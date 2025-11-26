import React,{useEffect,useState} from 'react'
import {useAuth} from '../authContext.jsx'
import api from '../api'
import {useNavigate} from 'react-router-dom'

export default function(){
  const {userId}=useAuth()
  const nav=useNavigate()
  const [data,setD]=useState({})
  useEffect(()=>{api.get('/data_peek/'+userId).then(r=>setD(r.data||{}))},[userId])
  return <div className="text-white"><button onClick={()=>nav('/')}>Home</button>
  <pre>{JSON.stringify(data,null,2)}</pre></div>
}
