import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';

const ProfileIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const DiscoverIcon = () => (
  <svg width="26" height="22" viewBox="0 0 31 22" fill="currentColor">
    <path d="M21.5 9h-3a1 1 0 110-2h3a1 1 0 110 2zm-9-2h-1V6a1 1 0 00-2 0v1h-1a1 1 0 000 2h1v1a1 1 0 002 0V9h1a1 1 0 000-2zm17.19 13.08a3.5 3.5 0 01-4.87.6L17.81 15h-4.62l-4.96 5.64-.04.04A3.5 3.5 0 013.1 21.58a3.5 3.5 0 01-.53-4.86l2.05-10.53A7.5 7.5 0 0110 0h11a7.5 7.5 0 017.38 6.16l2.04 10.54a3.5 3.5 0 01-.73 3.38z"/>
  </svg>
);

const JournalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 25 24" fill="currentColor">
    <path d="M22.5 0H2.5a2 2 0 00-2 2v20a2 2 0 002 2h13.59a2 2 0 001.41-.59l6.41-6.41A2 2 0 0024.5 15.59V2a2 2 0 00-2-2zM2.5 2h20v13h-6a1 1 0 00-1 1v6h-13V2zm18.59 15l-3.59 3.59V17h3.59z"/>
  </svg>
);

export default function Sidebar() {
  const location = useLocation();
  const isJournal = location.pathname === '/profile' && location.search.includes('tab=journal');
  const isProfile = location.pathname === '/profile' && !isJournal;

  return (
    <nav className="sidebar">
      <NavLink to="/profile" className={() => `sidebar-item${isProfile ? ' active' : ''}`} aria-label="Profile">
        <ProfileIcon />
        <span className="sidebar-label">Profile</span>
      </NavLink>
      <NavLink to="/dashboard" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`} aria-label="Discover">
        <DiscoverIcon />
        <span className="sidebar-label">Discover</span>
      </NavLink>
      <NavLink to="/profile?tab=journal" className={() => `sidebar-item${isJournal ? ' active' : ''}`} aria-label="Journal">
        <JournalIcon />
        <span className="sidebar-label">Journal</span>
      </NavLink>
    </nav>
  );
}
