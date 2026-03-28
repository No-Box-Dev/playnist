import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchGames, imageUrl, saveOnboardingPicks, updateMe, getSuggestedUsers, followUser } from '../api';
import { getDefaultAvatar, getAvatarUrl } from '../avatars';
import type { Game } from '../types';
import './OnboardingPreview.css';

const MOCK_CREATORS = [
  { name: 'Jasper Middendorp', avatar: getDefaultAvatar('Jasper Middendorp') },
  { name: 'Emma Nicole', avatar: getDefaultAvatar('Emma Nicole') },
  { name: 'PixelHunter', avatar: getDefaultAvatar('PixelHunter') },
  { name: 'RetroGamer99', avatar: getDefaultAvatar('RetroGamer99') },
  { name: 'CozyGamerGal', avatar: getDefaultAvatar('CozyGamerGal') },
  { name: 'NightOwlPlays', avatar: getDefaultAvatar('NightOwlPlays') },
];

const GAME_CARDS = [
  { question: 'A game you wish you could play for the first time again?', color: 'green', status: 'played' },
  { question: 'The game you\'re into right now?', color: 'orange', status: 'playing' },
  { question: 'A game you\'re saving for the perfect moment?', color: 'yellow', status: 'want_to_play' },
] as const;

interface GameSelection {
  id: number;
  name: string;
  cover_image_id?: string;
}

interface GameSearchCardProps {
  question: string;
  color: string;
  onSelect?: (selected: boolean, game?: GameSelection) => void;
}

function GameSearchCard({ question, color, onSelect }: GameSearchCardProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Game[]>([]);
  const [selected, setSelected] = useState<GameSelection | null>(null);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query || query.length < 1) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchGames(query).then((r) => {
        setResults((r as Game[]).slice(0, 5));
        setShowResults(true);
      }).catch((err) => {
        console.error('Failed to search games:', err);
        setResults([]);
      });
    }, 150);
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
          <>
            <img src={imageUrl(selected.cover_image_id, 't_cover_big_2x')} alt={selected.name} />
            <button className="ob-game-card__remove" onClick={() => { setSelected(null); onSelect?.(false); }}>&times;</button>
          </>
        )}
        {!selected && (
          <div className="ob-game-card__search" ref={wrapperRef}>
            <input
              type="text"
              className="ob-game-card__input"
              placeholder="Start searching games..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); }}
              onFocus={() => results.length > 0 && setShowResults(true)}
            />
            {showResults && results.length > 0 && (
              <div className="ob-game-card__results">
                {results.map((g) => (
                  <div key={g.id} className="ob-game-card__result" onClick={() => {
                    const sel = { id: g.id, name: g.name, cover_image_id: g.cover?.image_id };
                    setSelected(sel);
                    setShowResults(false);
                    setQuery('');
                    onSelect?.(true, sel);
                  }}>
                    {g.cover?.image_id && (
                      <img src={imageUrl(g.cover.image_id, 't_thumb')} alt={g.name} />
                    )}
                    <span>{g.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [suggestedUsers, setSuggestedUsers] = useState<{ id: string; username: string; avatar_url: string; is_ambassador: number }[]>([]);
  const [gameSelections, setGameSelections] = useState<(GameSelection | null)[]>([null, null, null]);

  const allGamesSelected = gameSelections.every(Boolean);

  const handleGameSelect = (index: number, selected: boolean, game?: GameSelection) => {
    setGameSelections((prev) => { const next = [...prev]; next[index] = selected ? (game ?? null) : null; return next; });
  };

  const goToStep = (target: number) => {
    if (target < step) { setStep(target); return; }
    if (target >= 2 && !allGamesSelected) return;
    setStep(target);
  };

  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (step === 1) {
      if (!allGamesSelected) return;
      setSaving(true);
      try {
        const picks = gameSelections.map((g, i) => ({ id: g!.id, status: GAME_CARDS[i].status }));
        await saveOnboardingPicks(picks);
      } catch (e) {
        console.error('Failed to save game picks:', e);
      }
      setSaving(false);
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setSaving(true);
      try {
        await updateMe({ onboarding_step: 3 });
        navigate('/dashboard');
      } catch (e) {
        console.error('Failed to complete onboarding:', e);
        setSaving(false);
      }
    }
  };

  useEffect(() => {
    if (step === 2 && suggestedUsers.length === 0) {
      getSuggestedUsers().then((users) => {
        setSuggestedUsers(users as typeof suggestedUsers);
      }).catch(() => {});
    }
  }, [step]);

  const toggleFollow = (userId: string) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
        followUser(userId).catch(() => {});
      }
      return next;
    });
  };

  return (
    <div className="ob-backdrop">
      <div className="ob-modal">
        <h1 className="ob-title">ONBOARDING</h1>

        <div className="ob-steps">
          <div className={`ob-step ${step === 1 ? 'ob-step--active' : ''}`} onClick={() => goToStep(1)}>
            {step === 1 && <span className="ob-step__mascot">🧑‍🎤</span>}
            <span>STEP 1 – GENRE OF GAMES</span>
          </div>
          <div className={`ob-step ${step === 2 ? 'ob-step--active' : ''} ${!allGamesSelected && step < 2 ? 'ob-step--disabled' : ''}`} onClick={() => goToStep(2)}>
            {step === 2 && <span className="ob-step__mascot">🧑‍🎤</span>}
            <span>STEP 2 – CREATORS</span>
          </div>
          <div className={`ob-step ${step === 3 ? 'ob-step--active' : ''} ${step < 3 ? 'ob-step--disabled' : ''}`} onClick={() => goToStep(3)}>
            {step === 3 && <span className="ob-step__mascot">🧑‍🎤</span>}
            <span>STEP 3 – Let's GOOOO!</span>
          </div>
        </div>

        <div className="ob-divider" />

        {step === 1 && (
          <div className="ob-content">
            <div className="ob-cards-row">
              {GAME_CARDS.map((card, i) => (
                <GameSearchCard key={card.color} question={card.question} color={card.color} onSelect={(sel, game) => handleGameSelect(i, sel, game)} />
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
              {(suggestedUsers.length > 0 ? suggestedUsers : MOCK_CREATORS).map((c) => {
                const userId = 'id' in c ? c.id : c.name;
                const name = 'username' in c ? c.username : c.name;
                const avatar = 'id' in c ? getAvatarUrl(c.id, c.avatar_url) : c.avatar;
                return (
                  <div key={userId} className={`ob-creator-card ${followed.has(userId) ? 'ob-creator-card--followed' : ''}`}>
                    <img src={avatar} alt={name} className="ob-creator-card__avatar" />
                    <span className="ob-creator-card__name">{name}</span>
                    <button className="ob-creator-card__follow" onClick={() => toggleFollow(userId)}>
                      {followed.has(userId) ? '✓' : '+'}
                    </button>
                  </div>
                );
              })}
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
          <button
            className={`ob-continue ${(step === 1 && !allGamesSelected) || saving ? 'ob-continue--disabled' : ''}`}
            onClick={handleContinue}
            disabled={saving}
          >
            {saving ? 'SAVING...' : step === 3 ? 'LET\'S GO!' : 'CONTINUE'}
          </button>
        </div>
      </div>
    </div>
  );
}
