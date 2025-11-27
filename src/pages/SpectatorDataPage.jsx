import React from 'react';
import { useAuth } from '../authContext.jsx';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../apiConfig.js';

/* ===========================
   BIRTHDAY PARSING UTILITIES
=========================== */

function parseBirthday(raw) {
  if (!raw || typeof raw !== 'string') {
    return { year: null, month: null, day: null };
  }

  const trimmed = raw.trim();
  if (!trimmed) return { year: null, month: null, day: null };

  // ISO YYYY-MM-DD
  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    return { year: Number(y), month: Number(m), day: Number(d) };
  }

  // Slash M/D/YYYY
  const slash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, m, d, y] = slash;
    return { year: Number(y), month: Number(m), day: Number(d) };
  }

  // “Mar 5 2008” / “March 5 2008”
  const cleaned = trimmed.replace(',', '');
  const parts = cleaned.split(/\s+/);
  if (parts.length === 3) {
    const [mRaw, dRaw, yRaw] = parts;
    const short = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const full  = ['january','february','march','april','may','june','july','august','september','october','november','december'];
    const lower = mRaw.toLowerCase();

    let month = short.indexOf(lower) + 1;
    if (month === 0) {
      month = full.indexOf(lower) + 1;
    }

    if (month > 0) {
      return {
        year: Number(yRaw),
        month,
        day: Number(dRaw),
      };
    }
  }

  // Dash numeric non-ISO
  const dash = trimmed.replace(/\//g, '-').split('-');
  if (dash.length === 3) {
    const [a, b, c] = dash;
    if (a.length === 4) {
      return { year: Number(a), month: Number(b), day: Number(c) };
    }
    if (c.length === 4) {
      return { year: Number(c), month: Number(a), day: Number(b) };
    }
  }

  return { year: null, month: null, day: null };
}

function getStarSign(month, day) {
  if (!month || !day) return null;
  const m = month, d = day;

  const ranges = [
    ['Aries',       3,21, 4,19],
    ['Taurus',      4,20, 5,20],
    ['Gemini',      5,21, 6,20],
    ['Cancer',      6,21, 7,22],
    ['Leo',         7,23, 8,22],
    ['Virgo',       8,23, 9,22],
    ['Libra',       9,23,10,22],
    ['Scorpio',    10,23,11,21],
    ['Sagittarius',11,22,12,21],
    ['Capricorn',  12,22, 1,19],
    ['Aquarius',    1,20, 2,18],
    ['Pisces',      2,19, 3,20],
  ];

  for (const [sign, m1, d1, m2, d2] of ranges) {
    if ((m === m1 && d >= d1) || (m === m2 && d <= d2)) return sign;
  }
  return null;
}

function calculateDaysAlive(year, month, day) {
  if (!year || !month || !day) return null;
  try {
    const birth = new Date(year, month - 1, day);
    const today = new Date();
    const diff = today - birth;
    if (diff <= 0) return null;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

/* ===========================
   FIXED — LOCAL TIME WEEKDAY
=========================== */
function getWeekdayBorn(year, month, day) {
  if (!year || !month || !day) return null;
  try {
    const d = new Date(year, month - 1, day); // LOCAL timezone
    return d.toLocaleDateString(undefined, { weekday: 'long' });
  } catch {
    return null;
  }
}

/* ===========================
   COMPONENT
=========================== */

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
        // ignore
      }
    };

    fetchData();
    const int = setInterval(fetchData, 1500);

    return () => {
      active = false;
      clearInterval(int);
    };
  }, [userId]);

  const birthdayRaw = data?.birthday || '';
  const parsed = parseBirthday(birthdayRaw);

  const starSign = parsed.month && parsed.day ? getStarSign(parsed.month, parsed.day) : null;
  const daysAlive =
    parsed.year && parsed.month && parsed.day
      ? calculateDaysAlive(parsed.year, parsed.month, parsed.day)
      : null;
  const weekday =
    parsed.year && parsed.month && parsed.day
      ? getWeekdayBorn(parsed.year, parsed.month, parsed.day)
      : null;

  const canShowAny =
    Boolean(starSign) || daysAlive !== null || weekday !== null;

  const fullName = [data?.first_name, data?.last_name].filter(Boolean).join(' ') || '—';

  return (
    <div className="spectator-layout">
      <div className="spectator-card">
        <h1 className="sensus-title">SENSUS</h1>
        <div className="sensus-subtitle">Spectator data</div>

        <div className="spectator-item">
          <div className="spectator-label">Full Name</div>
          <div className="spectator-value">{fullName}</div>
        </div>

        <div className="spectator-item">
          <div className="spectator-label">Phone Number</div>
          <div className="spectator-value">{data?.phone_number || '—'}</div>
        </div>

        <div className="spectator-item">
          <div className="spectator-label">Birthday</div>
          <div className="spectator-value">{birthdayRaw || '—'}</div>
        </div>

        <div className="spectator-dropdown">
          <button
            className="pill-button pill-button-full dropdown-toggle"
            onClick={() => setExpanded((v) => !v)}
          >
            <span>{expanded ? 'Hide more data' : 'Show more data'}</span>
            <span>{expanded ? '▲' : '▼'}</span>
          </button>

          {expanded && (
            <div className="dropdown-content">
              {canShowAny ? (
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
                <div style={{ color: '#777' }}>
                  No additional data can be computed from this format.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="spectator-item" style={{ marginTop: '16px' }}>
          <div className="spectator-label">Address</div>
          <div className="spectator-value">{data?.address || '—'}</div>
        </div>

        <div className="small-footer">
          <button className="small-link-button" onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
