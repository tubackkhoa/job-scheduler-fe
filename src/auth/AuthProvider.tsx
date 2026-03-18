import { useState } from 'react';
import { AuthContext } from './authContext';
import storage from '../storage';
import api from '@/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setAuthToken] = useState<string | null>(
    () => storage.getToken().access_token,
  );

  const login = async (username: string, password: string) => {
    const { access_token } = await api.login(username, password);
    setAuthToken(access_token);
    const user = await api.me();
    storage.saveUser(user);
    window.ctx = { user }; // update for global access
    return access_token;
  };

  const logout = () => {
    storage.clearToken();
    storage.clearUser();
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
