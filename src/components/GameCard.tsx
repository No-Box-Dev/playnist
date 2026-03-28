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

  return (
    <div
      className="game-card aspect-[2/3]"
      onClick={() => navigate(`/game/${game.id}`)}
    >
      {imageId ? (
        <img src={coverUrl(imageId)} alt={game.name} loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[var(--color-gray-bg)] p-2 text-center text-xs text-[var(--color-gray)]">
          {game.name}
        </div>
      )}
      {onAdd && (
        <button
          className="add-btn"
          onClick={(e) => { e.stopPropagation(); onAdd(game); }}
        >
          +
        </button>
      )}
    </div>
  );
}
