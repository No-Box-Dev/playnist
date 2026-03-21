const API_URL = import.meta.env.VITE_API_URL || 'https://playnist-api.jasper-414.workers.dev';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error || res.statusText);
  }
  return res.json();
}

// IGDB
export const searchGames = (q: string) => request<unknown[]>(`/search?q=${encodeURIComponent(q)}`);
export const getGame = (id: number) => request<unknown>(`/game?id=${id}`);
export const getTrending = () => request<unknown[]>('/trending');
export const getNew = () => request<unknown[]>('/new');

// Auth
export const getMe = () => request<unknown>('/me');

// Users
export const getUser = (id: string) => request<unknown>(`/users/${id}`);
export const getUserCollection = (id: string, status?: string) =>
  request<unknown[]>(`/users/${id}/collection${status ? `?status=${status}` : ''}`);
export const getUserJournals = (id: string) => request<unknown[]>(`/users/${id}/journals`);
export const getUserFollowers = (id: string) => request<unknown[]>(`/users/${id}/followers`);
export const getUserFollowing = (id: string) => request<unknown[]>(`/users/${id}/following`);

// Collection
export const addToCollection = (igdb_game_id: number, status: string) =>
  request<unknown>('/collection', { method: 'POST', body: JSON.stringify({ igdb_game_id, status }) });
export const updateCollectionItem = (id: string, status: string) =>
  request<unknown>(`/collection/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const removeFromCollection = (id: string) =>
  request<unknown>(`/collection/${id}`, { method: 'DELETE' });

// Journals
export const createJournal = (igdb_game_id: number, content: string) =>
  request<unknown>('/journals', { method: 'POST', body: JSON.stringify({ igdb_game_id, content }) });
export const deleteJournal = (id: string) =>
  request<unknown>(`/journals/${id}`, { method: 'DELETE' });

// Comments
export const getGameComments = (igdbId: number) => request<unknown[]>(`/games/${igdbId}/comments`);
export const addGameComment = (igdbId: number, content: string) =>
  request<unknown>(`/games/${igdbId}/comments`, { method: 'POST', body: JSON.stringify({ content }) });

// Reactions
export const getGameReactions = (igdbId: number) => request<unknown[]>(`/games/${igdbId}/reactions`);
export const toggleReaction = (target_type: string, target_id: string, emoji: string) =>
  request<unknown>('/reactions', { method: 'POST', body: JSON.stringify({ target_type, target_id, emoji }) });

// Follows
export const followUser = (userId: string) =>
  request<unknown>(`/follows/${userId}`, { method: 'POST' });
export const unfollowUser = (userId: string) =>
  request<unknown>(`/follows/${userId}`, { method: 'DELETE' });
