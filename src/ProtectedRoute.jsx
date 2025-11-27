import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./authContext.jsx";

export default function ProtectedRoute({ children }) {
  const auth = useAuth();

  // If context is not ready → avoid destructuring crash
  if (!auth || auth.loading) return null;

  const { userId } = auth;

  if (!userId) return <Navigate to="/" replace />;

  return children;
}
