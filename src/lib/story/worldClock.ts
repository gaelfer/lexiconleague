import {getStoryProgress,saveStoryProgress,type StoryProgress} from './progress';
export const DAY_LENGTH=25*60*1000;
export const DUSK_START=11*60*1000;
export const NIGHT_START=15*60*1000;
export type WorldClock={day:number;elapsed:number};
export function normalizeClock(clock?:WorldClock):WorldClock{const elapsed=Number.isFinite(clock?.elapsed)?Math.max(0,clock!.elapsed):0;return{day:Math.max(1,Math.floor(clock?.day||1))+Math.floor(elapsed/DAY_LENGTH),elapsed:elapsed%DAY_LENGTH};}
export function advanceClock(clock:WorldClock,delta:number){return normalizeClock({...clock,elapsed:clock.elapsed+Math.max(0,delta)});}
export function clockPhase(clock:WorldClock){const t=normalizeClock(clock).elapsed;return t<5*60000?'Morning':t<DUSK_START?'Afternoon':t<NIGHT_START?'Dusk':'Night';}
export function sleepUntilMorning(){const p=getStoryProgress();if(p.worldClock)saveStoryProgress({worldClock:{day:normalizeClock(p.worldClock).day+1,elapsed:0}});}
export function unlockClock(){const p=getStoryProgress();if(!p.worldClock)saveStoryProgress({worldClock:{day:1,elapsed:DUSK_START},trackedMainQuest:'evening-bell'});}
export function northernProgress(change:NonNullable<StoryProgress['northernStory']>){const p=getStoryProgress();return saveStoryProgress({northernStory:{...p.northernStory,...change}});}
/** Older saves with an accepted invitation remain valid. Missing a morning never strands the quest. */
export function escortMorningReady(){const p=getStoryProgress();return !p.northernStory?.escortDay||normalizeClock(p.worldClock).day>=p.northernStory.escortDay;}
