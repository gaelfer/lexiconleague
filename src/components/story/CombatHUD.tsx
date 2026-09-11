'use client';
import {useEffect,useState} from 'react';
import {EventBus} from '@/game/EventBus';
import {getStoryInventory,getStoryProgress} from '@/lib/story/progress';
import {toolSlots,TOOL_KEYS} from '@/lib/story/equipment';
import {combatLoadout,ARTS,INKBURSTS} from '@/lib/story/combatLoadout';
import s from './AdventureUI.module.css';
import CombatGlyph from './CombatGlyph';
import type {ArtId,HeartRingId} from '@/lib/story/combatLoadout';
type Hud={arts:{id:string;name:string;remaining:number}[];ink:number;ring:string;burst:string};
export default function CombatHUD(){
 const p=getStoryProgress(),loadout=combatLoadout(p);
 const [hud,setHud]=useState<Hud>({arts:loadout.arts.map(id=>({id,name:ARTS.find(a=>a.id===id)!.name,remaining:0})),ink:p.inkMeter??0,ring:loadout.ring,burst:INKBURSTS.find(b=>b.id===loadout.inkburst)!.name});
 const [slots,setSlots]=useState(()=>toolSlots(getStoryInventory()));
 useEffect(()=>{const save=()=>setSlots(toolSlots(getStoryInventory()));EventBus.on('combat-hud',setHud);window.addEventListener('story-save',save);return()=>{EventBus.off('combat-hud',setHud);window.removeEventListener('story-save',save);};},[]);
 const input=(key:string,down:boolean)=>EventBus.emit('combat-input',{key,down});
 if(p.combatArtsUnlocked!==true)return null;
 return <div className={s.combatHud} aria-label="Combat controls"><div className={s.combatButtons}>{TOOL_KEYS.filter(k=>slots[k]).map(key=><button key={key} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);input(key,true);}} onPointerUp={()=>input(key,false)} onPointerCancel={()=>input(key,false)} onKeyDown={e=>{if(!e.repeat&&(e.key==='Enter'||e.key===' ')){e.preventDefault();input(key,true);}}} onKeyUp={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input(key,false);}}} aria-label={`Use ${slots[key]}`}><kbd>{key}</kbd> {slots[key]}</button>)}{hud.arts.map((art,i)=><button key={i} disabled={art.remaining>0} onClick={()=>{input(i===0?'Z':'X',true);input(i===0?'Z':'X',false);}}><CombatGlyph id={art.id as ArtId} size={30}/><kbd>{i===0?'Z':'X'}</kbd> {art.name} · {art.remaining?`${art.remaining}s`:'Ready'}</button>)}</div><div className={s.inkBar}><button disabled={hud.ink<100||hud.burst==='Unavailable'} onClick={()=>{input('C',true);input('C',false);}}><CombatGlyph id={INKBURSTS.find(b=>b.name===hud.burst)?.id??'redline'} size={30}/><kbd>C</kbd> {hud.burst}</button><progress aria-label="Ink meter" max={100} value={hud.ink}/><span>{Math.floor(hud.ink)} / 100 Ink</span><span title={`Ring of ${hud.ring}`} style={{display:'flex',alignItems:'center'}}><CombatGlyph id={hud.ring as HeartRingId} size={30}/>{hud.ring}</span></div></div>;
}
