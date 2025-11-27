import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../authContext.jsx";
import {
  fetchNotePeek,
  fetchScreenshotBlob,
  setCommand
} from "../api.js";

export default function PeekScreenPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [noteData, setNoteData] = React.useState(null);
  const [screenshotUrl, setScreenshotUrl] = React.useState(null);
  const [overlayVisible, setOverlayVisible] = React.useState(false);
  const [status, setStatus] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    let timer;

    async function poll() {
      try {
        const note = await fetchNotePeek(userId);
        if (!cancelled) setNoteData(note || null);

        const blob = await fetchScreenshotBlob(userId);
        if (!cancelled) {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setScreenshotUrl((old) => {
              if (old) URL.revokeObjectURL(old);
              return url;
            });
          } else {
            setScreenshotUrl((old) => {
              if (old) URL.revokeObjectURL(old);
              return null;
            });
          }
        }
      } catch (e) {
        if (!cancelled) {
          setStatus(e.message || "Connection problem");
        }
      } finally {
        if (!cancelled) {
          timer = setTimeout(poll, 1000);
        }
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      setScreenshotUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
    };
  }, [userId]);

  const holdTimer = React.useRef(null);

  function handlePointerDown() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      setOverlayVisible(true);
      setStatus("");
    }, 350);
  }

  function handlePointerUp() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    setOverlayVisible(false);
  }

  const tapState = React.useRef({ count: 0, last: 0 });

  async function handleTap() {
    const now = Date.now();
    if (now - tapState.current.last < 400) {
      tapState.current.count += 1;
    } else {
      tapState.current.count = 1;
    }
    tapState.current.last = now;

    const count = tapState.current.count;

    if (count === 2) {
      try {
        await setCommand(userId, "screenshot");
        setStatus("Screenshot command sent");
      } catch (e) {
        setStatus(e.message || "Failed to send screenshot command");
      }
    } else if (count === 3) {
      tapState.current.count = 0;
      try {
        await setCommand(userId, "finishEffect");
        setStatus("Finish command sent");
        setTimeout(() => navigate("/dashboard"), 500);
      } catch (e) {
        setStatus(e.message || "Failed to send finish command");
      }
    }

    setTimeout(() => {
      if (tapState.current.count === count) {
        tapState.current.count = 0;
      }
    }, 450);
  }

  const note = noteData?.note || noteData?.text || "";
  const url = noteData?.url || "";
  const contact =
    noteData?.contact ||
    noteData?.person ||
    noteData?.name ||
    noteData?.label ||
    "";

  return (
    <div
      className="screen peek-screen"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={handleTap}
    >
      <div className="peek-overlay">
        {!overlayVisible && (
          <div className="peek-instruction">
            <div className="peek-title">Peek Screen</div>
            <p>Press &amp; hold anywhere to reveal.</p>
            <p className="muted small">
              Double-tap: send screenshot command. Triple-tap: finish effect +
              back to dashboard.
            </p>
          </div>
        )}

        {overlayVisible && (
          <div className="peek-content">
            <div className="peek-top-row">
              {note && <div className="peek-note">{note}</div>}
              {url && (
                <div className="peek-url" title={url}>
                  {url}
                </div>
              )}
              {contact && <div className="peek-contact">{contact}</div>}
            </div>

            {screenshotUrl && (
              <div className="peek-screenshot">
                <img src={screenshotUrl} alt="Latest screenshot" />
              </div>
            )}
          </div>
        )}
      </div>

      {status && <div className="status-banner">{status}</div>}
    </div>
  );
}