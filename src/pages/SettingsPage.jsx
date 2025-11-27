import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api.js'
import { useAuth } from '../authContext.jsx'

export default function SettingsPage() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await api.post(`/user/${encodeURIComponent(userId)}/change_password`, {
        old_password: oldPassword,
        new_password: newPassword,
      })
      setMessage('Password updated.')
      setOldPassword('')
      setNewPassword('')
    } catch (err) {
      console.error(err)
      setMessage('Failed to update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full min-h-screen bg-black text-white px-6 pt-safe pb-safe flex items-center justify-center">
      <div className="max-w-md w-full">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-xs text-neutral-400 hover:text-neutral-200 mb-6"
        >
          ← Home
        </button>

        <div className="bg-neutral-900/90 rounded-2xl px-6 py-6 border border-neutral-800 shadow-lg">
          <h2 className="text-center text-lg font-medium mb-6">Settings</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wide text-neutral-500 mb-1">
                Old Password
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-neutral-500 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg bg-black border border-neutral-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
            </div>

            {message && (
              <div className="text-xs text-neutral-300 pt-1">{message}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-full bg-neutral-100 text-black py-2 text-sm font-medium disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
