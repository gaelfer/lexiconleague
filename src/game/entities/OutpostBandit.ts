import * as Phaser from 'phaser';
import {storyResident} from './storyResident';

/** Ordinary Inklings surrender; they never dissolve like corrupted creatures. */
export default class OutpostBandit {
 readonly sprite:Phaser.Physics.Arcade.Image;
 readonly rig:ReturnType<typeof storyResident>;
 private blade:Phaser.GameObjects.Image;
 private hp=3;private elapsed=0;private cooldown=600;private stun=0;private windup=0;
 defeated=false;
 get canReceiveHit(){return !this.defeated&&this.stun<=0;}
 constructor(private scene:Phaser.Scene,x:number,y:number,index:number,name=index%2?'OUTPOST LOOKOUT':'OUTPOST GUARD'){
  this.sprite=scene.physics.add.image(x,y,'player-hitbox').setDisplaySize(24,20).setAlpha(0).setCollideWorldBounds(true);
  this.rig=storyResident(scene,x,y,index%2?8:5,name,index%2?0xb9a4cb:0x83b5ab);
  this.blade=scene.add.image(16,7,'story-sword').setDisplaySize(12,42).setOrigin(.5,.82).setAngle(30);this.rig.rig.add(this.blade);
 }
 update(delta:number,target:{x:number;y:number}){
  if(this.defeated)return false;
  this.elapsed+=delta;this.stun=Math.max(0,this.stun-delta);this.cooldown=Math.max(0,this.cooldown-delta);
  const dx=target.x-this.sprite.x,dy=target.y-this.sprite.y,d=Math.hypot(dx,dy);
  this.rig.rig.setPosition(this.sprite.x,this.sprite.y-16);this.rig.pose(this.elapsed,d>48&&this.stun===0,dy);
  if(this.stun||Math.max(this.sprite.getData('boundUntil')??0,this.sprite.getData('staggerUntil')??0)>this.scene.time.now){this.sprite.setVelocity(0);return false;}
  if(this.windup){this.windup+=delta;this.sprite.setVelocity(0);this.blade.setAngle(-65);if(this.windup>=500){this.windup=0;this.cooldown=1100;this.scene.tweens.add({targets:this.blade,angle:65,duration:150,yoyo:true});return d<62;}return false;}
  if(d<58&&!this.cooldown){this.windup=1;this.sprite.setVelocity(0);}
  else if(d>48&&d<330)this.sprite.setVelocity(dx/d*45,dy/d*45);
  else this.sprite.setVelocity(0);
  return false;
 }
 takeHit(_x:number,_y:number,damage=1){
  if(!this.canReceiveHit)return false;this.hp-=damage;this.stun=300;this.windup=0;
  this.rig.rig.setAlpha(.5);this.scene.tweens.add({targets:this.rig.rig,alpha:1,duration:180});
  if(this.hp>0)return false;
  this.defeated=true;this.sprite.disableBody();this.blade.setVisible(false);this.rig.feet.forEach(f=>f.setVisible(false));
  const text=this.scene.add.text(this.sprite.x,this.sprite.y-58,'I yield!',{fontSize:'11px',color:'#f0d9a3'}).setOrigin(.5).setDepth(80);this.scene.time.delayedCall(1800,()=>text.destroy());return true;
 }
}
