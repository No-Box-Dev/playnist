const API_URL = import.meta.env.VITE_API_URL || 'https://playnist-api.jasper-414.workers.dev';

// Token management
let authToken: string | null = localStorage.getItem('playnist_token');

export function setToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem('playnist_token', token);
  else localStorage.removeItem('playnist_token');
}

export function getStoredToken() {
  return authToken;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error || res.statusText);
  }
  return res.json();
}

// Auth
export const signup = (email: string, password: string, username: string, bio?: string) =>
  request<{ user: unknown; token: string }>('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, username, bio }) });

export const signin = (email: string, password: string) =>
  request<{ user: unknown; token: string }>('/auth/signin', { method: 'POST', body: JSON.stringify({ email, password }) });

export const signout = () =>
  request<unknown>('/auth/signout', { method: 'POST' });

export const getMe = () => request<unknown>('/me');

export const updateMe = (data: { username?: string; bio?: string; avatar_url?: string; onboarding_step?: number }) =>
  request<unknown>('/me', { method: 'PATCH', body: JSON.stringify(data) });

// Images
export const imageUrl = (imageId: string, size: string = 't_cover_big') =>
  `${API_URL}/img/${imageId}/${size}`;

// Games
export const searchGames = (q: string) => request<unknown[]>(`/search?q=${encodeURIComponent(q)}`);
export const getGame = (id: number) => request<unknown>(`/game?id=${id}`);
export const getGamesBatch = (ids: number[]) =>
  ids.length === 0 ? Promise.resolve([]) : request<unknown[]>(`/games/batch?ids=${ids.join(',')}`);
export const getTrending = () => request<unknown[]>('/trending');
export const getNew = () => request<unknown[]>('/new');

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

// Avatar upload
export const uploadAvatar = async (file: File) => {
  const headers: Record<string, string> = { 'Content-Type': file.type };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(`${API_URL}/upload/avatar`, { method: 'POST', headers, body: await file.arrayBuffer() });
  if (!res.ok) throw new Error('Upload failed');
  return res.json() as Promise<{ avatar_url: string }>;
};

// Notifications
export const getNotifications = () => request<unknown[]>('/notifications');
export const getUnreadCount = () => request<{ count: number }>('/notifications/unread-count');
export const markNotificationsRead = () => request<unknown>('/notifications/mark-read', { method: 'POST' });

// Password Reset
export const forgotPassword = (email: string) =>
  request<unknown>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
export const resetPassword = (token: string, password: string) =>
  request<unknown>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) });

// Onboarding
export const saveOnboardingPicks = (game_ids: number[]) =>
  request<unknown>('/onboarding/picks', { method: 'POST', body: JSON.stringify({ game_ids }) });

// Public: Page Sections (enabled only)
export const getPublicPageSections = (page: string) =>
  request<unknown[]>(`/pages/${page}/sections`);

// Admin: Page Sections
export const getPageSections = (page: string) =>
  request<unknown[]>(`/admin/pages/${page}/sections`);
export const updateSection = (id: string, data: Record<string, unknown>) =>
  request<unknown>(`/admin/sections/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const createSection = (data: Record<string, unknown>) =>
  request<unknown>('/admin/sections', { method: 'POST', body: JSON.stringify(data) });
export const deleteSection = (id: string) =>
  request<unknown>(`/admin/sections/${id}`, { method: 'DELETE' });
export const reorderSections = (order: { id: string; sort_order: number }[]) =>
  request<unknown>('/admin/sections/reorder', { method: 'POST', body: JSON.stringify({ order }) });
