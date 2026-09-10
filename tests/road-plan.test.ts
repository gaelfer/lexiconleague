import { describe,it,expect } from 'vitest';
import { ROAD_PATHS } from '../src/game/story/roadPlan';
describe('Inkwell Road redesign',()=>{
  it('connects the crossing, all three seals and arrival along whole-tile paths',()=>{
    const cells=new Set<string>();
    for(const [x,y,w,h] of ROAD_PATHS){
      for(const n of [x,y,w,h])expect(n%32).toBe(0);
      for(let py=y;py<y+h;py+=32)for(let px=x;px<x+w;px+=32)cells.add(`${px/32},${py/32}`);
    }
    const visited=new Set(['3,9']),queue=[[3,9]];
    for(let i=0;i<queue.length;i++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const x=queue[i][0]+dx,y=queue[i][1]+dy,key=`${x},${y}`;
      if(cells.has(key)&&!visited.has(key)){visited.add(key);queue.push([x,y]);}
    }
    for(const [x,y] of [[800,304],[1600,304],[2400,304],[1968,464],[3056,336]])expect(visited.has(`${Math.floor(x/32)},${Math.floor(y/32)}`)).toBe(true);
  });
});
