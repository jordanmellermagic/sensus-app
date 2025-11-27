import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api.js'
import { useAuth } from '../authContext.jsx'
import { parseUrlInfo } from '../urlUtils.js'

const POLL_INTERVAL_MS = 700

function vibrate(ms = 10) {
  if (navigator.vibrate) {
    navigator.vibrate(ms)
  }
}

export default function PeekScreenPage() {
  const { userId } = useAuth()
  const navigate = useNavigate()

  const [note, setNote] = useState(null)
  const [screen, setScreen] = useState(null)
  const [heroType, setHeroType] = useState(null)
  const [heroKey, setHeroKey] = useState(0)
  const [showOverlay, setShowOverlay] = useState(false)

  const lastNoteUpdated = useRef(null)
  const lastScreenUpdated = useRef(null)

  const lastTapTime = useRef(0)
  const tapCount = useRef(0)
  const holdTimeout = useRef(null)
  const holding = useRef(false)

  const fetchNote = async () => {
    try {
      const res = await api.get(`/note_peek/${encodeURIComponent(userId)}`)
      const updatedAt = res.data?.note_peek_updated_at || res.data?.updated_at || null
      setNote({
        name: res.data?.note_name || null,
        body: res.data?.note_body || null,
        updatedAt,
      })
      lastNoteUpdated.current = updatedAt
    } catch (err) {
      console.error(err)
    }
  }

  const fetchScreen = async () => {
    try {
      const res = await api.get(`/screen_peek/${encodeURIComponent(userId)}`)
      const updatedAt = res.data?.screen_peek_updated_at || res.data?.updated_at || null
      setScreen({
        contact: res.data?.contact || null,
        urlRaw: res.data?.url || null,
        screenshotPath: res.data?.screenshot_path || null,
        updatedAt,
      })
      lastScreenUpdated.current = updatedAt
    } catch (err) {
      console.error(err)
    }
  }

  const setCommand = async (command) => {
    try {
      await api.post(`/commands/${encodeURIComponent(userId)}`, { command })
    } catch (err) {
      console.error('Failed to set command', err)
    }
  }

  useEffect(() => {
    fetchNote()
    fetchScreen()
    const id = setInterval(() => {
      fetchNote()
      fetchScreen()
    }, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [userId])

  useEffect(() => {
    const timestamps = []

    if (note?.updatedAt) {
      timestamps.push({ type: 'note', t: new Date(note.updatedAt).getTime() || 0 })
    }
    if (screen?.updatedAt) {
      timestamps.push({ type: 'screen', t: new Date(screen.updatedAt).getTime() || 0 })
    }

    if (timestamps.length === 0) {
      setHeroType(null)
      return
    }

    timestamps.sort((a, b) => b.t - a.t)
    const latest = timestamps[0].type

    setHeroType(latest)
    setHeroKey((k) => k + 1)
  }, [note, screen])

  const handleTouchStart = () => {
    holding.current = false
    holdTimeout.current = window.setTimeout(() => {
      holding.current = true
      setShowOverlay(true)
      vibrate(15)
    }, 320)
  }

  const handleTouchEnd = () => {
    if (holdTimeout.current) {
      window.clearTimeout(holdTimeout.current)
      holdTimeout.current = null
    }

    if (holding.current) {
      holding.current = false
      setShowOverlay(false)
      return
    }

    const now = Date.now()
    if (now - lastTapTime.current < 350) {
      tapCount.current += 1
    } else {
      tapCount.current = 1
    }
    lastTapTime.current = now

    window.setTimeout(() => {
      if (tapCount.current === 2) {
        vibrate(20)
        setCommand('screenshot')
      } else if (tapCount.current === 3) {
        vibrate(30)
        setCommand('finishEffect')
      }
      tapCount.current = 0
    }, 260)
  }

  const handleSwipeDown = (e) => {
    if (e.changedTouches && e.changedTouches.length === 2) {
      navigate('/')
    }
  }

  const urlInfo = screen?.urlRaw ? parseUrlInfo(screen.urlRaw) : null
  const screenshotUrl =
    screen?.screenshotPath &&
    `${screen.screenshotPath}?t=${Date.now()}`

  const noteExists = note?.name || note?.body
  const urlExists = !!urlInfo?.domain
  const contactExists = !!screen?.contact
  const screenshotExists = !!screen?.screenshotPath

  return (
    <div
      className="w-full min-h-screen bg-black text-white pt-safe pb-safe"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onTouchMove={handleSwipeDown}
    >
      {!showOverlay && (
        <div className="w-full min-h-screen bg-black" />
      )}

      {showOverlay && (
        <div className="relative w-full min-h-screen bg-black text-white overflow-hidden">
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs sm:text-sm text-neutral-200">
            <div className="flex-1 min-w-0">
              {noteExists && (
                <div className="truncate">
                  <span className="font-semibold mr-1">Note</span>
                  {note?.name || note?.body}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-center">
              {urlExists && (
                <div className="truncate flex items-center justify-center gap-1">
                  <span role="img" aria-label="web">
                    🌐
                  </span>
                  <span>{urlInfo.domain}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-right">
              {contactExists && (
                <div className="truncate">
                  <span className="font-semibold mr-1">Contact</span>
                  {screen.contact}
                </div>
              )}
            </div>
          </div>

          <div className="absolute inset-x-0 top-14 bottom-24 flex items-center justify-center">
            {heroType === 'note' && noteExists && (
              <div
                key={heroKey}
                className="max-w-xl w-[80%] bg-neutral-900/95 border border-neutral-700 rounded-3xl px-5 py-4 text-left"
              >
                <div className="text-sm font-semibold text-neutral-200 mb-1">
                  Note
                </div>
                <div className="text-lg leading-snug">
                  {note?.body || note?.name}
                </div>
              </div>
            )}

            {heroType === 'screen' && screenshotExists && (
              <div
                key={heroKey}
                className="max-w-xs sm:max-w-sm w-[70%] rounded-3xl overflow-hidden border border-neutral-700 shadow-lg"
              >
                <img
                  src={screenshotUrl}
                  alt="Screenshot"
                  className="w-full h-auto block"
                />
              </div>
            )}

            {heroType === 'screen' && !screenshotExists && urlExists && (
              <div
                key={heroKey}
                className="max-w-md w-[70%] rounded-3xl bg-neutral-900/95 border border-neutral-700 px-5 py-4 text-center"
              >
                <div className="text-sm mb-1">Visited</div>
                <div className="text-lg flex items-center justify-center gap-2">
                  <span role="img" aria-label="web">
                    🌐
                  </span>
                  <span>{urlInfo.domain}</span>
                </div>
                {urlInfo.search && (
                  <div className="mt-2 text-sm text-neutral-300">
                    “{urlInfo.search}”
                  </div>
                )}
              </div>
            )}

            {heroType === null && (
              <div className="text-sm text-neutral-500">
                No peek data yet.
              </div>
            )}
          </div>

          {screenshotExists && heroType !== 'screen' && (
            <div className="absolute inset-x-0 bottom-20 flex items-center justify-center">
              <div className="max-w-[50%] rounded-2xl overflow-hidden border border-neutral-700 shadow-md">
                <img
                  src={screenshotUrl}
                  alt="Screenshot thumbnail"
                  className="w-full h-auto block"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
