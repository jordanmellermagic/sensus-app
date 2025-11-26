import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './authContext.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import SpectatorDataPage from './pages/SpectatorDataPage.jsx'
import PeekScreenPage from './pages/PeekScreenPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

function AppShell() {
  const location = useLocation()
  const isPeek = location.pathname === '/peek'
  return (
    <div className={isPeek ? 'w-full h-screen bg-black' : 'min-h-screen bg-black flex items-center justify-center'}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/spectator-data" element={<ProtectedRoute><SpectatorDataPage /></ProtectedRoute>} />
        <Route path="/peek" element={<ProtectedRoute><PeekScreenPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return <AuthProvider><AppShell /></AuthProvider>
}
