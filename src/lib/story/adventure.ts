import {getStoryProgress,saveStoryProgress,type StoryProgress} from './progress';

export const AREA_NAMES={road:'Inkwell Road',village:'Inkwell Village',wordwood:'Wordwood'};
export type AdventureArea=keyof typeof AREA_NAMES;
export const areaForChapter=(id:number):AdventureArea=>id===0?'village':id===2?'wordwood':'road';
export function continueUrl(p:StoryProgress){
  const area=p.resumeArea??(p.opening==='wordwood'||p.completedChapters.includes(2)?'wordwood':p.completedChapters.includes(1)?'village':'road');
  if(area==='wordwood'&&p.completedChapters.includes(1)&&(p.opening==='wordwood'||!p.opening||p.completedChapters.includes(2)))return '/story/2';
  if(area==='village'&&p.completedChapters.includes(1))return '/story/village';
  return '/story/1';
}
export function hasAdventure(p:StoryProgress){return !!(p.startedAt||p.opening||p.completedChapters.length||Object.keys(p.chapterCheckpoints).length);}
export type StorySettings={sound:boolean;volume:number;reducedMotion:boolean};
const SETTINGS_KEY='lexiconleague:story:settings';
export function getStorySettings():StorySettings{
  try{const value=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');return {sound:value.sound!==false,volume:typeof value.volume==='number'?Math.max(0,Math.min(1,value.volume)):.6,reducedMotion:value.reducedMotion===true};}
  catch{return {sound:true,volume:.6,reducedMotion:false};}
}
export function saveStorySettings(settings:StorySettings){
  try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));window.dispatchEvent(new Event('story-settings'));return true;}catch{return false;}
}

