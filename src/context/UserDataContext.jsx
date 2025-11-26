
import React,{createContext,useContext,useState,useEffect} from 'react';
import { useUserData } from '../hooks/useUserData.js';

const C=createContext(null);
export function UserDataProvider({children}){
  const [userId,setUserId]=useState('');
  const {data,setData,isLoading,error,isOffline}=useUserData(userId,1000);

  useEffect(()=>{
    const s=localStorage.getItem('sensus_user_id');
    if(s) setUserId(s);
  },[]);

  useEffect(()=>{
    if(!userId) return localStorage.removeItem('sensus_user_id');
    localStorage.setItem('sensus_user_id',userId);
  },[userId]);

  return <C.Provider value={{userId,setUserId,userData:data,setUserData:setData,isLoading,error,isOffline}}>
    {children}
  </C.Provider>;
}
export const useUserDataContext=()=>useContext(C);
