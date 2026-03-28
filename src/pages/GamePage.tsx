import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import Modal from '../components/Modal';
import { getGame, addToCollection, createJournal, imageUrl } from '../api';
import type { Game } from '../types';
import './GamePage.css';

export default function GamePage() {
  const { igdbId } = useParams();
  const navigate = useNavigate();
  const id = parseInt(igdbId || '0');

  const [game, setGame] = useState<Game | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [addStatus, setAddStatus] = useState('played');
  const [journalModal, setJournalModal] = useState(false);
  const [journalContent, setJournalContent] = useState('');

  useEffect(() => {
    if (!id) return;
    getGame(id).then((g) => setGame(g as Game));
  }, [id]);

  const handleAdd = async () => {
    await addToCollection(id, addStatus);
    setAddModal(false);
  };

  const handleJournal = async () => {
    if (!journalContent.trim()) return;
    await createJournal(id, journalContent);
    setJournalModal(false);
    setJournalContent('');
  };

  if (!game) return (
    <div className="app-layout">
      <Sidebar />
      <Header />
      <main className="main-content"><p>Loading...</p></main>
      <BottomNav />
    </div>
  );

  const coverUrl = game.cover?.image_id
    ? imageUrl(game.cover.image_id, 't_cover_big_2x')
    : null;

  const developers = game.involved_companies?.filter((c) => c.developer).map((c) => c.company.name) || [];
  const publishers = game.involved_companies?.filter((c) => !c.developer).map((c) => c.company.name) || [];
  const releaseDate = game.first_release_date
    ? new Date(game.first_release_date * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : null;

  const infoCards = [
    { label: 'MAIN DEVELOPERS', value: developers.join(', ') || '--' },
    { label: 'PUBLISHERS', value: publishers.join(', ') || '--' },
    { label: 'GENRE', value: game.genres?.map((g) => g.name).join(', ') || '--' },
    { label: 'PLATFORMS', value: game.platforms?.map((p) => p.name).join(', ') || '--' },
    { label: 'THEMES', value: '--' },
    { label: 'SERIES', value: '--' },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <Header />
      <main className="main-content">
        {/* Back button */}
        <button className="game-back-btn" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/dashboard')}>
          <span className="game-back-arrow" aria-hidden="true">&larr;</span> BACK
        </button>

        {/* Hero: text left, cover right */}
        <div className="game-hero-v2">
          <div className="game-hero-text">
            <h1 className="game-title-v2">{game.name}</h1>
            {releaseDate && <div className="game-release">Released {releaseDate}</div>}

            {game.storyline && (
              <>
                <h2 className="game-section-title">Story</h2>
                <p className="game-story">{game.storyline}</p>
              </>
            )}
            {!game.storyline && game.summary && (
              <>
                <h2 className="game-section-title">About</h2>
                <p className="game-story">{game.summary}</p>
              </>
            )}

            {/* Inline info grid: Genre, Platforms, Developers */}
            <div className="game-inline-grid">
              <div className="game-inline-item">
                <div className="game-inline-label">Genre</div>
                <div className="game-inline-value">{game.genres?.map((g) => g.name).join(', ') || '--'}</div>
              </div>
              <div className="game-inline-item">
                <div className="game-inline-label">Platforms</div>
                <div className="game-inline-value">{game.platforms?.map((p) => p.name).join(', ') || '--'}</div>
              </div>
              <div className="game-inline-item">
                <div className="game-inline-label">Developers</div>
                <div className="game-inline-value">{developers.join(', ') || '--'}</div>
              </div>
            </div>

            <a
              className="game-igdb-link"
              href={`https://www.igdb.com/games/${game.slug || game.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >SHOW ON IGDB.COM</a>
          </div>

          <div className="game-hero-cover-v2">
            {coverUrl ? (
              <div className="game-cover-wrap">
                <img src={coverUrl} alt={game.name} />
                <button className="game-cover-add" onClick={() => setAddModal(true)}>+</button>
              </div>
            ) : (
              <div className="game-cover-placeholder" />
            )}
          </div>
        </div>

        {/* Info cards grid */}
        <div className="game-info-grid">
          {infoCards.map((card) => (
            <div key={card.label} className="game-info-card">
              <div className="game-info-card-label">{card.label}</div>
              <div className="game-info-card-value">{card.value}</div>
            </div>
          ))}
        </div>

        {/* Screenshots */}
        {game.screenshots && game.screenshots.length > 0 && (
          <section className="mb-12">
            <h2 className="game-section-title">Screenshots</h2>
            <div className="game-screenshots">
              {game.screenshots.slice(0, 4).map((s) => (
                <img key={s.image_id} className="game-screenshot" src={imageUrl(s.image_id, 't_screenshot_med')} alt="Screenshot" loading="lazy" />
              ))}
            </div>
          </section>
        )}

        {/* Similar Games */}
        {game.similar_games && game.similar_games.length > 0 && (
          <section className="mb-12">
            <h2 className="game-section-title">Similar Games</h2>
            <div className="game-grid-4">
              {game.similar_games.slice(0, 4).map((sg) => (
                <div key={sg.id || sg.name} className="game-card aspect-[2/3]" onClick={() => { if (sg.id) navigate(`/game/${sg.id}`); }}>
                  {sg.cover?.image_id ? (
                    <img src={imageUrl(sg.cover.image_id, 't_cover_big_2x')} alt={sg.name} loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-[var(--color-gray-bg)] flex items-center justify-center text-xs p-2 text-center">{sg.name}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Add to Collection Modal */}
        <Modal open={addModal} onClose={() => setAddModal(false)}>
          <div className="text-center">
            <h3 className="mb-4">Add "{game.name}" to Collection</h3>
            <div className="flex gap-2 justify-center mb-6">
              {(['played', 'playing', 'want_to_play'] as const).map((s) => (
                <button key={s} className={`pill pill-${s === 'played' ? 'played' : s === 'playing' ? 'playing' : 'want'}${addStatus === s ? ' active' : ''}`} onClick={() => setAddStatus(s)}>
                  {s === 'want_to_play' ? 'Want to Play' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              <button className="btn btn-outline" onClick={() => setAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd}>Save</button>
            </div>
          </div>
        </Modal>

        {/* Journal Modal */}
        <Modal open={journalModal} onClose={() => setJournalModal(false)}>
          <h3 className="mb-4">Write about "{game.name}"</h3>
          <textarea className="input resize-y mb-4" rows={5} placeholder="What moment made you smile? Made you cry?" value={journalContent} onChange={(e) => setJournalContent(e.target.value)} />
          <div className="flex gap-3 justify-end">
            <button className="btn btn-outline" onClick={() => setJournalModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleJournal}>Post</button>
          </div>
        </Modal>
      </main>
      <BottomNav />
    </div>
  );
}
