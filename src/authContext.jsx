import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem('sensus_user_id');
    if (stored) {
      setUserId(stored);
    }
    setInitializing(false);
  }, []);

  const login = (id) => {
    window.localStorage.setItem('sensus_user_id', id);
    setUserId(id);
  };

  const logout = () => {
    window.localStorage.removeItem('sensus_user_id');
    setUserId(null);
  };

  const value = {
    userId,
    login,
    logout,
    initializing
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
