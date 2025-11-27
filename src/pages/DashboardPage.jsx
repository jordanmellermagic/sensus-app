import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../authContext.jsx';
import { API_BASE } from '../apiConfig.js';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { userId, logout } = useAuth();
  const [resetError, setResetError] = React.useState('');
  const [resetSuccess, setResetSuccess] = React.useState('');

  const handleResetApp = async () => {
    if (!userId) return;
    setResetError('');
    setResetSuccess('');
    try {
      const res = await fetch(`${API_BASE}/clear_all/${encodeURIComponent(userId)}`, {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error('Reset failed');
      }
      setResetSuccess('App data cleared.');
    } catch (err) {
      setResetError('Unable to reset app. Please try again.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="centered-page">
      <div className="card">
        <h1 className="sensus-title">SENSUS</h1>
        <div className="sensus-subtitle">Control panel</div>

        <div style={{ marginTop: '8px', fontSize: '0.85rem', textAlign: 'center', color: '#b0b0b0' }}>
          Logged in as <span style={{ color: '#ffffff' }}>{userId}</span>
        </div>

        <div className="section">
          <div className="section-title">Peeks</div>
          <div className="button-row">
            <button
              className="pill-button"
              type="button"
              onClick={() => navigate('/peek')}
            >
              Peek Screen
            </button>
            <button
              className="pill-button"
              type="button"
              onClick={() => navigate('/spectator')}
            >
              Spectator Data
            </button>
          </div>
        </div>

        <div className="section">
          <div className="section-title">App Controls</div>
          <div className="button-row">
            <button
              className="pill-button"
              type="button"
              onClick={() => navigate('/settings')}
            >
              Settings
            </button>
            <button
              className="pill-button pill-button-danger"
              type="button"
              onClick={handleResetApp}
            >
              Reset App
            </button>
          </div>
          {resetError && <div className="error-text">{resetError}</div>}
          {resetSuccess && <div className="success-text">{resetSuccess}</div>}
        </div>

        <div className="small-footer">
          <button className="small-link-button" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
