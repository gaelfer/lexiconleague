import {useState} from 'react';
import type {StoryProgress} from '@/lib/story/progress';
import {SKILLS,learnedSkills,skillPoints,canLearnSkill,learnSkill,type SkillId} from '@/lib/story/skills';
import s from './AdventureUI.module.css';
function SkillIcon({id}:{id:SkillId}){
 return <svg width="48" height="48" viewBox="0 0 32 32" fill="none" aria-hidden="true" shapeRendering="crispEdges"><path d="M9 4H24V8H28V23H24V27H8V23H4V9H9" stroke="currentColor" strokeWidth="2"/>{id==='spin'?<path d="M10 22L21 11M17 9H23V15M8 19L13 24" stroke="currentColor" strokeWidth="3"/>:id==='focused-spin'?<path d="M18 7L10 18H16L14 25L23 14H17Z" fill="currentColor"/>:<path d="M16 7L19 13L25 16L19 19L16 25L13 19L7 16L13 13Z" fill="currentColor"/>}</svg>;
}
export default function SkillsScreen({progress,onError}:{progress:StoryProgress;onError:()=>void}){
 const learned=learnedSkills(progress),points=skillPoints(progress),[selected,setSelected]=useState<SkillId>('spin'),skill=SKILLS.find(s=>s.id===selected)!,owned=learned.includes(selected),available=canLearnSkill(progress,selected);
 return <><div className={s.pageHeading}><span>III</span><h2>Skills</h2><span className={s.pointsBadge}>{points} SP</span></div><p className={s.paperNote}>Sword arts · {learned.length} / 3 learned</p>
 <div className={s.skillPath} aria-label="Sword skill upgrades">{SKILLS.map((node,i)=><button key={node.id} className={s.skillNode} aria-pressed={selected===node.id} onClick={()=>setSelected(node.id)} data-learned={learned.includes(node.id)}><small>{i===0?'FOUNDATION':'UPGRADE'}</small><SkillIcon id={node.id}/><strong>{node.name}</strong><span>{learned.includes(node.id)?'✓ Learned':canLearnSkill(progress,node.id)?'Available · 1 SP':'Locked'}</span></button>)}</div>
 <article className={s.skillFocus}><div><small>SWORD ART / {selected==='spin'?'CHARGED ATTACK':selected==='focused-spin'?'CHARGE SPEED':'POWER & REACH'}</small><h3>{skill.name}</h3><p>{skill.description}</p><div className={s.skillStats}>{selected==='spin'?'Hold → Charge → Release':selected==='focused-spin'?'Charge time   0.7s → 0.5s':'Damage   2 → 3     ·     Reach   80 → 96'}</div><p className={s.paperNote}>{owned?'Permanently learned. Works with your equipped sword.':skill.requirement}</p></div><button className={s.stoneButton} disabled={!available} onClick={()=>{if(!learnSkill(selected))onError();}}>{owned?'Learned':available?'Learn · 1 point':'Locked'}</button></article>
 <p className={s.paperNote}>Earn skill points by completing chapters and freeing Wordwood’s guardian. Both upgrades build on Spin attack.</p></>;
}
