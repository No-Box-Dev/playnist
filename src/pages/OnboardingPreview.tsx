import { useState, useEffect, useRef } from 'react';
import { searchGames } from '../api';
import { getDefaultAvatar } from '../avatars';
import type { IGDBGame } from '../types';
import './OnboardingPreview.css';

const MOCK_CREATORS = [
  { name: 'Jasper Middendorp', avatar: getDefaultAvatar('Jasper Middendorp') },
  { name: 'Emma Nicole', avatar: getDefaultAvatar('Emma Nicole') },
  { name: 'emmanicole', avatar: getDefaultAvatar('emmanicole') },
];

const GAME_CARDS = [
  { question: 'A game you wish you could play for the first time again?', color: 'green' },
  { question: 'The game you\'re into right now?', color: 'orange' },
  { question: 'A game you\'re saving for the perfect moment?', color: 'yellow' },
] as const;

interface GameSelection {
  id: number;
  name: string;
  cover_image_id?: string;
}

function GameSearchCard({ question, color }: { question: string; color: string; }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IGDBGame[]>([]);
  const [selected, setSelected] = useState<GameSelection | null>(null);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchGames(query).then((r) => {
        setResults((r as IGDBGame[]).slice(0, 5));
        setShowResults(true);
      }).catch(() => {});
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className={`ob-game-card ob-game-card--${color}`}>
      <h3 className="ob-game-card__question">{question}</h3>
      <div className="ob-game-card__cover">
        {selected?.cover_image_id && (
          <img src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${selected.cover_image_id}.jpg`} alt={selected.name} />
        )}
      </div>
      <div className="ob-game-card__search" ref={wrapperRef}>
        <label className="ob-game-card__label">Game name</label>
        <input
          type="text"
          className="ob-game-card__input"
          placeholder="Start searching games..."
          value={selected ? selected.name : query}
          onChange={(e) => { setSelected(null); setQuery(e.target.value); }}
          onFocus={() => results.length > 0 && setShowResults(true)}
        />
        {showResults && results.length > 0 && (
          <div className="ob-game-card__results">
            {results.map((g) => (
              <div key={g.id} className="ob-game-card__result" onClick={() => {
                setSelected({ id: g.id, name: g.name, cover_image_id: g.cover?.image_id });
                setShowResults(false);
                setQuery('');
              }}>
                {g.cover?.image_id && (
                  <img src={`https://images.igdb.com/igdb/image/upload/t_thumb/${g.cover.image_id}.jpg`} alt="" />
                )}
                <span>{g.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPreview() {
  const [step, setStep] = useState(1);
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  const toggleFollow = (name: string) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  return (
    <div className="ob-backdrop">
      <div className="ob-modal">
        <h1 className="ob-title">ONBOARDING</h1>

        <div className="ob-steps">
          <div className={`ob-step ${step === 1 ? 'ob-step--active' : ''}`}>
            {step === 1 && <span className="ob-step__mascot">🧑‍🎤</span>}
            <span>STEP 1 – GENRE OF GAMES</span>
          </div>
          <div className={`ob-step ${step === 2 ? 'ob-step--active' : ''}`}>
            {step === 2 && <span className="ob-step__mascot">🧑‍🎤</span>}
            <span>STEP 2 – CREATORS</span>
          </div>
          <div className={`ob-step ${step === 3 ? 'ob-step--active' : ''}`}>
            {step === 3 && <span className="ob-step__mascot">🧑‍🎤</span>}
            <span>STEP 3 – Let's GOOOO!</span>
          </div>
        </div>

        <div className="ob-divider" />

        {step === 1 && (
          <div className="ob-content">
            <div className="ob-cards-row">
              {GAME_CARDS.map((card) => (
                <GameSearchCard key={card.color} question={card.question} color={card.color} />
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="ob-content">
            <h2 className="ob-heading">We've handpicked some of the most inspiring creators just for you!</h2>
            <p className="ob-subtext">Follow the ones you love and start filling your feed with cozy, uplifting content</p>
            <p className="ob-label">Suggested for you</p>
            <div className="ob-creators-row">
              {MOCK_CREATORS.map((c) => (
                <div key={c.name} className={`ob-creator-card ${followed.has(c.name) ? 'ob-creator-card--followed' : ''}`}>
                  <img src={c.avatar} alt={c.name} className="ob-creator-card__avatar" />
                  <span className="ob-creator-card__name">{c.name}</span>
                  <button className="ob-creator-card__follow" onClick={() => toggleFollow(c.name)}>
                    {followed.has(c.name) ? '✓' : '+'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="ob-content ob-content--center">
            <div className="ob-smiley">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="38" fill="#F4A623" stroke="#E8941E" strokeWidth="2"/>
                <circle cx="30" cy="34" r="4" fill="#3D3D3D"/>
                <circle cx="50" cy="34" r="4" fill="#3D3D3D"/>
                <path d="M25 48 C30 56, 50 56, 55 48" stroke="#3D3D3D" strokeWidth="3" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <h2 className="ob-heading">You've completed the onboarding – welcome aboard!</h2>
            <p className="ob-subtext">
              We'll curate the best content just for you, based on your interests.
              <br />
              Get cozy and enjoy the journey – it's going to be inspiring and heartwarming
            </p>
          </div>
        )}

        <div className="ob-footer">
          <button className="ob-continue" onClick={() => setStep((s) => Math.min(s + 1, 3))}>
            {step < 3 ? 'CONTINUE' : 'CONTINUE'}
          </button>
        </div>
      </div>
    </div>
  );
}
