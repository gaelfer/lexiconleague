import {describe,it,expect} from 'vitest';
import {WORDWOOD_APPROACH,WORDWOOD_WAYFARER,APPROACH_BLOTLINGS,nearApproach,APPROACH_BRIDGE,approachRiverDistance} from '../src/game/story/wordwoodApproach';
import {regionPoint} from '../src/lib/story/mapProjection';
import {gateWaypoint} from '../src/lib/story/waypoints';
import {approachEnemySpawns} from '../src/game/story/wordwoodApproach';
describe('Wayfarer to Wordwood approach',()=>{
 it('stops spawning path enemies after the saved boss defeat',()=>{
  expect(approachEnemySpawns(undefined)).toHaveLength(3);
  expect(approachEnemySpawns(false)).toHaveLength(3);
  expect(approachEnemySpawns(true)).toEqual([]);
 });
 it('spans the complete diagonal river and reaches dry banks at both ends',()=>{
  expect(approachRiverDistance(688,1808)).toBe(0);
  for(let x=APPROACH_BRIDGE.x;x<=APPROACH_BRIDGE.x+APPROACH_BRIDGE.width;x+=16){
   expect(approachRiverDistance(x,APPROACH_BRIDGE.y)).toBeGreaterThan(64);
   expect(approachRiverDistance(x,APPROACH_BRIDGE.y+APPROACH_BRIDGE.height)).toBeGreaterThan(64);
  }
 });
 it('connects the gate arrival to the forest on the movement grid',()=>{
  expect(WORDWOOD_APPROACH[0]).toEqual([WORDWOOD_WAYFARER.x,WORDWOOD_WAYFARER.y+32]);
  expect(gateWaypoint.wordwood).toEqual(WORDWOOD_WAYFARER);
  WORDWOOD_APPROACH.forEach(([x,y],i)=>{expect(x%32).toBe(16);expect(y%32).toBe(16);if(i){const a=WORDWOOD_APPROACH[i-1];expect(x===a[0]||y===a[1]).toBe(true);}});
  expect(WORDWOOD_APPROACH.at(-1)).toEqual([816,1104]);
 });
 it('places three scattered blotlings only on the new approach',()=>{
  for(const [x,y] of APPROACH_BLOTLINGS){expect(y).toBeGreaterThan(1200);expect(nearApproach(x,y)).toBe(true);expect(Math.hypot(x-144,y-2224)).toBeGreaterThan(250);}
 });
 it('moves the regional player pin along the illustrated connecting trail',()=>{
  expect(regionPoint('wordwood',144,2224)).toEqual({x:154,y:154});
  expect(regionPoint('wordwood',688,1808).x).toBe(198);
  expect(regionPoint('wordwood',816,1104)).toEqual({x:246,y:69});
 });
});
