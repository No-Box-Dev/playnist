import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setToken, getStoredToken, signin, signup, signout, searchGames, getGame, getTrending, getNew } from '../api';

const API_URL = 'https://playnist-api.jasper-414.workers.dev';

beforeEach(() => {
  vi.mocked(global.fetch).mockReset();
  localStorage.clear();
  // Reset module-level authToken
  setToken(null);
});

describe('setToken', () => {
  it('stores token in localStorage', () => {
    setToken('abc123');
    expect(localStorage.getItem('playnist_token')).toBe('abc123');
  });

  it('removes token from localStorage when null', () => {
    setToken('abc123');
    setToken(null);
    expect(localStorage.getItem('playnist_token')).toBeNull();
  });
});

describe('getStoredToken', () => {
  it('returns stored token', () => {
    setToken('my-token');
    expect(getStoredToken()).toBe('my-token');
  });

  it('returns null when no token set', () => {
    expect(getStoredToken()).toBeNull();
  });
});

describe('request()', () => {
  it('adds Authorization header when token exists', async () => {
    setToken('bearer-test');
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await getTrending(); // uses request() internally

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, options] = mockFetch.mock.calls[0];
    const headers = options?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer bearer-test');
  });

  it('does not add Authorization header when no token', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));

    await getTrending();

    const [, options] = mockFetch.mock.calls[0];
    const headers = options?.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });

  it('throws on non-ok responses', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, statusText: 'Unauthorized' }));

    await expect(getTrending()).rejects.toThrow('Unauthorized');
  });

  it('throws statusText when error body has no error field', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(new Response('not json', { status: 500, statusText: 'Internal Server Error' }));

    await expect(getTrending()).rejects.toThrow('Internal Server Error');
  });
});

describe('signin', () => {
  it('calls /auth/signin with POST and credentials', async () => {
    const mockFetch = vi.mocked(global.fetch);
    const responseData = { user: { id: '1' }, token: 'tok' };
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(responseData), { status: 200 }));

    const result = await signin('user@test.com', 'pass123');

    expect(result).toEqual(responseData);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe(`${API_URL}/auth/signin`);
    expect(options?.method).toBe('POST');
    expect(JSON.parse(options?.body as string)).toEqual({ email: 'user@test.com', password: 'pass123' });
  });
});

describe('signup', () => {
  it('calls /auth/signup with POST and user data', async () => {
    const mockFetch = vi.mocked(global.fetch);
    const responseData = { user: { id: '2' }, token: 'tok2' };
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(responseData), { status: 200 }));

    const result = await signup('new@test.com', 'pass456', 'newuser', 'my bio');

    expect(result).toEqual(responseData);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe(`${API_URL}/auth/signup`);
    expect(options?.method).toBe('POST');
    expect(JSON.parse(options?.body as string)).toEqual({
      email: 'new@test.com',
      password: 'pass456',
      username: 'newuser',
      bio: 'my bio',
    });
  });
});

describe('signout', () => {
  it('calls /auth/signout with POST', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

    await signout();

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe(`${API_URL}/auth/signout`);
    expect(options?.method).toBe('POST');
  });
});

describe('Game endpoints', () => {
  it('searchGames calls /search with encoded query', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));

    await searchGames('zelda tears');

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe(`${API_URL}/search?q=zelda%20tears`);
  });

  it('getGame calls /game with id param', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

    await getGame(12345);

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe(`${API_URL}/game?id=12345`);
  });

  it('getTrending calls /trending', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));

    await getTrending();

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe(`${API_URL}/trending`);
  });

  it('getNew calls /new', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));

    await getNew();

    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe(`${API_URL}/new`);
  });
});
