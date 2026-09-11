import {nextGridStep,type GridPoint} from './gridMovement';
import {facingVector} from './combat';
import type {Facing} from './movement';
export function dashTiles(from:GridPoint,facing:Facing,count:number,clear:(a:GridPoint,b:GridPoint)=>boolean){const d=facingVector(facing),points:GridPoint[]=[];let at=from;for(let i=0;i<count;i++){const next=nextGridStep(at,d.x,d.y,clear);if(!next)break;points.push(next);at=next;}return points;}
export function frontalHit(player:GridPoint,facing:Facing,source:GridPoint){const d=facingVector(facing),x=source.x-player.x,y=source.y-player.y;return (x*d.x+y*d.y)/Math.max(1,Math.hypot(x,y))>=Math.SQRT1_2;}
export function toolAction(tool:string,heldMs:number,chargeMs:number){return tool==='sword'?'slash':tool==='bow'?(heldMs>=chargeMs?'charged-arrow':'arrow'):tool==='shield'?'guard':null;}
