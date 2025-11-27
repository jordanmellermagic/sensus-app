import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../authContext.jsx'

export default function LoginPage() {
  const { login, loading, error } = useAuth()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(userId.trim(), password)
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch {
      // error handled in context
    }
  }

  return (
    <div className="w-full min-h-screen bg-black text-white flex items-center justify-center px-6 pt-safe pb-safe">
      <div className="max-w-md w-full flex flex-col items-center">
        <div className="mb-10 text-center">
          <div className="tracking-[0.4em] text-3xl font-semibold">SENSUS</div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full bg-neutral-900/90 rounded-2xl px-6 py-6 shadow-lg border border-neutral-800"
        >
          <h2 className="text-sm font-semibold mb-4 text-neutral-200">
            Performer Login
          </h2>

          <label className="block text-xs uppercase tracking-wide text-neutral-500 mb-1">
            User ID
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full mb-4 rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
            autoComplete="username"
          />

          <label className="block text-xs uppercase tracking-wide text-neutral-500 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-4 rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
            autoComplete="current-password"
          />

          {error && (
            <div className="text-xs text-red-400 mb-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-full bg-neutral-100 text-black py-2 text-sm font-medium disabled:opacity-60"
          >
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  )
}
