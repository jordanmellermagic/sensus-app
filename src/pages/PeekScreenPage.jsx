// src/pages/PeekScreenPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../authContext.jsx';
import { API_BASE } from '../apiConfig.js';

// Hero priority WITHOUT timestamps (GET endpoints don't expose *_updated_at)
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
  const twoFingerRef = React.useRef({
    active: false,
    startY: 0
  });

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

  const handleSetCommand = (command) => {
    // If you later wire this to /commands, you can POST here.
    // For now we only log, as per your original spec.
    // eslint-disable-next-line no-console
    console.log('setCommand', command);
  };

  const triggerVibration = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 40, 30]);
    }
  };

  // Poll backend every 1.5 seconds, wired to your actual endpoints.:contentReference[oaicite:3]{index=3}
  React.useEffect(() => {
    let active = true;
    let intervalId;

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

        if (screenRes.status === 'fulfilled' && screenRes.value.ok) {
          const json = await screenRes.value.json();
          if (active) setScreenData(json);
        }

        // Screenshot: only try to fetch if backend says a screenshot_path exists
        const screenshotPath =
          screenData && screenData.screenshot_path
            ? screenData.screenshot_path
            : null;

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
            } else {
              // if 404, just clear
              if (active) {
                setScreenshotUrl((prev) => {
                  if (prev) URL.revokeObjectURL(prev);
                  return null;
                });
              }
            }
          } catch {
            // ignore errors; will try again on next poll
          }
        } else {
          // no screenshot_path -> clear screenshot
          setScreenshotUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
        }
      } catch {
        // ignore, next poll will try again
      }
    };

    fetchAll();
    intervalId = window.setInterval(fetchAll, 1500);

    return () => {
      active = false;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      setScreenshotUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [userId, screenData && screenData.screenshot_path]);

  const handleTouchStart = (e) => {
    const touches = e.touches;
    if (!touches || touches.length === 0) return;

    // Two-finger swipe setup
    if (touches.length >= 2) {
      twoFingerRef.current.active = true;
      twoFingerRef.current.startY =
        (touches[0].clientY + (touches[1]?.clientY || touches[0].clientY)) / 2;
      ignoreTapRef.current = true;
      pointerDownRef.current = false;
      clearLongPressTimeout();
      return;
    }

    // Single finger
    twoFingerRef.current.active = false;
    ignoreTapRef.current = false;
    pointerDownRef.current = true;

    clearLongPressTimeout();
    longPressTimeoutRef.current = window.setTimeout(() => {
      if (pointerDownRef.current) {
        setIsReveal(true);
      }
    }, 150); // 120–180ms → pick 150ms
  };

  const handleTouchMove = (e) => {
    const touches = e.touches;
    if (twoFingerRef.current.active && touches && touches.length >= 2) {
      const currentY =
        (touches[0].clientY + (touches[1]?.clientY || touches[0].clientY)) / 2;
      const deltaY = currentY - twoFingerRef.current.startY;
      if (deltaY > 50) {
        // Two-finger swipe down → dashboard
        twoFingerRef.current.active = false;
        ignoreTapRef.current = true;
        clearLongPressTimeout();
        pointerDownRef.current = false;
        setIsReveal(false);
        navigate('/dashboard');
      }
      return;
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
      handleSetCommand('screenshot');
      triggerVibration();
    } else if (tapCountRef.current >= 3) {
      handleSetCommand('finishEffect');
      triggerVibration();
      resetTapState();
      // No navigation on triple tap
    }
  };

  const handleTouchEnd = (e) => {
    clearLongPressTimeout();

    if (twoFingerRef.current.active) {
      twoFingerRef.current.active = false;
      ignoreTapRef.current = true;
      pointerDownRef.current = false;
      setIsReveal(false);
      return;
    }

    if (pointerDownRef.current && !isReveal && !ignoreTapRef.current) {
      // Short tap → tap commands
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

  // Map backend fields to our UI
  const noteName = noteData && noteData.note_name;
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

  // Normalize contact to an array (spec says "Contacts", API is single "contact")
  const contactsArray = hasContact ? [String(contactRaw)] : [];

  return (
    <div
      className="peek-root"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* Idle state: pure black; nothing rendered */}
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
                  <img src={screenshotUrl} alt="Screen peek" className="peek-screenshot" />
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
                <img src={screenshotUrl} alt="Screen peek" className="peek-screenshot" />
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
                  <img src={screenshotUrl} alt="Screen peek" className="peek-screenshot" />
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
                  <img src={screenshotUrl} alt="Screen peek" className="peek-screenshot" />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
