
import {useEffect,useState,useRef} from 'react';
import {API_BASE} from '../api/client.js';

async function g(p){const r=await fetch(API_BASE+p); if(!r.ok) throw new Error('err'); return r.json();}

export function useUserData(id,ms){
  const [data,setData]=useState(null);
  const [error,setError]=useState(false);
  const [isOffline,setIsOffline]=useState(false);
  const interval=useRef(null);

  useEffect(()=>{
    let off=false;
    async function load(){
      if(!id) return setData(null);
      try{
        const [a,b,c]=await Promise.all([
          g('/data_peek/'+id),
          g('/note_peek/'+id),
          g('/screen_peek/'+id)
        ]);
        if(!off){ setData({...a,...b,...c}); setError(false); setIsOffline(false);}
      }catch(e){ if(!off){setError(true); setIsOffline(!navigator.onLine);} }
    }
    load();
    if(interval.current) clearInterval(interval.current);
    if(id) interval.current=setInterval(load,ms);
    return ()=>{ off=true; if(interval.current) clearInterval(interval.current); };
  },[id,ms]);

  return {data,setData,error,isOffline};
}
