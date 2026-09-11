import type {AdventureArea} from './adventure';
import {WORDWOOD_APPROACH} from '../../game/story/wordwoodApproach';
export function worldPoint(area:AdventureArea,x:number,y:number){
 return area==='wordwood'?{x:24+x/1600*272,y:20+y/1200*180}:area==='village'?{x:60+x/1280*200,y:8+(y+128)/1536*192}:{x:22+x/3200*276,y:60+y/600*96};
}
export function trailPoint(x:number,y:number){return {x:24+x/1600*272,y:16+(y-1200)/1200*180};}
/** Every road tile and its live marker use this same transform on the regional chart. */
export function regionPoint(area:AdventureArea,x:number,y:number){
 if(area==='road')return {x:36+x/3200*124,y:154+(y-304)/600*22};
 if(area==='wordwood'){
  if(y<=1200)return {x:246,y:69};
  const chart=[[154,154],[186,154],[189,149],[192,145],[195,141],[198,136],[198,106],[205,101],[211,97],[218,92],[246,69]];
  let best=Infinity,result={x:246,y:69};
  WORDWOOD_APPROACH.slice(1).forEach((b,i)=>{const a=WORDWOOD_APPROACH[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy))),distance=Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);if(distance<best){best=distance;result={x:chart[i][0]+t*(chart[i+1][0]-chart[i][0]),y:chart[i][1]+t*(chart[i+1][1]-chart[i][1])};}});
  return result;
 }
 return {x:166+x/1280*20,y:170+(y+128)/1536*14};
}
