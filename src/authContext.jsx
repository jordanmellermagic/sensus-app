import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext({
  userId: null,
  loading: true,
  login: () => {},
  logout: () => {}
});

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem("sensus_user_id");
    if (stored) setUserId(stored);
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

  return (
    <AuthContext.Provider value={{ userId, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