export type Quest={id:string;title:string;kind:'main'|'side';location:string;description:string;steps:{id:string;text:string;done:boolean}[];status:'active'|'completed';waypoint?:{area:AdventureArea;x:number;y:number;label:string}};
function checkpoint(p:StoryProgress,id:number){try{return JSON.parse(p.chapterCheckpoints[id]||'{}');}catch{return {};}}
/** Derived quests preserve legacy saves; future authored sidequests use persisted steps below. */
export function getQuests(p:StoryProgress):Quest[]{
  const w=p.wordwoodExpedition??{},wood=checkpoint(p,2),roadDone=p.completedChapters.includes(1),talked=p.opening==='wordwood'||p.completedChapters.includes(2);
  const make=(id:string,title:string,kind:Quest['kind'],location:string,description:string,steps:Quest['steps']):Quest=>({id,title,kind,location,description,steps,status:steps.every(s=>s.done)?'completed':'active'});
  const quests=[make('warning-bell','The warning bell','main','Inkwell Road','Follow the disturbance along the woodland road.',[
    {id:'wake',text:'Leave home and investigate the bell.',done:!!p.opening||roadDone},
    {id:'rescue',text:'Help Luma and reach the travellers.',done:p.opening==='scholar'||talked||roadDone},
    {id:'seals',text:'Restore the road seals and reach Inkwell.',done:roadDone}])];
  if(roadDone)quests.push(make('scholars-request','The scholar’s request','main','Inkwell Village','Speak with Scholar Bellum in the Archive.',[{id:'bellum',text:'Tell Bellum what happened on the road.',done:talked}]));
  if(talked)quests.push(make('wordwood-tablet','The Wordwood Tablet','main','Wordwood','Investigate the old inscriptions beyond the woodland gate.',[
    {id:'signs',text:'Restore the woodland signs.',done:!!wood.solved||!!w.tablet},
    {id:'gate',text:'Uncover and unlock the northern gate.',done:!!w.gardenGateOpened||!!w.tablet},
    {id:'tablet',text:'Recover the Tablet from the Sunken Repository.',done:!!w.tablet},
    {id:'report',text:'Bring your findings to Bellum.',done:!!w.studied}]));
  if(w.tablet||p.quests?.['lost-keepers'])quests.push(make('lost-keepers','The lost caretakers','side','Wordwood','Wren asked you to look for the bridgekeeper and gardener. Neither has come home from Wordwood.',[{id:'investigate',text:'Investigate the disturbance in the Repository.',done:!!w.tablet},{id:'rescue',text:'Find the missing caretakers in Wordwood.',done:!!w.logGuardianFreed}]));
  if(talked&&(!w.logGuardianFreed||wood.found?.length===3))quests.push(make('field-notes','Notes from the woods','side','Wordwood','Collect the survey papers beside the forest paths.',[0,1,2].map(i=>({id:`note-${i}`,text:`Find woodland field note ${i+1}.`,done:!!wood.found?.includes(i)}))));
  if(p.visitedInkwell||roadDone)quests.push(make('a-place-to-rest','A place to rest','side','Inkwell Village','Ask Wren at the Lantern Inn about a room.',[{id:'room',text:'Book a room at the Lantern Inn.',done:!!p.innRoomBooked}]));
  // Finished legacy objectives remain in the record, but undiscovered sidequests stay hidden.
  if(p.worldClock){const n=p.northernStory??{};quests.push(make('evening-bell','When the bell calls','main','Inkwell Village','Bellum suggested tea. A quiet celebration brings news from the road.',[{id:'tea',text:'Share tea at Mossbell Tea Room.',done:!!n.tea},{id:'rumour',text:'Speak with Sir Serif as you leave after tea.',done:!!n.rumour}]));if(n.rumour)quests.push(make('first-dictionary','The First Dictionary','main','Northmeadow watchtower','Follow Copper north of the road’s survey camp. Listen before judging the people you find.',[{id:'escort',text:'Rest until morning, then meet Dame Copper at the eastern crossing.',done:!!n.escort},{id:'camp',text:'Clear all four floors of the watchtower.',done:!!n.campCleared},{id:'dictionary',text:'Find the First Dictionary.',done:!!n.dictionary},{id:'cure',text:'Help the bandits restore their friend.',done:!!n.cured},{id:'return',text:'Walk Copper back to her crossing.',done:!!n.returnedToPost||!!n.reported},{id:'report',text:'Bring the dictionary and evidence to Bellum.',done:!!n.reported}]));}
  return quests.filter(q=>q.kind==='main'||p.quests?.[q.id]||q.status==='completed');
}
export type SidequestDefinition={id:string;title:string;location:string;description:string;steps:{id:string;text:string}[];waypoint?:Quest['waypoint']};
/** Register future quest definitions here; NPCs call acceptSidequest/advanceSidequest. */
export const SIDEQUESTS:SidequestDefinition[]=[{id:'lumas-sketchbook',title:'The green ribbon',location:'Inkwell Road',description:'Luma lost her sketchbook while fleeing the Blotlings. One drawing matters more to her than the rest.',steps:[{id:'found',text:'Look beside the orchard on Inkwell Road.'},{id:'returned',text:'Return the sketchbook to Luma at home in Inkwell.'},{id:'reward',text:'Speak with Mira outside in the village.'}]}];
const BUILTIN_SIDEQUESTS=['lost-keepers','field-notes','a-place-to-rest'];
export function acceptSidequest(id:string){const p=getStoryProgress();if((!BUILTIN_SIDEQUESTS.includes(id)&&!SIDEQUESTS.some(q=>q.id===id))||p.quests?.[id])return false;return saveStoryProgress({quests:{...p.quests,[id]:{status:'active',steps:[]}}});}
export function advanceSidequest(id:string,step:string){const p=getStoryProgress(),q=SIDEQUESTS.find(q=>q.id===id),state=p.quests?.[id];if(!q||!state||!q.steps.some(s=>s.id===step))return false;const steps=[...new Set([...state.steps,step])];return saveStoryProgress({quests:{...p.quests,[id]:{steps,status:q.steps.every(s=>steps.includes(s.id))?'completed':'active'}}});}
export function journalQuests(p:StoryProgress):Quest[]{return [...getQuests(p),...SIDEQUESTS.filter(q=>p.quests?.[q.id]).map(q=>({...q,kind:'side' as const,status:p.quests![q.id].status,steps:q.steps.map(s=>({...s,done:p.quests![q.id].steps.includes(s.id)}))}))];}
export function trackedQuests(p:StoryProgress):Quest[]{
 const active=journalQuests(p).filter(q=>q.status==='active');
 const main=p.trackedMainQuest===null?undefined:active.find(q=>q.kind==='main'&&q.id===(p.trackedMainQuest??p.trackedQuest))??active.find(q=>q.kind==='main');
 const sideIds=p.trackedSideQuests??(p.trackedQuest?[p.trackedQuest]:[]);
 const sides=[...new Set(sideIds)].flatMap(id=>{const q=active.find(q=>q.kind==='side'&&q.id===id);return q?[q]:[];}).slice(0,2);
 return [...(main?[main]:[]),...sides];
}
export function currentQuest(p:StoryProgress){return trackedQuests(p)[0];}
export function toggleQuestTracking(id:string):'saved'|'limit'|'unavailable'|'error'{
 const p=getStoryProgress(),q=journalQuests(p).find(q=>q.id===id&&q.status==='active');if(!q)return 'unavailable';
 const tracked=trackedQuests(p),already=tracked.some(q=>q.id===id);
 if(q.kind==='main')return saveStoryProgress({trackedMainQuest:already?null:id})?'saved':'error';
 const ids=tracked.filter(q=>q.kind==='side').map(q=>q.id);
 if(!already&&ids.length>=2)return 'limit';
 return saveStoryProgress({trackedSideQuests:already?ids.filter(key=>key!==id):[...ids,id]})?'saved':'error';
}
