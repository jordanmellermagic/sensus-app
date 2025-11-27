import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("sensus_user_id");
      if (stored) setUserId(stored);
    } catch (e) {
      console.error("auth localStorage error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (id) => {
    setUserId(id);
    try {
      window.localStorage.setItem("sensus_user_id", id);
    } catch (e) {
      console.error("auth localStorage error", e);
    }
  };

  const logout = () => {
    setUserId(null);
    try {
      window.localStorage.removeItem("sensus_user_id");
    } catch (e) {
      console.error("auth localStorage error", e);
    }
  };

  const value = { userId, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
