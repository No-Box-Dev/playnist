import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import GameCard from '../components/GameCard';
import Modal from '../components/Modal';
import { searchGames, addToCollection } from '../api';
import type { Game } from '../types';
import './Search.css';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Game[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addModal, setAddModal] = useState<Game | null>(null);
  const [addStatus, setAddStatus] = useState('played');

  const handleSearch = async (q?: string) => {
    const term = q ?? query;
    if (!term.trim()) return;
    setLoading(true);
    setSearchParams({ q: term });
    try {
      const res = await searchGames(term);
      setResults(res as Game[]);
    } catch {
      setResults([]);
    }
    setSearched(true);
    setLoading(false);
  };

  useEffect(() => {
    if (initialQuery) handleSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = (game: Game) => setAddModal(game);

  const confirmAdd = async () => {
    if (!addModal) return;
    try {
      await addToCollection(addModal.id, addStatus);
      setAddModal(null);
      setAddStatus('played');
    } catch {
      // TODO: surface error feedback
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <Header />
      <main className="main-content">
        <section className="section">
          <h2 className="section-header">Search Games</h2>
          <div className="search-bar">
            <input
              className="input search-input"
              type="text"
              placeholder="Search for any game..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              autoFocus
            />
            <button className="btn btn-primary" onClick={() => handleSearch()}>Search</button>
          </div>
        </section>

        {loading && <p className="search-status">Searching...</p>}

        {!loading && searched && results.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-emoji">&#x1F50D;</div>
            <div className="empty-state-text">No games found for "{searchParams.get('q')}"</div>
          </div>
        )}

        {results.length > 0 && (
          <section className="section">
            <div className="search-count">{results.length} result{results.length !== 1 ? 's' : ''}</div>
            <div className="game-grid">
              {results.map((g) => (
                <GameCard key={g.id} game={g} onAdd={handleAdd} />
              ))}
            </div>
          </section>
        )}

        <Modal open={!!addModal} onClose={() => setAddModal(null)}>
          {addModal && (
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: 16 }}>Add "{addModal.name}" to Collection</h3>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
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
