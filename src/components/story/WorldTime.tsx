'use client';
import {useEffect,useState} from 'react';
import {EventBus} from '@/game/EventBus';
import {getStoryProgress} from '@/lib/story/progress';
import {clockPhase,normalizeClock,type WorldClock} from '@/lib/story/worldClock';
export default function WorldTime(){
 const [time,setTime]=useState(()=>{const p=getStoryProgress();return{...normalizeClock(p.worldClock),unlocked:!!p.worldClock};});
 useEffect(()=>{const tick=(t:WorldClock&{unlocked:boolean})=>setTime(previous=>previous.day===t.day&&Math.floor(previous.elapsed/1000)===Math.floor(t.elapsed/1000)&&previous.unlocked===t.unlocked?previous:t);EventBus.on('world-clock',tick);return()=>{EventBus.off('world-clock',tick);};},[]);
 const phase=clockPhase(time),night=phase==='Night',dusk=phase==='Dusk';
 const minutes=time.elapsed/60000,hour=minutes<5?6+minutes:minutes<11?11+(minutes-5):minutes<15?17+(minutes-11)*.75:20+(minutes-15);
 const hours=Math.floor(hour)%24,mins=Math.floor((hour%1)*60),label=`${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}`;
 return <><div aria-hidden="true" style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:3,background:night?'#142549':dusk?'#a35e36':'transparent',opacity:night?.3:dusk?.13:0,transition:'background 8s, opacity 8s'}}/><div aria-label={`World time: day ${time.day}, ${label}, ${phase}`} style={{position:'absolute',top:62,left:16,zIndex:500,color:'#e8d9b1',background:'#152c2bed',padding:'6px 10px',fontSize:12,pointerEvents:'none',display:'flex',alignItems:'center',gap:8,border:'1px solid #788474'}}><svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="13" r="11" fill="#dbc998" stroke="#8b805e"/><path d="M13 3v2m10 8h-2M13 23v-2M3 13h2" stroke="#4c6152"/><path d="M13 13V7" stroke="#29483f" strokeWidth="2" transform={`rotate(${hour*30} 13 13)`}/><path d="M13 13V4" stroke="#29483f" transform={`rotate(${mins*6} 13 13)`}/><circle cx="13" cy="13" r="1.5" fill="#29483f"/></svg><span><strong>{label}</strong> · {phase}<br/><small>Day {time.day}</small></span></div></>;
}
