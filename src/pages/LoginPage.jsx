import React,{useState} from 'react'
import {useNavigate} from 'react-router-dom'
import api from '../api'
import {useAuth} from '../authContext.jsx'

export default function LoginPage(){
  const [userId,setUser]=useState('')
  const [password,setPw]=useState('')
  const {login}=useAuth()
  const nav=useNavigate()
  const submit=async(e)=>{e.preventDefault()
    try{await api.post('/auth/login',{user_id:userId,password});login(userId);nav('/')}
    catch{alert('Invalid')}
  }
  return <form onSubmit={submit} className="text-white">Login<input value={userId} onChange={e=>setUser(e.target.value)}/><input type="password" value={password} onChange={e=>setPw(e.target.value)}/><button>Go</button></form>
}
