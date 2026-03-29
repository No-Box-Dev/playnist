-- FTS5 full-text search index for games
-- Uses porter stemmer for morphological matching and ASCII tokenizer for clean splits
-- content= syncs with games table via rowid

CREATE VIRTUAL TABLE IF NOT EXISTS games_fts USING fts5(
  name,
  slug,
  content='games',
  content_rowid='id',
  tokenize='porter ascii'
);

-- Populate FTS index from existing games
INSERT INTO games_fts(rowid, name, slug)
  SELECT id, name, slug FROM games;

-- Triggers to keep FTS in sync with games table
CREATE TRIGGER IF NOT EXISTS games_ai AFTER INSERT ON games BEGIN
  INSERT INTO games_fts(rowid, name, slug) VALUES (new.id, new.name, new.slug);
END;

CREATE TRIGGER IF NOT EXISTS games_ad AFTER DELETE ON games BEGIN
  INSERT INTO games_fts(games_fts, rowid, name, slug) VALUES('delete', old.id, old.name, old.slug);
END;

CREATE TRIGGER IF NOT EXISTS games_au AFTER UPDATE ON games BEGIN
  INSERT INTO games_fts(games_fts, rowid, name, slug) VALUES('delete', old.id, old.name, old.slug);
  INSERT INTO games_fts(rowid, name, slug) VALUES (new.id, new.name, new.slug);
END;
