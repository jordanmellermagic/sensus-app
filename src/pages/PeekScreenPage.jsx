// src/pages/PeekScreenPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../authContext.jsx';
import { API_BASE } from '../apiConfig.js';

// Hero priority when timestamps aren't exposed to the frontend
function determineHero({ hasScreenshot, hasNote, hasContact, hasUrl }) {
  if (hasScreenshot) return 'screenshot';
  if (hasNote) return 'note';
  if (hasContact) return 'contacts';
  if (hasUrl) return 'url';
  return null;
}

export default function PeekScreenPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [noteData, setNoteData] = React.useState(null);
  const [screenData, setScreenData] = React.useState(null);
  const [screenshotUrl, setScreenshotUrl] = React.useState(null);
  const [isReveal, setIsReveal] = React.useState(false);

  const longPressTimeoutRef = React.useRef(null);
  const pointerDownRef = React.useRef(false);
  const lastTapTimeRef = React.useRef(0);
  const tapCountRef = React.useRef(0);
  const ignoreTapRef = React.useRef(false);
  const twoFingerRef = React.useRef({ active: false, startY: 0 });

  const clearLongPressTimeout = () => {
    if (longPressTimeoutRef.current) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const resetTapState = () => {
    tapCountRef.current = 0;
    lastTapTimeRef.current = 0;
  };

  const sendCommand = async (command) => {
    if (!userId) return;
    try {
      await fetch(`${API_BASE}/commands/${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
    } catch {
      // ignore network errors for performance safety
    }
  };

  const triggerVibration = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 40, 30]);
    }
  };

  const registerTap = () => {
    const now = Date.now();
    if (now - lastTapTimeRef.current < 350) {
      tapCountRef.current += 1;
    } else {
      tapCountRef.current = 1;
    }
    lastTapTimeRef.current = now;

    if (tapCountRef.current === 2) {
      sendCommand('screenshot');
      triggerVibration();
    } else if (tapCountRef.current >= 3) {
      sendCommand('finishEffect');
      triggerVibration();
      resetTapState();
      // no navigation on triple tap
    }
  };

  // Poll note_peek + screen_peek + screenshot every 1.5 seconds
  React.useEffect(() => {
    let active = true;

    const fetchAll = async () => {
      if (!userId) return;
      try {
        const [noteRes, screenRes] = await Promise.allSettled([
          fetch(`${API_BASE}/note_peek/${encodeURIComponent(userId)}`),
          fetch(`${API_BASE}/screen_peek/${encodeURIComponent(userId)}`)
        ]);

        if (!active) return;

        if (noteRes.status === 'fulfilled' && noteRes.value.ok) {
          const json = await noteRes.value.json();
          if (active) setNoteData(json);
        }

        let screenJson = null;
        if (screenRes.status === 'fulfilled' && screenRes.value.ok) {
          screenJson = await screenRes.value.json();
          if (active) setScreenData(screenJson);
        }

        // Screenshot: only fetch if backend says a screenshot_path exists
        const screenshotPath = screenJson && screenJson.screenshot_path;
        if (screenshotPath) {
          try {
            const shotRes = await fetch(
              `${API_BASE}/screen_peek/${encodeURIComponent(userId)}/screenshot`
            );
            if (shotRes.ok) {
              const blob = await shotRes.blob();
              const url = URL.createObjectURL(blob);
              if (active) {
                setScreenshotUrl((prev) => {
                  if (prev) URL.revokeObjectURL(prev);
                  return url;
                });
              } else {
                URL.revokeObjectURL(url);
              }
            } else if (active) {
              setScreenshotUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
              });
            }
          } catch {
            // ignore screenshot errors; keep last good one or none
          }
        } else if (active) {
          setScreenshotUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
        }
      } catch {
        // ignore; next poll will try again
      }
    };

    fetchAll();
    const id = window.setInterval(fetchAll, 1500);

    return () => {
      active = false;
      window.clearInterval(id);
      setScreenshotUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [userId]);

  const handleTouchStart = (e) => {
    const touches = e.touches;
    if (!touches || touches.length === 0) return;

    if (touches.length >= 2) {
      // two-finger gesture
      twoFingerRef.current.active = true;
      twoFingerRef.current.startY =
        (touches[0].clientY + (touches[1]?.clientY || touches[0].clientY)) / 2;
      ignoreTapRef.current = true;
      pointerDownRef.current = false;
      clearLongPressTimeout();
      return;
    }

    // one finger
    twoFingerRef.current.active = false;
    ignoreTapRef.current = false;
    pointerDownRef.current = true;

    clearLongPressTimeout();
    longPressTimeoutRef.current = window.setTimeout(() => {
      if (pointerDownRef.current) {
        setIsReveal(true);
      }
    }, 150); // 120–180ms; choose 150ms
  };

  const handleTouchMove = (e) => {
    const touches = e.touches;
    if (twoFingerRef.current.active && touches && touches.length >= 2) {
      const currentY =
        (touches[0].clientY + (touches[1]?.clientY || touches[0].clientY)) / 2;
      const deltaY = currentY - twoFingerRef.current.startY;
      if (deltaY > 50) {
        // two-finger swipe down -> dashboard
        twoFingerRef.current.active = false;
        ignoreTapRef.current = true;
        pointerDownRef.current = false;
        clearLongPressTimeout();
        setIsReveal(false);
        navigate('/dashboard');
      }
      return;
    }
  };

  const handleTouchEnd = () => {
    clearLongPressTimeout();

    if (twoFingerRef.current.active) {
      twoFingerRef.current.active = false;
      ignoreTapRef.current = true;
      pointerDownRef.current = false;
      setIsReveal(false);
      return;
    }

    if (pointerDownRef.current && !isReveal && !ignoreTapRef.current) {
      // short tap
      registerTap();
    }

    pointerDownRef.current = false;
    if (isReveal) {
      setIsReveal(false);
    }
  };

  const handleTouchCancel = () => {
    clearLongPressTimeout();
    pointerDownRef.current = false;
    twoFingerRef.current.active = false;
    setIsReveal(false);
  };

  // Map backend fields to booleans
  const noteBody = noteData && noteData.note_body;
  const hasNote = Boolean(noteBody && noteBody.trim());

  const contactRaw = screenData && screenData.contact;
  const hasContact = Boolean(contactRaw && String(contactRaw).trim());

  const urlRaw = screenData && screenData.url;
  const hasUrl = Boolean(urlRaw && String(urlRaw).trim());

  const hasScreenshot = Boolean(screenshotUrl);

  const hero = determineHero({
    hasScreenshot,
    hasNote,
    hasContact,
    hasUrl
  });

  const contactsArray = hasContact ? [String(contactRaw)] : [];

  return (
    <div
      className="peek-root"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* Idle state: pure black */}
      {isReveal && (
        <div className="peek-overlay">
          {/* HERO: NOTE */}
          {hero === 'note' && hasNote && (
            <>
              <div className="peek-block hero">
                <div className="peek-note-text peek-hero-large">
                  {noteBody}
                </div>
              </div>

              {hasScreenshot && (
                <div className="peek-block bottom-center">
                  <img
                    src={screenshotUrl}
                    alt="Screen peek"
                    className="peek-screenshot"
                  />
                </div>
              )}

              {hasContact && (
                <div className="peek-block top-right">
                  <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>Contact</div>
                  <ul className="peek-contacts-list">
                    {contactsArray.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {hasUrl && (
                <div className="peek-block top-middle">
                  <div>
                    <span role="img" aria-label="web">
                      {'\uD83C\uDF10'}
                    </span>{' '}
                    {urlRaw}
                  </div>
                </div>
              )}
            </>
          )}

          {/* HERO: SCREENSHOT */}
          {hero === 'screenshot' && hasScreenshot && (
            <>
              <div className="peek-block hero">
                <img
                  src={screenshotUrl}
                  alt="Screen peek"
                  className="peek-screenshot"
                />
              </div>

              {hasNote && (
                <div className="peek-block top-left">
                  <div className="peek-note-text">
                    {noteBody}
                  </div>
                </div>
              )}

              {hasContact && (
                <div className="peek-block top-right">
                  <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>Contact</div>
                  <ul className="peek-contacts-list">
                    {contactsArray.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {hasUrl && (
                <div className="peek-block top-middle">
                  <div>
                    <span role="img" aria-label="web">
                      {'\uD83C\uDF10'}
                    </span>{' '}
                    {urlRaw}
                  </div>
                </div>
              )}
            </>
          )}

          {/* HERO: URL */}
          {hero === 'url' && hasUrl && (
            <>
              <div className="peek-block hero">
                <div className="peek-hero-large">
                  <span role="img" aria-label="web">
                    {'\uD83C\uDF10'}
                  </span>{' '}
                  {urlRaw}
                </div>
              </div>

              {hasScreenshot && (
                <div className="peek-block bottom-center">
                  <img
                    src={screenshotUrl}
                    alt="Screen peek"
                    className="peek-screenshot"
                  />
                </div>
              )}

              {hasNote && (
                <div className="peek-block top-left">
                  <div className="peek-note-text">
                    {noteBody}
                  </div>
                </div>
              )}

              {hasContact && (
                <div className="peek-block top-right">
                  <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>Contact</div>
                  <ul className="peek-contacts-list">
                    {contactsArray.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* HERO: CONTACTS */}
          {hero === 'contacts' && hasContact && (
            <>
              <div className="peek-block hero">
                <div className="peek-hero-large" style={{ marginBottom: 6 }}>
                  Contact
                </div>
                <ul className="peek-contacts-list">
                  {contactsArray.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>

              {hasNote && (
                <div className="peek-block top-left">
                  <div className="peek-note-text">
                    {noteBody}
                  </div>
                </div>
              )}

              {hasUrl && (
                <div className="peek-block top-middle">
                  <div>
                    <span role="img" aria-label="web">
                      {'\uD83C\uDF10'}
                    </span>{' '}
                    {urlRaw}
                  </div>
                </div>
              )}

              {hasScreenshot && (
                <div className="peek-block bottom-center">
                  <img
                    src={screenshotUrl}
                    alt="Screen peek"
                    className="peek-screenshot"
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
