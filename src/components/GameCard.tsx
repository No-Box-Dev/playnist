import { useNavigate } from 'react-router-dom';
import type { IGDBGame } from '../types';

function coverUrl(imageId: string) {
  return `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`;
}

interface GameCardProps {
  game: IGDBGame;
  onAdd?: (game: IGDBGame) => void;
}

export default function GameCard({ game, onAdd }: GameCardProps) {
  const navigate = useNavigate();
  const imageId = game.cover?.image_id;

  return (
    <div
      className="game-card"
      style={{ aspectRatio: '2/3' }}
      onClick={() => navigate(`/game/${game.id}`)}
    >
      {imageId ? (
        <img src={coverUrl(imageId)} alt={game.name} loading="lazy" />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'var(--color-gray-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--color-gray)', padding: 8, textAlign: 'center' }}>
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
