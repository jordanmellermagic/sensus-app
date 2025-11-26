// src/pages/PeekScreenPage.jsx
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api.js'
import { useAuth } from '../authContext.jsx'
import { parseUrlInfo } from '../urlUtils.js'

function getTimestamp(obj, keys) {
  if (!obj) return null
  for (const key of keys) {
    if (obj[key]) {
      const t = Date.parse(obj[key])
      if (!Number.isNaN(t)) return t
    }
  }
  return null
}

function usePeekData(userId, intervalMs = 1500) {
  const [noteData, setNoteData] = useState(null)
  const [screenData, setScreenData] = useState(null)
  const [heroType, setHeroType] = useState(null) // 'note' | 'screen'
  const [screenHeroKind, setScreenHeroKind] = useState(null) // 'screenshot' | 'url' | 'contact'

  const prevNoteRef = useRef(null)
  const prevScreenRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      try {
        const [noteRes, screenRes] = await Promise.all([
          api.get(`/note_peek/${encodeURIComponent(userId)}`),
          api.get(`/note_peek/${encodeURIComponent(userId)}`),
          api.get(`/screen_peek/${encodeURIComponent(userId)}`),
        ])
      } catch (err) {
        console.error('Peek poll failed', err)
      }
    }

    const pollWrapped = async () => {
      try {
        const [noteRes, screenRes] = await Promise.all([
          api.get(`/note_peek/${encodeURIComponent(userId)}`),
          api.get(`/screen_peek/${encodeURIComponent(userId)}`),
        ])

        const note = noteRes.data || {}
        const screen = screenRes.data || {}

        if (cancelled) return

        const prevNote = prevNoteRef.current
        const prevScreen = prevScreenRef.current

        // Has each block changed structurally?
        const noteChanged =
          JSON.stringify(prevNote || {}) !== JSON.stringify(note || {})
        const screenChanged =
          JSON.stringify(prevScreen || {}) !== JSON.stringify(screen || {})

        // Timestamp-based hero selection (note vs screen)
        const noteTs = getTimestamp(note, [
          'note_peek_updated_at',
          'updated_at',
        ])
        const screenTs = getTimestamp(screen, [
          'screen_peek_updated_at',
          'updated_at',
        ])

        let nextHeroType = heroType
        if (noteTs || screenTs) {
          if (noteTs && !screenTs) nextHeroType = 'note'
          else if (!noteTs && screenTs) nextHeroType = 'screen'
          else if (noteTs && screenTs) {
            nextHeroType = noteTs >= screenTs ? 'note' : 'screen'
          }
        } else {
          // Fallback if timestamps missing
          if (screenChanged && !noteChanged) nextHeroType = 'screen'
          else if (noteChanged && !screenChanged) nextHeroType = 'note'
          else if (screenChanged && noteChanged) {
            // If both change, prefer screen by default
            nextHeroType = 'screen'
          }
        }

        // Within screen block, decide screenshot/url/contact
        const hasScreenshot = !!screen?.screenshot_path
        const hasUrl = !!screen?.url
        const hasContact = !!screen?.contact

        let nextScreenHeroKind = screenHeroKind

        if (screenChanged) {
          const prev = prevScreen || {}
          const changedScreenshot =
            prev?.screenshot_path !== screen?.screenshot_path && !!screen?.screenshot_path
          const changedUrl = prev?.url !== screen?.url && !!screen?.url
          const changedContact =
            prev?.contact !== screen?.contact && !!screen?.contact

          if (changedScreenshot) nextScreenHeroKind = 'screenshot'
          else if (changedUrl) nextScreenHeroKind = 'url'
          else if (changedContact) nextScreenHeroKind = 'contact'
        }

        // If still no hero kind but we have content, pick best available
        if (!nextScreenHeroKind) {
          if (hasScreenshot) nextScreenHeroKind = 'screenshot'
          else if (hasUrl) nextScreenHeroKind = 'url'
          else if (hasContact) nextScreenHeroKind = 'contact'
        }

        // If heroType is "screen" but there's no screen content, fall back
        if (nextHeroType === 'screen' && !hasScreenshot && !hasUrl && !hasContact) {
          nextHeroType = hasNote(note) ? 'note' : null
        }

        prevNoteRef.current = note
        prevScreenRef.current = screen

        setNoteData(note)
        setScreenData(screen)
        setHeroType(nextHeroType)
        setScreenHeroKind(nextScreenHeroKind)
      } catch (err) {
        console.error('Polling failed', err)
      }
    }

    pollWrapped()
    const id = setInterval(pollWrapped, intervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [userId, intervalMs, heroType, screenHeroKind])

  return { noteData, screenData, heroType, screenHeroKind }
}

function hasNote(noteData) {
  return !!(noteData?.note_name || noteData?.note_body)
}

function vibrate(pattern = 50) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern)
    }
    if (
      typeof window !== 'undefined' &&
      window?.webkit?.messageHandlers?.hapticFeedback
    ) {
      window.webkit.messageHandlers.hapticFeedback.postMessage('impact')
    }
  } catch {
    // ignore
  }
}

