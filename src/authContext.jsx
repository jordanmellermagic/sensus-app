import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(
    typeof window !== 'undefined'
      ? window.localStorage.getItem('sensus_user_id') || ''
      : '',
  )

  const isAuthenticated = !!userId

  const login = (id) => {
    setUserId(id)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('sensus_user_id', id)
    }
  }

  const logout = () => {
    setUserId('')
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('sensus_user_id')
    }
  }

  return (
    <AuthContext.Provider value={{ userId, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
