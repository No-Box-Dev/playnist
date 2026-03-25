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
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' },
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

// ─── IGDB proxy (kept for backward compat + games without local data) ───

let tokenCache = { token: null, expiresAt: 0 };

async function getAccessToken(env) {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) return tokenCache.token;
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.TWITCH_CLIENT_ID,
      client_secret: env.TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get IGDB token');
  tokenCache.token = data.access_token;
  tokenCache.expiresAt = Date.now() + (data.expires_in - 300) * 1000;
  return data.access_token;
}

async function igdbFetch(env, endpoint, body) {
  const token = await getAccessToken(env);
  const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: 'POST',
    headers: {
      'Client-ID': env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body,
  });
  return res.json();
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
      // ── Auth ──
      if (path === '/auth/signup' && method === 'POST') {
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

      // ── IGDB proxy endpoints (game data) ──
      if (path === '/search') {
        const query = url.searchParams.get('q');
        if (!query) return json({ error: 'Missing ?q=' }, 400);
        const sanitized = query.replace(/[";]/g, '');
        const games = await igdbFetch(env, 'games',
          `search "${sanitized}"; fields name, cover.image_id, summary, rating, first_release_date, genres.name, platforms.name, involved_companies.company.name, screenshots.image_id, slug; limit 20;`
        );
        return json(games);
      }

      if (path === '/game') {
        const id = url.searchParams.get('id');
        if (!id || !/^\d+$/.test(id)) return json({ error: 'Missing or invalid ?id=' }, 400);
        const games = await igdbFetch(env, 'games',
          `where id = ${id}; fields name, cover.image_id, summary, storyline, rating, aggregated_rating, first_release_date, genres.name, platforms.name, involved_companies.company.name, involved_companies.developer, screenshots.image_id, videos.video_id, slug, similar_games.name, similar_games.cover.image_id, rating_count; limit 1;`
        );
        return json(games[0] || null);
      }

      if (path === '/trending') {
        const games = await igdbFetch(env, 'games',
          `fields name, cover.image_id, summary, rating, first_release_date, genres.name, platforms.name, slug; sort rating desc; where rating > 80 & rating_count > 50 & cover != null; limit 20;`
        );
        return json(games);
      }

      if (path === '/new') {
        const now = Math.floor(Date.now() / 1000);
        const threeMonthsAgo = now - 90 * 24 * 60 * 60;
        const games = await igdbFetch(env, 'games',
          `fields name, cover.image_id, summary, rating, first_release_date, genres.name, platforms.name, slug; sort first_release_date desc; where first_release_date >= ${threeMonthsAgo} & first_release_date <= ${now} & cover != null; limit 20;`
        );
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

