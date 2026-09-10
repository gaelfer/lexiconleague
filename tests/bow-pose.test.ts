import { describe,it,expect } from 'vitest';
import { bowPose,BOW_DURATION,BOW_RELEASE } from '../src/game/bowPose';
import { facingVector } from '../src/game/combat';
import type { Facing } from '../src/game/movement';
describe('bow animation alignment',()=>{
  it('draws the string backward and returns it to the release plane',()=>{
    expect(bowPose(0,0,'right',BOW_DURATION,0.78).string).toBe(-19);
    expect(bowPose(0,0,'right',BOW_RELEASE+1,0.78).string).toBeLessThan(-26);
    expect(bowPose(0,0,'right',BOW_RELEASE,0.78).string).toBe(-19);
  });
  it('spawns the arrow on the same transformed nock line in all eight directions',()=>{
    for(const facing of ['up','down','left','right','up-left','up-right','down-left','down-right'] as Facing[]){
      const p=bowPose(400,304,facing,BOW_RELEASE,0.78),d=facingVector(facing);
      expect(p.release.x).toBeCloseTo(400+(p.grip.x-400-4*d.x)*0.78);
      expect(p.release.y).toBeCloseTo(304-16+(p.grip.y-304-4*d.y)*0.78);
    }
  });
});
