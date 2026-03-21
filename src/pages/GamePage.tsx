import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ReactionBar from '../components/ReactionBar';
import Modal from '../components/Modal';
import { getGame, getGameComments, getGameReactions, addGameComment, addToCollection, createJournal } from '../api';
import type { IGDBGame, Comment, Reaction } from '../types';
import './GamePage.css';

export default function GamePage() {
  const { igdbId } = useParams();
  const id = parseInt(igdbId || '0');

  const [game, setGame] = useState<IGDBGame | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [newComment, setNewComment] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [addStatus, setAddStatus] = useState('played');
  const [journalModal, setJournalModal] = useState(false);
  const [journalContent, setJournalContent] = useState('');

  useEffect(() => {
    if (!id) return;
    getGame(id).then((g) => setGame(g as IGDBGame));
    getGameComments(id).then((c) => setComments(c as Comment[]));
    getGameReactions(id).then((r) => setReactions(r as Reaction[]));
  }, [id]);

  const handleComment = async () => {
    if (!newComment.trim()) return;
    const comment = await addGameComment(id, newComment) as Comment;
    setComments((prev) => [comment, ...prev]);
    setNewComment('');
  };

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
    </div>
  );

  const coverUrl = game.cover?.image_id
    ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
    : null;

  const developer = game.involved_companies?.find((c) => c.developer)?.company.name;
  const publisher = game.involved_companies?.find((c) => !c.developer)?.company.name;
  const releaseDate = game.first_release_date
    ? new Date(game.first_release_date * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const ratingDisplay = game.rating ? (game.rating / 10).toFixed(1) : null;

  return (
    <div className="app-layout">
      <Sidebar />
      <Header />
      <main className="main-content">
        <div className="game-hero">
          <div className="game-hero-cover">
            {coverUrl ? <img src={coverUrl} alt={game.name} /> : <div style={{ width: '100%', height: 200, background: 'var(--color-gray-bg)' }} />}
          </div>
          <div className="game-hero-info">
            <h1 className="game-title">{game.name}</h1>
            <div className="game-meta">
              {game.genres?.map((g) => <span key={g.name} className="game-tag">{g.name}</span>)}
              {game.platforms?.slice(0, 3).map((p) => <span key={p.name} className="game-tag">{p.name}</span>)}
            </div>
            {ratingDisplay && (
              <div className="game-rating">
                <span className="game-rating-score">{ratingDisplay}</span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{parseFloat(ratingDisplay) >= 8 ? 'Excellent' : parseFloat(ratingDisplay) >= 6 ? 'Good' : 'Mixed'}</div>
                  <div className="game-rating-label">Based on community ratings</div>
                </div>
              </div>
            )}
            {game.summary && <p className="game-description">{game.summary}</p>}
            <div className="game-details-grid">
              {developer && <div className="game-detail-item"><div className="game-detail-label">Developer</div><div className="game-detail-value">{developer}</div></div>}
              {publisher && <div className="game-detail-item"><div className="game-detail-label">Publisher</div><div className="game-detail-value">{publisher}</div></div>}
              {releaseDate && <div className="game-detail-item"><div className="game-detail-label">Release Date</div><div className="game-detail-value">{releaseDate}</div></div>}
            </div>
            <div className="added-count">
              <strong>{game.rating_count || 1247}</strong> players have this in their collection
            </div>
            <div className="game-actions">
              <button className="btn btn-primary" onClick={() => setAddModal(true)}>+ Add to Collection</button>
              <button className="btn btn-outline" onClick={() => setJournalModal(true)}>Write Journal Entry</button>
            </div>
            <ReactionBar targetType="game" targetId={String(id)} initial={reactions} />
          </div>
        </div>

        {/* Comments */}
        <section className="game-section">
          <h2 className="section-header">Community Comments</h2>
          {comments.map((c) => (
            <div key={c.id} className="comment-box">
              <div className="comment-header">
                <img className="comment-avatar" src={c.avatar_url || '/images/user-icon.png'} alt={c.username} />
                <div>
                  <div className="comment-name">{c.username}</div>
                  <div className="comment-time">{new Date(c.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <p className="comment-body">{c.content}</p>
            </div>
          ))}
          <div className="add-comment" style={{ marginTop: 16 }}>
            <img className="comment-avatar" src="/images/user-icon.png" alt="You" />
            <textarea
              className="input"
              placeholder="Add a comment..."
              rows={2}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={handleComment}>Post</button>
          </div>
        </section>

        {/* Add to Collection Modal */}
        <Modal open={addModal} onClose={() => setAddModal(false)}>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: 16 }}>Add "{game.name}" to Collection</h3>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
              {(['played', 'playing', 'want_to_play'] as const).map((s) => (
                <button key={s} className={`pill pill-${s === 'played' ? 'played' : s === 'playing' ? 'playing' : 'want'}${addStatus === s ? ' active' : ''}`} onClick={() => setAddStatus(s)}>
                  {s === 'want_to_play' ? 'Want to Play' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd}>Save</button>
            </div>
          </div>
        </Modal>

        {/* Journal Modal */}
        <Modal open={journalModal} onClose={() => setJournalModal(false)}>
          <h3 style={{ marginBottom: 16 }}>Write about "{game.name}"</h3>
          <textarea
            className="input"
            rows={5}
            placeholder="What moment made you smile? Made you cry? Made you frustrated?"
            value={journalContent}
            onChange={(e) => setJournalContent(e.target.value)}
            style={{ resize: 'vertical', marginBottom: 16 }}
          />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={() => setJournalModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleJournal}>Post</button>
          </div>
        </Modal>
      </main>
    </div>
  );
}
