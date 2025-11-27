import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../authContext.jsx'

function PillButton({ children, onClick, variant = 'default' }) {
  const base =
    'px-8 py-3 rounded-full text-sm font-medium border transition-colors'
  const variants = {
    default:
      base +
      ' bg-neutral-900 border-neutral-700 text-neutral-100 hover:border-neutral-500',
    danger:
      base +
      ' bg-red-600 border-red-500 text-white hover:bg-red-500 hover:border-red-400',
    subtle:
      base +
      ' bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-600',
  }
  return (
    <button type="button" onClick={onClick} className={variants[variant]}>
      {children}
    </button>
  )
}

export default function DashboardPage() {
  const { userId, logout } = useAuth()
  const navigate = useNavigate()

  const handleResetApp = async () => {
    const confirmed = window.confirm(
      'Reset app for this performer? This clears spectator data, notes, screen peek, and commands.',
    )
    if (!confirmed) return

    try {
      const res = await fetch(
        `${encodeURIComponent('https://sensus-api-wd2o.onrender.com')}/clear_all/${encodeURIComponent(
          userId,
        )}`,
        { method: 'POST' },
      )
      if (!res.ok) throw new Error('Failed to reset')
      alert('App reset for this performer.')
    } catch (err) {
      console.error(err)
      alert('Failed to reset app.')
    }
  }

  return (
    <div className="w-full min-h-screen bg-black text-white flex items-center justify-center px-6 pt-safe pb-safe">
      <div className="flex flex-col items-center text-center gap-6">
        <div>
          <div className="tracking-[0.4em] text-3xl font-semibold mb-2">
            SENSUS
          </div>
          <div className="text-xs text-neutral-400">
            Logged in as <span className="text-neutral-200">{userId}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center gap-5">
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            Peeks
          </div>
          <div className="flex flex-row gap-4">
            <PillButton onClick={() => navigate('/peek')}>Peek Screen</PillButton>
            <PillButton onClick={() => navigate('/spectator')}>
              Spectator Data
            </PillButton>
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="text-xs uppercase tracking-wide text-neutral-500">
              App Controls
            </div>
            <div className="flex flex-row gap-4">
              <PillButton onClick={() => navigate('/settings')}>
                Settings
              </PillButton>
              <PillButton variant="danger" onClick={handleResetApp}>
                Reset App
              </PillButton>
            </div>
          </div>

          <div className="mt-6">
            <PillButton variant="subtle" onClick={logout}>
              Log Out
            </PillButton>
          </div>
        </div>
      </div>
    </div>
  )
}
