import React from 'react'
import { Outlet } from 'react-router-dom'

export default function App() {
  return (
    <div className="w-full min-h-screen bg-black text-white">
      <Outlet />
    </div>
  )
}
