import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../authContext.jsx';
import { API_BASE } from '../apiConfig.js';

function safeParseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function determineHero(noteData, screenData) {
  const noteUpdated = safeParseDate(
    (noteData && (noteData.note_peek_updated_at || noteData.updated_at)) || null
  );
  const screenUpdated = safeParseDate(
    (screenData && (screenData.screen_peek_updated_at || screenData.updated_at)) || null
  );

  if (!noteUpdated && !screenUpdated) {
    return null;
  }

  if (screenUpdated && (!noteUpdated || screenUpdated >= noteUpdated)) {
    const hasScreenshot = Boolean(screenData && screenData.has_screenshot);
    const hasUrl =
      Boolean(screenData && (screenData.url_search_text || screenData.url || screenData.domain));
    const hasContacts = Boolean(screenData && screenData.contacts && screenData.contacts.length);

    if (hasScreenshot) return 'screenshot';
    if (hasUrl) return 'url';
    if (hasContacts) return 'contacts';
    return 'screenshot';
  }

  return 'note';
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
    // Frontend-only implementation; integrates with existing environment if needed.
    // In installed PWA, device vibration is triggered separately below.
    // eslint-disable-next-line no-console
    console.log('setCommand', command);
  };

  const triggerVibration = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 40, 30]);
    }
  };

  React.useEffect(() => {
    let active = true;
    let intervalId;

    const fetchAll = async () => {
      if (!userId) return;
      try {
        const [noteRes, screenRes, screenshotRes] = await Promise.allSettled([
          fetch(`${API_BASE}/note_peek/${encodeURIComponent(userId)}`),
          fetch(`${API_BASE}/screen_peek/${encodeURIComponent(userId)}`),
          fetch(`${API_BASE}/screen_peek/${encodeURIComponent(userId)}/screenshot`)
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

        if (screenshotRes.status === 'fulfilled' && screenshotRes.value.ok) {
          const blob = await screenshotRes.value.blob();
          const url = URL.createObjectURL(blob);
          if (active) {
            setScreenshotUrl((prev) => {
              if (prev) {
                URL.revokeObjectURL(prev);
              }
              return url;
            });
          } else {
            URL.revokeObjectURL(url);
          }
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
  }, [userId]);

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
    }, 150); // 120–180ms range, using 150ms
  };

  const handleTouchMove = (e) => {
    const touches = e.touches;
    if (twoFingerRef.current.active && touches && touches.length >= 2) {
      const currentY =
        (touches[0].clientY + (touches[1]?.clientY || touches[0].clientY)) / 2;
      const deltaY = currentY - twoFingerRef.current.startY;
      if (deltaY > 50) {
        // Two-finger swipe down → navigate to dashboard
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
      // No navigation on triple tap (per updated behavior)
    }
  };

  const handleTouchEnd = (e) => {
    const touchesRemaining = e.touches;
    clearLongPressTimeout();

    if (twoFingerRef.current.active) {
      twoFingerRef.current.active = false;
      ignoreTapRef.current = true;
      pointerDownRef.current = false;
      setIsReveal(false);
      return;
    }

    if (pointerDownRef.current && !isReveal && !ignoreTapRef.current) {
      // Tap (short press) -> tap-based commands
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

  const hero = determineHero(
    noteData,
    screenData && {
      ...screenData,
      has_screenshot: Boolean(screenshotUrl)
    }
  );

  const hasNote = Boolean(noteData && noteData.text);
  const noteText = noteData && (noteData.text || noteData.note);

  const contacts =
    (screenData && screenData.contacts) ||
    (screenData && screenData.contact_list) ||
    null;

  const urlSearchText =
    (screenData && screenData.url_search_text) ||
    (screenData && screenData.url_search_term) ||
    null;

  const urlDomain =
    (screenData && screenData.domain) ||
    (screenData && screenData.url_domain) ||
    null;

  const hasContacts = Boolean(contacts && contacts.length);
  const hasUrl = Boolean(urlSearchText || urlDomain);
  const hasScreenshot = Boolean(screenshotUrl);

  return (
    <div
      className="peek-root"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {isReveal && (
        <div className="peek-overlay">
          {hero === 'note' && hasNote && (
            <>
              <div className="peek-block hero">
                <div className="peek-note-text peek-hero-large">{noteText}</div>
              </div>
              {hasScreenshot && (
                <div className="peek-block bottom-center">
                  <img src={screenshotUrl} alt="Screen peek" className="peek-screenshot" />
                </div>
              )}
              {hasContacts && (
                <div className="peek-block top-right">
                  <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>Contacts</div>
                  <ul className="peek-contacts-list">
                    {contacts.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {hasUrl && (
                <div className="peek-block top-middle">
                  {urlSearchText && (
                    <div>
                      <span role="img" aria-label="search">
                        \uD83D\uDD0D
                      </span>{' '}
                      {urlSearchText}
                    </div>
                  )}
                  {urlDomain && (
                    <div>
                      <span role="img" aria-label="web">
                        \uD83C\uDF10
                      </span>{' '}
                      {urlDomain}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {hero === 'screenshot' && hasScreenshot && (
            <>
              <div className="peek-block hero">
                <img src={screenshotUrl} alt="Screen peek" className="peek-screenshot" />
              </div>
              {hasNote && (
                <div className="peek-block top-left">
                  <div className="peek-note-text">{noteText}</div>
                </div>
              )}
              {hasContacts && (
                <div className="peek-block top-right">
                  <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>Contacts</div>
                  <ul className="peek-contacts-list">
                    {contacts.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {hasUrl && (
                <div className="peek-block top-middle">
                  {urlSearchText && (
                    <div>
                      <span role="img" aria-label="search">
                        \uD83D\uDD0D
                      </span>{' '}
                      {urlSearchText}
                    </div>
                  )}
                  {urlDomain && (
                    <div>
                      <span role="img" aria-label="web">
                        \uD83C\uDF10
                      </span>{' '}
                      {urlDomain}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {hero === 'url' && hasUrl && (
            <>
              <div className="peek-block hero">
                {urlSearchText && (
                  <div className="peek-hero-large">
                    <span role="img" aria-label="search">
                      \uD83D\uDD0D
                    </span>{' '}
                    {urlSearchText}
                  </div>
                )}
                {urlDomain && (
                  <div style={{ marginTop: 6 }}>
                    <span role="img" aria-label="web">
                      \uD83C\uDF10
                    </span>{' '}
                    {urlDomain}
                  </div>
                )}
              </div>
              {hasScreenshot && (
                <div className="peek-block bottom-center">
                  <img src={screenshotUrl} alt="Screen peek" className="peek-screenshot" />
                </div>
              )}
              {hasNote && (
                <div className="peek-block top-left">
                  <div className="peek-note-text">{noteText}</div>
                </div>
              )}
              {hasContacts && (
                <div className="peek-block top-right">
                  <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>Contacts</div>
                  <ul className="peek-contacts-list">
                    {contacts.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {hero === 'contacts' && hasContacts && (
            <>
              <div className="peek-block hero">
                <div className="peek-hero-large" style={{ marginBottom: 6 }}>
                  Contacts
                </div>
                <ul className="peek-contacts-list">
                  {contacts.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
              {hasNote && (
                <div className="peek-block top-left">
                  <div className="peek-note-text">{noteText}</div>
                </div>
              )}
              {hasUrl && (
                <div className="peek-block top-middle">
                  {urlSearchText && (
                    <div>
                      <span role="img" aria-label="search">
                        \uD83D\uDD0D
                      </span>{' '}
                      {urlSearchText}
                    </div>
                  )}
                  {urlDomain && (
                    <div>
                      <span role="img" aria-label="web">
                        \uD83C\uDF10
                      </span>{' '}
                      {urlDomain}
                    </div>
                  )}
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
