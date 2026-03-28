import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import { AuthContext } from '../../hooks/useAuth';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock API
vi.mock('../../api', () => ({
  signin: vi.fn(),
  signup: vi.fn(),
  setToken: vi.fn(),
}));

// Mock carousel covers to avoid randomness
vi.mock('../../carouselSets', () => ({
  getRandomCarouselCovers: () => [
    ['https://playnist-api.jasper-414.workers.dev/img/test1/t_cover_big_2x'],
    ['https://playnist-api.jasper-414.workers.dev/img/test2/t_cover_big_2x'],
    ['https://playnist-api.jasper-414.workers.dev/img/test3/t_cover_big_2x'],
  ],
}));

import { signin, signup } from '../../api';

const mockSetUser = vi.fn();

function renderLogin() {
  return render(
    <AuthContext value={{ user: null, loading: false, setUser: mockSetUser }}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthContext>
  );
}

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows welcome state by default with logo, tagline, SIGN UP, SIGN IN', () => {
    renderLogin();

    expect(screen.getByAltText('Playnist')).toBeInTheDocument();
    expect(screen.getByText(/your game library/)).toBeInTheDocument();
    expect(screen.getByText(/reimagined/)).toBeInTheDocument();
    expect(screen.getByText('SIGN UP')).toBeInTheDocument();
    expect(screen.getByText('SIGN IN')).toBeInTheDocument();
  });

  it('clicking SIGN IN shows signin form', () => {
    renderLogin();

    fireEvent.click(screen.getByText('SIGN IN'));

    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type Password')).toBeInTheDocument();
  });

  it('clicking SIGN UP shows signup form with Email tab active', () => {
    renderLogin();

    fireEvent.click(screen.getByText('SIGN UP'));

    expect(screen.getByText('Create an account')).toBeInTheDocument();
    // Email tab should be active
    const emailTab = screen.getByRole('button', { name: 'Email' });
    expect(emailTab.className).toContain('active');
    expect(screen.getByPlaceholderText('Your Email')).toBeInTheDocument();
  });

  it('signup tabs navigation works: Email -> Password -> Username', () => {
    renderLogin();
    fireEvent.click(screen.getByText('SIGN UP'));

    // Start on email step - fill in email
    const emailInput = screen.getByPlaceholderText('Your Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Click NEXT to advance to password step
    fireEvent.click(screen.getByRole('button', { name: 'NEXT' }));
    expect(screen.getByPlaceholderText('Type Password')).toBeInTheDocument();

    // Fill password and advance to username step
    const passwordInput = screen.getByPlaceholderText('Type Password');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'NEXT' }));

    expect(screen.getByPlaceholderText('Your Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Optional bio')).toBeInTheDocument();
  });

  it('shows error when submitting empty email on signin', () => {
    renderLogin();
    fireEvent.click(screen.getByText('SIGN IN'));

    // Submit with empty fields
    fireEvent.click(screen.getByRole('button', { name: 'SIGN IN' }));

    expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
  });

  it('shows error when submitting empty email on signup', () => {
    renderLogin();
    fireEvent.click(screen.getByText('SIGN UP'));

    // Try to advance without entering email
    fireEvent.click(screen.getByRole('button', { name: 'NEXT' }));

    expect(screen.getByText('Please enter your email')).toBeInTheDocument();
  });

  it('calls signin API on form submit', async () => {
    const mockedSignin = vi.mocked(signin);
    mockedSignin.mockResolvedValueOnce({ user: { id: '1', username: 'player' }, token: 'tok123' });

    renderLogin();
    fireEvent.click(screen.getByText('SIGN IN'));

    fireEvent.change(screen.getByPlaceholderText('Type Email'), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Type Password'), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: 'SIGN IN' }));

    await waitFor(() => {
      expect(mockedSignin).toHaveBeenCalledWith('user@test.com', 'pass123');
    });
  });

  it('calls signup API on final step submit', async () => {
    const mockedSignup = vi.mocked(signup);
    mockedSignup.mockResolvedValueOnce({ user: { id: '2', username: 'newplayer' }, token: 'tok456' });

    renderLogin();
    fireEvent.click(screen.getByText('SIGN UP'));

    // Step 1: Email
    fireEvent.change(screen.getByPlaceholderText('Your Email'), { target: { value: 'new@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'NEXT' }));

    // Step 2: Password
    fireEvent.change(screen.getByPlaceholderText('Type Password'), { target: { value: 'password456' } });
    fireEvent.click(screen.getByRole('button', { name: 'NEXT' }));

    // Step 3: Username + agree to terms
    fireEvent.change(screen.getByPlaceholderText('Your Username'), { target: { value: 'newplayer' } });
    const termsCheckbox = screen.getByRole('checkbox');
    fireEvent.click(termsCheckbox);
    fireEvent.click(screen.getByRole('button', { name: 'SIGN UP' }));

    await waitFor(() => {
      expect(mockedSignup).toHaveBeenCalledWith('new@test.com', 'password456', 'newplayer', '');
    });
  });

  it('shows error message when signin API fails', async () => {
    const mockedSignin = vi.mocked(signin);
    mockedSignin.mockRejectedValueOnce(new Error('Invalid credentials'));

    renderLogin();
    fireEvent.click(screen.getByText('SIGN IN'));

    fireEvent.change(screen.getByPlaceholderText('Type Email'), { target: { value: 'bad@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Type Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'SIGN IN' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
