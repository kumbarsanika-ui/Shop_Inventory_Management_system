import { createContext, useContext, useState } from 'react';
import { api, send } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('stockroom-user') || 'null'); }
    catch { return null; }
  });

  async function login(credentials) {
    const response = await send('/auth/login', 'POST', credentials);
    localStorage.setItem('stockroom-token', response.data.token);
    localStorage.setItem('stockroom-user', JSON.stringify(response.data.user));
    setUser(response.data.user);
  }

  async function logout() {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* Token is cleared locally regardless. */ }
    localStorage.removeItem('stockroom-token');
    localStorage.removeItem('stockroom-user');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