export default function PeekScreenPage() {
  const { userId } = useAuth()
  const navigate = useNavigate()

  const [revealing, setRevealing] = useState(false)
  const [tapTimes, setTapTimes] = useState([])
  const holdTimerRef = useRef(null)
  const didRevealRef = useRef(false)
  const tapTimeoutRef = useRef(null)
  const touchStartRef = useRef(null)
  const [isTwoFingerGesture, setIsTwoFingerGesture] = useState(false)

  const { noteData, screenData, heroType, screenHeroKind } = usePeekData(
    userId,
    1500,
  )

  const noteExists = hasNote(noteData)
  const hasScreenshot = !!screenData?.screenshot_path
  const hasUrl = !!screenData?.url
  const hasContact = !!screenData?.contact

  // If heroType isn't set, choose a default
  let effectiveHeroType = heroType
  if (!effectiveHeroType) {
    if (hasScreenshot || hasUrl || hasContact) effectiveHeroType = 'screen'
    else if (noteExists) effectiveHeroType = 'note'
  }

  let effectiveScreenHeroKind = screenHeroKind
  if (effectiveHeroType === 'screen') {
    if (!effectiveScreenHeroKind) {
      if (hasScreenshot) effectiveScreenHeroKind = 'screenshot'
      else if (hasUrl) effectiveScreenHeroKind = 'url'
      else if (hasContact) effectiveScreenHeroKind = 'contact'
    }
  }

  // URL info
  const urlInfo = hasUrl ? parseUrlInfo(screenData.url) : { domain: null, search: null, page: null }

  const showAnything =
    noteExists || hasScreenshot || hasUrl || hasContact

  // Anti-cache token for screenshots: path + updated_at
  const screenshotKey = (() => {
    if (!hasScreenshot) return ''
    const base = screenData.screenshot_path || 'shot'
    const ts =
      screenData.screen_peek_updated_at ||
      screenData.updated_at ||
      ''
    return encodeURIComponent(base + ':' + ts)
  })()

  const screenshotQuery = screenshotKey ? `?v=${screenshotKey}` : ''

  // --- Press & hold with 120ms delay ---
  const handlePointerDown = () => {
    didRevealRef.current = false
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
    }
    holdTimerRef.current = setTimeout(() => {
      didRevealRef.current = true
      setRevealing(true)
    }, 120)
  }

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    if (didRevealRef.current) {
      didRevealRef.current = false
      setRevealing(false)
      return
    }
    registerTap()
  }

  const registerTap = () => {
    const now = Date.now()
    const recent = tapTimes.filter((t) => now - t < 600)
    recent.push(now)
    setTapTimes(recent)

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current)
      tapTimeoutRef.current = null
    }

    tapTimeoutRef.current = setTimeout(async () => {
      const len = recent.length
      setTapTimes([])
      tapTimeoutRef.current = null

      if (len >= 3) {
        vibrate(60)
        try {
          await api.post(`/commands/${encodeURIComponent(userId)}`, {
            command: 'finishEffect',
          })
        } catch (err) {
          console.error('Failed to send finishEffect', err)
        }
      } else if (len === 2) {
        vibrate(40)
        try {
          await api.post(`/commands/${encodeURIComponent(userId)}`, {
            command: 'screenshot',
          })
        } catch (err) {
          console.error('Failed to send screenshot command', err)
        }
      }
    }, 250)
  }

  // Two-finger swipe down to exit
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      setIsTwoFingerGesture(true)
      touchStartRef.current = {
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      }
    }
  }

  const handleTouchMove = (e) => {
    if (isTwoFingerGesture && e.touches.length === 2 && touchStartRef.current) {
      const currentY =
        (e.touches[0].clientY + e.touches[1].clientY) / 2
      const deltaY = currentY - touchStartRef.current.y
      if (deltaY > 80) {
        setIsTwoFingerGesture(false)
        touchStartRef.current = null
        navigate('/', { replace: true })
      }
    }
  }

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      setIsTwoFingerGesture(false)
      touchStartRef.current = null
    }
  }

  return (
    <div
      className="w-full h-screen bg-black text-white relative touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {revealing && showAnything && (
        <div className="absolute inset-0">
          {/* SMALL FIXED POSITIONS */}

          {/* NOTE – top-left */}
          {noteExists && effectiveHeroType !== 'note' && (
            <div className="absolute top-4 left-4 max-w-[45%] text-[14px] text-neutral-200 bg-black/80 px-2 py-1.5 rounded-md">
              <div className="font-semibold text-[13px] mb-0.5">Note</div>
              {noteData?.note_name && (
                <div className="font-medium mb-0.5">
                  {noteData.note_name}
                </div>
              )}
              {noteData?.note_body && (
                <div className="text-neutral-300 line-clamp-2">
                  {noteData.note_body}
                </div>
              )}
            </div>
          )}

          {/* URL – top-middle */}
          {hasUrl &&
            !(
              effectiveHeroType === 'screen' &&
              effectiveScreenHeroKind === 'url'
            ) &&
            (urlInfo.search || urlInfo.page || urlInfo.domain) && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 max-w-[70%] text-[14px] text-center text-neutral-200 bg-black/80 px-3 py-2 rounded-md">
                {urlInfo.search && (
                  <div className="mb-1">
                    <span className="mr-1">🔍</span>
                    <span>{urlInfo.search}</span>
                  </div>
                )}
                {!urlInfo.search && urlInfo.page && (
                  <div className="mb-1">
                    <span className="mr-1">📄</span>
                    <span>{urlInfo.page}</span>
                  </div>
                )}
                {urlInfo.domain && (
                  <div>
                    <span className="mr-1">🌐</span>
                    <span>{urlInfo.domain}</span>
                  </div>
                )}
              </div>
            )}

          {/* CONTACT – top-right */}
          {hasContact &&
            !(
              effectiveHeroType === 'screen' &&
              effectiveScreenHeroKind === 'contact'
            ) && (
              <div className="absolute top-4 right-4 max-w-[45%] text-[14px] text-right text-neutral-200 bg-black/80 px-2 py-1.5 rounded-md">
                <div className="font-semibold mb-0.5 text-[13px]">
                  Contact
                </div>
                <div className="text-neutral-300 break-words">
                  {screenData.contact}
                </div>
              </div>
            )}

          {/* SCREENSHOT THUMB – bottom-center */}
          {hasScreenshot &&
            !(
              effectiveHeroType === 'screen' &&
              effectiveScreenHeroKind === 'screenshot'
            ) && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-32">
                <img
                  key={screenshotKey + '-thumb'}
                  src={`${api.defaults.baseURL}/screen_peek/${encodeURIComponent(
                    userId,
                  )}/screenshot${screenshotQuery}&thumb=1`}
                  alt="Screen peek thumbnail"
                  className="w-full h-auto object-contain rounded-md border border-neutral-700 bg-black"
                />
              </div>
            )}

          {/* HERO CENTER – LARGE (~75% WIDTH) */}
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="w-[75vw] max-w-md max-h-[75vh]">
              {/* SCREEN HERO – SCREENSHOT */}
              {effectiveHeroType === 'screen' &&
                effectiveScreenHeroKind === 'screenshot' &&
                hasScreenshot && (
                  <div className="rounded-xl border border-neutral-700 bg-neutral-900/70 overflow-hidden">
                    <img
                      key={screenshotKey + '-hero'}
                      src={`${api.defaults.baseURL}/screen_peek/${encodeURIComponent(
                        userId,
                      )}/screenshot${screenshotQuery}`}
                      alt="Screen peek"
                      className="block w-full h-auto max-h-[75vh] object-contain bg-black"
                    />
                  </div>
                )}

              {/* NOTE HERO */}
              {effectiveHeroType === 'note' && noteExists && (
                <div className="rounded-xl border border-neutral-700 bg-neutral-900/85 px-4 py-3">
                  <div className="font-semibold text-sm mb-1 text-neutral-100">
                    Note
                  </div>
                  {noteData?.note_name && (
                    <div className="font-semibold mb-1 text-[15px] text-neutral-100">
                      {noteData.note_name}
                    </div>
                  )}
                  {noteData?.note_body && (
                    <div className="text-[15px] text-neutral-200 whitespace-pre-wrap">
                      {noteData.note_body}
                    </div>
                  )}
                </div>
              )}

              {/* URL HERO */}
              {effectiveHeroType === 'screen' &&
                effectiveScreenHeroKind === 'url' &&
                hasUrl && (
                  <div className="rounded-xl border border-neutral-700 bg-neutral-900/85 px-4 py-3 text-center text-[15px] text-neutral-100">
                    {urlInfo.search && (
                      <div className="mb-2">
                        <span className="mr-1">🔍</span>
                        <span>{urlInfo.search}</span>
                      </div>
                    )}
                    {!urlInfo.search && urlInfo.page && (
                      <div className="mb-2">
                        <span className="mr-1">📄</span>
                        <span>{urlInfo.page}</span>
                      </div>
                    )}
                    {urlInfo.domain && (
                      <div className="text-xs text-neutral-300">
                        <span className="mr-1">🌐</span>
                        <span>{urlInfo.domain}</span>
                      </div>
                    )}
                  </div>
                )}

              {/* CONTACT HERO */}
              {effectiveHeroType === 'screen' &&
                effectiveScreenHeroKind === 'contact' &&
                hasContact && (
                  <div className="rounded-xl border border-neutral-700 bg-neutral-900/85 px-4 py-3 text-[15px] text-neutral-200">
                    <div className="font-semibold mb-1 text-neutral-100">
                      Contact
                    </div>
                    <div className="whitespace-pre-wrap break-words">
                      {screenData.contact}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
