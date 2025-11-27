import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './authContext.jsx';

export default function ProtectedRoute({ children }) {
  const { userId, initializing } = useAuth();

  if (initializing) {
    return null;
  }

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
