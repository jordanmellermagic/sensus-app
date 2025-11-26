import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api.js'
import { useAuth } from '../authContext.jsx'

function usePollingData(userId, intervalMs = 1500) {
  const [noteData, setNoteData] = useState(null)
  const [screenData, setScreenData] = useState(null)
  const prevNoteRef = useRef(null)
  const prevScreenRef = useRef(null)
  const [heroSource, setHeroSource] = useState(null) // 'note' | 'screen' | 'contact'

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

        if (noteChanged && !screenChanged) {
          setHeroSource('note')
        } else if (screenChanged && !noteChanged) {
          // screen could be screenshot, url, or contact change
          setHeroSource('screen')
        } else if (noteChanged && screenChanged) {
          // if both changed in same poll, prefer screen
          setHeroSource('screen')
        } else if (!heroSource) {
          // initial hero guess
          if (screen?.screenshot_path || screen?.url) {
            setHeroSource('screen')
          } else if (note?.note_name || note?.note_body) {
            setHeroSource('note')
          } else if (screen?.contact) {
            setHeroSource('contact')
          }
        }

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
  }, [userId, intervalMs, heroSource])

  return { noteData, screenData, heroSource }
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
  const touchStartRef = useRef(null)
  const [isTwoFingerGesture, setIsTwoFingerGesture] = useState(false)
  const { noteData, screenData, heroSource } = usePollingData(userId)

  const handlePointerDown = () => {
    setRevealing(true)
  }

  const handlePointerUp = () => {
    setRevealing(false)
  }

  const registerTap = async () => {
    const now = Date.now()
    const recent = tapTimes.filter((t) => now - t < 600)
    recent.push(now)
    setTapTimes(recent)

    if (recent.length >= 3) {
      setTapTimes([])
      try {
        await api.post(`/commands/${encodeURIComponent(userId)}`, {
          command: 'finishEffect',
        })
        vibrate(60)
      } catch (err) {
        console.error('Failed to send finishEffect', err)
      }
    } else if (recent.length === 2) {
      try {
        await api.post(`/commands/${encodeURIComponent(userId)}`, {
          command: 'screenshot',
        })
        vibrate(40)
      } catch (err) {
        console.error('Failed to send screenshot command', err)
      }
    }
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

  const hasScreenshot = !!screenData?.screenshot_path
  const hasUrl = !!screenData?.url
  const hasNote = !!(noteData?.note_name || noteData?.note_body)
  const hasContact = !!screenData?.contact

  let heroType = heroSource
  if (!heroType) {
    if (hasUrl || hasScreenshot) heroType = 'screen'
    else if (hasNote) heroType = 'note'
    else if (hasContact) heroType = 'contact'
  }

  const showCenterPreview =
    revealing && (hasScreenshot || hasUrl || hasNote || hasContact)

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
      {/* Base is pure black. Only render overlay while revealing */}
      {revealing && (
        <div className="absolute inset-0">
          {/* Corner note (when not hero and note exists) */}
          {hasNote && heroType !== 'note' && (
            <div className="absolute top-4 left-4 max-w-[45%] text-xs text-neutral-200 bg-black/60 px-2 py-1 rounded-md">
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

          {/* Corner contact (when not hero and contact exists) */}
          {hasContact && heroType !== 'contact' && (
            <div className="absolute top-4 right-4 max-w-[45%] text-xs text-right text-neutral-200 bg-black/60 px-2 py-1 rounded-md">
              <div className="font-semibold mb-0.5">Contact</div>
              <div className="text-neutral-300 break-words">
                {screenData.contact}
              </div>
            </div>
          )}

          {/* Center hero */}
          {showCenterPreview && (
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <div className="max-w-full max-h-full">
                {heroType === 'screen' && (hasScreenshot || hasUrl) && (
                  <div className="rounded-xl border border-neutral-700 bg-neutral-900/70 overflow-hidden max-w-md mx-auto">
                    {hasUrl && (
                      <div className="px-3 py-2 border-b border-neutral-800 text-xs text-neutral-300 flex items-center justify-between">
                        <span className="truncate">{screenData.url}</span>
                        <span className="ml-2 text-[10px] uppercase text-neutral-500">
                          Preview
                        </span>
                      </div>
                    )}
                    {hasScreenshot && (
                      <img
                        src={`${api.defaults.baseURL}/screen_peek/${encodeURIComponent(
                          userId,
                        )}/screenshot?ts=${Date.now()}`}
                        alt="Screen peek"
                        className="block w-full h-auto max-h-[60vh] object-contain bg-black"
                      />
                    )}
                    {!hasScreenshot && !hasUrl && (
                      <div className="px-4 py-6 text-center text-sm text-neutral-500">
                        No screen data yet.
                      </div>
                    )}
                  </div>
                )}

                {heroType === 'note' && hasNote && (
                  <div className="rounded-xl border border-neutral-700 bg-neutral-900/80 px-4 py-3 max-w-md mx-auto">
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

                {heroType === 'contact' && hasContact && (
                  <div className="rounded-xl border border-neutral-700 bg-neutral-900/80 px-4 py-3 max-w-md mx-auto text-sm text-neutral-200">
                    <div className="font-semibold mb-1">Contact</div>
                    <div className="whitespace-pre-wrap break-words">
                      {screenData.contact}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
