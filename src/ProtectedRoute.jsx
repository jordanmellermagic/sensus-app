import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./authContext.jsx";

export default function ProtectedRoute({ children }) {
  const { userId, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!userId) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}
