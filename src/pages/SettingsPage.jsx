import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api.js'
import { useAuth } from '../authContext.jsx'

export default function SettingsPage() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('')
    setLoading(true)
    try {
      await api.post(`/user/${encodeURIComponent(userId)}/change_password`, {
        old_password: oldPassword,
        new_password: newPassword,
      })
      setStatus('Password changed successfully.')
      setOldPassword('')
      setNewPassword('')
    } catch (err) {
      console.error('Failed to change password', err)
      setStatus('Failed to change password. Check your old password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/')}
          className="text-xs text-neutral-400 hover:text-neutral-200"
        >
          ← Home
        </button>
      </div>

      <h2 className="text-center text-lg font-medium mb-6">Settings</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-neutral-900/70 border border-neutral-800 rounded-2xl px-6 py-6 space-y-4"
      >
        <div className="space-y-1">
          <label className="block text-sm text-neutral-300">
            Old Password
          </label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full bg-black/60 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:border-white"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm text-neutral-300">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-black/60 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:border-white"
            required
          />
        </div>
        {status && (
          <div className="text-xs text-neutral-300 pt-1">{status}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-black rounded-full py-2 text-sm font-medium mt-2 disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Change Password'}
        </button>
      </form>
    </div>
  )
}
