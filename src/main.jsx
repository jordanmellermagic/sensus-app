import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './authContext.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import SpectatorDataPage from './pages/SpectatorDataPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import PeekScreenPage from './pages/PeekScreenPage.jsx'

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="spectator" element={<SpectatorDataPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="peek" element={<PeekScreenPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .catch((err) => console.error('SW registration failed', err))
  })
}
