import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../authContext.jsx'
import api from '../api.js'

function PillButton({ children, onClick, variant = 'default' }) {
  const base =
    'px-6 py-3 rounded-full text-sm font-medium transition border'
  const variants = {
    default:
      base +
      ' bg-neutral-900 border-neutral-700 text-neutral-50 hover:bg-neutral-800',
    primary:
      base +
      ' bg-white border-white text-black hover:bg-neutral-200',
    danger:
      base +
      ' bg-red-700 border-red-500 text-white hover:bg-red-600',
  }
  return (
    <button onClick={onClick} className={variants[variant]}>
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
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold tracking-[0.3em] uppercase mb-1">
          SENSUS
        </h1>
        <div className="text-xs text-neutral-500">
          Logged in as <span className="text-neutral-200">{userId}</span>
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <button
          onClick={logout}
          className="px-4 py-1.5 rounded-full border border-neutral-700 text-xs text-neutral-300 hover:bg-neutral-800"
        >
          Log Out
        </button>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <PillButton onClick={() => navigate('/peek')}>Peek Screen</PillButton>
        <PillButton onClick={() => navigate('/spectator-data')}>
          Spectator Data
        </PillButton>
      </div>

      <div className="flex flex-col items-center gap-4">
        <PillButton onClick={() => navigate('/settings')}>Settings</PillButton>
        <PillButton variant="danger" onClick={handleResetApp}>
          Reset App
        </PillButton>
      </div>
    </div>
  )
}
