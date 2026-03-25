import { useState, useEffect, type ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './hooks/useAuth';
import { getMe, getStoredToken } from './api';
import type { User } from './types';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Discover from './pages/Discover';
import Search from './pages/Search';
import Journal from './pages/Journal';
import Profile from './pages/Profile';
import GamePage from './pages/GamePage';
import Settings from './pages/Settings';
import Admin from './pages/Admin';

function RequireAuth({ children, user }: { children: ReactNode; user: User | null }) {
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getStoredToken()) {
      setLoading(false);
      return;
    }
    getMe()
      .then((u) => setUser(u as User))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <AuthContext value={{ user, loading, setUser }}>
      <Routes>
        <Route path="/" element={user ? <Navigate to={user.onboarding_step < 3 ? '/onboarding' : '/dashboard'} replace /> : <Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding" element={<RequireAuth user={user}><Onboarding /></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth user={user}><Dashboard /></RequireAuth>} />
        <Route path="/discover" element={<RequireAuth user={user}><Discover /></RequireAuth>} />
        <Route path="/search" element={<RequireAuth user={user}><Search /></RequireAuth>} />
        <Route path="/journal" element={<RequireAuth user={user}><Journal /></RequireAuth>} />
        <Route path="/profile/:id?" element={<RequireAuth user={user}><Profile /></RequireAuth>} />
        <Route path="/game/:igdbId" element={<GamePage />} />
        <Route path="/settings" element={<RequireAuth user={user}><Settings /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth user={user}><Admin /></RequireAuth>} />
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
      </Routes>
    </AuthContext>
  );
}
