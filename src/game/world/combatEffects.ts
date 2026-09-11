import * as Phaser from 'phaser';
import {EventBus} from '../EventBus';
import {facingVector} from '../combat';
import type {Facing} from '../movement';
import type Player from '../entities/Player';
import {addInk,combatLoadout} from '../../lib/story/combatLoadout';
import {getStoryProgress,saveStoryProgress} from '../../lib/story/progress';
export type CombatEnemy={sprite:Phaser.Physics.Arcade.Image;defeated:boolean;canReceiveHit?:boolean;meleeRadius?:number;takeHit:(x:number,y:number,damage?:number)=>boolean};
export function hitEnemy(enemy:CombatEnemy,x:number,y:number,damage=1,meter=true){
 if(enemy.defeated||enemy.canReceiveHit===false)return false;
 const defeated=enemy.takeHit(x,y,damage);if(meter)addInk(5);return defeated;
}
export function sealReward(player:Player,id:string){const p=getStoryProgress(),key=`seal-ink:${id}`;if(p.claimedRewards.includes(key))return;const recall=combatLoadout(p).ring==='recall';if(!saveStoryProgress({claimedRewards:[...p.claimedRewards,key]}))return;addInk(recall?25:15);if(recall)player.heal(.5);}
export function combatEffects(scene:Phaser.Scene,player:Player,enemies:()=>CombatEnemy[],blocked:()=>boolean){
 scene.data.set('combat-targets',enemies);
 const effect=(e:{scene:Phaser.Scene;id:string;x:number;y:number;facing:Facing;end?:{x:number;y:number};hit?:Set<unknown>;source?:{x:number;y:number}})=>{
  if(e.scene!==scene||!scene.sys.isActive()||blocked())return;
  const d=facingVector(e.facing);
  if(e.id==='marginal-storm'){
   for(let wave=0;wave<3;wave++)scene.time.delayedCall(wave*250,()=>{if(!scene.sys.isActive()||blocked()||player.isDying)return;for(const spread of [-.22,0,.22])EventBus.emit('player-bow',{x:player.x,y:player.y-10,facing:e.facing,angle:Math.atan2(d.y,d.x)+spread,spectral:true});});return;
  }
  const g=scene.add.graphics().setDepth(13);
  if(e.id==='lunge')g.lineStyle(5,0xe8d6a3).lineBetween(e.x,e.y-10,e.x+d.x*120,e.y-10+d.y*120);
  else if(e.id==='redline'&&e.end)g.lineStyle(10,0xc68b7a,.6).lineBetween(e.x,e.y-10,e.end.x,e.end.y-10);
  scene.tweens.add({targets:g,alpha:0,duration:350,onComplete:()=>g.destroy()});
  for(const enemy of enemies()){
   if(enemy.defeated)continue;
   const dx=enemy.sprite.x-e.x,dy=enemy.sprite.y-e.y,along=dx*d.x+dy*d.y,across=Math.abs(dx*d.y-dy*d.x),distance=Math.hypot(dx,dy);
   if(e.id==='wordbind'&&distance<96){
    if(enemy.meleeRadius)continue;
    enemy.sprite.setData('boundUntil',scene.time.now+2000);enemy.sprite.setVelocity(0,0);
    const ring=scene.add.graphics().setDepth(8);ring.lineStyle(2,0xbba9cc).strokeRect(enemy.sprite.x-22,enemy.sprite.y-16,44,32);scene.time.delayedCall(2000,()=>ring.destroy());
   }else if(e.id==='lunge'&&along>=0&&along<=128&&across<=18+(enemy.meleeRadius??0)){
    hitEnemy(enemy,e.x,e.y,1);enemy.sprite.setData('staggerUntil',scene.time.now+(enemy.meleeRadius?450:900));
   }else if(e.id==='redline'&&e.end&&!e.hit?.has(enemy)&&along>=-16&&along<=Math.hypot(e.end.x-e.x,e.end.y-e.y)+20&&across<=30){e.hit?.add(enemy);hitEnemy(enemy,e.x,e.y,3,false);}
   else if(e.id==='ward-burst'&&distance<=100)hitEnemy(enemy,e.x,e.y,2,false);
   else if(e.id==='perfect-guard'&&e.source&&Math.hypot(enemy.sprite.x-e.source.x,enemy.sprite.y-e.source.y)<24){enemy.sprite.setData('staggerUntil',scene.time.now+800);enemy.sprite.setVelocity(d.x*160,d.y*160);}
  }
 };
 EventBus.on('combat-effect',effect);scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>EventBus.off('combat-effect',effect));
}
