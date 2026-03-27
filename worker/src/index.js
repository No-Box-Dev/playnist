// ─── Helpers ───

function uuid() {
  return crypto.randomUUID();
}

function toHex(buf) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password, salt) {
  if (!salt) {
    salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  }
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 50000, hash: 'SHA-256' },
    key, 256
  );
  return salt + ':' + toHex(bits);
}

async function verifyPassword(password, stored) {
  const [salt] = stored.split(':');
  const rehash = await hashPassword(password, salt);
  // Constant-time comparison
  if (rehash.length !== stored.length) return false;
  let diff = 0;
  for (let i = 0; i < rehash.length; i++) diff |= rehash.charCodeAt(i) ^ stored.charCodeAt(i);
  return diff === 0;
}

function requireAdmin(user) {
  if (!user || !user.is_ambassador) return json({ error: 'Admin access required' }, 403);
  return null;
}

// Rate limiting (in-memory, resets on deploy)
const rateLimits = new Map();
function checkRateLimit(key, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const entry = rateLimits.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + windowMs; }
  entry.count++;
  rateLimits.set(key, entry);
  if (entry.count > maxRequests) return true; // rate limited
  return false;
}

// Helper to create notifications
async function createNotification(env, userId, type, message, linkUrl) {
  const id = uuid();
  await env.DB.prepare(
    'INSERT INTO notifications (id, user_id, type, message, link_url) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, userId, type, message, linkUrl || '').run();
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extraHeaders },
  });
}

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach(part => {
    const [k, ...v] = part.trim().split('=');
    if (k) cookies[k.trim()] = v.join('=').trim();
  });
  return cookies;
}

