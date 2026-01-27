import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      checkAuth();
    } else {
      // Try cookie-based auth
      checkAuth();
    }
  }, [checkAuth, token]);

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password });
    const { token: newToken, user: userData } = response.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('auth_token', newToken);
    return userData;
  };

  const register = async (data) => {
    const response = await axios.post(`${API}/auth/register`, data);
    const { token: newToken, user: userData } = response.data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('auth_token', newToken);
    return userData;
  };

  const loginWithGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const processGoogleSession = async (sessionId) => {
    const response = await axios.post(`${API}/auth/session`, { session_id: sessionId }, {
      withCredentials: true
    });
    setUser(response.data.user);
    return response.data.user;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      // Ignore errors
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    loginWithGoogle,
    processGoogleSession,
    logout,
    isAuthenticated: !!user,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
