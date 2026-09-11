import {getStoryProgress,saveStoryProgress,type StoryProgress} from './progress';
export type SkillId='spin'|'focused-spin'|'wide-spin';
export const SKILLS=[
 {id:'spin',name:'Spin attack',description:'Hold your sword’s assigned key, wait for the ready cue, then release to sweep every enemy around you.',requirement:'One starting skill point.'},
 {id:'focused-spin',name:'Steady focus',description:'Reach full spin charge faster: 0.5 seconds instead of 0.7.',requirement:'Learn Spin attack and finish Inkwell Road.'},
 {id:'wide-spin',name:'Inkwhirl',description:'A wider, stronger spin: 96 reach and 3 damage.',requirement:'Learn Spin attack and defeat the corrupted Wordwood guardian.'},
] as const;
/** Old saves keep the spin they already had. New games explicitly start with []. */
export function learnedSkills(p:StoryProgress):SkillId[]{return p.learnedSkills===undefined?['spin']:SKILLS.filter(s=>p.learnedSkills?.includes(s.id)).map(s=>s.id);}
export function skillPoints(p:StoryProgress){return Math.max(0,1+new Set(p.completedChapters).size+(p.wordwoodExpedition?.logGuardianFreed?1:0)-learnedSkills(p).length);}
export function canLearnSkill(p:StoryProgress,id:SkillId){const learned=learnedSkills(p);return !learned.includes(id)&&skillPoints(p)>0&&(id==='spin'||learned.includes('spin')&&(id==='focused-spin'?p.completedChapters.includes(1):!!p.wordwoodExpedition?.logGuardianFreed));}
export function learnSkill(id:SkillId){const p=getStoryProgress();return canLearnSkill(p,id)&&saveStoryProgress({learnedSkills:[...learnedSkills(p),id]});}
export function spinProfile(p:StoryProgress){const learned=learnedSkills(p);return {learned:learned.includes('spin'),chargeMs:learned.includes('focused-spin')?500:700,radius:learned.includes('wide-spin')?96:80,damage:learned.includes('wide-spin')?3:2,durationMs:420};}
