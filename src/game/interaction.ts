import {facingVector,type Point} from './combat';
import type {Facing} from './movement';

/** A neighbouring tile, including its corners, is a comfortable interaction area. */
export function interactionScore(player:Point&{facing:Facing},target:Point,range=48){
  const dx=target.x-player.x,dy=target.y-player.y;
  if(Math.abs(dx)>range||Math.abs(dy)>range)return Infinity;
  const direction=facingVector(player.facing);
  return Math.hypot(dx,dy)-(dx*direction.x+dy*direction.y)*.2;
}
export const atDoorway=(player:Point,door:Point)=>Math.abs(player.x-door.x)<=56&&player.y>=door.y-20&&player.y<=door.y+104;
