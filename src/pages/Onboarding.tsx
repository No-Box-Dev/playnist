import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrending, saveOnboardingPicks } from '../api';
import type { IGDBGame } from '../types';
import './Onboarding.css';

const MOCK_USERS = [
  { name: 'PixelHunter', games: 42 },
  { name: 'RetroGamer99', games: 87 },
  { name: 'NightOwlPlays', games: 23 },
  { name: 'GameMaster42', games: 156 },
  { name: 'CozyGamerGal', games: 64 },
  { name: 'SpeedRunKing', games: 98 },
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [games, setGames] = useState<IGDBGame[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    getTrending().then((g) => setGames((g as IGDBGame[]).slice(0, 8)));
  }, []);

  const toggleGame = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding">
        <div className="onboarding-logo"><img src="/images/logo.png" alt="Playnist" /></div>

        <div className="steps">
          <div className={`step-dot ${step > 1 ? 'done' : step === 1 ? 'active' : ''}`} />
          <div className={`step-dot ${step > 2 ? 'done' : step === 2 ? 'active' : ''}`} />
          <div className={`step-dot ${step === 3 ? 'active' : ''}`} />
        </div>

        {step === 1 && (
          <>
            <h2 className="onboarding-title">PICK YOUR FAVORITE GAMES</h2>
            <p className="onboarding-subtitle">Select games you love so we can personalize your experience</p>
            <div className="game-pick-grid">
              {games.map((g) => (
                <div
                  key={g.id}
                  className={`game-pick ${selected.has(g.id) ? 'selected' : ''}`}
                  onClick={() => toggleGame(g.id)}
                >
                  {g.cover?.image_id ? (
                    <img src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg`} alt={g.name} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--color-gray-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, padding: 4 }}>{g.name}</div>
                  )}
                  <div className="game-pick-check">&#x2713;</div>
                </div>
              ))}
            </div>
            <div className="onboarding-footer">
              <span className="step-counter">{selected.size} selected</span>
              <button className="btn btn-primary" onClick={async () => { if (selected.size > 0) await saveOnboardingPicks([...selected]).catch(() => {}); setStep(2); }}>Next</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="onboarding-title">JOIN THE COMMUNITY</h2>
            <p className="onboarding-subtitle">Follow some players to fill your feed with great content</p>
            <div className="user-card-grid">
              {MOCK_USERS.map((u) => (
                <div key={u.name} className="user-card">
                  <img src="/images/user-icon.png" alt={u.name} />
                  <div className="user-card-name">{u.name}</div>
                  <div className="user-card-games">{u.games} games</div>
                  <button className="follow-btn">+ Follow</button>
                </div>
              ))}
            </div>
            <div className="onboarding-footer">
              <button className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>Next</button>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="completion">
            <div className="completion-emoji">&#x1F60A;</div>
            <h2 className="completion-title">LET'S GO!</h2>
            <p className="completion-text">You're all set. Start discovering amazing games and connecting with the community.</p>
            <button className="btn btn-primary" style={{ fontSize: 16, padding: '12px 40px' }} onClick={() => navigate('/dashboard')}>
              Discover
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
