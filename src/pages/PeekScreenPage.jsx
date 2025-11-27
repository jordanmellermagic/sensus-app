import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../authContext.jsx";
import { fetchNotePeek, fetchScreenPeek, fetchScreenshotBlob, setCommand } from "../api.js";
import { summarizeUrl } from "../urlUtils.js";

const POLL_MS = 1200;
const LONG_PRESS_MS = 350;
const TAP_WINDOW = 260;

function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

export default function PeekScreenPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [note, setNote] = useState({ name: "", body: "" });
  const [screen, setScreen] = useState({ contact: "", url: "", screenshotUrl: "" });
  const [hero, setHero] = useState("none");
  const [overlayVisible, setOverlayVisible] = useState(false);

  const snapshotRef = useRef({ note: null, screen: null });
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);
  const pressTimerRef = useRef(null);
  const longPressActiveRef = useRef(false);
  const pressStartRef = useRef(0);
  const touchStartPositionsRef = useRef(null);

  // Poll note + screen data
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [noteRes, screenRes] = await Promise.all([
          fetchNotePeek(userId).catch(() => null),
          fetchScreenPeek(userId).catch(() => null)
        ]);

        if (cancelled) return;

        const newNote = {
          name: noteRes?.note_name || "",
          body: noteRes?.note_body || ""
        };

        const baseScreen = {
          contact: screenRes?.contact || "",
          url: screenRes?.url || "",
          screenshotPath: screenRes?.screenshot_path || ""
        };

        let screenshotUrl = "";
        if (baseScreen.screenshotPath) {
          const blob = await fetchScreenshotBlob(userId).catch(() => null);
          if (!cancelled && blob) {
            screenshotUrl = URL.createObjectURL(blob);
          }
        }

        const newScreen = {
          contact: baseScreen.contact,
          url: baseScreen.url,
          screenshotUrl
        };

        setNote(newNote);
        setScreen(newScreen);

        const snap = {
          note: JSON.stringify(newNote),
          screen: JSON.stringify(baseScreen)
        };
        const prev = snapshotRef.current;
        snapshotRef.current = snap;

        const hasNote = newNote.name || newNote.body;
        const hasUrl = !!baseScreen.url;
        const hasShot = !!baseScreen.screenshotPath;

        if (!prev.note && !prev.screen) {
          if (hasShot) setHero("screenshot");
          else if (hasUrl) setHero("url");
          else if (hasNote) setHero("note");
          else setHero("none");
          return;
        }

        const noteChanged = snap.note !== prev.note;
        const screenChanged = snap.screen !== prev.screen;

        if (screenChanged) {
          if (hasShot) setHero("screenshot");
          else if (hasUrl) setHero("url");
          else if (noteChanged && hasNote) setHero("note");
        } else if (noteChanged && hasNote) {
          setHero("note");
        }
      } catch {
        if (!cancelled) {
          setNote({ name: "", body: "" });
          setScreen({ contact: "", url: "", screenshotUrl: "" });
          setHero("none");
        }
      }
    }

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [userId]);

  function handleShortTap() {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      const count = tapCountRef.current;
      tapCountRef.current = 0;
      if (count === 2) {
        setCommand(userId, "screenshot").catch(() => {});
        vibrate(40);
      } else if (count >= 3) {
        setCommand(userId, "finishEffect").catch(() => {});
        vibrate([20, 40, 20]);
        navigate("/dashboard");
      }
    }, TAP_WINDOW);
  }

  function onPointerDown(e) {
    if (e.touches && e.touches.length === 2) {
      const [t1, t2] = e.touches;
      touchStartPositionsRef.current = { y1: t1.clientY, y2: t2.clientY };
    } else {
      touchStartPositionsRef.current = null;
    }
    pressStartRef.current = performance.now();
    longPressActiveRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      longPressActiveRef.current = true;
      setOverlayVisible(true);
      vibrate(60);
    }, LONG_PRESS_MS);
  }

  function onPointerUp() {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (longPressActiveRef.current) {
      setOverlayVisible(false);
      longPressActiveRef.current = false;
      return;
    }
    const dur = performance.now() - pressStartRef.current;
    if (dur < LONG_PRESS_MS) handleShortTap();
  }

  function onTouchMove(e) {
    if (!touchStartPositionsRef.current) return;
    if (!e.touches || e.touches.length !== 2) return;
    const [t1, t2] = e.touches;
    const start = touchStartPositionsRef.current;
    const dy1 = t1.clientY - start.y1;
    const dy2 = t2.clientY - start.y2;
    if (dy1 > 60 && dy2 > 60) {
      touchStartPositionsRef.current = null;
      navigate("/dashboard");
    }
  }

  useEffect(() => {
    return () => {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    };
  }, []);

  const urlSummary = summarizeUrl(screen.url);
  const hasNote = note.name || note.body;
  const hasUrl = !!screen.url;
  const hasContact = !!screen.contact;
  const hasShot = !!screen.screenshotUrl;

  return (
    <div
      className="min-h-screen bg-black text-white relative overflow-hidden"
      onTouchStart={onPointerDown}
      onTouchEnd={onPointerUp}
      onTouchCancel={onPointerUp}
      onTouchMove={onTouchMove}
      onMouseDown={onPointerDown}
      onMouseUp={onPointerUp}
    >
      {!overlayVisible && (
        <>
          <div className="absolute inset-0 px-4 pt-6 pb-6 flex flex-col justify-between">
            {/* top row */}
            <div className="flex justify-between items-start text-sm">
              <div className="max-w-[40%]">
                {hasNote && (
                  <>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                      Note
                    </div>
                    <div className="mt-1 truncate">
                      {note.name || note.body}
                    </div>
                  </>
                )}
              </div>
              <div className="flex-1 text-center">
                {hasUrl && urlSummary && (
                  <div className="inline-flex flex-col items-center max-w-[80%]">
                    <div className="h-5 w-5 rounded-full border border-neutral-600 mb-1" />
                    <div className="text-sm truncate">{urlSummary.host}</div>
                    {urlSummary.searchTerm && (
                      <div className="text-xs text-neutral-400 truncate">
                        {urlSummary.searchTerm}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="max-w-[35%] text-right">
                {hasContact && (
                  <>
                    <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                      Contact
                    </div>
                    <div className="mt-1 text-sm truncate">{screen.contact}</div>
                  </>
                )}
              </div>
            </div>

            {/* hero area */}
            <div className="flex-1 flex items-center justify-center">
              {hero === "screenshot" && hasShot && (
                <img
                  src={screen.screenshotUrl}
                  alt="Screenshot"
                  className="max-w-[70%] max-h-[60vh] rounded-2xl border border-neutral-700 shadow-2xl"
                />
              )}
              {hero === "url" && hasUrl && (
                <div className="bg-neutral-900/90 border border-neutral-700 rounded-2xl px-4 py-3 max-w-[80%] text-center">
                  <div className="text-sm mb-1">{urlSummary?.host}</div>
                  {urlSummary?.searchTerm && (
                    <div className="text-xs text-neutral-300">
                      {urlSummary.searchTerm}
                    </div>
                  )}
                </div>
              )}
              {hero === "note" && hasNote && (
                <div className="bg-neutral-900/90 border border-neutral-700 rounded-2xl px-4 py-3 max-w-[80%]">
                  {note.name && (
                    <div className="text-sm font-medium mb-1">{note.name}</div>
                  )}
                  {note.body && (
                    <div className="text-xs text-neutral-300 whitespace-pre-wrap">
                      {note.body}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-[11px] text-neutral-500 text-center">
              Press &amp; hold to reveal · Double-tap to screenshot · Triple-tap to finish · Two-finger swipe down to Home
            </div>
          </div>
        </>
      )}

      {overlayVisible && (
        <div className="absolute inset-0 bg-black/95 px-4 pt-8 pb-6 overflow-y-auto text-sm">
          {hasNote && (
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                Note
              </div>
              <div className="mt-1">
                {note.name || note.body}
              </div>
              {note.name && note.body && (
                <div className="mt-1 text-neutral-300">{note.body}</div>
              )}
            </div>
          )}
          {hasUrl && urlSummary && (
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                URL
              </div>
              <div className="mt-1">{urlSummary.host}</div>
              {urlSummary.searchTerm && (
                <div className="mt-1">🔍 {urlSummary.searchTerm}</div>
              )}
            </div>
          )}
          {hasContact && (
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                Contact
              </div>
              <div className="mt-1">{screen.contact}</div>
            </div>
          )}
          {hasShot && (
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                Screenshot
              </div>
              <img
                src={screen.screenshotUrl}
                alt="Screenshot"
                className="mt-2 max-w-[80%] max-h-[60vh] rounded-2xl border border-neutral-700"
              />
            </div>
          )}
          {!hasNote && !hasUrl && !hasContact && !hasShot && (
            <div className="mt-10 text-neutral-500 text-center">
              Waiting for data…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
