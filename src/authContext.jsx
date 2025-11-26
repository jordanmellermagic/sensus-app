import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(localStorage.getItem('sensus_user_id') || '')
  const isAuthenticated = !!userId

  const login = (id) => {
    setUserId(id)
    localStorage.setItem('sensus_user_id', id)
  }

  const logout = () => {
    setUserId('')
    localStorage.removeItem('sensus_user_id')
  }

  return (
    <AuthContext.Provider value={{ userId, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
