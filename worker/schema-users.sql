-- User tables for Playnist

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  is_ambassador INTEGER DEFAULT 0,
  onboarding_step INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_collections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  igdb_game_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('played', 'playing', 'want_to_play')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, igdb_game_id)
);

CREATE TABLE IF NOT EXISTS user_journals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  igdb_game_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS game_comments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  igdb_game_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS game_reactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, target_type, target_id, emoji)
);

CREATE TABLE IF NOT EXISTS user_follows (
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id),
  FOREIGN KEY (following_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS onboarding_picks (
  user_id TEXT NOT NULL,
  igdb_game_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, igdb_game_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_collections_user ON user_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_collections_user_status ON user_collections(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_journals_user ON user_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_game_comments_game ON game_comments(igdb_game_id);
CREATE INDEX IF NOT EXISTS idx_game_reactions_target ON game_reactions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
