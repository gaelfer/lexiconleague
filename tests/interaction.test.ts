import {describe,it,expect} from 'vitest';
import {interactionScore,atDoorway} from '../src/game/interaction';

describe('grid interaction targeting',()=>{
  const player={x:80,y:80,facing:'up' as const};
  it('reaches adjacent diagonal tiles without pixel-perfect alignment',()=>{
    expect(Number.isFinite(interactionScore(player,{x:112,y:48}))).toBe(true);
    expect(interactionScore(player,{x:144,y:80})).toBe(Infinity);
  });
  it('prefers an equally close character in the facing direction',()=>{
    expect(interactionScore(player,{x:80,y:48})).toBeLessThan(interactionScore(player,{x:80,y:112}));
  });
  it('allows approach from neighbouring door tiles but not behind the building',()=>{
    expect(atDoorway({x:112,y:144},{x:80,y:80})).toBe(true);
    expect(atDoorway({x:144,y:144},{x:80,y:80})).toBe(false);
    expect(atDoorway({x:80,y:48},{x:80,y:80})).toBe(false);
  });
});
