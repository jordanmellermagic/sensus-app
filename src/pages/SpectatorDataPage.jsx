import React from 'react';
import { useAuth } from '../authContext.jsx';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../apiConfig.js';

function parseBirthdayString(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  const parts = trimmed.split('-').map((p) => p.trim());
  if (parts.length === 3) {
    const [y, m, d] = parts.map((p) => parseInt(p, 10));
    if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
      return { year: y, month: m, day: d };
    }
  }
  if (parts.length === 2) {
    const [m, d] = parts.map((p) => parseInt(p, 10));
    if (!Number.isNaN(m) && !Number.isNaN(d)) {
      return { year: null, month: m, day: d };
    }
  }
  return null;
}

function getStarSign(month, day) {
  if (!month || !day) return null;
  const m = month;
  const d = day;
  if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return 'Aries';
  if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return 'Taurus';
  if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return 'Gemini';
  if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return 'Cancer';
  if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return 'Leo';
  if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return 'Virgo';
  if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return 'Libra';
  if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return 'Scorpio';
  if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return 'Sagittarius';
  if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return 'Capricorn';
  if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return 'Aquarius';
  if ((m === 2 && d >= 19) || (m === 3 && d <= 20)) return 'Pisces';
  return null;
}

function calculateDaysAlive(year, month, day) {
  if (!year || !month || !day) return null;
  try {
    const birthUtc = Date.UTC(year, month - 1, day);
    const today = new Date();
    const todayUtc = Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate()
    );
    const diffMs = todayUtc - birthUtc;
    if (diffMs < 0) return null;
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    return days;
  } catch {
    return null;
  }
}

function getWeekdayBorn(year, month, day) {
  if (!year || !month || !day) return null;
  try {
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  } catch {
    return null;
  }
}

export default function SpectatorDataPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = React.useState(null);
  const [expanded, setExpanded] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    let intervalId;

    const fetchData = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`${API_BASE}/data_peek/${encodeURIComponent(userId)}`);
        if (!res.ok) return;
        const json = await res.json();
        if (active) {
          setData(json);
        }
      } catch {
        // ignore errors, next poll will try again
      }
    };

    fetchData();
    intervalId = window.setInterval(fetchData, 1500);

    return () => {
      active = false;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [userId]);

  const birthdayRaw = data && (data.birthday || data.date_of_birth || data.dob);
  const parsed = parseBirthdayString(birthdayRaw || '');
  const starSign =
    parsed && parsed.month && parsed.day ? getStarSign(parsed.month, parsed.day) : null;
  const daysAlive =
    parsed && parsed.year && parsed.month && parsed.day
      ? calculateDaysAlive(parsed.year, parsed.month, parsed.day)
      : null;
  const weekday =
    parsed && parsed.year && parsed.month && parsed.day
      ? getWeekdayBorn(parsed.year, parsed.month, parsed.day)
      : null;

  const canShowAnyComputed =
    Boolean(starSign) || daysAlive !== null || weekday !== null;

  const fullNameParts = [];
  if (data && data.first_name) fullNameParts.push(data.first_name);
  if (data && data.last_name) fullNameParts.push(data.last_name);
  const fullName = fullNameParts.join(' ').trim();

  return (
    <div className="spectator-layout">
      <div className="spectator-card">
        <h1 className="sensus-title">SENSUS</h1>
        <div className="sensus-subtitle">Spectator data</div>

        <div style={{ marginTop: '12px' }}>
          <div className="spectator-item">
            <div className="spectator-label">Full Name</div>
            <div className="spectator-value">
              {fullName || '—'}
            </div>
          </div>

          <div className="spectator-item">
            <div className="spectator-label">Phone Number</div>
            <div className="spectator-value">
              {(data && (data.phone_number || data.phone)) || '—'}
            </div>
          </div>

          <div className="spectator-item">
            <div className="spectator-label">Birthday</div>
            <div className="spectator-value">
              {birthdayRaw || '—'}
            </div>
          </div>

          <div className="spectator-dropdown">
            <button
              type="button"
              className="pill-button pill-button-full dropdown-toggle"
              onClick={() => setExpanded((v) => !v)}
            >
              <span>{expanded ? 'Hide more data' : 'Show more data'}</span>
              <span>{expanded ? '\u25B2' : '\u25BC'}</span>
            </button>
            {expanded && (
              <div className="dropdown-content">
                {canShowAnyComputed ? (
                  <>
                    {starSign && (
                      <div className="dropdown-row">
                        <strong>Star sign:</strong> {starSign}
                      </div>
                    )}
                    {daysAlive !== null && (
                      <div className="dropdown-row">
                        <strong>Days alive:</strong> {daysAlive.toLocaleString()}
                      </div>
                    )}
                    {weekday && (
                      <div className="dropdown-row">
                        <strong>Day of week born:</strong> {weekday}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ color: '#777777' }}>
                    No additional data can be computed from the current birthday format.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="spectator-item" style={{ marginTop: '16px' }}>
            <div className="spectator-label">Address</div>
            <div className="spectator-value">
              {(data && (data.address || data.full_address)) || '—'}
            </div>
          </div>
        </div>

        <div className="small-footer">
          <button
            type="button"
            className="small-link-button"
            onClick={() => navigate('/dashboard')}
          >
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
