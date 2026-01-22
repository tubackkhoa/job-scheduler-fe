import { createContext } from 'react';

export type AuthState = {
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<string>;
  logout: () => void;
};

export const AuthContext = createContext<AuthState | null>(null);
