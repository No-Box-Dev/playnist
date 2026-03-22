import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Header.css';

export default function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="header">
      <button type="button" className="header-logo" onClick={() => navigate('/dashboard')} aria-label="Go to dashboard">
        <img src="/images/logo.png" alt="Playnist" />
      </button>
      <div className="header-actions">
        <button className="header-icon-btn" title="Search" aria-label="Search" onClick={() => navigate('/search')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
        <button className="header-icon-btn" title="Notifications">&#x1f514;</button>
        <img
          className="header-avatar"
          src={user?.avatar_url || '/images/user-icon.png'}
          alt="User"
          onClick={() => navigate('/profile')}
        />
      </div>
    </header>
  );
}
