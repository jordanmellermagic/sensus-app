import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./authContext.jsx";

export default function ProtectedRoute({ children }) {
  const { userId, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading…
      </div>
    );
  }

  if (!userId) {
    return <Navigate to="/" replace />;
  }

  return children;
}
