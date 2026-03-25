import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { updateMe, signout, setToken } from '../api';
import { useAuth } from '../hooks/useAuth';
import './Settings.css';

export default function Settings() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  if (!user) { navigate('/'); return null; }

  const [username, setUsername] = useState(user?.username || '');
  const [email] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      await updateMe({ username, bio });
      if (user) {
        setUser({ ...user, username, bio });
      }
      setSaveMsg('Changes saved');
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signout();
    } catch {
      // ignore errors on signout
    }
    setToken(null);
    setUser(null);
    navigate('/');
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <Header />
      <main className="main-content">
        <h1 className="settings-title">Settings</h1>

        {/* Profile Section */}
        <section className="settings-section">
          <h2 className="settings-section-title">Profile</h2>
          <div className="settings-card">
            <div className="settings-avatar-row">
              <img
                className="settings-avatar"
                src={user?.avatar_url || '/images/user-icon.png'}
                alt="Avatar"
              />
              <div className="settings-avatar-info">
                <div className="settings-avatar-name">{user?.username || 'User'}</div>
                <div className="settings-avatar-hint">Change your profile picture in your profile page</div>
              </div>
            </div>
            <div className="settings-form">
              <div className="settings-field">
                <label className="settings-label">Username</label>
                <input
                  className="settings-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="settings-field">
                <label className="settings-label">Email</label>
                <input
                  className="settings-input"
                  type="email"
                  value={email}
                  readOnly
                />
              </div>
              <div className="settings-field">
                <label className="settings-label">Bio</label>
                <textarea
                  className="settings-input settings-textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              </div>
              {saveMsg && <div className="settings-save-msg">{saveMsg}</div>}
              <button className="btn btn-primary settings-save-btn" onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="settings-section">
          <h2 className="settings-section-title">Account</h2>
          <div className="settings-card">
            <div className="settings-row" onClick={() => navigate('/reset-password')}>
              <div className="settings-row-label">Change Password</div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </div>
            <div className="settings-row">
              <div className="settings-row-label">Notifications</div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </div>
            <div className="settings-row settings-row-danger" onClick={handleSignOut}>
              <div className="settings-row-label">Sign Out</div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            </div>
            <div className="settings-row settings-row-danger">
              <div className="settings-row-label">Delete Account</div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
            </div>
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
