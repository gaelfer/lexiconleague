import {getStoryProgress} from '../../lib/story/progress';
import {clockPhase,type WorldClock} from '../../lib/story/worldClock';
import {TOWN} from './townPlan';
export const RESIDENT_HOMES:Record<string,string>={Mira:'mapmaker',Bramble:'gardener','Sir Serif':'guard',Pip:'scriptorium',Nell:'nell',Rowan:'guest',Fenn:'baker',Tansy:'gardener',Oren:'guest'};
export const TEA_REGULARS=['Mira','Nell','Pip','Fenn','Tansy','Oren','Sir Serif'];
export function teaGathering(clock?:WorldClock){const story=getStoryProgress().northernStory;return !!clock&&(clockPhase(clock)==='Dusk'||!!story?.tea&&!story.rumour);}
export function residentLocation(name:string,clock?:WorldClock){
 if(!clock)return 'legacy';
 const phase=clockPhase(clock);
 if(TEA_REGULARS.includes(name)&&teaGathering(clock))return 'tea-room';
 if(phase==='Night')return RESIDENT_HOMES[name]??'guest';
 const mornings:Record<string,string>={Mira:'outside',Bramble:'gardener','Sir Serif':'outside',Pip:'scriptorium',Nell:'outside',Rowan:'outside',Fenn:'baker',Tansy:'gardener',Oren:'guest'};
 const afternoons:Record<string,string>={Mira:'mapmaker',Bramble:'outside','Sir Serif':'guard',Pip:'outside',Nell:'nell',Rowan:'scriptorium',Fenn:'outside',Tansy:'outside',Oren:'outside'};
 if(phase==='Morning')return mornings[name]??'outside';
 if(phase==='Afternoon')return afternoons[name]??'outside';
 if(phase==='Dusk')return name==='Bramble'?'outside':name==='Rowan'?'guest':'tea-room';
 return 'outside';
}
export function residentActivity(name:string,clock?:WorldClock){
 if(!clock)return 'at home';const phase=clockPhase(clock);
 if(phase==='Night')return 'sleeping';
 if(residentLocation(name,clock)==='tea-room')return 'sharing tea';
 const work:Record<string,[string,string]>={Mira:['measuring the square','drawing maps'],Bramble:['potting seedlings','checking the gardens'],'Sir Serif':['morning patrol','checking the watch roster'],Pip:['copying stories','practising a spell'],Nell:['buying breakfast','mending clothes'],Rowan:['walking by the pond','reading'],Fenn:['baking','delivering bread'],Tansy:['watering seedlings','gathering herbs'],Oren:['unpacking','visiting the square']};
 return work[name]?.[phase==='Morning'?0:1]??'heading home';
}
export function copperLocation(clock?:WorldClock){
 const p=getStoryProgress();if(!clock||(p.northernStory?.escort&&!p.northernStory.returnedToPost))return 'post';
 return clockPhase(clock)==='Night'?'inn-bed':clock.elapsed<60000?'inn-coffee':'post';
}
export function residentDoor(id:string){const b=TOWN.buildings.find(b=>b.id===id);return{x:b?.x??656,y:(b?.y??176)+96};}
