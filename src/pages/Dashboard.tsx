import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import GameCard from '../components/GameCard';
import Modal from '../components/Modal';
import { getTrending, getNew, addToCollection, imageUrl, getAmbassadors, getUserJournals, getUserCollection, getGame, getGamesBatch, followUser, unfollowUser, getUserFollowing } from '../api';
import { useAuth } from '../hooks/useAuth';
import type { Game, User } from '../types';
import './Dashboard.css';

export default function Dashboard() {
  const [trending, setTrending] = useState<Game[]>([]);
  const [newGames, setNewGames] = useState<Game[]>([]);
  const [rainyDay, setRainyDay] = useState<Game[]>([]);
  const [ambassadorPicks, setAmbassadorPicks] = useState<Game[]>([]);
  const [addModal, setAddModal] = useState<Game | null>(null);
  const [addStatus, setAddStatus] = useState('played');
  const [spotlightAmbassador, setSpotlightAmbassador] = useState<User | null>(null);
  const [spotlightJournal, setSpotlightJournal] = useState<{ content: string; igdb_game_id: number } | null>(null);
  const [spotlightGame, setSpotlightGame] = useState<Game | null>(null);
  const [picksAmbassador, setPicksAmbassador] = useState<User | null>(null);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    getTrending().then((g) => {
      const all = g as Game[];
      setTrending(all.slice(0, 4));
      setRainyDay(all.slice(4, 8));
    }).catch(() => {});
    getNew().then((g) => setNewGames((g as Game[]).slice(0, 5))).catch(() => {});

    // Fetch ambassadors dynamically, then load spotlight + picks data
    getAmbassadors().then((ambassadors) => {
      const list = ambassadors as User[];
      const spotlightUser = list[0];
      const picksUser = list[1] || list[0];

      if (spotlightUser) {
        setSpotlightAmbassador(spotlightUser);
        getUserJournals(spotlightUser.id).then((journals) => {
          const j = (journals as { content: string; igdb_game_id: number }[])[0];
          if (j) {
            setSpotlightJournal(j);
            getGame(j.igdb_game_id).then((g) => setSpotlightGame(g as Game)).catch(() => {});
          }
        }).catch(() => {});
      }

      if (picksUser) {
        setPicksAmbassador(picksUser);
        getUserCollection(picksUser.id).then((items) => {
          const gameIds = (items as { igdb_game_id: number }[]).map((i) => i.igdb_game_id).slice(0, 4);
          if (gameIds.length) {
            getGamesBatch(gameIds).then((games) => setAmbassadorPicks(games as Game[])).catch(() => {});
          }
        }).catch(() => {});
      }
    }).catch(() => {});

    // Fetch who the current user follows
    if (user?.id) {
      getUserFollowing(user.id).then((f) => {
        setFollowing(new Set((f as { id: string }[]).map((u) => u.id)));
      }).catch(() => {});
    }
  }, [user?.id]);

  const handleFollow = async (userId: string) => {
    try {
      if (following.has(userId)) {
        await unfollowUser(userId);
        setFollowing((prev) => { const next = new Set(prev); next.delete(userId); return next; });
      } else {
        await followUser(userId);
        setFollowing((prev) => new Set(prev).add(userId));
      }
    } catch { /* ignore */ }
  };

  const handleAdd = (game: Game) => setAddModal(game);

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
            {trending.length > 0
              ? trending.map((g) => <GameCard key={g.id} game={g} onAdd={handleAdd} />)
              : [1, 2, 3, 4].map((i) => <div key={i} className="skeleton-card" />)
            }
          </div>
        </section>

        {/* Ambassador Spotlight — Bubble layout: game cover left, info right */}
        <section className="section">
          <h2 className="section-header-caps">Ambassador Spotlight</h2>
          {spotlightAmbassador && spotlightGame && spotlightJournal && (
            <div className="ambassador-card-v2">
              {spotlightGame.cover?.image_id && (
                <div className="ambassador-game-cover" onClick={() => navigate(`/game/${spotlightGame.id}`)}>
                  <img src={imageUrl(spotlightGame.cover.image_id, 't_cover_big_2x')} alt={spotlightGame.name} ref={(img) => { if (img?.complete) img.classList.add('loaded'); }} onLoad={(e) => e.currentTarget.classList.add('loaded')} />
                  <button className="add-btn" aria-label={`Add ${spotlightGame.name} to collection`} onClick={(e) => { e.stopPropagation(); handleAdd(spotlightGame); }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                  </button>
                </div>
              )}
              <div className="ambassador-info">
                <div className="ambassador-header">
                  <img className="ambassador-avatar-sm ambassador-clickable" src={spotlightAmbassador.avatar_url || '/images/user-icon.png'} alt={spotlightAmbassador.username} onClick={() => navigate(`/profile/${spotlightAmbassador.username}`)} />
                  <div>
                    <div className="ambassador-name-row">
                      <span className="ambassador-name-v2 ambassador-clickable" onClick={() => navigate(`/profile/${spotlightAmbassador.username}`)}>{spotlightAmbassador.username}</span>
                      <button className={`btn-follow${following.has(spotlightAmbassador.id) ? ' following' : ''}`} onClick={() => handleFollow(spotlightAmbassador.id)}>
                        {following.has(spotlightAmbassador.id) ? 'Following' : 'Follow'}
                      </button>
                    </div>
                    <span className="badge-ambassador-sm">Ambassador</span>
                  </div>
                </div>
                <p className="ambassador-quote-v2">{spotlightJournal.content}</p>
                <div className="ambassador-actions">
                  <div className="reactions">
                    <button className="reaction-btn"><img src="/images/emoji-heart.png" alt="heart" className="reaction-emoji" /> <span>0</span></button>
                    <button className="reaction-btn"><img src="/images/emoji-smile.png" alt="smile" className="reaction-emoji" /> <span>0</span></button>
                    <button className="reaction-btn"><img src="/images/emoji-laugh.png" alt="laugh" className="reaction-emoji" /> <span>0</span></button>
                    <button className="reaction-btn"><img src="/images/emoji-shocked.png" alt="shocked" className="reaction-emoji" /> <span>0</span></button>
                  </div>
                  <a className="read-more-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '0.25rem' }}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    0 Read more
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* New & Noteworthy */}
        <section className="section">
          <h2 className="section-header-caps">New and Noteworthy!</h2>
          <div className="game-grid">
            {newGames.length > 0
              ? newGames.map((g) => <GameCard key={g.id} game={g} onAdd={handleAdd} />)
              : [1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton-card" />)
            }
          </div>
        </section>

        {/* Ambassador Top Picks */}
        <section className="section">
          <h2 className="section-header-caps">Ambassador Top Picks</h2>
          <div className="ambassador-picks-card">
            {picksAmbassador && (
              <div className="ambassador-picks-header">
                <img className="ambassador-avatar-sm ambassador-clickable" src={picksAmbassador.avatar_url || '/images/user-icon.png'} alt={picksAmbassador.username} onClick={() => navigate(`/profile/${picksAmbassador.username}`)} />
                <div>
                  <div className="ambassador-name-row">
                    <span className="ambassador-name-v2 ambassador-clickable" onClick={() => navigate(`/profile/${picksAmbassador.username}`)}>{picksAmbassador.username}</span>
                    <button className={`btn-follow${following.has(picksAmbassador.id) ? ' following' : ''}`} onClick={() => handleFollow(picksAmbassador.id)}>
                      {following.has(picksAmbassador.id) ? 'Following' : 'Follow'}
                    </button>
                  </div>
                  <span className="badge-ambassador-sm">Ambassador</span>
                </div>
                <span className="ambassador-picks-label">Favourite games</span>
              </div>
            )}
            <div className="game-grid-4">
              {ambassadorPicks.length > 0
                ? ambassadorPicks.map((g) => <GameCard key={g.id} game={g} onAdd={handleAdd} />)
                : [1, 2, 3, 4].map((i) => <div key={i} className="skeleton-card" />)
              }
            </div>
          </div>
        </section>

        {/* Journal Prompt */}
        <section className="section">
          <h2 className="section-header-caps">Journal Prompt of the Week!</h2>
          <div className="prompt-card">
            <img className="prompt-icon" src="/images/icon-journal-box.avif" alt="Journal" />
            <p className="prompt-text">What games are you playing in the New Year 2026?</p>
            <button className="btn btn-primary prompt-btn" onClick={() => navigate('/journal')}>WRITE IN JOURNAL +</button>
          </div>
        </section>

        {/* Games for Rainy Days */}
        <section className="section">
          <h2 className="section-header-caps">Games for Rainy Days</h2>
          <div className="game-grid-4">
            {rainyDay.length > 0
              ? rainyDay.map((g) => <GameCard key={g.id} game={g} onAdd={handleAdd} />)
              : [1, 2, 3, 4].map((i) => <div key={i} className="skeleton-card" />)
            }
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
