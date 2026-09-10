import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { INTERIOR_ASSETS, INTERIOR_PLANS, ROOM_GRID, propAsset } from '../src/game/story/interiorPlans';

describe('medieval tile interiors',()=>{
  it('ships every loaded sprite as its own native 16×16 PNG',()=>{
    for(const asset of INTERIOR_ASSETS){
      const png=readFileSync(new URL(`../public/story/interiors/${asset}.png`,import.meta.url));
      expect(png.subarray(1,4).toString(),asset).toBe('PNG');
      expect(png.readUInt32BE(16),asset).toBe(16);
      expect(png.readUInt32BE(20),asset).toBe(16);
    }
  });
  it('gives every home a bed and Mira and Luma separate beds',()=>{
    for(const id of ['home','baker','gardener','guard','guest','mapmaker'] as const)
      expect(INTERIOR_PLANS[id].props.some(p=>p.asset==='bed-head'),id).toBe(true);
    expect(INTERIOR_PLANS.mapmaker.props.filter(p=>p.asset==='bed-head')).toHaveLength(2);
  });
  for(const [id,plan] of Object.entries(INTERIOR_PLANS))it(`${id}: unique, reachable furniture and a clear entrance`,()=>{
    const blocked=new Set<string>();
    for(const p of plan.props){
      expect(Number.isInteger(p.col)&&Number.isInteger(p.row)).toBe(true);
      expect(p.col).toBeGreaterThanOrEqual(0);expect(p.col).toBeLessThan(11);
      expect(p.row).toBeGreaterThanOrEqual(0);expect(p.row).toBeLessThan(8);
      expect(INTERIOR_ASSETS).toContain(propAsset(p,plan.palette));
      const key=`${p.col},${p.row}`;
      expect(blocked.has(key),`${id}: overlapping ${key}`).toBe(false);blocked.add(key);
    }
    if(['baker','gardener','guest','mapmaker'].includes(id)){
      expect(blocked.has('8,4'),`${id}: resident in furniture`).toBe(false);blocked.add('8,4');
    }
    expect(blocked.has('5,6')).toBe(false);expect(blocked.has('5,7')).toBe(false);
    const visited=new Set(['5,7']),queue=[[5,7]];
    for(let i=0;i<queue.length;i++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const x=queue[i][0]+dx,y=queue[i][1]+dy,key=`${x},${y}`;
      if(x<0||x>=ROOM_GRID.cols||y<0||y>=ROOM_GRID.rows||blocked.has(key)||visited.has(key))continue;
      visited.add(key);queue.push([x,y]);
    }
    for(const p of plan.props)expect([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>visited.has(`${p.col+dx},${p.row+dy}`)),`${id}: unreachable ${p.label}`).toBe(true);
  });
});
