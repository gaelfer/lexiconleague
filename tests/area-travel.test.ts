import { describe,it,expect } from 'vitest';
import { AREAS,canTravel,advanceEcho } from '../src/game/story/areaTravel';

describe('connected story areas',()=>{
  it('preserves progression locks and uses explicit local destinations',()=>{
    expect(canTravel('approach',[])).toBe(true);
    expect(canTravel('village',[])).toBe(false);
    expect(canTravel('wordwood',[])).toBe(false);
    for(const area of ['approach','village','wordwood'] as const){
      expect(canTravel(area,[1])).toBe(true);
      expect(AREAS[area].url).toMatch(/^\/story\/(1|2|village)\?arrival=gatehouse$/);
    }
  });
  it('puts all lodge doors and arrivals on distinct adjacent grid tiles',()=>{
    for(const {door,spawn} of Object.values(AREAS)){
      for(const p of [door,spawn]){expect(p.x%32).toBe(16);expect(p.y%32).toBe(16);}
      expect(Math.abs(door.x-spawn.x)+Math.abs(door.y-spawn.y)).toBe(32);
    }
  });
  it('requires seed, sprout, bloom and resets only the sequence on mistakes',()=>{
    expect([0,2,1].reduce(advanceEcho,0)).toBe(3);
    expect(advanceEcho(1,1)).toBe(0);
    expect(advanceEcho(2,0)).toBe(1);
  });
});
