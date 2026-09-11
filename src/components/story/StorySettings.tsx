'use client';
import {useState} from 'react';
import {getStorySettings,saveStorySettings,type StorySettings as Settings} from '@/lib/story/adventure';
import s from './AdventureUI.module.css';
export default function StorySettings(){
 const [settings,setSettings]=useState(getStorySettings),[error,setError]=useState(false);
 function update(patch:Partial<Settings>){const next={...settings,...patch};setSettings(next);setError(!saveStorySettings(next));}
 return <div><label className={s.setting}>Sound<input type="checkbox" checked={settings.sound} onChange={e=>update({sound:e.target.checked})}/></label><label className={s.setting}>Volume<input aria-label="Volume" type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={e=>update({volume:Number(e.target.value)})}/></label><label className={s.setting}>Reduce menu motion<input type="checkbox" checked={settings.reducedMotion} onChange={e=>update({reducedMotion:e.target.checked})}/></label>{error&&<p role="alert">Settings could not be saved in this browser.</p>}</div>;
}
