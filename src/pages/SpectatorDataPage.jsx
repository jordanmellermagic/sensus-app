import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api.js'
import { useAuth } from '../authContext.jsx'
import { computeExtras } from '../birthdayUtils.js'

export default function SpectatorDataPage() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  const fetchData = async () => {
    try {
      const res = await api.get(`/data_peek/${encodeURIComponent(userId)}`)
      setData(res.data)
      setLoading(false)
    } catch (err) {
      console.error(err)
      setData(null)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 1000)
    return () => clearInterval(id)
  }, [userId])

  const handleClear = async () => {
    const confirmed = window.confirm('Clear spectator data?')
    if (!confirmed) return
    try {
      await api.post(`/data_peek/${encodeURIComponent(userId)}/clear`)
      await fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const fullName =
    data && (data.first_name || data.last_name)
      ? `${data.first_name || ''} ${data.last_name || ''}`.trim()
      : null

  const extras = data?.birthday ? computeExtras(data.birthday) : null

  return (
    <div className="w-full min-h-screen bg-black text-white px-6 pt-safe pb-safe flex items-start justify-center">
      <div className="w-full max-w-md mt-16">
        <div className="flex items-center justify-between mb-10">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-neutral-400 hover:text-neutral-200"
          >
            ← Home
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Clear
          </button>
        </div>

        <h1 className="text-center text-xl font-medium mb-10">
          Spectator Data
        </h1>

        {loading && <div className="text-sm text-neutral-400">Loading…</div>}

        {!loading && (
          <div className="space-y-8">
            <section>
              <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                Full Name
              </div>
              <div className="text-lg">
                {fullName || <span className="text-neutral-500">—</span>}
              </div>
            </section>

            <section>
              <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                Phone Number
              </div>
              <div className="text-lg">
                {data?.phone_number || (
                  <span className="text-neutral-500">—</span>
                )}
              </div>
            </section>

            <section>
              <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                Birthday
              </div>
              <div className="text-lg mb-2">
                {data?.birthday || <span className="text-neutral-500">—</span>}
              </div>

              {extras && (extras.starSign || extras.daysAlive || extras.weekday) && (
                <button
                  type="button"
                  onClick={() => setShowDetails((v) => !v)}
                  className="text-xs text-neutral-400 hover:text-neutral-200 mb-1"
                >
                  {showDetails ? 'Hide details' : 'Show details'}
                </button>
              )}

              {showDetails && extras && (
                <div className="mt-1 space-y-1 text-sm text-neutral-200">
                  {extras.starSign && (
                    <div>Star sign: {extras.starSign}</div>
                  )}
                  {extras.hasYear && extras.daysAlive != null && (
                    <div>Days alive: {extras.daysAlive.toLocaleString()}</div>
                  )}
                  {extras.hasYear && extras.weekday && (
                    <div>Day of week born: {extras.weekday}</div>
                  )}
                </div>
              )}
            </section>

            <section>
              <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                Address
              </div>
              <div className="text-lg leading-snug whitespace-pre-line">
                {data?.address ? (
                  data.address
                ) : (
                  <span className="text-neutral-500">No address on file.</span>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
