import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Header.css';

export default function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header-logo">
        <img src="/images/logo.png" alt="Playnist" />
      </div>
      <div className="header-actions">
        <button className="btn btn-primary header-add-btn" onClick={() => navigate('/dashboard')}>+ Add Game</button>
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
