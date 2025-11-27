import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../authContext.jsx';
import { API_BASE } from '../apiConfig.js';

export default function SettingsPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!oldPassword || !newPassword) {
      setError('Please fill in both fields.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE}/user/${encodeURIComponent(userId)}/change_password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            old_password: oldPassword,
            new_password: newPassword
          })
        }
      );
      if (!res.ok) {
        throw new Error('Password change failed');
      }
      setSuccess('Password updated successfully.');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setError('Unable to change password. Please check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="centered-page">
      <div className="card">
        <h1 className="sensus-title">SENSUS</h1>
        <div className="sensus-subtitle">Settings</div>

        <form className="settings-form" onSubmit={handleSubmit}>
          <div>
            <label className="field-label" htmlFor="oldPassword">Old password</label>
            <input
              id="oldPassword"
              className="text-input"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              className="text-input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <button className="pill-button pill-button-full" type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Change password'}
          </button>
        </form>
        {error && <div className="error-text">{error}</div>}
        {success && <div className="success-text">{success}</div>}

        <div className="small-footer">
          <button
            className="small-link-button"
            type="button"
            onClick={() => navigate('/dashboard')}
          >
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
