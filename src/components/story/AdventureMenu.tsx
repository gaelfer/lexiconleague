'use client';

import {useEffect,useRef,useState} from 'react';
import type Phaser from 'phaser';
import {useRouter} from 'next/navigation';
import {getStoryProgress,getStoryInventory,saveStoryProgress} from '@/lib/story/progress';
import {AREA_NAMES,areaForChapter,getStorySettings} from '@/lib/story/adventure';
import {inventoryEntries,useHerbalReserve as consumeHerbalBundle} from '@/lib/story/inventory';
import {TOOL_KEYS,toolSlots} from '@/lib/story/equipment';
import {maxCombatHearts} from '@/lib/story/combatLoadout';
import {EventBus} from '@/game/EventBus';
import InventoryScreen from './InventoryScreen';
import SkillsScreen from './SkillsScreen';
import {questWaypoints} from '@/lib/story/waypoints';
import {ROAD_HOME} from '@/game/story/mapGeography';
import QuestJournal from './QuestJournal';
import QuestTracker from './QuestTracker';
import ItemGlyph from './ItemGlyph';
import RegionMap from './RegionMap';
import StorySettings from './StorySettings';
import s from './AdventureUI.module.css';

type ObservedScene=Phaser.Scene & {floor?:number;player?:{x:number;y:number;hearts:number;isDying?:boolean;healFully:()=>void}};
type Position={x:number;y:number;outside:boolean;map?:{x:number;y:number};north?:{x:number;y:number}};
const PAGES=['Inventory','Map','Combat Loadout','System'] as const;

