export type AreaId='approach'|'village'|'wordwood';
export const AREAS={
  approach:{name:'INKWELL ROAD',url:'/story/1?arrival=gatehouse',door:{x:240,y:336},spawn:{x:272,y:336}},
  village:{name:'INKWELL VILLAGE',url:'/story/village?arrival=gatehouse',door:{x:400,y:464},spawn:{x:400,y:432}},
  wordwood:{name:'WORDWOOD',url:'/story/2?arrival=gatehouse',door:{x:560,y:336},spawn:{x:528,y:336}},
} as const;
export function canTravel(area:AreaId,completed:readonly number[]){return area==='approach'||completed.includes(1);}
export const ECHO_ORDER=[0,2,1] as const;
export function advanceEcho(step:number,stone:number){return stone===ECHO_ORDER[step]?step+1:stone===ECHO_ORDER[0]?1:0;}
