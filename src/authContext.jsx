import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem("sensus_user_id");
    if (stored) {
      setUserId(stored);
    }
    setLoading(false);
  }, []);

  const login = (id) => {
    setUserId(id);
    window.localStorage.setItem("sensus_user_id", id);
  };

  const logout = () => {
    setUserId(null);
    window.localStorage.removeItem("sensus_user_id");
  };

  const value = { userId, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}