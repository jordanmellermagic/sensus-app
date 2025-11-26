import React from 'react'
import {useNavigate} from 'react-router-dom'
import {useAuth} from '../authContext.jsx'
import api from '../api'

export default function DashboardPage(){
  const {userId,logout}=useAuth()
  const nav=useNavigate()
  const reset=async()=>{await api.post('/clear_all/'+encodeURIComponent(userId))}
  return <div className="text-white"><h1>SENSUS</h1>
    <button onClick={()=>nav('/peek')}>Peek Screen</button>
    <button onClick={()=>nav('/spectator-data')}>Spectator Data</button>
    <button onClick={()=>nav('/settings')}>Settings</button>
    <button onClick={reset}>Reset App</button>
    <button onClick={logout}>Logout</button>
  </div>
}
