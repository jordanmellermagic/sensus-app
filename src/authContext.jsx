import React, { createContext, useContext, useEffect, useState } from 'react'
import api from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(() => localStorage.getItem('sensus_user_id') || '')
  const [tokenValid, setTokenValid] = useState(() => !!localStorage.getItem('sensus_user_id'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const login = async (id, password) => {
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/login', { user_id: id, password })
      localStorage.setItem('sensus_user_id', id)
      setUserId(id)
      setTokenValid(true)
    } catch (err) {
      console.error('Login failed', err)
      setError('Invalid credentials')
      setTokenValid(false)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('sensus_user_id')
    setUserId('')
    setTokenValid(false)
  }

  const value = {
    userId,
    isAuthenticated: tokenValid,
    loading,
    error,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx.value
}
