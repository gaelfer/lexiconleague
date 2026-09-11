import {expect,it} from 'vitest';
import {buildingSigns,canReadSign} from '../src/game/story/buildingSigns';
import {TOWN,townDoor} from '../src/game/story/townPlan';

it('names every village building and leaves the doorway column clear',()=>{
 const signs=buildingSigns(0);
 for(const building of TOWN.buildings){
  const sign=signs.find(sign=>sign.id===building.id)!;
  expect(sign.name.length).toBeGreaterThan(3);
  expect(sign.x%32).toBe(16);expect(sign.y%32).toBe(16);
  expect(Math.abs(sign.x-townDoor(building.id)!.x)).toBe(building.id==='archive'?64:32);
  expect(sign.mountY).toBeLessThan(sign.y);
 }
 expect(signs.find(sign=>sign.id==='mapmaker')?.name).toBe("MIRA'S HOUSE");
});
it('requires the actual plaque tile rather than an adjacent tile',()=>{
 const sign=buildingSigns(0)[0];
 expect(canReadSign({x:sign.x,y:sign.y},sign)).toBe(true);
 expect(canReadSign({x:sign.x,y:sign.y+32},sign)).toBe(false);
 expect(canReadSign({x:sign.x,y:sign.y+64},sign)).toBe(false);
 expect(canReadSign({x:sign.x+32,y:sign.y+32},sign)).toBe(false);
});
