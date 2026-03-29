import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import GameCard from '../components/GameCard';
import Modal from '../components/Modal';
import { getPublicPageSections, getTrending, getNew, searchGames, addToCollection } from '../api';
import type { Game, PageSection } from '../types';
import './Discover.css';

export default function Discover() {
  const [sections, setSections] = useState<PageSection[]>([]);
  const [gameData, setGameData] = useState<Record<string, Game[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [addModal, setAddModal] = useState<Game | null>(null);
  const [addStatus, setAddStatus] = useState('played');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getPublicPageSections('discover').then((s) => {
      const loaded = s as PageSection[];
      setSections(loaded);
      // Fetch game data for each game_grid section
      loaded.forEach((section) => {
        if (section.section_type === 'game_grid') {
          const cfg = section.config;
          const query = cfg.query as string;
          const offset = (cfg.offset as number) || 0;
          const limit = (cfg.limit as number) || 5;
          const fetcher = query === 'new' ? getNew() : getTrending();
          fetcher.then((g) => {
            setGameData((prev) => ({
              ...prev,
              [section.id]: (g as Game[]).slice(offset, offset + limit),
            }));
          });
        }
      });
    }).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timeout = setTimeout(() => {
      searchGames(searchQuery).then((g) => setSearchResults(g as Game[]));
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleAdd = (game: Game) => setAddModal(game);
  const confirmAdd = async () => {
    if (!addModal) return;
    await addToCollection(addModal.id, addStatus);
    setAddModal(null);
  };

  const filterByCategory = (games: Game[]) => {
    if (activeCategory === 'All') return games;
    return games.filter((g) =>
      g.genres?.some((genre) => genre.name.toLowerCase().includes(activeCategory.toLowerCase()))
    );
  };

  const categoriesSection = sections.find((s) => s.section_type === 'category_pills');
  const categories = categoriesSection ? (categoriesSection.config.categories as string[]) || [] : [];

  return (
    <div className="app-layout">
      <Sidebar />
      <Header />
      <main className="main-content">
        {/* Search */}
        <section className="discover-search-section">
          <div className="discover-search-wrap">
            <svg className="discover-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input className="discover-search-input" type="text" placeholder="Search games..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </section>

        {/* Category Pills from CMS */}
        {categories.length > 0 && (
          <section className="discover-categories">
            {categories.map((cat) => (
              <button key={cat} className={`discover-pill${activeCategory === cat ? ' active' : ''}`} onClick={() => setActiveCategory(cat)}>
                {cat}
              </button>
            ))}
          </section>
        )}

        {/* Search Results */}
        {searchQuery.trim() ? (
          <section className="section">
            <h2 className="section-header">Search Results</h2>
            {searchResults.length === 0 ? (
              <p className="discover-empty">No games found for "{searchQuery}"</p>
            ) : (
              <div className="game-grid">
                {filterByCategory(searchResults).map((g) => <GameCard key={g.id} game={g} onAdd={handleAdd} />)}
              </div>
            )}
          </section>
        ) : isLoading ? (
          /* Skeleton loading state */
          <>
            {[1, 2, 3].map((i) => (
              <section key={i} className="section">
                <div className="skeleton-title" />
                <div className="game-grid">
                  {[1, 2, 3, 4, 5].map((j) => <div key={j} className="skeleton-card" />)}
                </div>
              </section>
            ))}
          </>
        ) : (
          /* Render CMS sections dynamically */
          sections.filter((s) => s.section_type === 'game_grid').map((section) => {
            const games = gameData[section.id] || [];
            const columns = (section.config.columns as number) || 5;
            const filtered = filterByCategory(games);
            return (
              <section key={section.id} className="section">
                <h2 className="section-header">{section.title}</h2>
                <div className={columns === 4 ? 'game-grid-4' : 'game-grid'}>
                  {filtered.length > 0
                    ? filtered.map((g) => <GameCard key={g.id} game={g} onAdd={handleAdd} />)
                    : Array.from({ length: columns }, (_, j) => <div key={j} className="skeleton-card" />)
                  }
                </div>
              </section>
            );
          })
        )}

        {/* Add to Collection Modal */}
        <Modal open={!!addModal} onClose={() => setAddModal(null)}>
          {addModal && (
            <div className="flex flex-col items-center gap-6 py-6">
              <h3 className="text-lg text-center">Add "{addModal.name}" to Collection</h3>
              <div className="flex gap-3 justify-center flex-wrap">
                {(['played', 'playing', 'want_to_play'] as const).map((s) => (
                  <button key={s} className={`pill pill-${s === 'played' ? 'played' : s === 'playing' ? 'playing' : 'want'}${addStatus === s ? ' active' : ''}`} onClick={() => setAddStatus(s)}>
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
