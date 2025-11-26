import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../authContext.jsx'
import api from '../api.js'

function PillButton({ children, onClick, variant = 'default', className = '' }) {
  const base =
    'px-6 py-3 rounded-full text-sm font-medium transition border text-center'
  const variants = {
    default:
      base +
      ' bg-neutral-900 border-neutral-700 text-neutral-50 hover:bg-neutral-800',
    danger:
      base +
      ' bg-red-700 border-red-500 text-white hover:bg-red-600',
  }
  return (
    <button onClick={onClick} className={variants[variant] + ' ' + className}>
      {children}
    </button>
  )
}

export default function DashboardPage() {
  const { userId, logout } = useAuth()
  const navigate = useNavigate()

  const handleResetApp = async () => {
    const ok = window.confirm(
      'Reset App will clear all spectator data, notes, screen data, and commands. Continue?',
    )
    if (!ok) return
    try {
      await api.post(`/clear_all/${encodeURIComponent(userId)}`)
      window.alert('App reset. Data cleared.')
    } catch (err) {
      console.error(err)
      window.alert('Failed to reset app. Please try again.')
    }
  }

  return (
    <div className="w-full max-w-md mx-auto min-h-[calc(100vh-2rem)] flex flex-col justify-start pt-10">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-semibold tracking-[0.3em] uppercase mb-1">
          SENSUS
        </h1>
        <div className="text-xs text-neutral-500">
          Logged in as <span className="text-neutral-200">{userId}</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-center text-xs uppercase tracking-wide text-neutral-500 mb-3">
          Peeks
        </div>
        <div className="flex justify-center gap-4 mb-10">
          <PillButton
            onClick={() => navigate('/peek')}
            className="min-w-[140px]"
          >
            Peek Screen
          </PillButton>
          <PillButton
            onClick={() => navigate('/spectator-data')}
            className="min-w-[140px]"
          >
            Spectator Data
          </PillButton>
        </div>

        <div className="text-center text-xs uppercase tracking-wide text-neutral-500 mb-3">
          App Controls
        </div>
        <div className="flex justify-center gap-4 mb-8">
          <PillButton
            onClick={() => navigate('/settings')}
            className="min-w-[140px]"
          >
            Settings
          </PillButton>
          <PillButton
            variant="danger"
            onClick={handleResetApp}
            className="min-w-[140px]"
          >
            Reset App
          </PillButton>
        </div>

        <div className="flex justify-center mt-2">
          <button
            onClick={logout}
            className="px-4 py-1.5 rounded-full border border-neutral-700 text-xs text-neutral-300 hover:bg-neutral-800"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  )
}
