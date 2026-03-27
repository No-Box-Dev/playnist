import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GameCard from '../../components/GameCard';
import type { Game } from '../../types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const gameWithCover: Game = {
  id: 101,
  name: 'Test Game',
  cover: { image_id: 'abc123' },
};

const gameWithoutCover: Game = {
  id: 202,
  name: 'No Cover Game',
};

describe('GameCard', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders game cover image from IGDB', () => {
    render(
      <MemoryRouter>
        <GameCard game={gameWithCover} />
      </MemoryRouter>
    );

    const img = screen.getByAltText('Test Game') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toBe('https://playnist-api.jasper-414.workers.dev/img/abc123/t_cover_small_2x');
  });

  it('shows fallback when no cover', () => {
    render(
      <MemoryRouter>
        <GameCard game={gameWithoutCover} />
      </MemoryRouter>
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('No Cover Game')).toBeInTheDocument();
  });

  it('calls onAdd when + button clicked', () => {
    const onAdd = vi.fn();
    render(
      <MemoryRouter>
        <GameCard game={gameWithCover} onAdd={onAdd} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+'));
    expect(onAdd).toHaveBeenCalledWith(gameWithCover);
  });

  it('does not render + button when onAdd is not provided', () => {
    render(
      <MemoryRouter>
        <GameCard game={gameWithCover} />
      </MemoryRouter>
    );

    expect(screen.queryByText('+')).not.toBeInTheDocument();
  });

  it('navigates to game page on click', () => {
    render(
      <MemoryRouter>
        <GameCard game={gameWithCover} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByAltText('Test Game'));
    expect(mockNavigate).toHaveBeenCalledWith('/game/101');
  });

  it('does not navigate when + button is clicked (stopPropagation)', () => {
    const onAdd = vi.fn();
    render(
      <MemoryRouter>
        <GameCard game={gameWithCover} onAdd={onAdd} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('+'));
    expect(onAdd).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
