import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../authContext.jsx";
import { fetchScreenshotBlob, setCommand } from "../api.js";

const TAP_WINDOW_MS = 400;
const MAX_TAP_DISTANCE = 40;

export default function PeekScreenPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [imageUrl, setImageUrl] = useState(null);
  const [isHolding, setIsHolding] = useState(false);

  const tapStateRef = useRef({
    lastTapTime: 0,
    tapCount: 0,
    lastX: 0,
    lastY: 0
  });

  const touchGestureRef = useRef({
    twoFingerStartY: null,
    twoFingerActive: false
  });

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  async function loadScreenshot() {
    try {
      const blob = await fetchScreenshotBlob(userId);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setImageUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      console.error("screenshot fetch error", err);
    }
  }

  function handlePointerDown(e) {
    e.preventDefault();
    setIsHolding(true);
    loadScreenshot();
  }

  function handlePointerUp(e) {
    e.preventDefault();
    setIsHolding(false);

    const now = Date.now();
    const { clientX, clientY } = "changedTouches" in e
      ? e.changedTouches[0]
      : e;

    const ts = tapStateRef.current;
    const dt = now - ts.lastTapTime;
    const dx = clientX - ts.lastX;
    const dy = clientY - ts.lastY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (dt > TAP_WINDOW_MS || distance > MAX_TAP_DISTANCE) {
      tapStateRef.current = {
        lastTapTime: now,
        tapCount: 1,
        lastX: clientX,
        lastY: clientY
      };
      return;
    }

    const nextCount = ts.tapCount + 1;
    tapStateRef.current = {
      lastTapTime: now,
      tapCount: nextCount,
      lastX: clientX,
      lastY: clientY
    };

    if (nextCount === 2) {
      setCommand(userId, "screenshot").catch((err) =>
        console.error("screenshot command error", err)
      );
    } else if (nextCount >= 3) {
      setCommand(userId, "finishEffect")
        .catch((err) => console.error("finishEffect error", err))
        .finally(() => {
          navigate("/dashboard", { replace: true });
        });
      tapStateRef.current.tapCount = 0;
    }
  }

  function handleTouchStart(e) {
    if (e.touches.length === 2) {
      touchGestureRef.current.twoFingerActive = true;
      const avgY =
        (e.touches[0].clientY + e.touches[1].clientY) / 2;
      touchGestureRef.current.twoFingerStartY = avgY;
    }
    handlePointerDown(e);
  }

  function handleTouchMove(e) {
    if (touchGestureRef.current.twoFingerActive && e.touches.length === 2) {
      const avgY =
        (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const startY = touchGestureRef.current.twoFingerStartY ?? avgY;
      const deltaY = avgY - startY;
      if (deltaY > 80) {
        touchGestureRef.current.twoFingerActive = false;
        navigate("/dashboard", { replace: true });
        return;
      }
    }
  }

  function handleTouchEnd(e) {
    if (e.touches.length < 2) {
      touchGestureRef.current.twoFingerActive = false;
    }
    handlePointerUp(e);
  }

  function handleMouseDown(e) {
    if (e.button !== 0) return;
    handlePointerDown(e);
  }

  function handleMouseUp(e) {
    if (e.button !== 0) return;
    handlePointerUp(e);
  }

  return (
    <div className="peek-root">
      <div
        className="peek-screen"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="peek-hint">
          Press &amp; hold anywhere to reveal. Double‑tap: screenshot. Triple‑tap:
          finish effect. Two‑finger swipe down: back to dashboard.
        </div>
        {isHolding && imageUrl && (
          <img
            className="peek-image"
            src={imageUrl}
            alt="Peek"
          />
        )}
      </div>
    </div>
  );
}
