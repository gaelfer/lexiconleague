import { describe, expect, it } from 'vitest';
import { TOWN, townDoor } from '../src/game/story/townPlan';
import { ROOM_LAYOUTS } from '../src/game/story/roomLayouts';

describe('Inkwell town model', () => {
  it('centers all exterior doorways on single movement-grid columns',()=>{
    for(const building of TOWN.buildings)expect(townDoor(building.id)!.x%32,building.id).toBe(16);
    expect(TOWN.gatehouse.x%32).toBe(16);
  });
  it('keeps the gatehouse clear of the tea-room roof and its arrival outside collision',()=>{
    const gate=TOWN.gatehouse;
    const tea=TOWN.buildings.find(b=>b.id==='tea-room')!;
    const teaRoofTop=Math.ceil((tea.y+64)/32)*32-174;
    expect(gate.y).toBeLessThan(teaRoofTop);
    expect(gate.y-146).toBeGreaterThanOrEqual(TOWN.top);
    expect(gate.spawn.y-16).toBeGreaterThanOrEqual(gate.y-16);
    expect(gate.spawn.x%32).toBe(16);expect(gate.spawn.y%32).toBe(16);
  });
  it('has a distinct room plan for every enterable house', () => {
    const houses = TOWN.buildings.filter((house) => house.id !== 'archive'&&house.id!=='inn');
    expect(houses).toHaveLength(8);
    const plans = houses.map((house) => ROOM_LAYOUTS[house.id as keyof typeof ROOM_LAYOUTS]);
    expect(plans.every((plan) => plan?.length >= 3)).toBe(true);
    expect(new Set(plans.map((plan) => JSON.stringify(plan))).size).toBe(houses.length);
  });
  it('places every doorstep on a street connected to the spawn', () => {
    const tiles = new Set<string>();
    for (const [x,y,w,h] of TOWN.streets) {
      for (let ty=Math.floor(y/32);ty<Math.ceil((y+h)/32);ty++)
        for(let tx=Math.floor(x/32);tx<Math.ceil((x+w)/32);tx++) tiles.add(`${tx},${ty}`);
    }
    const start = `${Math.floor(TOWN.spawn.x/32)},${Math.floor(TOWN.spawn.y/32)}`;
    const visited = new Set([start]); const pending = [start];
    while(pending.length) {
      const [x,y]=pending.pop()!.split(',').map(Number);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const next=`${x+dx},${y+dy}`;
        if(tiles.has(next)&&!visited.has(next)){ visited.add(next); pending.push(next); }
      }
    }
    for(const house of TOWN.buildings){
      const door=townDoor(house.id)!;
      expect(visited.has(`${Math.floor(door.x/32)},${Math.floor(door.y/32)}`), house.id).toBe(true);
    }
  });
});
