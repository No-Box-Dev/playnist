import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { imageUrl } from '../api';
import type { Game } from '../types';

function coverUrl(imageId: string) {
  return imageUrl(imageId, 't_cover_big_2x');
}

interface GameCardProps {
  game: Game;
  onAdd?: (game: Game) => void;
}

export default function GameCard({ game, onAdd }: GameCardProps) {
  const navigate = useNavigate();
  const imageId = game.cover?.image_id;

  const imgRef = useCallback((img: HTMLImageElement | null) => {
    if (img && img.complete) img.classList.add('loaded');
  }, []);

  return (
    <div
      className="game-card aspect-[2/3]"
      onClick={() => navigate(`/game/${game.id}`)}
    >
      {imageId ? (
        <img ref={imgRef} src={coverUrl(imageId)} alt={game.name} loading="lazy" onLoad={(e) => e.currentTarget.classList.add('loaded')} />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[var(--color-gray-bg)] p-2 text-center text-xs text-[var(--color-gray)]">
          {game.name}
        </div>
      )}
      {onAdd && (
        <button
          className="add-btn"
          aria-label={`Add ${game.name} to collection`}
          onClick={(e) => { e.stopPropagation(); onAdd(game); }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
        </button>
      )}
    </div>
  );
}
