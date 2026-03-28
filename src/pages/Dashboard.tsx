import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import GameCard from '../components/GameCard';
import Modal from '../components/Modal';
import { getTrending, getNew, addToCollection, imageUrl } from '../api';
import type { Game } from '../types';
import './Dashboard.css';

export default function Dashboard() {
  const [trending, setTrending] = useState<Game[]>([]);
  const [newGames, setNewGames] = useState<Game[]>([]);
  const [rainyDay, setRainyDay] = useState<Game[]>([]);
  const [ambassadorPicks, setAmbassadorPicks] = useState<Game[]>([]);
  const [addModal, setAddModal] = useState<Game | null>(null);
  const [addStatus, setAddStatus] = useState('played');
  const navigate = useNavigate();

  useEffect(() => {
    getTrending().then((g) => {
      const all = g as Game[];
      setTrending(all.slice(0, 4));
      setAmbassadorPicks(all.slice(4, 8));
      setRainyDay(all.slice(8, 12));
    });
    getNew().then((g) => setNewGames((g as Game[]).slice(0, 5)));
  }, []);

  const handleAdd = (game: Game) => setAddModal(game);

  const confirmAdd = async () => {
    if (!addModal) return;
    await addToCollection(addModal.id, addStatus);
    setAddModal(null);
  };

  const spotlightGame = trending[0];

  return (
    <div className="app-layout">
      <Sidebar />
      <Header />
      <main className="main-content">
        {/* Trending */}
        <section className="section">
          <h2 className="section-header">Trending on Playnist</h2>
          <div className="game-grid-4">
            {trending.map((g) => <GameCard key={g.id} game={g} onAdd={handleAdd} />)}
          </div>
        </section>

        {/* Ambassador Spotlight — Bubble layout: game cover left, info right */}
        <section className="section">
          <h2 className="section-header-caps">Ambassador Spotlight</h2>
          <div className="ambassador-card-v2">
            {spotlightGame?.cover?.image_id && (
              <div className="ambassador-game-cover" onClick={() => navigate(`/game/${spotlightGame.id}`)}>
                <img src={imageUrl(spotlightGame.cover.image_id, 't_cover_big_2x')} alt={spotlightGame.name} />
                <button className="add-btn" onClick={(e) => { e.stopPropagation(); handleAdd(spotlightGame); }}>+</button>
              </div>
            )}
            <div className="ambassador-info">
              <div className="ambassador-header">
                <img className="ambassador-avatar-sm" src="/images/user-icon.png" alt="Ambassador" />
                <div>
                  <div className="ambassador-name-v2">Emma Nicole</div>
                  <span className="badge-ambassador-sm">Ambassador</span>
                </div>
                <button className="btn-follow">Follow</button>
              </div>
              <p className="ambassador-quote-v2">
                This is one of my standouts of the year so far! It feels so different to other management games, but it has all the same familiar mechanics that you know and love. I'm so excited to see how this game continues to grow and evolve.
              </p>
              <div className="ambassador-actions">
                <div className="reactions">
                  <button className="reaction-btn"><img src="/images/emoji-heart.png" alt="heart" className="reaction-emoji" /> <span>8</span></button>
                  <button className="reaction-btn"><img src="/images/emoji-smile.png" alt="smile" className="reaction-emoji" /> <span>3</span></button>
                  <button className="reaction-btn"><img src="/images/emoji-laugh.png" alt="laugh" className="reaction-emoji" /> <span>1</span></button>
                  <button className="reaction-btn"><img src="/images/emoji-shocked.png" alt="shocked" className="reaction-emoji" /> <span>4</span></button>
                </div>
                <a className="read-more-link">&gt; Read more</a>
              </div>
              <button className="btn btn-primary btn-add-library">Add to Library</button>
            </div>
          </div>
        </section>

        {/* New & Noteworthy */}
        <section className="section">
          <h2 className="section-header-caps">New and Noteworthy!</h2>
          <div className="game-grid">
            {newGames.map((g) => <GameCard key={g.id} game={g} onAdd={handleAdd} />)}
          </div>
        </section>

        {/* Ambassador Top Picks */}
        <section className="section">
          <h2 className="section-header-caps">Ambassador Top Picks</h2>
          <div className="ambassador-picks-header">
            <img className="ambassador-avatar-sm" src="/images/user-icon.png" alt="Ambassador" />
            <div>
              <span className="ambassador-name-v2">Emma Nicole</span>
              <span className="badge-ambassador-sm ml-2">Ambassador</span>
            </div>
            <button className="btn-follow">Follow</button>
            <span className="ambassador-picks-label">Favourite games</span>
          </div>
          <div className="game-grid-4">
            {ambassadorPicks.map((g) => <GameCard key={g.id} game={g} onAdd={handleAdd} />)}
          </div>
        </section>

        {/* Journal Prompt */}
        <section className="section">
          <h2 className="section-header-caps">Journal Prompt of the Week!</h2>
          <div className="prompt-card">
            <div className="prompt-icon">&#x1F4DD;</div>
            <p className="prompt-text">What games are you playing in the New Year 2026?</p>
            <button className="btn btn-primary prompt-btn" onClick={() => navigate('/journal')}>WRITE IN JOURNAL +</button>
          </div>
        </section>

        {/* Games for Rainy Days */}
        <section className="section">
          <h2 className="section-header-caps">Games for Rainy Days</h2>
          <div className="game-grid-4">
            {rainyDay.map((g) => <GameCard key={g.id} game={g} onAdd={handleAdd} />)}
          </div>
        </section>

        {/* Add Game Modal */}
        <Modal open={!!addModal} onClose={() => setAddModal(null)}>
          {addModal && (
            <div className="text-center">
              <h3 className="mb-4">Add "{addModal.name}" to Collection</h3>
              <div className="flex gap-2 justify-center mb-6">
                {(['played', 'playing', 'want_to_play'] as const).map((s) => (
                  <button
                    key={s}
                    className={`pill pill-${s === 'played' ? 'played' : s === 'playing' ? 'playing' : 'want'}${addStatus === s ? ' active' : ''}`}
                    onClick={() => setAddStatus(s)}
                  >
                    {s === 'want_to_play' ? 'Want to Play' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 justify-center">
                <button className="btn btn-outline" onClick={() => setAddModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={confirmAdd}>Save</button>
              </div>
            </div>
          )}
        </Modal>
      </main>
      <BottomNav />
    </div>
  );
}
