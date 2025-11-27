import React from 'react';
import { useAuth } from '../authContext.jsx';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../apiConfig.js';

// Parse birthday string as robustly as possible.
// Primary: ISO "YYYY-MM-DD"
// Fallbacks: "Mar 6 2008", "March 6 2008", "Mar 6, 2008", "3/6/2008", etc.
function parseBirthday(raw) {
  if (!raw || typeof raw !== 'string') {
    return { year: null, month: null, day: null };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return { year: null, month: null, day: null };
  }

  // ISO: YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return {
      year: Number(y),
      month: Number(m),
      day: Number(d)
    };
  }

  // Slash format: M/D/YYYY or MM/DD/YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{4})$/);
  if (slashMatch) {
    const [, m, d, y] = slashMatch;
    return {
      year: Number(y),
      month: Number(m),
      day: Number(d)
    };
  }

  // Month-name formats, e.g. "Mar 6 2008", "March 6 2008", with optional comma.
  const monthNamesShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const monthNamesLong = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

  const cleaned = trimmed.replace(',', '');
  const parts = cleaned.split(/\s+/);
  if (parts.length === 3) {
    const [mRaw, dRaw, yRaw] = parts;
    const mLower = mRaw.toLowerCase();
    let month = null;

    let idx = monthNamesShort.indexOf(mLower);
    if (idx === -1) {
      idx = monthNamesLong.indexOf(mLower);
    }
    if (idx !== -1) {
      month = idx + 1;
    }

    const day = Number(dRaw);
    const year = Number(yRaw);

    if (month && !Number.isNaN(day) && !Number.isNaN(year)) {
      return { year, month, day };
    }
  }

  // Fallback: numeric with dashes in non-ISO order, e.g. "03-06-2008" or "6-3-2008"
  const dashParts = trimmed.replace(/\//g, '-').split('-');
  if (dashParts.length === 3) {
    const [a, b, c] = dashParts;
    if (a.length === 4) {
      // YYYY-MM-DD
      return {
        year: Number(a),
        month: Number(b),
        day: Number(c)
      };
    }
    if (c.length === 4) {
      // DD-MM-YYYY or MM-DD-YYYY – assume MM-DD-YYYY
      return {
        year: Number(c),
        month: Number(a),
        day: Number(b)
      };
    }
  }

  return { year: null, month: null, day: null };
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
    const birth = Date.UTC(year, month - 1, day);
    const today = new Date();
    const todayUtc = Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate()
    );
    const diff = todayUtc - birth;
    if (diff <= 0) return null;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function getWeekdayBorn(year, month, day) {
  if (!year || !month || !day) return null;
  try {
    const d = new Date(Date.UTC(year, month - 1, day));
    return d.toLocaleDateString(undefined, { weekday: 'long' });
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
    const fetchData = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`${API_BASE}/data_peek/${encodeURIComponent(userId)}`);
        if (!res.ok) return;
        const json = await res.json();
        if (active) setData(json);
      } catch {
        // ignore, will retry on next poll
      }
    };

    fetchData();
    const id = window.setInterval(fetchData, 1500);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [userId]);

  const birthdayRaw = data && data.birthday;
  const parsed = parseBirthday(birthdayRaw || '');
  const starSign = parsed.month && parsed.day ? getStarSign(parsed.month, parsed.day) : null;
  const daysAlive =
    parsed.year && parsed.month && parsed.day
      ? calculateDaysAlive(parsed.year, parsed.month, parsed.day)
      : null;
  const weekday =
    parsed.year && parsed.month && parsed.day
      ? getWeekdayBorn(parsed.year, parsed.month, parsed.day)
      : null;

  const canShowAnyComputed = Boolean(starSign || daysAlive !== null || weekday !== null);

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
            <div className="spectator-value">{fullName || '—'}</div>
          </div>

          <div className="spectator-item">
            <div className="spectator-label">Phone Number</div>
            <div className="spectator-value">
              {(data && data.phone_number) || '—'}
            </div>
          </div>

          <div className="spectator-item">
            <div className="spectator-label">Birthday</div>
            <div className="spectator-value">{birthdayRaw || '—'}</div>
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
                        <strong>Days alive:</strong> {daysAlive.toLocaleString()}</strong>
                      </div>
                    )}
                    {weekday && (
                      <div className="dropdown-row">
                        <strong>Day of week born:</strong> {weekday}</strong>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ color: '#777' }}>
                    No additional data can be computed from the current birthday format.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="spectator-item" style={{ marginTop: '16px' }}>
            <div className="spectator-label">Address</div>
            <div className="spectator-value">
              {(data && data.address) || '—'}
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
