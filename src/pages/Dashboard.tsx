import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import GameCard from '../components/GameCard';
import Modal from '../components/Modal';
import { getTrending, getNew, addToCollection } from '../api';
import type { IGDBGame } from '../types';
import './Dashboard.css';

const COMMUNITY_POSTS = [
  { user: 'PixelHunter', time: '2 hours ago', genre: 'Action Adventure', coverIdx: 0, body: 'Just finished the main storyline and I\'m blown away. The final boss fight was incredibly satisfying...', reactions: { heart: 12, star: 5, laugh: 3, fire: 8 } },
  { user: 'RetroGamer99', time: '5 hours ago', genre: 'Strategy, Simulation', coverIdx: 1, body: '100 hours in and still discovering new things. This is hands down the best simulation game I\'ve played...', reactions: { heart: 24, star: 10, fire: 15 } },
  { user: 'NightOwlPlays', time: '1 day ago', genre: 'Indie, Platformer', coverIdx: 2, body: 'Don\'t sleep on this indie gem! The art style alone makes it worth playing, but the mechanics are what keeps you coming back...', reactions: { heart: 7, laugh: 2 } },
];

export default function Dashboard() {
  const [trending, setTrending] = useState<IGDBGame[]>([]);
  const [newGames, setNewGames] = useState<IGDBGame[]>([]);
  const [rainyDay, setRainyDay] = useState<IGDBGame[]>([]);
  const [addModal, setAddModal] = useState<IGDBGame | null>(null);
  const [addStatus, setAddStatus] = useState('played');
  const navigate = useNavigate();

  useEffect(() => {
    getTrending().then((g) => {
      const all = g as IGDBGame[];
      setTrending(all.slice(0, 4));
      setRainyDay(all.slice(4, 9));
    });
    getNew().then((g) => setNewGames((g as IGDBGame[]).slice(0, 5)));
  }, []);

  const handleAdd = (game: IGDBGame) => setAddModal(game);

  const confirmAdd = async () => {
    if (!addModal) return;
    await addToCollection(addModal.id, addStatus);
    setAddModal(null);
  };

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

        {/* Ambassador Spotlight */}
        <section className="section">
          <h2 className="section-header">Ambassador Spotlight</h2>
          <div className="ambassador-card">
            <img className="ambassador-avatar" src="/images/user-icon.png" alt="Ambassador" />
            <div className="ambassador-content">
              <div className="ambassador-name">
                GameMaster42{' '}
                <span className="badge-ambassador" style={{ marginLeft: 8 }}>&#x2B50; Ambassador</span>
              </div>
              <p className="ambassador-quote">"This game completely changed my perspective on storytelling in games. The way it weaves narrative with gameplay is unlike anything I've experienced before."</p>
              {trending[0] && (
                <div className="ambassador-game" onClick={() => navigate(`/game/${trending[0].id}`)}>
                  {trending[0].cover?.image_id && (
                    <img src={`https://images.igdb.com/igdb/image/upload/t_cover_small/${trending[0].cover.image_id}.jpg`} alt={trending[0].name} />
                  )}
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{trending[0].name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-gray)' }}>{trending[0].genres?.map((g) => g.name).join(', ') || 'Game'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Community */}
        <section className="section">
          <h2 className="section-header">What the Community is Playing</h2>
          <div className="community-grid">
            {COMMUNITY_POSTS.map((post) => {
              const coverGame = newGames[post.coverIdx];
              const coverImageId = coverGame?.cover?.image_id;
              return (
                <div key={post.user} className="community-card">
                  <div className="community-card-header">
                    <img style={{ borderRadius: '50%', width: 36, height: 36, objectFit: 'cover' }} src="/images/user-icon.png" alt={post.user} />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{post.user}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-gray)' }}>{post.time}</div>
                    </div>
                  </div>
                  <div className="community-game-tag">
                    {coverImageId && <img src={`https://images.igdb.com/igdb/image/upload/t_thumb/${coverImageId}.jpg`} alt="" style={{ width: 20, height: 28, borderRadius: 3, objectFit: 'cover' }} />}
                    <span>{post.genre}</span>
                  </div>
                  <p className="community-card-body">{post.body}</p>
                  <a className="read-more">Read more</a>
                  <div className="reactions" style={{ marginTop: 12 }}>
                    {Object.entries(post.reactions).map(([key, count]) => (
                      <button key={key} className="reaction-btn">
                        {key === 'heart' ? '\u2764\uFE0F' : key === 'star' ? '\uD83C\uDF1F' : key === 'laugh' ? '\uD83D\uDE02' : '\uD83D\uDD25'} <span>{count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* New & Noteworthy */}
        <section className="section">
          <h2 className="section-header">New & Noteworthy</h2>
          <div className="game-grid">
            {newGames.map((g) => <GameCard key={g.id} game={g} onAdd={handleAdd} />)}
          </div>
        </section>

        {/* Journal Prompt */}
        <section className="section">
          <div className="prompt-card">
            <div className="prompt-label">Journal Prompt of the Week</div>
            <p className="prompt-text">What game moment made you feel something you didn't expect?</p>
            <button className="btn btn-primary">Write in Journal</button>
          </div>
        </section>

        {/* Games for a Rainy Day */}
        <section className="section">
          <h2 className="section-header">Games for a Rainy Day</h2>
          <div className="game-grid">
            {rainyDay.map((g) => <GameCard key={g.id} game={g} onAdd={handleAdd} />)}
          </div>
        </section>

        {/* Add Game Modal */}
        <Modal open={!!addModal} onClose={() => setAddModal(null)}>
          {addModal && (
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: 16 }}>Add "{addModal.name}" to Collection</h3>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
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
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
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
