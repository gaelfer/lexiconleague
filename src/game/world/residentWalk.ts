import type * as Phaser from 'phaser';
import {residentDoor,residentLocation} from '../story/villageRoutine';
import {getStoryProgress} from '../../lib/story/progress';
import {tileCenter} from '../gridMovement';
/** Cardinal-grid routes around real solid footprints. Actor and interaction body move together. */
export function residentWalk(scene:Phaser.Scene,rig:Phaser.GameObjects.Container,body:Phaser.Physics.Arcade.Image,spec:{name:string;x:number;y:number},walls:Phaser.Physics.Arcade.StaticGroup){
 rig.setName(`resident-${spec.name}`);
 const day=({Fenn:{x:368,y:656},Tansy:{x:848,y:688},Oren:{x:1008,y:912}} as Record<string,{x:number;y:number}>)[spec.name]??{x:spec.x,y:spec.y};let location=residentLocation(spec.name,getStoryProgress().worldClock),route:{x:number;y:number}[]=[],target=location==='outside'?day:residentDoor(location),walking=false;
 if(location==='outside'){body.setPosition(day.x,day.y).refreshBody();rig.setPosition(day.x,day.y-16);spec.x=day.x;spec.y=day.y;}
 if(location!=='outside'&&location!=='legacy'){body.setPosition(target.x,target.y).refreshBody();rig.setPosition(target.x,target.y-16).setVisible(false);body.body!.enable=false;spec.x=-9999;spec.y=-9999;}
 const find=(goal:{x:number;y:number})=>{const start={x:tileCenter(body.x),y:tileCenter(body.y)},key=(p:{x:number;y:number})=>`${p.x},${p.y}`,queue=[start],seen=new Map<string,{x:number;y:number}|null>([[key(start),null]]);let end=start;
  for(let i=0;i<queue.length&&i<2000;i++){const p=queue[i];if(p.x===goal.x&&p.y===goal.y){end=p;break;}for(const [dx,dy]of [[32,0],[-32,0],[0,32],[0,-32]]){const q={x:p.x+dx,y:p.y+dy};if(q.x<48||q.x>1232||q.y<48||q.y>1360||seen.has(key(q)))continue;const solid=walls.getChildren().some(o=>{const b=(o as Phaser.Physics.Arcade.Image).body;return b?.enable&&q.x+9>b.x&&q.x-9<b.x+b.width&&q.y+7>b.y&&q.y-7<b.y+b.height;});if(solid)continue;seen.set(key(q),p);queue.push(q);}}
  const result=[];while(seen.get(key(end))){result.unshift(end);end=seen.get(key(end))!;}return result;
 };
 return (delta:number)=>{const desired=residentLocation(spec.name,scene.game.registry.get('world-clock'));if(desired==='legacy')return;
  if(desired!==location){location=desired;target=desired==='outside'?day:residentDoor(desired);rig.setVisible(true);body.body!.enable=true;route=find(target);walking=true;}
  if(!walking)return;
  const step=route[0];if(step){if(Math.hypot(scene.data.get('resident-player-x')-body.x,scene.data.get('resident-player-y')-body.y)<48)return;const dx=step.x-body.x,dy=step.y-body.y,d=Math.hypot(dx,dy),move=Math.min(d,delta*.075);body.setPosition(body.x+dx/(d||1)*move,body.y+dy/(d||1)*move).refreshBody();rig.setPosition(Math.round(body.x),Math.round(body.y)-16);spec.x=body.x;spec.y=body.y;const feet=rig.list.slice(1,3) as Phaser.GameObjects.Image[];feet.forEach((foot,i)=>foot.setY(21+Math.round(Math.sin(scene.time.now/100+i*Math.PI)*3)));(rig.list[4] as Phaser.GameObjects.Image)?.setVisible(dy>=0);if(d<=move)route.shift();}
  else{walking=false;if(location!=='outside'&&Math.hypot(body.x-target.x,body.y-target.y)<2){rig.setVisible(false);body.body!.enable=false;spec.x=-9999;spec.y=-9999;}}
 };
}
