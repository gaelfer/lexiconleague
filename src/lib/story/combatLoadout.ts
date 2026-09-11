import {getStoryInventory,getStoryProgress,saveStoryProgress,type StoryInventory,type StoryProgress} from './progress';
export const ARTS=[
 {id:'inkwhirl',name:'Inkwhirl',cooldown:6000,description:'Sweep nearby enemies with your sword. Brief recovery leaves you exposed.',tool:'sword'},
 {id:'quill-dash',name:'Quill Dash',cooldown:4500,description:'Slip exactly two tiles in your facing direction. Evades attacks; solid walls still stop you.',tool:null},
 {id:'lunge',name:'Lunge',cooldown:5000,description:'A narrow, long thrust that staggers enemies. A miss still costs the recovery.',tool:'sword'},
 {id:'wordbind',name:'Wordbind',cooldown:8000,description:'Seal nearby foes in place for two seconds. Guardians resist the seal.',tool:null},
] as const;
export type ArtId=typeof ARTS[number]['id'];
export const RINGS=[
 {id:'resolve',name:'Ring of Resolve',description:'+1 maximum heart. Ink fills 25% more slowly.'},
 {id:'recall',name:'Ring of Recall',description:'First-time correct Word Seals restore half a heart and extra Ink. No benefit from combat alone.'},
 {id:'clarity',name:'Ring of Clarity',description:'Charged arrows travel farther and pierce one extra foe. Charge takes 1 second instead of 0.7.'},
] as const;
export type HeartRingId=typeof RINGS[number]['id'];
export const INKBURSTS=[
 {id:'redline',name:'Redline',tool:'sword',description:'Rush four tiles in a straight line, striking each enemy once. Solid walls stop the rush.'},
 {id:'marginal-storm',name:'Marginal Storm',tool:'bow',description:'Three waves of spectral arrows sweep a wide lane.'},
 {id:'final-draft',name:'Final Draft',tool:'shield',description:'A four-second ward absorbs three hits, then bursts outward. Unlocks with the Lexica shield.'},
] as const;
export type InkburstId=typeof INKBURSTS[number]['id'];
export type CombatLoadout={arts:[ArtId,ArtId];ring:HeartRingId;inkburst:InkburstId};
export function combatLoadout(p:StoryProgress):CombatLoadout{
 const saved=p.combatLoadout,valid=ARTS.map(a=>a.id),a=valid.includes(saved?.arts?.[0] as ArtId)?saved!.arts[0]:'inkwhirl',b=valid.includes(saved?.arts?.[1] as ArtId)&&saved!.arts[1]!==a?saved!.arts[1]:a==='quill-dash'?'inkwhirl':'quill-dash';
 return {arts:[a,b],ring:RINGS.some(r=>r.id===saved?.ring)?saved!.ring:'recall',inkburst:INKBURSTS.some(i=>i.id===saved?.inkburst)?saved!.inkburst:'redline'};
}
export function saveCombatLoadout(value:CombatLoadout){
 if(value.arts.length!==2||value.arts[0]===value.arts[1]||value.arts.some(id=>!ARTS.some(a=>a.id===id))||!RINGS.some(r=>r.id===value.ring))return false;
 const burst=INKBURSTS.find(b=>b.id===value.inkburst);if(!burst||!getStoryInventory().unlockedWeapons.includes(burst.tool))return false;
 return saveStoryProgress({combatLoadout:value});
}
export const maxCombatHearts=(p:StoryProgress)=>combatLoadout(p).ring==='resolve'?4:3;
export const bowChargeDuration=(p:StoryProgress)=>combatLoadout(p).ring==='clarity'?1000:700;
export const arrowPierces=(p:StoryProgress,charged:boolean)=>charged?(combatLoadout(p).ring==='clarity'?2:1):0;
export function availableBurst(p:StoryProgress,bag:StoryInventory){const id=combatLoadout(p).inkburst;return INKBURSTS.find(b=>b.id===id&&bag.unlockedWeapons.includes(b.tool));}
export function addInk(amount:number){const p=getStoryProgress(),factor=combatLoadout(p).ring==='resolve'?.75:1;return saveStoryProgress({inkMeter:Math.min(100,Math.max(0,(p.inkMeter??0)+amount*factor))});}
