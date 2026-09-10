import {describe,it,expect} from 'vitest';
import {RESCUE_POSITIONS} from '../src/game/story/openingStory';
describe('rescue gathering',()=>{
  it('keeps the family and travellers together on distinct walk-grid tiles',()=>{
    const points=Object.values(RESCUE_POSITIONS);
    expect(new Set(points.map(p=>`${p.x},${p.y}`)).size).toBe(points.length);
    for(const p of points){expect(p.x%32).toBe(16);expect(p.y%32).toBe(16);}
    expect(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x))).toBeLessThanOrEqual(96);
    expect(Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y))).toBeLessThanOrEqual(64);
    expect(Math.hypot(RESCUE_POSITIONS.Luma.x-RESCUE_POSITIONS.Mira.x,RESCUE_POSITIONS.Luma.y-RESCUE_POSITIONS.Mira.y)).toBe(32);
  });
});
