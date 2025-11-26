import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api.js'
import { useAuth } from '../authContext.jsx'
import { parseUrlInfo } from '../urlUtils.js'

function usePeekData(userId, intervalMs = 1500) {
  const [noteData, setNoteData] = useState(null)
  const [screenData, setScreenData] = useState(null)
  const [heroType, setHeroType] = useState(null)
  const prevNoteRef = useRef(null)
  const prevScreenRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
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

        const noteChanged =
          JSON.stringify(prevNote || {}) !== JSON.stringify(note || {})
        const screenChanged =
          JSON.stringify(prevScreen || {}) !== JSON.stringify(screen || {})

        let nextHero = null

        if (screenChanged) {
          const ps = prevScreen || {}
          const changedScreenshot =
            ps?.screenshot_path !== screen?.screenshot_path &&
            !!screen?.screenshot_path
          const changedUrl =
            ps?.url !== screen?.url &&
            !!screen?.url
          const changedContact =
            ps?.contact !== screen?.contact &&
            !!screen?.contact

          if (changedScreenshot) nextHero = 'screenshot'
          else if (changedUrl) nextHero = 'url'
          else if (changedContact) nextHero = 'contact'
        }

        if (!nextHero && noteChanged) {
          const hasNote = !!(note?.note_name || note?.note_body)
          if (hasNote) nextHero = 'note'
        }

        if (!nextHero && !heroType) {
          if (screen?.screenshot_path) nextHero = 'screenshot'
          else if (screen?.url) nextHero = 'url'
          else if (screen?.contact) nextHero = 'contact'
          else if (note?.note_name || note?.note_body) nextHero = 'note'
        }

        if (nextHero) setHeroType(nextHero)

        prevNoteRef.current = note
        prevScreenRef.current = screen
        setNoteData(note)
        setScreenData(screen)
      } catch (err) {
        console.error('Polling failed', err)
      }
    }

    poll()
    const id = setInterval(poll, intervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [userId, intervalMs, heroType])

  return { noteData, screenData, heroType }
}

function vibrate(pattern = 50) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // ignore
    }
  }
}

export default function PeekScreenPage() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [revealing, setRevealing] = useState(false)
  const [tapTimes, setTapTimes] = useState([])
  const tapTimeoutRef = useRef(null)
  const touchStartRef = useRef(null)
  const [isTwoFingerGesture, setIsTwoFingerGesture] = useState(false)

  const { noteData, screenData, heroType } = usePeekData(userId)

  const handlePointerDown = () => {
    setRevealing(true)
  }

  const handlePointerUp = () => {
    setRevealing(false)
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

  const hasNote = !!(noteData?.note_name || noteData?.note_body)
  const hasUrl = !!screenData?.url
  const hasContact = !!screenData?.contact
  const hasScreenshot = !!screenData?.screenshot_path

  let effectiveHero = heroType
  if (!effectiveHero) {
    if (hasScreenshot) effectiveHero = 'screenshot'
    else if (hasUrl) effectiveHero = 'url'
    else if (hasContact) effectiveHero = 'contact'
    else if (hasNote) effectiveHero = 'note'
  }

  const urlInfo = hasUrl ? parseUrlInfo(screenData.url) : { domain: null, search: null, page: null }

  const showAnything =
    hasNote || hasUrl || hasContact || hasScreenshot

  return (
    <div
      className="w-full h-screen bg-black text-white relative touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={registerTap}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {revealing && showAnything && (
        <div className="absolute inset-0">
          {/* Small fixed positions */}
          {hasNote && effectiveHero !== 'note' && (
            <div className="absolute top-4 left-4 max-w-[45%] text-xs text-neutral-200 bg-black/70 px-2 py-1 rounded-md">
              {noteData?.note_name && (
                <div className="font-semibold mb-0.5">
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

          {hasUrl && effectiveHero !== 'url' && (urlInfo.search || urlInfo.page || urlInfo.domain) && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 max-w-[70%] text-xs text-center text-neutral-200 bg-black/70 px-3 py-2 rounded-md">
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

          {hasContact && effectiveHero !== 'contact' && (
            <div className="absolute top-4 right-4 max-w-[45%] text-xs text-right text-neutral-200 bg-black/70 px-2 py-1 rounded-md">
              <div className="font-semibold mb-0.5">Contact</div>
              <div className="text-neutral-300 break-words">
                {screenData.contact}
              </div>
            </div>
          )}

          {hasScreenshot && effectiveHero !== 'screenshot' && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-32">
              <img
                src={`${api.defaults.baseURL}/screen_peek/${encodeURIComponent(
                  userId,
                )}/screenshot?thumb=1&ts=${Date.now()}`}
                alt="Screen peek"
                className="w-full h-auto object-contain rounded-md border border-neutral-700 bg-black"
              />
            </div>
          )}

          {/* HERO in center */}
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="max-w-[70vw] max-h-[70vh]">
              {effectiveHero === 'screenshot' && hasScreenshot && (
                <div className="rounded-xl border border-neutral-700 bg-neutral-900/70 overflow-hidden">
                  <img
                    src={`${api.defaults.baseURL}/screen_peek/${encodeURIComponent(
                      userId,
                    )}/screenshot?ts=${Date.now()}`}
                    alt="Screen peek"
                    className="block w-full h-auto max-h-[70vh] object-contain bg-black"
                  />
                </div>
              )}

              {effectiveHero === 'note' && hasNote && (
                <div className="rounded-xl border border-neutral-700 bg-neutral-900/80 px-4 py-3">
                  {noteData?.note_name && (
                    <div className="font-semibold mb-1">
                      {noteData.note_name}
                    </div>
                  )}
                  {noteData?.note_body && (
                    <div className="text-sm text-neutral-200 whitespace-pre-wrap">
                      {noteData.note_body}
                    </div>
                  )}
                </div>
              )}

              {effectiveHero === 'url' && hasUrl && (
                <div className="rounded-xl border border-neutral-700 bg-neutral-900/80 px-4 py-3 text-center text-sm text-neutral-100">
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

              {effectiveHero === 'contact' && hasContact && (
                <div className="rounded-xl border border-neutral-700 bg-neutral-900/80 px-4 py-3 text-sm text-neutral-200">
                  <div className="font-semibold mb-1">Contact</div>
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
