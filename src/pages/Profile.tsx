import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getAvatarUrl } from '../avatars';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import Modal from '../components/Modal';
import { useAuth } from '../hooks/useAuth';
import { getUserCollection, getUserJournals, getGamesBatch, addToCollection, createJournal, deleteJournal, searchGames, imageUrl } from '../api';
import type { CollectionItem, Journal, Game } from '../types';
import './Profile.css';
import './Journal.css';

export default function Profile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const profileId = id || user?.id || 'dev-user-001';
  const isOwn = !id || id === user?.id;

  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') === 'journal' ? 'journal' : 'library';
  const [tab, setTab] = useState<'library' | 'journal'>(tabParam);

  useEffect(() => { setTab(tabParam); }, [tabParam]);
  const [filter, setFilter] = useState<string | null>(null);
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [gameCache, setGameCache] = useState<Record<number, Game>>({});
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [journalModal, setJournalModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [addStatus, setAddStatus] = useState('played');
  const [journalContent, setJournalContent] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const collectionPromise = getUserCollection(profileId, filter || undefined).then((c) => {
      if (!cancelled) setCollection(c as CollectionItem[]);
    });
    const journalPromise = tab === 'journal'
      ? getUserJournals(profileId).then((j) => { if (!cancelled) setJournals(j as Journal[]); })
      : Promise.resolve();
    Promise.all([collectionPromise, journalPromise]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [profileId, filter, tab]);

  useEffect(() => {
    const allIds = [
      ...collection.map((c) => c.igdb_game_id),
      ...journals.map((j) => j.igdb_game_id),
    ];
    const missing = [...new Set(allIds)].filter((id) => !gameCache[id]);
    if (missing.length === 0) return;
    getGamesBatch(missing).then((games) => {
      const batch: Record<number, Game> = {};
      (games as Game[]).forEach((g) => { batch[g.id] = g; });
      setGameCache((prev) => ({ ...prev, ...batch }));
    });
  }, [collection, journals]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const results = await searchGames(searchQuery);
    setSearchResults(results as Game[]);
  };

  const handleAddGame = async () => {
    if (!selectedGame) return;
    await addToCollection(selectedGame.id, addStatus);
    setAddModal(false);
    setSelectedGame(null);
    setSearchQuery('');
    setSearchResults([]);
    getUserCollection(profileId, filter || undefined).then((c) => setCollection(c as CollectionItem[]));
  };

  const handleDeleteJournal = async (journalId: string) => {
    await deleteJournal(journalId);
    setJournals((prev) => prev.filter((j) => j.id !== journalId));
  };

  const handleCreateJournal = async () => {
    if (!selectedGame || !journalContent.trim()) return;
    await createJournal(selectedGame.id, journalContent);
    setJournalModal(false);
    setSelectedGame(null);
    setJournalContent('');
    setSearchQuery('');
    setSearchResults([]);
    getUserJournals(profileId).then((j) => setJournals(j as Journal[]));
  };

  const playedCount = collection.filter((c) => c.status === 'played').length;
  const playingCount = collection.filter((c) => c.status === 'playing').length;
  const wantCount = collection.filter((c) => c.status === 'want_to_play').length;

  return (
    <div className="app-layout">
      <Sidebar />
      <Header />
      <main className="main-area">
        {/* Sunburst Banner */}
        <div className="profile-banner">
          {isOwn && <button className="profile-banner-edit"><img src="/images/icon-edit.svg" alt="Edit" /></button>}
        </div>

        {/* Profile Info — avatar left, stats+edit right */}
        <div className="profile-info">
          <div className="profile-avatar-wrap">
            <img className="profile-avatar" src={getAvatarUrl(profileId, isOwn ? user?.avatar_url : undefined)} alt="Avatar" />
            {isOwn && <button className="profile-edit-avatar"><img src="/images/icon-edit.svg" alt="Edit avatar" /></button>}
          </div>
          <div className="profile-right">
            <div className="profile-stats-row">
              <div className="profile-stat"><strong>0</strong> Followers</div>
              <div className="profile-stat"><strong>0</strong> Following</div>
            </div>
            {isOwn ? (
              <button className="btn btn-outline profile-edit-btn" onClick={() => navigate('/settings')}>EDIT PROFILE &#x270F;</button>
            ) : (
              <button className="btn btn-primary">+ Follow</button>
            )}
          </div>
        </div>

        {/* Username */}
        <h1 className="profile-name">{user?.username || 'User'}</h1>

        {/* Tabs — LIBRARY / JOURNAL */}
        <div className="profile-tabs">
          <button className={`profile-tab ${tab === 'library' ? 'active' : ''}`} onClick={() => setTab('library')}>
            <svg width="16" height="18" viewBox="0 0 16 18" fill="none" className="profile-tab-icon"><path fillRule="evenodd" clipRule="evenodd" d="M0 5.75V16C0 17.648 1.882 18.589 3.2 17.6L6.8 14.9C7.511 14.367 8.489 14.367 9.2 14.9L12.8 17.6C14.118 18.589 16 17.648 16 16V5.75H0ZM0 4.25H16V2C16 .895 15.105 0 14 0H2C.895 0 0 .895 0 2V4.25Z" fill="currentColor"/></svg>
            LIBRARY
          </button>
          <button className={`profile-tab ${tab === 'journal' ? 'active' : ''}`} onClick={() => setTab('journal')}>
            <svg width="21" height="18" viewBox="0 0 21 18" fill="none" className="profile-tab-icon"><path fillRule="evenodd" clipRule="evenodd" d="M9.75 2.378C7.631.922 4.69.259 2.494.011 1.396-.113.5.804.5 1.935V13.2c0 1.131.896 2.048 1.994 2.172 2.195.248 5.137.911 7.256 2.367V2.378Zm1.5 15.361c2.119-1.456 5.06-2.119 7.256-2.367C19.604 15.248 20.5 14.331 20.5 13.2V1.935C20.5.804 19.604-.113 18.506.011c-2.195.248-5.137.911-7.256 2.367v15.361ZM2.759 5.14a.75.75 0 0 1 .856-.626c1.303.202 2.77.539 4.156 1.075a.75.75 0 1 1-.57 1.387c-1.259-.487-2.616-.802-3.844-.992a.75.75 0 0 1-.598-.844Zm.856 3.374a.75.75 0 0 0-.598.844.75.75 0 0 0 .627.856c.619.096 1.273.224 1.931.39a.75.75 0 1 0 .344-.89 16.3 16.3 0 0 0-2.304-.2Z" fill="currentColor"/></svg>
            JOURNAL
          </button>
        </div>

        {/* Library Tab */}
        {tab === 'library' && (
          <div className="profile-section">
            <div className="collections-header">
              <h2 className="collections-title">COLLECTIONS</h2>
              {isOwn && <button className="btn btn-primary collections-add-btn" onClick={() => setAddModal(true)}>ADD NEW GAME +</button>}
            </div>
            <div className="library-filters">
              <button className={`pill pill-played ${filter === 'played' ? 'active' : ''}`} onClick={() => setFilter(filter === 'played' ? null : 'played')}>Played {playedCount}</button>
              <button className={`pill pill-playing ${filter === 'playing' ? 'active' : ''}`} onClick={() => setFilter(filter === 'playing' ? null : 'playing')}>Playing {playingCount}</button>
              <button className={`pill pill-want ${filter === 'want_to_play' ? 'active' : ''}`} onClick={() => setFilter(filter === 'want_to_play' ? null : 'want_to_play')}>Want to play {wantCount}</button>
            </div>
            <div className="library-content">
              {loading ? (
                <div className="empty-state"><div className="empty-state-title">Loading...</div></div>
              ) : collection.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-emoji">&#x1F4E6;</div>
                  <div className="empty-state-title">YOUR LIBRARY IS EMPTY</div>
                  <div className="empty-state-text">Add a game to your library</div>
                  <button className="btn btn-orange" onClick={() => setAddModal(true)}>ADD A GAME +</button>
                </div>
              ) : (
                <div className="game-grid">
                  {collection.map((item) => {
                    const game = gameCache[item.igdb_game_id];
                    const imageId = game?.cover?.image_id;
                    return (
                      <div key={item.id} className="game-card aspect-[2/3]" onClick={() => navigate(`/game/${item.igdb_game_id}`)}>
                        {imageId ? (
                          <img src={imageUrl(imageId, 't_cover_big_2x')} alt={game?.name} loading="lazy" ref={(img) => { if (img?.complete) img.classList.add('loaded'); }} onLoad={(e) => e.currentTarget.classList.add('loaded')} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-[var(--color-gray)]">
                            {game?.name || ''}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Journal Tab */}
        {tab === 'journal' && (
          <div className="profile-section">
            <div className="collections-header">
              <h2 className="collections-title">JOURNAL</h2>
              {isOwn && (
                <button className="btn btn-primary collections-add-btn" onClick={() => setJournalModal(true)}>ADD NEW JOURNAL +</button>
              )}
            </div>
            {loading ? (
              <div className="empty-state"><div className="empty-state-title">Loading...</div></div>
            ) : journals.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-emoji">&#x1F4DD;</div>
                <div className="empty-state-title">YOUR JOURNAL IS EMPTY</div>
                <div className="empty-state-text">Add a game to your Library and write about your experience</div>
                {isOwn && <button className="btn btn-orange" onClick={() => setAddModal(true)}>ADD NEW GAME +</button>}
              </div>
            ) : (
              journals.map((j) => {
                const game = gameCache[j.igdb_game_id];
                return (
                  <div key={j.id} className="journal-entry">
                    {game?.cover?.image_id ? (
                      <img src={imageUrl(game.cover.image_id, 't_cover_big_2x')} alt={game.name} />
                    ) : (
                      <div style={{ width: 48, height: 64, background: 'var(--color-gray-bg)', borderRadius: 6, flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div className="journal-game-name">{game?.name || 'Game'}</div>
                      <p className="journal-text">{j.content}</p>
                    </div>
                    {isOwn && <button className="journal-delete" aria-label="Delete journal entry" onClick={() => handleDeleteJournal(j.id)}>&#x1F5D1;</button>}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Add Game Modal */}
        <Modal open={addModal} onClose={() => { setAddModal(false); setSelectedGame(null); setSearchResults([]); }}>
          <h3 style={{ marginBottom: 16 }}>Add a Game</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input className="input" placeholder="Search for a game..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            <button className="btn btn-primary" onClick={handleSearch}>Search</button>
          </div>
          {searchResults.length > 0 && (
            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}>
              {searchResults.slice(0, 10).map((g) => (
                <div key={g.id} onClick={() => setSelectedGame(g)} style={{ padding: '8px 12px', cursor: 'pointer', background: selectedGame?.id === g.id ? 'var(--color-gray-bg)' : 'transparent', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  {g.cover?.image_id && <img src={imageUrl(g.cover.image_id, 't_thumb')} style={{ width: 24, height: 32, borderRadius: 4, objectFit: 'cover' }} alt="" />}
                  <span style={{ fontSize: 14 }}>{g.name}</span>
                </div>
              ))}
            </div>
          )}
          {selectedGame && (
            <>
              <div style={{ fontSize: 14, marginBottom: 12 }}>Selected: <strong>{selectedGame.name}</strong></div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {(['played', 'playing', 'want_to_play'] as const).map((s) => (
                  <button key={s} className={`pill pill-${s === 'played' ? 'played' : s === 'playing' ? 'playing' : 'want'}${addStatus === s ? ' active' : ''}`} onClick={() => setAddStatus(s)}>
                    {s === 'want_to_play' ? 'Want to Play' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => { setAddModal(false); setSelectedGame(null); }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAddGame}>Save</button>
              </div>
            </>
          )}
        </Modal>

        {/* Journal Modal */}
        <Modal open={journalModal} onClose={() => { setJournalModal(false); setSelectedGame(null); setSearchQuery(''); setSearchResults([]); setJournalContent(''); }}>
          <div className="journal-modal">
            <h2 className="journal-modal-title">WRITE IN JOURNAL</h2>
            <p className="journal-modal-subtitle">Your journal is not just for reviews, but for your experiences</p>

            <div className="journal-modal-field">
              <label className="journal-modal-label">Game name</label>
              <div className="journal-modal-search-wrap">
                <input
                  className="input"
                  placeholder="Start searching game name"
                  value={selectedGame ? selectedGame.name : searchQuery}
                  onChange={(e) => { setSelectedGame(null); setSearchQuery(e.target.value); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <svg className="journal-modal-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M16 16l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              {searchResults.length > 0 && !selectedGame && (
                <div className="journal-modal-results">
                  {searchResults.slice(0, 10).map((g) => (
                    <div key={g.id} className="journal-modal-result" onClick={() => setSelectedGame(g)}>
                      {g.cover?.image_id && <img src={imageUrl(g.cover.image_id, 't_thumb')} alt="" />}
                      <span>{g.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="journal-modal-field">
              <label className="journal-modal-label">Write in Journal</label>
              <textarea
                className="input journal-modal-textarea"
                rows={8}
                placeholder="What moment made you smile? Made you cry? Made you frustrated?"
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
              />
            </div>

            <div className="journal-modal-actions">
              <button className="btn btn-outline journal-modal-btn" onClick={() => { setJournalModal(false); setSelectedGame(null); setSearchQuery(''); setSearchResults([]); setJournalContent(''); }}>CANCEL</button>
              <button className="btn btn-primary journal-modal-btn" onClick={handleCreateJournal}>POST</button>
            </div>
          </div>
        </Modal>
      </main>
      <BottomNav />
    </div>
  );
}
