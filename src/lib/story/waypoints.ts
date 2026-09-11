import {currentQuest,trackedQuests,type AdventureArea,type Quest} from './adventure';
import type {StoryProgress} from './progress';
import {WORDWOOD_WAYFARER} from '../../game/story/wordwoodApproach';
export type QuestWaypoint={area:AdventureArea;x:number;y:number;label:string;questId:string;kind:Quest['kind']};
export function questWaypoint(p:StoryProgress,q=currentQuest(p)):QuestWaypoint|undefined{
 if(!q)return;const w=p.wordwoodExpedition??{};
 if(q.waypoint)return {...q.waypoint,questId:q.id,kind:q.kind};
 const point=(area:AdventureArea,x:number,y:number,label:string):QuestWaypoint=>({area,x,y,label,questId:q.id,kind:q.kind});
 if(q.id==='evening-bell')return point('village',784,272,'Mossbell Tea Room');
 if(q.id==='first-dictionary')return p.northernStory?.cured&&!p.northernStory.returnedToPost&&!p.northernStory.reported?point('road',2928,272,'Return with Copper'):p.northernStory?.cured?point('village',1040,406,'Bellum · the witnessed cure'):p.northernStory?.escort?point('road',1168,16,'Northmeadow · watchtower'):point('road',2928,272,'Dame Copper · road watch');
 if(q.id==='lumas-sketchbook'){const steps=p.quests?.[q.id]?.steps??[];return steps.includes('returned')?point('village',528,720,'Mira'):steps.includes('found')?point('village',496,646,'Luma · home'):point('road',1904,400,'The orchard · sketchbook');}
 if(q.id==='scholars-request'||(q.id==='wordwood-tablet'&&w.tablet))return point('village',1040,406,'Scholar Bellum · Archive');
 if(q.id==='warning-bell')return point('road',p.opening==='woke'||!p.opening?720:2704,304,p.opening==='woke'||!p.opening?'Follow the warning bell':'The travellers’ clearing');
 if(q.id==='wordwood-tablet'){
  let solved=false;try{solved=JSON.parse(p.chapterCheckpoints[2]||'{}').solved===true;}catch{}
  return solved?point('wordwood',816,112,'The northern gate · Repository'):point('wordwood',800,664,'The woodland inscriptions');
 }
 if(q.id==='lost-keepers')return w.tablet?point('wordwood',1232,496,'The hollow log'):point('wordwood',816,112,'Investigate the Repository');
 if(q.id==='field-notes'){
  const step=q.steps.findIndex(step=>!step.done),points=[[208,336],[1360,336],[1104,976]];if(step>=0)return point('wordwood',points[step][0],points[step][1],'Woodland field note');
 }
 if(q.id==='a-place-to-rest')return point('village',848,1286,'Wren · Lantern Inn');
 return undefined;
}
export function questWaypoints(p:StoryProgress){return trackedQuests(p).flatMap(q=>{const point=questWaypoint(p,q);return point?[point]:[];});}
export const gateWaypoint:Record<AdventureArea,{x:number;y:number}>={road:{x:3056,y:336},village:{x:656,y:80},wordwood:WORDWOOD_WAYFARER};
