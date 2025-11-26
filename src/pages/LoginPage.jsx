import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api.js'
import { useAuth } from '../authContext.jsx'

export default function LoginPage() {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/login', { user_id: userId, password })
      login(userId)
      navigate('/', { replace: true })
    } catch (err) {
      console.error(err)
      setError('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-semibold tracking-[0.3em] uppercase mb-2">
          SENSUS
        </h1>
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-neutral-900/70 border border-neutral-800 rounded-2xl px-6 py-6 space-y-5"
      >
        <div className="text-xs uppercase tracking-wide text-neutral-400 mb-2">
          Performer Login
        </div>
        <div className="space-y-1">
          <label className="block text-sm text-neutral-300">User ID</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full bg-black/60 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:border-white"
            autoComplete="username"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm text-neutral-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black/60 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:border-white"
            autoComplete="current-password"
            required
          />
        </div>
        {error && (
          <div className="text-xs text-red-400 pt-1">{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-black rounded-full py-2 text-sm font-medium mt-2 disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Log In'}
        </button>
      </form>
    </div>
  )
}
