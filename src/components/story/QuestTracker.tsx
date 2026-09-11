import {AREA_NAMES,trackedQuests,type AdventureArea} from '@/lib/story/adventure';
import {gateWaypoint,questWaypoints} from '@/lib/story/waypoints';
import type {StoryProgress} from '@/lib/story/progress';
import s from './AdventureUI.module.css';
export default function QuestTracker({progress,area,position,onToggle}:{progress:StoryProgress;area:AdventureArea;position?:{x:number;y:number;outside:boolean};onToggle:()=>void}){
 const quests=trackedQuests(progress),points=questWaypoints(progress),visible=progress.questOverlayVisible!==false;
 return <aside className={s.questTracker} aria-label="Tracked quests"><button className={s.trackerToggle} onClick={onToggle} aria-expanded={visible}>Tab · {visible?'Hide quests':'Show quests'}</button>{visible&&<div className={s.trackerBody}>{!quests.length&&<p>No quests tracked. Open the adventure log with M to choose one.</p>}{quests.map(q=>{
  const waypoint=points.find(p=>p.questId===q.id),destination=waypoint?.area===area?waypoint:gateWaypoint[area];
  const angle=position&&destination?Math.atan2(destination.y-position.y,destination.x-position.x)*180/Math.PI+90:0;
  const label=waypoint?(waypoint.area===area?waypoint.label:`Wayfarer Gate → ${AREA_NAMES[waypoint.area]}`):q.location;
  return <article key={q.id} className={s.trackedCard} data-kind={q.kind}><small>{q.kind==='main'?'Main quest':'Side quest'}</small><h3>{q.title}</h3><p>{q.steps.find(step=>!step.done)?.text}</p><div><span aria-hidden="true" style={{display:'inline-block',transform:position?.outside?`rotate(${angle}deg)`:undefined}}>{position?.outside?'↑':'◆'}</span> {position?.outside?label:`Outside · ${label}`}</div></article>;
 })}</div>}</aside>;
}
