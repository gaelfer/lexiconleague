import { facingVector } from './combat';
import type { Facing } from './movement';
export const BOW_DURATION=420;
export const BOW_RELEASE=180;
export function bowPose(x:number,y:number,facing:Facing,remaining:number,scale:number){
  const d=facingVector(facing);
  const pull=remaining>BOW_RELEASE?(BOW_DURATION-remaining)/(BOW_DURATION-BOW_RELEASE):0;
  const grip={x:x+d.x*23,y:y+7+d.y*18};
  const string=-19-8*Math.max(0,Math.min(1,pull));
  return {grip,string,angle:Math.atan2(d.y,d.x),
    release:{x:x+(d.x*23-4*d.x)*scale,y:y-16+(7+d.y*18-4*d.y)*scale}};
}
