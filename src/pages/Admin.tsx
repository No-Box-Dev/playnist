import { useState, useEffect } from 'react';
import { getPageSections, updateSection, createSection, deleteSection, reorderSections, searchGames } from '../api';
import type { PageSection, SectionType, IGDBGame } from '../types';
import './Admin.css';

const SECTION_TYPES: { value: SectionType; label: string }[] = [
  { value: 'game_grid', label: 'Game Grid' },
  { value: 'ambassador', label: 'Ambassador Spotlight' },
  { value: 'community_posts', label: 'Community Posts' },
  { value: 'journal_prompt', label: 'Journal Prompt' },
  { value: 'category_pills', label: 'Category Pills' },
];

function GameSearch({ onSelect }: { onSelect: (game: IGDBGame) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<IGDBGame[]>([]);

  const search = async () => {
    if (!q.trim()) return;
    const r = await searchGames(q);
    setResults(r as IGDBGame[]);
  };

  return (
    <div className="admin-game-search">
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="admin-input" placeholder="Search games..." value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} />
        <button className="admin-btn" onClick={search}>Search</button>
      </div>
      {results.length > 0 && (
        <div className="admin-game-results">
          {results.slice(0, 8).map((g) => (
            <div key={g.id} className="admin-game-result" onClick={() => { onSelect(g); setResults([]); setQ(''); }}>
              {g.cover?.image_id && <img src={`https://images.igdb.com/igdb/image/upload/t_thumb/${g.cover.image_id}.jpg`} alt="" />}
              <div>
                <div className="admin-game-name">{g.name}</div>
                <div className="admin-game-meta">{g.genres?.map((gen) => gen.name).join(', ')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionEditor({ section, onSave, onDelete }: { section: PageSection; onSave: (s: PageSection) => void; onDelete: () => void }) {
  const [title, setTitle] = useState(section.title);
  const [config, setConfig] = useState(section.config);
  const [enabled, setEnabled] = useState(!!section.enabled);
  const [saving, setSaving] = useState(false);

  const updateConfig = (key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const updated = await updateSection(section.id, { title, config, enabled }) as PageSection;
    onSave(updated);
    setSaving(false);
  };

  return (
    <div className={`admin-section-card ${!enabled ? 'disabled' : ''}`}>
      <div className="admin-section-header">
        <div className="admin-section-drag">&#x2630;</div>
        <div className="admin-section-type-badge">{section.section_type.replace('_', ' ')}</div>
        <input className="admin-section-title-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label className="admin-toggle">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span className="admin-toggle-slider" />
        </label>
      </div>

      <div className="admin-section-body">
        {/* Game Grid Config */}
        {section.section_type === 'game_grid' && (
          <>
            <div className="admin-field-row">
              <label>Source</label>
              <select className="admin-select" value={(config.query as string) || 'trending'} onChange={(e) => updateConfig('query', e.target.value)}>
                <option value="trending">Trending</option>
                <option value="new">New Releases</option>
                <option value="manual">Manual Selection</option>
              </select>
            </div>
            <div className="admin-field-row">
              <label>Limit</label>
              <input className="admin-input admin-input-sm" type="number" value={(config.limit as number) || 5} onChange={(e) => updateConfig('limit', parseInt(e.target.value))} />
            </div>
            <div className="admin-field-row">
              <label>Columns</label>
              <select className="admin-select" value={(config.columns as number) || 5} onChange={(e) => updateConfig('columns', parseInt(e.target.value))}>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
            </div>
            {config.query === 'manual' && (
              <div className="admin-field-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <label>Selected Games</label>
                <div className="admin-selected-games">
                  {((config.game_ids as number[]) || []).map((gid) => (
                    <span key={gid} className="admin-game-chip">{gid} <button onClick={() => updateConfig('game_ids', ((config.game_ids as number[]) || []).filter((id) => id !== gid))}>x</button></span>
                  ))}
                </div>
                <GameSearch onSelect={(g) => updateConfig('game_ids', [...((config.game_ids as number[]) || []), g.id])} />
              </div>
            )}
          </>
        )}

        {/* Ambassador Config */}
        {section.section_type === 'ambassador' && (
          <>
            <div className="admin-field-row">
              <label>Ambassador Name</label>
              <input className="admin-input" value={(config.user_name as string) || ''} onChange={(e) => updateConfig('user_name', e.target.value)} />
            </div>
            <div className="admin-field-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <label>Quote</label>
              <textarea className="admin-textarea" value={(config.quote as string) || ''} onChange={(e) => updateConfig('quote', e.target.value)} rows={3} />
            </div>
            <div className="admin-field-row">
              <label>Game Source</label>
              <select className="admin-select" value={(config.game_query as string) || 'trending_first'} onChange={(e) => updateConfig('game_query', e.target.value)}>
                <option value="trending_first">First Trending Game</option>
                <option value="manual">Manual Selection</option>
              </select>
            </div>
            {config.game_query === 'manual' && (
              <div className="admin-field-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <label>Selected Game (ID: {(config.game_id as number) || 'none'})</label>
                <GameSearch onSelect={(g) => updateConfig('game_id', g.id)} />
              </div>
            )}
          </>
        )}

        {/* Community Posts Config */}
        {section.section_type === 'community_posts' && (
          <div className="admin-posts-editor">
            {((config.posts as Array<Record<string, unknown>>) || []).map((post, i) => (
              <div key={i} className="admin-post-card">
                <div className="admin-field-row">
                  <label>User</label>
                  <input className="admin-input" value={(post.user as string) || ''} onChange={(e) => {
                    const posts = [...((config.posts as Array<Record<string, unknown>>) || [])];
                    posts[i] = { ...posts[i], user: e.target.value };
                    updateConfig('posts', posts);
                  }} />
                </div>
                <div className="admin-field-row">
                  <label>Time</label>
                  <input className="admin-input" value={(post.time as string) || ''} onChange={(e) => {
                    const posts = [...((config.posts as Array<Record<string, unknown>>) || [])];
                    posts[i] = { ...posts[i], time: e.target.value };
                    updateConfig('posts', posts);
                  }} />
                </div>
                <div className="admin-field-row">
                  <label>Genre</label>
                  <input className="admin-input" value={(post.genre as string) || ''} onChange={(e) => {
                    const posts = [...((config.posts as Array<Record<string, unknown>>) || [])];
                    posts[i] = { ...posts[i], genre: e.target.value };
                    updateConfig('posts', posts);
                  }} />
                </div>
                <div className="admin-field-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                  <label>Body</label>
                  <textarea className="admin-textarea" rows={2} value={(post.body as string) || ''} onChange={(e) => {
                    const posts = [...((config.posts as Array<Record<string, unknown>>) || [])];
                    posts[i] = { ...posts[i], body: e.target.value };
                    updateConfig('posts', posts);
                  }} />
                </div>
                <button className="admin-btn admin-btn-danger" onClick={() => {
                  const posts = ((config.posts as Array<Record<string, unknown>>) || []).filter((_, j) => j !== i);
                  updateConfig('posts', posts);
                }}>Remove Post</button>
              </div>
            ))}
            <button className="admin-btn" onClick={() => {
              const posts = [...((config.posts as Array<Record<string, unknown>>) || []), { user: '', time: '', genre: '', body: '', reactions: {} }];
              updateConfig('posts', posts);
            }}>+ Add Post</button>
          </div>
        )}

        {/* Journal Prompt Config */}
        {section.section_type === 'journal_prompt' && (
          <div className="admin-field-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <label>Prompt Text</label>
            <textarea className="admin-textarea" value={(config.text as string) || ''} onChange={(e) => updateConfig('text', e.target.value)} rows={2} />
          </div>
        )}

        {/* Category Pills Config */}
        {section.section_type === 'category_pills' && (
          <div className="admin-field-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <label>Categories (comma separated)</label>
            <input className="admin-input" value={((config.categories as string[]) || []).join(', ')} onChange={(e) => updateConfig('categories', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
          </div>
        )}
      </div>

      <div className="admin-section-footer">
        <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button className="admin-btn admin-btn-danger" onClick={onDelete}>Delete Section</button>
      </div>
    </div>
  );
}

export default function Admin() {
  const [activePage, setActivePage] = useState<'dashboard' | 'discover'>('dashboard');
  const [sections, setSections] = useState<PageSection[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<SectionType>('game_grid');
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    getPageSections(activePage).then((s) => setSections(s as PageSection[]));
  }, [activePage]);

  const handleSave = (updated: PageSection) => {
    setSections((prev) => prev.map((s) => s.id === updated.id ? updated : s));
  };

  const handleDelete = async (id: string) => {
    await deleteSection(id);
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    const created = await createSection({
      page: activePage,
      section_type: newType,
      title: newTitle,
      sort_order: sections.length,
      config: newType === 'game_grid' ? { query: 'trending', limit: 5, columns: 5 }
        : newType === 'category_pills' ? { categories: ['All'] }
        : newType === 'journal_prompt' ? { text: '' }
        : newType === 'ambassador' ? { user_name: '', quote: '', game_query: 'trending_first' }
        : newType === 'community_posts' ? { posts: [] }
        : {},
    }) as PageSection;
    setSections((prev) => [...prev, created]);
    setShowAdd(false);
    setNewTitle('');
  };

  const moveSection = async (idx: number, dir: -1 | 1) => {
    const next = [...sections];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const order = next.map((s, i) => ({ id: s.id, sort_order: i }));
    setSections(next);
    await reorderSections(order);
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1 className="admin-title">Content Manager</h1>
        <div className="admin-page-tabs">
          <button className={`admin-tab ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => setActivePage('dashboard')}>Dashboard</button>
          <button className={`admin-tab ${activePage === 'discover' ? 'active' : ''}`} onClick={() => setActivePage('discover')}>Discover</button>
        </div>
      </div>

      <p className="admin-subtitle">
        Manage the sections that appear on the <strong>{activePage}</strong> page. Drag to reorder, toggle to show/hide, edit content inline.
      </p>

      <div className="admin-sections">
        {sections.map((section, i) => (
          <div key={section.id} className="admin-section-wrap">
            <div className="admin-reorder">
              <button className="admin-reorder-btn" disabled={i === 0} onClick={() => moveSection(i, -1)}>&#x25B2;</button>
              <span className="admin-reorder-pos">{i + 1}</span>
              <button className="admin-reorder-btn" disabled={i === sections.length - 1} onClick={() => moveSection(i, 1)}>&#x25BC;</button>
            </div>
            <SectionEditor section={section} onSave={handleSave} onDelete={() => handleDelete(section.id)} />
          </div>
        ))}
      </div>

      {showAdd ? (
        <div className="admin-add-form">
          <select className="admin-select" value={newType} onChange={(e) => setNewType(e.target.value as SectionType)}>
            {SECTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input className="admin-input" placeholder="Section title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <button className="admin-btn admin-btn-primary" onClick={handleAdd}>Add</button>
          <button className="admin-btn" onClick={() => setShowAdd(false)}>Cancel</button>
        </div>
      ) : (
        <button className="admin-btn admin-btn-primary admin-add-btn" onClick={() => setShowAdd(true)}>+ Add Section</button>
      )}
    </div>
  );
}
