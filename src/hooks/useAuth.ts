import { createContext, useContext } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType>({ user: null, loading: true, setUser: () => {} });

export function useAuth() {
  return useContext(AuthContext);
}
