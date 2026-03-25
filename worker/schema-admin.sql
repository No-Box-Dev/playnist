CREATE TABLE IF NOT EXISTS page_sections (
  id TEXT PRIMARY KEY,
  page TEXT NOT NULL,
  section_type TEXT NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  config TEXT DEFAULT '{}',
  enabled INTEGER DEFAULT 1,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_page_sections_page ON page_sections(page, sort_order);

-- Seed dashboard sections
INSERT OR IGNORE INTO page_sections (id, page, section_type, title, sort_order, config) VALUES
('dash-trending', 'dashboard', 'game_grid', 'Trending on Playnist', 0, '{"query":"trending","limit":4,"columns":4}'),
('dash-ambassador', 'dashboard', 'ambassador', 'Ambassador Spotlight', 1, '{"user_name":"GameMaster42","quote":"This game completely changed my perspective on storytelling in games. The way it weaves narrative with gameplay is unlike anything I''ve experienced before.","game_query":"trending_first"}'),
('dash-community', 'dashboard', 'community_posts', 'What the Community is Playing', 2, '{"posts":[{"user":"PixelHunter","time":"2 hours ago","genre":"Action Adventure","body":"Just finished the main storyline and I''m blown away. The final boss fight was incredibly satisfying...","reactions":{"heart":12,"star":5,"laugh":3,"fire":8}},{"user":"RetroGamer99","time":"5 hours ago","genre":"Strategy, Simulation","body":"100 hours in and still discovering new things. This is hands down the best simulation game I''ve played...","reactions":{"heart":24,"star":10,"fire":15}},{"user":"NightOwlPlays","time":"1 day ago","genre":"Indie, Platformer","body":"Don''t sleep on this indie gem! The art style alone makes it worth playing, but the mechanics are what keeps you coming back...","reactions":{"heart":7,"laugh":2}}]}'),
('dash-new', 'dashboard', 'game_grid', 'New & Noteworthy', 3, '{"query":"new","limit":5,"columns":5}'),
('dash-prompt', 'dashboard', 'journal_prompt', 'Journal Prompt of the Week', 4, '{"text":"What game moment made you feel something you didn''t expect?"}'),
('dash-rainy', 'dashboard', 'game_grid', 'Games for a Rainy Day', 5, '{"query":"trending","offset":4,"limit":5,"columns":5}'),
('disc-categories', 'discover', 'category_pills', 'Categories', 0, '{"categories":["All","Action","Adventure","RPG","Strategy","Indie","Platformer","Shooter","Puzzle","Simulation"]}'),
('disc-trending', 'discover', 'game_grid', 'Trending', 1, '{"query":"trending","limit":4,"columns":4}'),
('disc-new', 'discover', 'game_grid', 'New Releases', 2, '{"query":"new","limit":6,"columns":5}'),
('disc-popular', 'discover', 'game_grid', 'Popular Games', 3, '{"query":"trending","offset":4,"limit":8,"columns":5}');
