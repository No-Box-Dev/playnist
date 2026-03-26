import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { User } from '../types';
import { AuthContext, useAuth } from '../hooks/useAuth';

// Mock all lazy-loaded page components to keep tests fast
vi.mock('../pages/Login', () => ({ default: () => <div data-testid="login-page">Login</div> }));
vi.mock('../pages/ResetPassword', () => ({ default: () => <div data-testid="reset-page">Reset</div> }));
vi.mock('../pages/Onboarding', () => ({ default: () => <div data-testid="onboarding-page">Onboarding</div> }));
vi.mock('../pages/Dashboard', () => ({ default: () => <div data-testid="dashboard-page">Dashboard</div> }));
vi.mock('../pages/Discover', () => ({ default: () => <div data-testid="discover-page">Discover</div> }));
vi.mock('../pages/Search', () => ({ default: () => <div data-testid="search-page">Search</div> }));
vi.mock('../pages/Journal', () => ({ default: () => <div data-testid="journal-page">Journal</div> }));
vi.mock('../pages/Profile', () => ({ default: () => <div data-testid="profile-page">Profile</div> }));
vi.mock('../pages/GamePage', () => ({ default: () => <div data-testid="game-page">Game</div> }));
vi.mock('../pages/Settings', () => ({ default: () => <div data-testid="settings-page">Settings</div> }));
vi.mock('../pages/Admin', () => ({ default: () => <div data-testid="admin-page">Admin</div> }));

// Mock api module
vi.mock('../api', () => ({
  getStoredToken: vi.fn(() => null),
  getMe: vi.fn(() => Promise.resolve(null)),
  setToken: vi.fn(),
}));

import { getStoredToken, getMe } from '../api';
import App from '../App';

const baseUser: User = {
  id: 'u1',
  username: 'testuser',
  email: 'test@test.com',
  bio: '',
  avatar_url: '',
  is_ambassador: 0,
  onboarding_step: 3,
  created_at: '2024-01-01',
};

function renderApp(initialPath: string = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>
  );
}

describe('AuthContext', () => {
  it('provides user and setUser to consumers', () => {
    const setUser = vi.fn();
    const user: User = { ...baseUser, username: 'contextuser' };

    function Consumer() {
      const auth = useAuth();
      return (
        <div>
          <span data-testid="username">{auth.user?.username}</span>
          <button onClick={() => auth.setUser(null)}>logout</button>
        </div>
      );
    }

    render(
      <AuthContext value={{ user, loading: false, setUser }}>
        <Consumer />
      </AuthContext>
    );

    expect(screen.getByTestId('username').textContent).toBe('contextuser');
  });
});

describe('App routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Login page when not authenticated', async () => {
    vi.mocked(getStoredToken).mockReturnValue(null);

    await act(async () => {
      renderApp('/');
    });

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('redirects to /onboarding when onboarding_step < 3', async () => {
    const onboardingUser: User = { ...baseUser, onboarding_step: 1 };
    vi.mocked(getStoredToken).mockReturnValue('valid-token');
    vi.mocked(getMe).mockResolvedValue(onboardingUser);

    await act(async () => {
      renderApp('/');
    });

    expect(screen.getByTestId('onboarding-page')).toBeInTheDocument();
  });

  it('redirects to /dashboard when authenticated and onboarding complete', async () => {
    vi.mocked(getStoredToken).mockReturnValue('valid-token');
    vi.mocked(getMe).mockResolvedValue(baseUser);

    await act(async () => {
      renderApp('/');
    });

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('RequireAuth blocks unauthenticated access to /dashboard', async () => {
    vi.mocked(getStoredToken).mockReturnValue(null);

    await act(async () => {
      renderApp('/dashboard');
    });

    // Should redirect to login
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
  });

  it('RequireAuth blocks unauthenticated access to /settings', async () => {
    vi.mocked(getStoredToken).mockReturnValue(null);

    await act(async () => {
      renderApp('/settings');
    });

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('settings-page')).not.toBeInTheDocument();
  });

  it('authenticated user can access /dashboard', async () => {
    vi.mocked(getStoredToken).mockReturnValue('valid-token');
    vi.mocked(getMe).mockResolvedValue(baseUser);

    await act(async () => {
      renderApp('/dashboard');
    });

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('unknown routes redirect to /dashboard when authenticated', async () => {
    vi.mocked(getStoredToken).mockReturnValue('valid-token');
    vi.mocked(getMe).mockResolvedValue(baseUser);

    await act(async () => {
      renderApp('/nonexistent');
    });

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
  });

  it('unknown routes redirect to / when not authenticated', async () => {
    vi.mocked(getStoredToken).mockReturnValue(null);

    await act(async () => {
      renderApp('/nonexistent');
    });

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});