export default function AdventureMenu({game,chapterId,blocked,hearts}:{game:React.RefObject<Phaser.Game|null>;chapterId:number;blocked:boolean;hearts:number}){
 const [open,setOpen]=useState(false),[tab,setTab]=useState<typeof PAGES[number]|'Quests'>('Map');
 const [progress,setProgress]=useState(getStoryProgress),[bag,setBag]=useState(getStoryInventory),[settings,setSettings]=useState(getStorySettings);
 const [status,setStatus]=useState(''),[itemId,setItemId]=useState(''),[position,setPosition]=useState<Position>();
 const panel=useRef<HTMLDivElement>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),router=useRouter();
 const content=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!open||!content.current)return;
  const inner=content.current,host=inner.parentElement!;
  const fit=()=>{const available=host.clientHeight-24;const scale=window.matchMedia('(max-width: 767px)').matches?1:Math.min(1,Math.max(0,available)/Math.max(1,inner.scrollHeight));inner.style.transform=`scale(${scale})`;};
  const observer=new ResizeObserver(fit);observer.observe(host);observer.observe(inner);fit();
  return()=>observer.disconnect();
 },[open,tab]);
 const area=areaForChapter(chapterId),waypoints=questWaypoints(progress);
 const items=inventoryEntries(progress,bag),slots=toolSlots(bag);
 const maxHearts=maxCombatHearts(progress);
 const reportError=()=>setStatus('Could not save. Please try again.');
 useEffect(()=>{panel.current?.scrollTo({top:0});panel.current?.querySelector(`.${s.consoleBody}`)?.scrollTo({top:0});panel.current?.querySelector('main')?.scrollTo({top:0});},[tab]);

 useEffect(()=>{
  const saved=(event:Event)=>{
   const ok=(event as CustomEvent<{ok:boolean}>).detail.ok;
   if(timer.current)clearTimeout(timer.current);
   setProgress(getStoryProgress());setBag(getStoryInventory());
   setStatus(ok?'Saving…':'Could not save. Check browser storage.');
   if(ok)timer.current=setTimeout(()=>setStatus('Saved on this device'),450);
  };
  const applySettings=()=>{const value=getStorySettings();setSettings(value);const g=game.current;if(g?.sound){g.sound.mute=!value.sound;g.sound.volume=value.volume;}};
  window.addEventListener('story-save',saved);window.addEventListener('story-settings',applySettings);applySettings();
  return()=>{window.removeEventListener('story-save',saved);window.removeEventListener('story-settings',applySettings);if(timer.current)clearTimeout(timer.current);};
 },[game]);

 useEffect(()=>{
  const key=(event:KeyboardEvent)=>{
   const target=event.target as HTMLElement;
   if(event.repeat||(!(event.key==='Escape'&&open)&&target.matches('input,textarea,select,[contenteditable=true]')))return;
   if(event.key==='Tab'&&!open&&!blocked){event.preventDefault();event.stopImmediatePropagation();saveStoryProgress({questOverlayVisible:getStoryProgress().questOverlayVisible===false});return;}
   if((event.code==='KeyM'&&!blocked)||(event.key==='Escape'&&open)){
    event.preventDefault();event.stopImmediatePropagation();setOpen(v=>!v);
   }
  };
  window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);
 },[open,blocked]);

 useEffect(()=>{
  const update=()=>{
   const scene=game.current?.scene.getScenes(true)[0] as ObservedScene|undefined;
   if(scene?.player){
    const outside=['DungeonScene','WordwoodScene'].includes(scene.scene.key);
    const parent=game.current?.scene.getScenes(false).find(s=>s.scene.key===(area==='wordwood'?'WordwoodScene':'DungeonScene')) as ObservedScene|undefined;
    const map=outside?{x:scene.player.x,y:scene.player.y}:scene.scene.key==='WakeScene'?ROAD_HOME:parent?.player?{x:parent.player.x,y:parent.player.y}:undefined;
    setPosition({x:scene.player.x,y:scene.player.y,outside,map,north:scene.scene.key==='NorthernTrailScene'?scene.floor?{x:464,y:336}:{x:scene.player.x,y:scene.player.y}:undefined});
   }
  };
  update();if(open)return;const interval=setInterval(update,400);return()=>clearInterval(interval);
 },[game,open,area]);

 useEffect(()=>{
  if(!open)return;const g=game.current;if(!g)return;
  const inputEnabled=g.input.enabled;
  EventBus.emit('combat-cancel');
  g.scene.getScenes(true).forEach(scene=>scene.input.keyboard?.resetKeys());
  // Sleeping the loop preserves already-paused parent scenes and avoids travel's RESUME hooks.
  g.input.enabled=false;g.loop.sleep();g.sound.pauseAll();setProgress(getStoryProgress());setBag(getStoryInventory());
  const previous=document.activeElement as HTMLElement|null;panel.current?.focus();
  return()=>{
   // The canvas parent can destroy the game first during a route change.
   if(game.current===g){g.scene.getScenes(true).forEach(scene=>scene.input.keyboard?.resetKeys());g.input.enabled=inputEnabled;g.loop.wake();g.sound.resumeAll();}
   if(previous?.isConnected)previous.focus();
  };
 },[open,game]);

 function save(){return saveStoryProgress({resumeArea:area});}
 function heal(){
  const scene=game.current?.scene.getScenes(true)[0] as ObservedScene|undefined;
  if(!scene?.player||scene.player.isDying||scene.player.hearts<=0||scene.player.hearts>=maxHearts)return;
  if(consumeHerbalBundle()){scene.player.healFully();setStatus('Herbal bundle used · health restored');}
 }

 return <>
  <div className={s.menuTrigger}><button className={s.button} disabled={blocked} onClick={()=>setOpen(true)} aria-label="Open adventure menu"><kbd>M</kbd> · Menu</button><p role="status" className={s.status}>{status}</p></div>
  {!open&&!blocked&&<QuestTracker progress={progress} area={area} position={position} onToggle={()=>saveStoryProgress({questOverlayVisible:progress.questOverlayVisible===false})}/>}
  {open&&<div className={s.overlay}>
   <div ref={panel} data-page={tab} className={`${s.gameMenu} ${settings.reducedMotion?'':s.menuMotion}`} role="dialog" aria-modal="true" aria-label="Adventure menu" tabIndex={-1} onKeyDown={event=>{
    if(event.key!=='Tab')return;
    const elements=panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select');if(!elements?.length)return;
    const first=elements[0],last=elements[elements.length-1];
    if(event.shiftKey&&(document.activeElement===first||document.activeElement===panel.current)){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
   }}>
    <header className={s.gameHeader}><div><p className={s.eyebrow}>{AREA_NAMES[area]} · Paused</p><h1 className={s.smallTitle}>Adventure journal</h1></div><button className={s.stoneButton} onClick={()=>setOpen(false)}>Resume <kbd>M / Esc</kbd></button></header>
    <div className={s.consoleBody}>
     <aside className={s.leftRail} aria-label="Player status"><div className={s.railBox}><span className={s.hearts} aria-label={`Health ${hearts} of ${maxHearts}`}>♥</span><small>{hearts} / {maxHearts} HEALTH</small></div><div className={s.railBox}><ItemGlyph icon="coin" size={40}/><strong>{bag.lexicoins}</strong><small>LEXICOINS</small></div><button className={s.stoneButton} aria-label="Quests" aria-pressed={tab==='Quests'} onClick={()=>setTab('Quests')}><ItemGlyph icon="scroll" size={44}/><small>QUESTS</small></button><span className={s.railCaption}>INKWELL<br/>FIELD JOURNAL</span></aside>
     <main className={s.journalPage}>
      <div ref={content} className={s.fittedPage}>
      {tab==='Map'&&<><div className={s.pageHeading}><span>II</span><h2>The surveyor’s chart</h2></div><RegionMap area={area} waypoints={waypoints} position={position?.map} northernPosition={position?.north}/></>}
      {tab==='Inventory'&&<InventoryScreen progress={progress} bag={bag} hearts={hearts} selectedId={itemId} onSelect={setItemId} onHeal={heal} onError={reportError}/>}
      {tab==='Combat Loadout'&&<SkillsScreen progress={progress} onError={reportError}/>}
      {tab==='Quests'&&<QuestJournal progress={progress}/>}
      {tab==='System'&&<><div className={s.pageHeading}><span>V</span><h2>Save & settings</h2></div><div className={s.systemSettings}><StorySettings/></div><div className={s.stack}><button className={s.stoneButton} onClick={save}>Save game</button><button className={s.stoneButton} onClick={()=>{if(save())router.push('/story');}}>Save & title screen</button><p className={s.paperNote}>Progress saves automatically on this device. Continue returns to a safe arrival point in {AREA_NAMES[area]}. Reset game progress is available in the title screen’s Settings.</p></div></>}
      </div>
     </main>
     <aside className={s.rightRail} aria-label="Quick tools">{TOOL_KEYS.map(key=>{const entry=items.find(item=>item.id===slots[key]);return <button className={s.quickSlot} data-stowed={!entry} key={key} aria-label={`Inspect ${key} tool`} onClick={()=>{setTab('Inventory');setItemId(entry?.id??'sword');}}><kbd>{key}</kbd><ItemGlyph icon={entry?.icon??'pack'} size={52}/><small>{entry?.id.toUpperCase()??'EMPTY'}</small></button>;})}<button className={s.quickSlot} aria-label="Inspect combat loadout" onClick={()=>setTab('Combat Loadout')}><ItemGlyph icon="spin" size={44}/><small>LOADOUT</small></button></aside>
    </div>
    <nav className={s.bottomTabs} aria-label="Adventure pages">{PAGES.map(name=><button key={name} className={s.stoneButton} aria-pressed={tab===name} onClick={()=>setTab(name)}>{name}</button>)}</nav>
    <footer className={s.gameFooter}><span role="status">{status||'Progress saves automatically on this device'}</span><span>M / Esc · Back</span></footer>
   </div>
  </div>}
 </>;
}
