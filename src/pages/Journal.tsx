import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import Modal from '../components/Modal';
import { useAuth } from '../hooks/useAuth';
import { getUserJournals, getGamesBatch, createJournal, deleteJournal, searchGames, imageUrl } from '../api';
import type { Journal as JournalType, Game } from '../types';
import './Journal.css';

export default function Journal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id;

  const [journals, setJournals] = useState<JournalType[]>([]);
  const [gameCache, setGameCache] = useState<Record<number, Game>>({});
  const [writeModal, setWriteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!userId) return;
    getUserJournals(userId).then((j) => setJournals(j as JournalType[])).catch(() => {});
  }, [userId]);

  useEffect(() => {
    const missing = [...new Set(journals.map((j) => j.igdb_game_id))].filter((id) => !gameCache[id]);
    if (missing.length === 0) return;
    getGamesBatch(missing).then((games) => {
      const batch: Record<number, Game> = {};
      (games as Game[]).forEach((g) => { batch[g.id] = g; });
      setGameCache((prev) => ({ ...prev, ...batch }));
    });
  }, [journals]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const results = await searchGames(searchQuery);
      setSearchResults(results as Game[]);
    } catch {
      setSearchResults([]);
    }
  };

  const handleCreate = async () => {
    if (!selectedGame || !content.trim() || !userId) return;
    try {
      await createJournal(selectedGame.id, content);
      setWriteModal(false);
      setSelectedGame(null);
      setContent('');
      setSearchQuery('');
      setSearchResults([]);
      getUserJournals(userId).then((j) => setJournals(j as JournalType[])).catch(() => {});
    } catch {
      // TODO: surface error feedback
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteJournal(id);
      setJournals((prev) => prev.filter((j) => j.id !== id));
    } catch {
      // TODO: surface error feedback
    }
  };

  const closeModal = () => {
    setWriteModal(false);
    setSelectedGame(null);
    setSearchQuery('');
    setSearchResults([]);
    setContent('');
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <Header />
      <main className="main-content">
        <div className="journal-page-header">
          <h2 className="section-header">Your Journal</h2>
          <button className="btn btn-primary" onClick={() => setWriteModal(true)}>+ Write Entry</button>
        </div>

        {journals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-emoji">&#x1F4DD;</div>
            <div className="empty-state-text">No journal entries yet</div>
            <p className="journal-empty-sub">Write about your gaming moments — the wins, the fails, the feelings.</p>
            <button className="btn btn-primary" onClick={() => setWriteModal(true)}>Write Your First Entry</button>
          </div>
        ) : (
          <div className="journal-list">
            {journals.map((j) => {
              const game = gameCache[j.igdb_game_id];
              return (
                <div
                  key={j.id}
                  className="journal-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/game/${j.igdb_game_id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/game/${j.igdb_game_id}`); }}
                >
                  <div className="journal-card-top">
                    {game?.cover?.image_id ? (
                      <img className="journal-card-cover" src={imageUrl(game.cover.image_id, 't_cover_small')} alt={game.name} />
                    ) : (
                      <div className="journal-card-cover-placeholder" />
                    )}
                    <div className="journal-card-meta">
                      <div className="journal-card-game">{game?.name || 'Game'}</div>
                      {game?.genres && <span className="journal-card-genre">{game.genres.map((g) => g.name).join(', ')}</span>}
                      <div className="journal-card-date">{new Date(j.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                    <button className="journal-card-delete" onClick={(e) => { e.stopPropagation(); handleDelete(j.id); }}>&#x1F5D1;</button>
                  </div>
                  <p className="journal-card-content">{j.content}</p>
                </div>
              );
            })}
          </div>
        )}

        <Modal open={writeModal} onClose={closeModal}>
          <h3 style={{ marginBottom: 16 }}>Write in Journal</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              className="input"
              placeholder="Search for a game..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn btn-primary" onClick={handleSearch}>Search</button>
          </div>
          {searchResults.length > 0 && !selectedGame && (
            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}>
              {searchResults.slice(0, 10).map((g) => (
                <div
                  key={g.id}
                  onClick={() => setSelectedGame(g)}
                  style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
                >
                  {g.cover?.image_id && <img src={imageUrl(g.cover.image_id, 't_thumb')} style={{ width: 24, height: 32, borderRadius: 4, objectFit: 'cover' }} alt="" />}
                  <span style={{ fontSize: 14 }}>{g.name}</span>
                </div>
              ))}
            </div>
          )}
          {selectedGame && (
            <>
              <div style={{ fontSize: 14, marginBottom: 12 }}>Game: <strong>{selectedGame.name}</strong></div>
              <textarea
                className="input"
                rows={5}
                placeholder="What moment made you smile? Made you cry? Made you frustrated?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ resize: 'vertical', marginBottom: 16 }}
              />
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate}>Post</button>
              </div>
            </>
          )}
        </Modal>
      </main>
      <BottomNav />
    </div>
  );
}