function getToken(request) {
  // Check Authorization header first
  const auth = request.headers.get('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  // Then check cookie
  const cookies = parseCookies(request.headers.get('Cookie'));
  return cookies['playnist_session'] || null;
}

async function getUser(env, request) {
  const token = getToken(request);
  if (!token) return null;
  const session = await env.DB.prepare(
    `SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')`
  ).bind(token).first();
  if (!session) return null;
  return env.DB.prepare(`SELECT id, username, email, bio, avatar_url, is_ambassador, onboarding_step, created_at FROM users WHERE id = ?`)
    .bind(session.user_id).first();
}

function sessionCookie(token, maxAge = 60 * 60 * 24 * 30) {
  return `playnist_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

// ─── D1 game queries ───

async function dbSearchGames(env, query) {
  const { results } = await env.DB.prepare(`
    SELECT g.id, g.name, g.slug, g.summary, g.rating, g.first_release_date,
           c.image_id AS cover_image_id
    FROM games g
    LEFT JOIN covers c ON c.game = g.id
    WHERE g.name LIKE ?
    ORDER BY g.rating_count DESC, g.rating DESC
    LIMIT 20
  `).bind(`%${query}%`).all();
  return results.map(r => ({
    id: r.id, name: r.name, slug: r.slug, summary: r.summary,
    rating: r.rating, first_release_date: r.first_release_date,
    cover: r.cover_image_id ? { image_id: r.cover_image_id } : undefined,
  }));
}

async function dbGetGame(env, id) {
  const game = await env.DB.prepare(`
    SELECT g.id, g.name, g.slug, g.summary, g.storyline, g.rating, g.aggregated_rating,
           g.first_release_date, g.rating_count,
           c.image_id AS cover_image_id
    FROM games g
    LEFT JOIN covers c ON c.game = g.id
    WHERE g.id = ?
  `).bind(id).first();
  if (!game) return null;

  const [genres, platforms, companies, similar] = await Promise.all([
    env.DB.prepare('SELECT gr.name FROM game_genres gg JOIN genres gr ON gr.id = gg.genre_id WHERE gg.game_id = ?').bind(id).all(),
    env.DB.prepare('SELECT p.name FROM game_platforms gp JOIN platforms p ON p.id = gp.platform_id WHERE gp.game_id = ?').bind(id).all(),
    env.DB.prepare(`
      SELECT co.name, ic.developer FROM involved_companies ic
      JOIN companies co ON co.id = ic.company WHERE ic.game = ?
    `).bind(id).all(),
    env.DB.prepare(`
      SELECT g.id, g.name, c.image_id AS cover_image_id
      FROM game_similar_games gs
      JOIN games g ON g.id = gs.similar_game_id
      LEFT JOIN covers c ON c.game = g.id
      WHERE gs.game_id = ?
      LIMIT 10
    `).bind(id).all(),
  ]);

  return {
    id: game.id, name: game.name, slug: game.slug, summary: game.summary,
    storyline: game.storyline, rating: game.rating, aggregated_rating: game.aggregated_rating,
    first_release_date: game.first_release_date, rating_count: game.rating_count,
    cover: game.cover_image_id ? { image_id: game.cover_image_id } : undefined,
    genres: genres.results.map(r => ({ name: r.name })),
    platforms: platforms.results.map(r => ({ name: r.name })),
    involved_companies: companies.results.map(r => ({ company: { name: r.name }, developer: !!r.developer })),
    similar_games: similar.results.map(r => ({
      id: r.id, name: r.name,
      cover: r.cover_image_id ? { image_id: r.cover_image_id } : undefined,
    })),
  };
}

async function dbGetGamesBatch(env, ids) {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  const { results } = await env.DB.prepare(`
    SELECT g.id, g.name, g.slug, g.summary, g.rating,
           c.image_id AS cover_image_id
    FROM games g
    LEFT JOIN covers c ON c.game = g.id
    WHERE g.id IN (${placeholders})
  `).bind(...ids).all();
  return results.map(r => ({
    id: r.id, name: r.name, slug: r.slug, summary: r.summary, rating: r.rating,
    cover: r.cover_image_id ? { image_id: r.cover_image_id } : undefined,
  }));
}

async function dbGetTrending(env) {
  const { results } = await env.DB.prepare(`
    SELECT g.id, g.name, g.slug, g.summary, g.rating, g.first_release_date,
           c.image_id AS cover_image_id
    FROM games g
    LEFT JOIN covers c ON c.game = g.id
    WHERE g.rating > 80 AND g.rating_count > 50 AND c.image_id IS NOT NULL
    ORDER BY g.rating DESC
    LIMIT 20
  `).all();
  return results.map(r => ({
    id: r.id, name: r.name, slug: r.slug, summary: r.summary,
    rating: r.rating, first_release_date: r.first_release_date,
    cover: r.cover_image_id ? { image_id: r.cover_image_id } : undefined,
  }));
}

async function dbGetNew(env) {
  const now = Math.floor(Date.now() / 1000);
  const threeMonthsAgo = now - 90 * 24 * 60 * 60;
  const { results } = await env.DB.prepare(`
    SELECT g.id, g.name, g.slug, g.summary, g.rating, g.first_release_date,
           c.image_id AS cover_image_id
    FROM games g
    LEFT JOIN covers c ON c.game = g.id
    WHERE g.first_release_date >= ? AND g.first_release_date <= ? AND c.image_id IS NOT NULL
    ORDER BY g.first_release_date DESC
    LIMIT 20
  `).bind(threeMonthsAgo, now).all();
  return results.map(r => ({
    id: r.id, name: r.name, slug: r.slug, summary: r.summary,
    rating: r.rating, first_release_date: r.first_release_date,
    cover: r.cover_image_id ? { image_id: r.cover_image_id } : undefined,
  }));
}

// ─── Routes ───

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // ── Image proxy (R2 cache) ──
      const imgMatch = path.match(/^\/img\/([a-zA-Z0-9_]+)\/(t_thumb|t_cover_small|t_cover_small_2x|t_cover_big|t_cover_big_2x|t_screenshot_med)$/);
      if (imgMatch && method === 'GET') {
        const [, imageId, size] = imgMatch;
        const key = `covers/${size}/${imageId}.jpg`;

        // Check R2 first
        const cached = await env.UPLOADS.get(key);
        if (cached) {
          return new Response(cached.body, {
            headers: {
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'public, max-age=31536000, immutable',
              ...CORS_HEADERS,
            },
          });
        }

        // Fetch from upstream, store in R2
        const upstream = await fetch(`https://images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg`);
        if (!upstream.ok) return new Response('Image not found', { status: 404, headers: CORS_HEADERS });

        const imageData = await upstream.arrayBuffer();
        await env.UPLOADS.put(key, imageData, { httpMetadata: { contentType: 'image/jpeg' } });

        return new Response(imageData, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
            ...CORS_HEADERS,
          },
        });
      }

      // ── Auth ──
      if (path === '/auth/signup' && method === 'POST') {
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        if (checkRateLimit('signup:' + ip, 5, 300000)) return json({ error: 'Too many signups. Try again later.' }, 429);
        const { email, password, username, bio } = await request.json();
        if (!email || !password || !username) return json({ error: 'Missing fields' }, 400);

        const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ? OR username = ?').bind(email, username).first();
        if (existing) return json({ error: 'Email or username already taken' }, 409);

        const id = uuid();
        const password_hash = await hashPassword(password);
        await env.DB.prepare(
          'INSERT INTO users (id, username, email, password_hash, bio) VALUES (?, ?, ?, ?, ?)'
        ).bind(id, username, email, password_hash, bio || '').run();

        const token = uuid();
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').bind(token, id, expires).run();

        const user = await env.DB.prepare('SELECT id, username, email, bio, avatar_url, is_ambassador, onboarding_step, created_at FROM users WHERE id = ?').bind(id).first();
        return json({ user, token }, 201, { 'Set-Cookie': sessionCookie(token) });
      }

      if (path === '/auth/signin' && method === 'POST') {
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        if (checkRateLimit('signin:' + ip, 10, 300000)) return json({ error: 'Too many attempts. Try again later.' }, 429);
        const { email, password } = await request.json();
        if (!email || !password) return json({ error: 'Missing fields' }, 400);

        const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
        if (!user) return json({ error: 'Invalid credentials' }, 401);

        const valid = await verifyPassword(password, user.password_hash);
        if (!valid) return json({ error: 'Invalid credentials' }, 401);

        const token = uuid();
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').bind(token, user.id, expires).run();

        const { password_hash, ...safeUser } = user;
        return json({ user: safeUser, token }, 200, { 'Set-Cookie': sessionCookie(token) });
      }

      if (path === '/auth/signout' && method === 'POST') {
        const token = getToken(request);
        if (token) await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
        return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) });
      }

      if (path === '/me' && method === 'GET') {
        const user = await getUser(env, request);
        if (!user) return json({ error: 'Not authenticated' }, 401);
        return json(user);
      }

      if (path === '/me' && method === 'PATCH') {
        const user = await getUser(env, request);
        if (!user) return json({ error: 'Not authenticated' }, 401);
        const body = await request.json();
        const updates = [];
        const values = [];
        if (body.username !== undefined) { updates.push('username = ?'); values.push(body.username); }
        if (body.bio !== undefined) { updates.push('bio = ?'); values.push(body.bio); }
        if (body.avatar_url !== undefined) { updates.push('avatar_url = ?'); values.push(body.avatar_url); }
        if (body.onboarding_step !== undefined) { updates.push('onboarding_step = ?'); values.push(body.onboarding_step); }
        if (updates.length === 0) return json(user);
        values.push(user.id);
        await env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
        const updated = await env.DB.prepare('SELECT id, username, email, bio, avatar_url, is_ambassador, onboarding_step, created_at FROM users WHERE id = ?').bind(user.id).first();
        return json(updated);
      }

      // ── Avatar Upload (R2) ──
      if (path === '/upload/avatar' && method === 'POST') {
        const user = await getUser(env, request);
        if (!user) return json({ error: 'Not authenticated' }, 401);
        const contentType = request.headers.get('Content-Type') || '';
        if (!contentType.includes('image/')) return json({ error: 'Must be an image' }, 400);
        const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
        const key = `avatars/${user.id}.${ext}`;
        const body = await request.arrayBuffer();
        if (body.byteLength > 5 * 1024 * 1024) return json({ error: 'Max 5MB' }, 400);
        await env.UPLOADS.put(key, body, { httpMetadata: { contentType } });
        const avatarUrl = `https://playnist-uploads.${env.CF_ACCOUNT_ID || 'account'}.r2.cloudflarestorage.com/${key}`;
        await env.DB.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').bind(avatarUrl, user.id).run();
        return json({ avatar_url: avatarUrl });
      }

      // ── Notifications ──
      if (path === '/notifications' && method === 'GET') {
        const user = await getUser(env, request);
        if (!user) return json({ error: 'Not authenticated' }, 401);
        const { results } = await env.DB.prepare(
          'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
        ).bind(user.id).all();
        return json(results);
      }

      if (path === '/notifications/unread-count' && method === 'GET') {
        const user = await getUser(env, request);
        if (!user) return json({ error: 'Not authenticated' }, 401);
        const row = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0'
        ).bind(user.id).first();
        return json({ count: row?.count || 0 });
      }

      if (path === '/notifications/mark-read' && method === 'POST') {
        const user = await getUser(env, request);
        if (!user) return json({ error: 'Not authenticated' }, 401);
        await env.DB.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').bind(user.id).run();
        return json({ ok: true });
      }

      // ── Password Reset ──
      if (path === '/auth/forgot-password' && method === 'POST') {
        const { email } = await request.json();
        if (!email) return json({ error: 'Missing email' }, 400);
        const userRow = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
        if (!userRow) return json({ ok: true }); // Don't reveal if email exists
        const resetToken = uuid();
        const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
        await env.DB.prepare(
          'INSERT OR REPLACE INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)'
        ).bind(resetToken, userRow.id, expires).run();
        // In production, send email here via Postmark/SES
        return json({ ok: true });
      }

      if (path === '/auth/reset-password' && method === 'POST') {
        const { token, password } = await request.json();
        if (!token || !password) return json({ error: 'Missing fields' }, 400);
        const reset = await env.DB.prepare(
          "SELECT user_id FROM password_resets WHERE token = ? AND expires_at > datetime('now')"
        ).bind(token).first();
        if (!reset) return json({ error: 'Invalid or expired token' }, 400);
        const hash = await hashPassword(password);
        await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(hash, reset.user_id).run();
        await env.DB.prepare('DELETE FROM password_resets WHERE token = ?').bind(token).run();
        return json({ ok: true });
      }

      // ── Game data endpoints (D1) ──
      if (path === '/search') {
        const query = url.searchParams.get('q');
        if (!query) return json({ error: 'Missing ?q=' }, 400);
        const games = await dbSearchGames(env, query);
        return json(games);
      }

      if (path === '/game') {
        const id = url.searchParams.get('id');
        if (!id || !/^\d+$/.test(id)) return json({ error: 'Missing or invalid ?id=' }, 400);
        const game = await dbGetGame(env, parseInt(id));
        return json(game);
      }

      if (path === '/games/batch') {
        const ids = url.searchParams.get('ids');
        if (!ids) return json({ error: 'Missing ?ids=' }, 400);
        const idList = ids.split(',').filter(id => /^\d+$/.test(id)).slice(0, 20).map(Number);
        if (idList.length === 0) return json([]);
        const games = await dbGetGamesBatch(env, idList);
        return json(games);
      }

      if (path === '/trending') {
        const games = await dbGetTrending(env);
        return json(games);
      }

      if (path === '/new') {
        const games = await dbGetNew(env);
        return json(games);
      }

      // ── Users ──
      const userMatch = path.match(/^\/users\/([^/]+)$/);
      if (userMatch && method === 'GET') {
        const user = await env.DB.prepare('SELECT id, username, email, bio, avatar_url, is_ambassador, onboarding_step, created_at FROM users WHERE id = ?').bind(userMatch[1]).first();
        if (!user) return json({ error: 'User not found' }, 404);
        return json(user);
      }

      const userCollectionMatch = path.match(/^\/users\/([^/]+)\/collection$/);
      if (userCollectionMatch && method === 'GET') {
        const userId = userCollectionMatch[1];
        const status = url.searchParams.get('status');
        let query = 'SELECT * FROM user_collections WHERE user_id = ?';
        const params = [userId];
        if (status) { query += ' AND status = ?'; params.push(status); }
        query += ' ORDER BY created_at DESC';
        const { results } = await env.DB.prepare(query).bind(...params).all();
        return json(results);
      }

      const userJournalsMatch = path.match(/^\/users\/([^/]+)\/journals$/);
      if (userJournalsMatch && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT * FROM user_journals WHERE user_id = ? ORDER BY created_at DESC'
        ).bind(userJournalsMatch[1]).all();
        return json(results);
      }

      const userFollowersMatch = path.match(/^\/users\/([^/]+)\/followers$/);
      if (userFollowersMatch && method === 'GET') {
        const { results } = await env.DB.prepare(
          `SELECT u.id, u.username, u.avatar_url, u.is_ambassador FROM user_follows f JOIN users u ON u.id = f.follower_id WHERE f.following_id = ?`
        ).bind(userFollowersMatch[1]).all();
        return json(results);
      }

      const userFollowingMatch = path.match(/^\/users\/([^/]+)\/following$/);
      if (userFollowingMatch && method === 'GET') {
        const { results } = await env.DB.prepare(
          `SELECT u.id, u.username, u.avatar_url, u.is_ambassador FROM user_follows f JOIN users u ON u.id = f.following_id WHERE f.follower_id = ?`
        ).bind(userFollowingMatch[1]).all();
        return json(results);
      }

      // ── Collection ──
      if (path === '/collection' && method === 'POST') {
        const user = await getUser(env, request);
        if (!user) return json({ error: 'Not authenticated' }, 401);
        const { igdb_game_id, status } = await request.json();
        if (!igdb_game_id || !status) return json({ error: 'Missing fields' }, 400);

        const existing = await env.DB.prepare(
          'SELECT id FROM user_collections WHERE user_id = ? AND igdb_game_id = ?'
        ).bind(user.id, igdb_game_id).first();

        if (existing) {
          await env.DB.prepare('UPDATE user_collections SET status = ? WHERE id = ?').bind(status, existing.id).run();
          return json({ id: existing.id, user_id: user.id, igdb_game_id, status });
        }

        const id = uuid();
        await env.DB.prepare(
          'INSERT INTO user_collections (id, user_id, igdb_game_id, status) VALUES (?, ?, ?, ?)'
        ).bind(id, user.id, igdb_game_id, status).run();
        return json({ id, user_id: user.id, igdb_game_id, status }, 201);
      }

      const collectionItemMatch = path.match(/^\/collection\/([^/]+)$/);
      if (collectionItemMatch && method === 'PATCH') {
        const user = await getUser(env, request);
        if (!user) return json({ error: 'Not authenticated' }, 401);
        const { status } = await request.json();
        await env.DB.prepare('UPDATE user_collections SET status = ? WHERE id = ? AND user_id = ?')
          .bind(status, collectionItemMatch[1], user.id).run();
        return json({ ok: true });
      }

      if (collectionItemMatch && method === 'DELETE') {
        const user = await getUser(env, request);
        if (!user) return json({ error: 'Not authenticated' }, 401);
        await env.DB.prepare('DELETE FROM user_collections WHERE id = ? AND user_id = ?')
          .bind(collectionItemMatch[1], user.id).run();
        return json({ ok: true });
      }

      // ── Journals ──
      if (path === '/journals' && method === 'POST') {
        const user = await getUser(env, request);
        if (!user) return json({ error: 'Not authenticated' }, 401);
        const { igdb_game_id, content } = await request.json();
        if (!igdb_game_id || !content) return json({ error: 'Missing fields' }, 400);
        const id = uuid();
        await env.DB.prepare(
          'INSERT INTO user_journals (id, user_id, igdb_game_id, content) VALUES (?, ?, ?, ?)'
        ).bind(id, user.id, igdb_game_id, content).run();
        return json({ id, user_id: user.id, igdb_game_id, content }, 201);
      }

      const journalMatch = path.match(/^\/journals\/([^/]+)$/);
      if (journalMatch && method === 'DELETE') {
        const user = await getUser(env, request);
        if (!user) return json({ error: 'Not authenticated' }, 401);
        await env.DB.prepare('DELETE FROM user_journals WHERE id = ? AND user_id = ?')
          .bind(journalMatch[1], user.id).run();
        return json({ ok: true });
      }

      // ── Comments ──
      const gameCommentsMatch = path.match(/^\/games\/(\d+)\/comments$/);
      if (gameCommentsMatch && method === 'GET') {
        const { results } = await env.DB.prepare(
          `SELECT c.id, c.user_id, c.igdb_game_id, c.content, c.created_at,
                  u.username, u.avatar_url, u.is_ambassador
           FROM game_comments c JOIN users u ON u.id = c.user_id
           WHERE c.igdb_game_id = ? ORDER BY c.created_at DESC`
        ).bind(parseInt(gameCommentsMatch[1])).all();
        return json(results);
      }

      if (gameCommentsMatch && method === 'POST') {
        const user = await getUser(env, request);
        if (!user) return json({ error: 'Not authenticated' }, 401);
        const { content } = await request.json();
        if (!content) return json({ error: 'Missing content' }, 400);
        const id = uuid();
        const igdbId = parseInt(gameCommentsMatch[1]);
        await env.DB.prepare(
          'INSERT INTO game_comments (id, user_id, igdb_game_id, content) VALUES (?, ?, ?, ?)'
        ).bind(id, user.id, igdbId, content).run();
        return json({
          id, user_id: user.id, igdb_game_id: igdbId, content,
          username: user.username, avatar_url: user.avatar_url, is_ambassador: user.is_ambassador,
          created_at: new Date().toISOString(),
        }, 201);
      }

      // ── Reactions ──
      const gameReactionsMatch = path.match(/^\/games\/(\d+)\/reactions$/);
      if (gameReactionsMatch && method === 'GET') {
        const { results } = await env.DB.prepare(
          `SELECT emoji, COUNT(*) as count FROM game_reactions
           WHERE target_type = 'game' AND target_id = ? GROUP BY emoji`
        ).bind(gameReactionsMatch[1]).all();
        return json(results);
      }

      if (path === '/reactions' && method === 'POST') {
        const user = await getUser(env, request);
        if (!user) return json({ error: 'Not authenticated' }, 401);
        const { target_type, target_id, emoji } = await request.json();

        const existing = await env.DB.prepare(
          'SELECT id FROM game_reactions WHERE user_id = ? AND target_type = ? AND target_id = ? AND emoji = ?'
        ).bind(user.id, target_type, target_id, emoji).first();

        if (existing) {
          await env.DB.prepare('DELETE FROM game_reactions WHERE id = ?').bind(existing.id).run();
          return json({ toggled: 'off' });
        }

        const id = uuid();
        await env.DB.prepare(
          'INSERT INTO game_reactions (id, user_id, target_type, target_id, emoji) VALUES (?, ?, ?, ?, ?)'
        ).bind(id, user.id, target_type, target_id, emoji).run();
        return json({ toggled: 'on' }, 201);
      }

      // ── Follows ──
      const followMatch = path.match(/^\/follows\/([^/]+)$/);
      if (followMatch && method === 'POST') {
        const user = await getUser(env, request);
        if (!user) return json({ error: 'Not authenticated' }, 401);
        const targetId = followMatch[1];
        if (targetId === user.id) return json({ error: 'Cannot follow yourself' }, 400);
        try {
          await env.DB.prepare('INSERT INTO user_follows (follower_id, following_id) VALUES (?, ?)')
            .bind(user.id, targetId).run();
          createNotification(env, targetId, 'follow', `${user.username} started following you`, `/profile/${user.id}`);
        } catch (e) {
          // Already following — ignore
        }
        return json({ ok: true });
      }

      if (followMatch && method === 'DELETE') {
        const user = await getUser(env, request);
        if (!user) return json({ error: 'Not authenticated' }, 401);
        await env.DB.prepare('DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?')
          .bind(user.id, followMatch[1]).run();
        return json({ ok: true });
      }

      // ── Admin: Page Sections ──
      const pageSectionsMatch = path.match(/^\/admin\/pages\/([^/]+)\/sections$/);
      if (pageSectionsMatch && method === 'GET') {
        const user = await getUser(env, request);
        const denied = requireAdmin(user);
        if (denied) return denied;
        const { results } = await env.DB.prepare(
          'SELECT * FROM page_sections WHERE page = ? ORDER BY sort_order'
        ).bind(pageSectionsMatch[1]).all();
        return json(results.map(r => ({ ...r, config: JSON.parse(r.config || '{}') })));
      }

      // Public endpoint: get enabled sections for a page
      const publicPageMatch = path.match(/^\/pages\/([^/]+)\/sections$/);
      if (publicPageMatch && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT * FROM page_sections WHERE page = ? AND enabled = 1 ORDER BY sort_order'
        ).bind(publicPageMatch[1]).all();
        return json(results.map(r => ({ ...r, config: JSON.parse(r.config || '{}') })));
      }

      const sectionMatch = path.match(/^\/admin\/sections\/([^/]+)$/);
      if (sectionMatch && method === 'PATCH') {
        const user = await getUser(env, request);
        const denied = requireAdmin(user);
        if (denied) return denied;
        const body = await request.json();
        const updates = [];
        const values = [];
        if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title); }
        if (body.config !== undefined) { updates.push('config = ?'); values.push(JSON.stringify(body.config)); }
        if (body.enabled !== undefined) { updates.push('enabled = ?'); values.push(body.enabled ? 1 : 0); }
        if (body.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(body.sort_order); }
        updates.push("updated_at = datetime('now')");
        values.push(sectionMatch[1]);
        await env.DB.prepare(`UPDATE page_sections SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
        const updated = await env.DB.prepare('SELECT * FROM page_sections WHERE id = ?').bind(sectionMatch[1]).first();
        return json({ ...updated, config: JSON.parse(updated.config || '{}') });
      }

      if (path === '/admin/sections' && method === 'POST') {
        const user = await getUser(env, request);
        const denied = requireAdmin(user);
        if (denied) return denied;
        const { page, section_type, title, config, sort_order } = await request.json();
        if (!page || !section_type || !title) return json({ error: 'Missing fields' }, 400);
        const id = uuid();
        await env.DB.prepare(
          'INSERT INTO page_sections (id, page, section_type, title, sort_order, config) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(id, page, section_type, title, sort_order || 0, JSON.stringify(config || {})).run();
        return json({ id, page, section_type, title, sort_order: sort_order || 0, config: config || {}, enabled: 1 }, 201);
      }

      if (sectionMatch && method === 'DELETE') {
        const user = await getUser(env, request);
        const denied = requireAdmin(user);
        if (denied) return denied;
        await env.DB.prepare('DELETE FROM page_sections WHERE id = ?').bind(sectionMatch[1]).run();
        return json({ ok: true });
      }

      // Bulk reorder
      if (path === '/admin/sections/reorder' && method === 'POST') {
        const user = await getUser(env, request);
        const denied = requireAdmin(user);
        if (denied) return denied;
        const { order } = await request.json(); // [{id, sort_order}]
        const stmt = env.DB.prepare('UPDATE page_sections SET sort_order = ? WHERE id = ?');
        await env.DB.batch(order.map(o => stmt.bind(o.sort_order, o.id)));
        return json({ ok: true });
      }

      // ── Onboarding ──
      if (path === '/onboarding/picks' && method === 'POST') {
        const user = await getUser(env, request);
        if (!user) return json({ error: 'Not authenticated' }, 401);
        const { game_ids } = await request.json();
        if (!Array.isArray(game_ids)) return json({ error: 'game_ids must be array' }, 400);
        const stmt = env.DB.prepare('INSERT OR IGNORE INTO onboarding_picks (user_id, igdb_game_id) VALUES (?, ?)');
        await env.DB.batch(game_ids.map(gid => stmt.bind(user.id, gid)));
        // Also add these to collection as "played"
        const colStmt = env.DB.prepare('INSERT OR IGNORE INTO user_collections (id, user_id, igdb_game_id, status) VALUES (?, ?, ?, ?)');
        await env.DB.batch(game_ids.map(gid => colStmt.bind(uuid(), user.id, gid, 'played')));
        await env.DB.prepare('UPDATE users SET onboarding_step = 3 WHERE id = ?').bind(user.id).run();
        return json({ ok: true });
      }

      return json({ error: 'Not found' }, 404);
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  },
};

