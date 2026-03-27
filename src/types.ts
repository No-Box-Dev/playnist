export interface User {
  id: string;
  username: string;
  email?: string;
  bio: string;
  avatar_url: string;
  is_ambassador: number;
  onboarding_step: number;
  created_at: string;
}

export interface Game {
  id: number;
  name: string;
  slug?: string;
  summary?: string;
  storyline?: string;
  rating?: number;
  rating_count?: number;
  aggregated_rating?: number;
  first_release_date?: number;
  cover?: { image_id: string };
  genres?: { name: string }[];
  platforms?: { name: string }[];
  involved_companies?: { company: { name: string }; developer: boolean }[];
  screenshots?: { image_id: string }[];
  videos?: { video_id: string }[];
  similar_games?: { name: string; cover?: { image_id: string } }[];
}

export interface CollectionItem {
  id: string;
  user_id: string;
  igdb_game_id: number;
  status: 'played' | 'playing' | 'want_to_play';
  created_at: string;
}

export interface Journal {
  id: string;
  user_id: string;
  igdb_game_id: number;
  content: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  igdb_game_id: number;
  content: string;
  username: string;
  avatar_url: string;
  is_ambassador: number;
  created_at: string;
}

export interface Reaction {
  emoji: string;
  count: number;
}

export type SectionType = 'game_grid' | 'ambassador' | 'community_posts' | 'journal_prompt' | 'category_pills';

export interface PageSection {
  id: string;
  page: string;
  section_type: SectionType;
  title: string;
  sort_order: number;
  config: Record<string, unknown>;
  enabled: number;
  updated_at: string;
}
