import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import GameCard from '../components/GameCard';
import Modal from '../components/Modal';
import { getTrending, getNew, searchGames, addToCollection } from '../api';
import type { IGDBGame } from '../types';
import './Discover.css';

const CATEGORIES = ['All', 'Action', 'Adventure', 'RPG', 'Strategy', 'Indie', 'Platformer', 'Shooter', 'Puzzle', 'Simulation'];

export default function Discover() {
  const [trending, setTrending] = useState<IGDBGame[]>([]);
  const [newReleases, setNewReleases] = useState<IGDBGame[]>([]);
  const [popular, setPopular] = useState<IGDBGame[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IGDBGame[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [addModal, setAddModal] = useState<IGDBGame | null>(null);
  const [addStatus, setAddStatus] = useState('played');

  useEffect(() => {
    getTrending().then((g) => {
      const all = g as IGDBGame[];
      setTrending(all.slice(0, 4));
      setPopular(all.slice(4, 12));
    });
    getNew().then((g) => setNewReleases((g as IGDBGame[]).slice(0, 6)));
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      searchGames(searchQuery).then((g) => setSearchResults(g as IGDBGame[]));
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleAdd = (game: IGDBGame) => setAddModal(game);

  const confirmAdd = async () => {
    if (!addModal) return;
    await addToCollection(addModal.id, addStatus);
    setAddModal(null);
  };

  const filterByCategory = (games: IGDBGame[]) => {
    if (activeCategory === 'All') return games;
    return games.filter((g) =>
      g.genres?.some((genre) => genre.name.toLowerCase().includes(activeCategory.toLowerCase()))
    );
  };

  const displayGames = searchQuery.trim() ? searchResults : null;

  return (
    <div className="app-layout">
      <Sidebar />
      <Header />
      <main className="main-content">
        {/* Search */}
        <section className="discover-search-section">
          <div className="discover-search-wrap">
            <svg className="discover-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="discover-search-input"
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        {/* Category Pills */}
        <section className="discover-categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`discover-pill${activeCategory === cat ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </section>

        {/* Search Results */}
        {displayGames ? (
          <section className="section">
            <h2 className="section-header">Search Results</h2>
            {displayGames.length === 0 ? (
              <p className="discover-empty">No games found for "{searchQuery}"</p>
            ) : (
              <div className="game-grid">
                {filterByCategory(displayGames).map((g) => (
                  <GameCard key={g.id} game={g} onAdd={handleAdd} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Trending */}
            <section className="section">
              <h2 className="section-header">Trending</h2>
              <div className="game-grid-4">
                {filterByCategory(trending).map((g) => (
                  <GameCard key={g.id} game={g} onAdd={handleAdd} />
                ))}
              </div>
            </section>

            {/* New Releases */}
            <section className="section">
              <h2 className="section-header">New Releases</h2>
              <div className="game-grid">
                {filterByCategory(newReleases).map((g) => (
                  <GameCard key={g.id} game={g} onAdd={handleAdd} />
                ))}
              </div>
            </section>

            {/* Popular Games */}
            <section className="section">
              <h2 className="section-header">Popular Games</h2>
              <div className="game-grid">
                {filterByCategory(popular).map((g) => (
                  <GameCard key={g.id} game={g} onAdd={handleAdd} />
                ))}
              </div>
            </section>
          </>
        )}

        {/* Add to Collection Modal */}
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
