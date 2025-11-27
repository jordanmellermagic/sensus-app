import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../authContext.jsx';
import { API_BASE } from '../apiConfig.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, userId } = useAuth();
  const [userIdInput, setUserIdInput] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      navigate('/dashboard', { replace: true });
    }
  }, [userId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!userIdInput || !password) {
      setError('Please enter both User ID and password.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userIdInput, password })
      });

      if (!res.ok) {
        throw new Error('Login failed');
      }

      login(userIdInput);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="centered-page">
      <div className="card">
        <h1 className="sensus-title">SENSUS</h1>
        <div className="sensus-subtitle">Control panel</div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label className="field-label" htmlFor="userId">User ID</label>
            <input
              id="userId"
              className="text-input"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label className="field-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="text-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button
            className="pill-button pill-button-full"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Logging in…' : 'Log In'}
          </button>
          {error && <div className="error-text">{error}</div>}
        </form>
      </div>
    </div>
  );
}
