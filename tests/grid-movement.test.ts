import { describe, expect, it } from 'vitest';
import { tileCenter, nextGridStep, interpolateStep } from '../src/game/gridMovement';
import { INTERIOR_PLANS, ROOM_GRID } from '../src/game/story/interiorPlans';

describe('tile movement', () => {
  it('starts and ends at tile centers', () => {
    expect(tileCenter(400)).toBe(400);
    expect(tileCenter(500)).toBe(496);
    expect(nextGridStep({x:400,y:464},1,0,()=>true)).toEqual({x:432,y:464});
  });
  it('rejects blocked destinations and diagonal corner cutting', () => {
    expect(nextGridStep({x:16,y:16},1,0,()=>false)).toBeNull();
    expect(nextGridStep({x:16,y:16},1,1,(_a,b)=>!(b.x===48&&b.y===16))).toBeNull();
    expect(nextGridStep({x:16,y:16},1,1,()=>true)).toEqual({x:48,y:48});
  });
  it('finishes an in-progress step without consulting held keys or overshooting', () => {
    expect(interpolateStep({x:16,y:16},{x:48,y:16},90,180)).toEqual({x:32,y:16});
    expect(interpolateStep({x:16,y:16},{x:48,y:16},300,180)).toEqual({x:48,y:16});
  });
  it('uses whole-tile furniture positions and footprints, including a bed', () => {
    expect(INTERIOR_PLANS.home.props.some(o=>o.asset==='bed-head')).toBe(true);
    for(const object of INTERIOR_PLANS.home.props) {
      expect((ROOM_GRID.x+object.col*32)%32).toBe(0);
      expect((ROOM_GRID.floorY+object.row*32)%32).toBe(0);
    }
  });
});
