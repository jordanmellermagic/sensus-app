import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./authContext.jsx";

export default function ProtectedRoute({ children }) {
  const { userId, loading } = useAuth();

  if (loading) {
    return (
      <div className="fullscreen-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!userId) {
    return <Navigate to="/" replace />;
  }

  return children;
}