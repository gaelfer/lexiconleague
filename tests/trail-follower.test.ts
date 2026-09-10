import {describe,it,expect} from 'vitest';
import {TrailFollower} from '../src/game/entities/trailFollower';
describe('Luma follows the travelled grid path',()=>{
  it('stays one tile behind and follows corners rather than cutting across them',()=>{
    const follower=new TrailFollower({x:16,y:16},{x:16,y:16});
    expect(follower.update({x:48,y:16},1000)).toEqual({x:16,y:16});
    expect(follower.update({x:48,y:48},1000)).toEqual({x:48,y:16});
    expect(follower.update({x:48,y:80},1000)).toEqual({x:48,y:48});
    expect(follower.update({x:48,y:80},1000)).toEqual({x:48,y:48});
  });
  it('moves at the same speed independent of update frequency',()=>{
    const first=new TrailFollower({x:16,y:16},{x:16,y:16});
    const second=new TrailFollower({x:16,y:16},{x:16,y:16});
    for(const f of [first,second])f.update({x:48,y:16},0);
    first.update({x:80,y:16},100);
    for(let i=0;i<10;i++)second.update({x:80,y:16},10);
    expect(first.position.x).toBeCloseTo(second.position.x);
    expect(first.position.y).toBe(second.position.y);
  });
});
