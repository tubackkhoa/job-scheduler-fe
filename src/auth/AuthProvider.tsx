import { useState } from 'react';
import { AuthContext } from './authContext';
import { getToken, clearToken } from './tokenStorage';
import api from '@/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setAuthToken] = useState<string | null>(
    () => getToken().access_token
  );

  const login = async (username: string, password: string) => {
    const { access_token } = await api.login(username, password);
    setAuthToken(access_token);
    return access_token;
  };

  const logout = () => {
    clearToken();
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
