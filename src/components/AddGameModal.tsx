import { useState, useEffect, useRef } from 'react';
import { searchGames, addToCollection, imageUrl } from '../api';
import type { Game } from '../types';
import Modal from './Modal';

interface AddGameModalProps {
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

export default function AddGameModal({ open, onClose, onAdded }: AddGameModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Game[]>([]);
  const [selected, setSelected] = useState<Game | null>(null);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!query || query.length < 1) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchGames(query).then((r) => setResults((r as Game[]).slice(0, 5))).catch(() => setResults([]));
    }, 150);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSave = async () => {
    if (!selected || !status) return;
    setSaving(true);
    try {
      await addToCollection(selected.id, status);
      onAdded?.();
      handleClose();
    } catch (e) {
      console.error('Failed to add game:', e);
    }
    setSaving(false);
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setSelected(null);
    setStatus('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <h2 className="modal-title">ADD A NEW GAME</h2>

      <label className="modal-label">Game name</label>
      <input
        className="modal-input"
        type="text"
        placeholder="Start searching game name"
        value={selected ? selected.name : query}
        onChange={(e) => { setSelected(null); setQuery(e.target.value); }}
      />
      {!selected && results.length > 0 && (
        <div className="modal-search-results">
          {results.map((g) => (
            <div key={g.id} className="modal-search-result" onClick={() => { setSelected(g); setResults([]); setQuery(''); }}>
              {g.cover?.image_id && <img src={imageUrl(g.cover.image_id, 't_thumb')} alt="" />}
              <span>{g.name}</span>
            </div>
          ))}
        </div>
      )}

      <label className="modal-label">Select category</label>
      <select className="modal-select" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="" disabled>Choose an option...</option>
        <option value="played">Played</option>
        <option value="playing">Playing</option>
        <option value="want_to_play">Want to play</option>
      </select>

      <div className="modal-actions">
        <button className="btn btn-outline" onClick={handleClose}>CANCEL</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={!selected || !status || saving}>
          {saving ? 'SAVING...' : 'SAVE'}
        </button>
      </div>
    </Modal>
  );
}
