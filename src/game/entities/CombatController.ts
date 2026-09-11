import * as Phaser from 'phaser';
import type Player from './Player';
import {EventBus} from '../EventBus';
import {toolSlots} from '../../lib/story/equipment';
import {ARTS,combatLoadout,availableBurst,bowChargeDuration,addInk,maxCombatHearts} from '../../lib/story/combatLoadout';
import {getStoryInventory,getStoryProgress,saveStoryProgress} from '../../lib/story/progress';
import {frontalHit,toolAction} from '../combatActions';
import {facingVector} from '../combat';

/** Scene-local action state; saved cooldown deadlines prevent room/menu resets. */
export class CombatController{
 private queue:string[]=[];
 private bowStarted:number|null=null;
 private releasedBow:number|null=null;
 private guardStarted:number|null=null;
 private guardSpent=false;
 private readyCue=false;
 private clock=0;
 private recovery=0;
 private wardUntil=0;
 private wardHits=0;
 private graphics:Phaser.GameObjects.Graphics;
 private lastHud='';
 private held=new Set<string>();
 private cooldowns:Record<string,number>;
 constructor(private scene:Phaser.Scene,private player:Player){
  this.clock=scene.game.registry.get('combat:clock')??0;
  this.cooldowns=scene.game.registry.get('combat:cooldowns')??{};
  scene.input.keyboard!.addKeys('Z,X,C');
  scene.input.keyboard!.addCapture(['Z','X','C']);
  this.graphics=scene.add.graphics().setDepth(12);
  const down=(e:KeyboardEvent)=>{if(e.repeat||this.held.has(e.code)||!scene.sys.isActive())return;this.held.add(e.code);this.press(e.key.toUpperCase());};
  const up=(e:KeyboardEvent)=>{this.held.delete(e.code);this.release(e.key.toUpperCase());};
  const cancel=()=>this.cancel();
  const touch=({key,down}:{key:string;down:boolean})=>{if(!scene.sys.isActive())return;if(down)this.press(key);else this.release(key);};
  scene.input.keyboard!.on('keydown',down);scene.input.keyboard!.on('keyup',up);
  scene.events.on(Phaser.Scenes.Events.PAUSE,cancel);scene.game.events.on(Phaser.Core.Events.BLUR,cancel);
  EventBus.on('combat-input',touch);EventBus.on('combat-cancel',cancel);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{scene.input.keyboard?.off('keydown',down);scene.input.keyboard?.off('keyup',up);scene.game.events.off(Phaser.Core.Events.BLUR,cancel);EventBus.off('combat-input',touch);EventBus.off('combat-cancel',cancel);});
 }
 private press(key:string){
  const state=this.scene as Phaser.Scene&{locked?:boolean;panel?:unknown;question?:unknown;dialogue?:unknown;activeDialogue?:unknown};
  if(!this.scene.game.input.enabled||state.locked||state.panel||state.question||state.dialogue||state.activeDialogue||this.player.isDying)return;
  const slots=toolSlots(getStoryInventory()),tool=slots[key as keyof typeof slots];
  if(tool&&toolAction(tool,0,bowChargeDuration(getStoryProgress()))==='slash')this.queue.push('sword');
  else if(tool==='bow'&&!this.busy){this.bowStarted=this.clock;this.readyCue=false;this.player.stopMovement();}
  else if(tool==='shield'&&!this.busy){this.guardStarted=this.clock;this.guardSpent=false;this.player.stopMovement();}
  else if(getStoryProgress().combatArtsUnlocked===true&&['Z','X','C'].includes(key))this.queue.push(key);
 }
 private release(key:string){const tool=toolSlots(getStoryInventory())[key as 'Q'];if(tool==='bow'&&this.bowStarted!==null){this.releasedBow=this.clock-this.bowStarted;this.bowStarted=null;}if(tool==='shield'){this.guardStarted=null;this.guardSpent=false;}}
 get drawing(){return this.bowStarted!==null;}
 get awaitingBowRelease(){return this.releasedBow!==null;}
 get drawMs(){return this.bowStarted===null?0:this.clock-this.bowStarted;}
 get guarding(){return this.guardStarted!==null&&!this.guardSpent;}
 get busy(){return this.recovery>0||this.drawing||this.guarding;}
 get movementLocked(){return this.busy;}
 cancel(){this.queue=[];this.held.clear();this.bowStarted=null;this.releasedBow=null;this.guardStarted=null;this.player.cancelBow();this.graphics.clear();}
 private flash(text:string,color='#f2dfa1'){
  const label=this.scene.add.text(this.player.x,this.player.y-60,text,{fontSize:'11px',color,backgroundColor:'#19332e',padding:{x:6,y:3}}).setOrigin(.5).setDepth(80);
  this.scene.time.delayedCall(700,()=>label.destroy());
 }
 private pulse(radius:number,color=0x8ed5c3){const g=this.scene.add.graphics().setDepth(9),p={r:8,a:1};this.scene.tweens.add({targets:p,r:radius,a:0,duration:360,onUpdate:()=>g.clear().lineStyle(3,color,p.a).strokeCircle(this.player.x,this.player.y-8,p.r),onComplete:()=>g.destroy()});}
 update(delta:number){
  this.clock=Math.max(this.clock,this.scene.game.registry.get('combat:clock')??0)+delta;this.cooldowns=this.scene.game.registry.get('combat:cooldowns')??this.cooldowns;this.scene.game.registry.set('combat:clock',this.clock);this.recovery=Math.max(0,this.recovery-delta);
  const p=getStoryProgress(),loadout=combatLoadout(p);
  if(this.wardUntil&&this.clock>=this.wardUntil){this.wardUntil=0;this.wardHits=0;this.pulse(100);EventBus.emit('combat-effect',{scene:this.scene,id:'ward-burst',x:this.player.x,y:this.player.y,facing:this.player.facing});}
  const action=this.queue.shift();this.queue=[];
  if(action&&!this.busy&&(action==='sword'||p.combatArtsUnlocked===true)){
   if(action==='sword'){if(this.player.slash())this.recovery=220;}
   else if(action==='C'){
    const burst=availableBurst(p,getStoryInventory());
    if(burst&&(p.inkMeter??0)>=100&&saveStoryProgress({inkMeter:0})){
     this.player.stopMovement();this.recovery=650;this.flash(burst.name.toUpperCase());
     if(burst.id==='redline')this.player.dash(4,true);
     else if(burst.id==='final-draft'){this.wardUntil=this.clock+4000;this.wardHits=3;this.pulse(60);}
     else EventBus.emit('combat-effect',{scene:this.scene,id:burst.id,x:this.player.x,y:this.player.y,facing:this.player.facing});
    }
   }else{
    const art=ARTS.find(a=>a.id===loadout.arts[action==='Z'?0:1])!;
    if((this.cooldowns[art.id]??0)<=this.clock&&(!art.tool||getStoryInventory().unlockedWeapons.includes(art.tool))){
     this.player.stopMovement();this.cooldowns[art.id]=this.clock+art.cooldown;this.scene.game.registry.set('combat:cooldowns',this.cooldowns);this.recovery=art.id==='lunge'?600:art.id==='inkwhirl'?550:300;
     if(art.id==='quill-dash')this.player.dash(2,false);
     else if(art.id==='inkwhirl')this.player.spinAttack();
     else {if(art.id==='lunge')this.player.lungePose();this.pulse(art.id==='wordbind'?96:40,art.id==='wordbind'?0xb6a1c8:0xe7d49c);EventBus.emit('combat-effect',{scene:this.scene,id:art.id,x:this.player.x,y:this.player.y,facing:this.player.facing});}
    }
   }
  }
  if(this.releasedBow!==null){this.releasedBow=null;if(this.recovery<=0){this.player.fireBow(false);this.recovery=420;}}
  this.graphics.clear();
  if(this.guarding){const d=facingVector(this.player.facing),x=this.player.x+d.x*22,y=this.player.y-10+d.y*22;this.graphics.lineStyle(4,this.clock-this.guardStarted!<=150?0xffedab:0x91bcb5).beginPath().arc(x,y,14,Math.atan2(d.y,d.x)-1.1,Math.atan2(d.y,d.x)+1.1).strokePath();}
  if(this.wardUntil)this.graphics.lineStyle(2,0xb5e3ce,.8).strokeCircle(this.player.x,this.player.y-10,30);
  const hud={arts:loadout.arts.map(id=>({id,name:ARTS.find(a=>a.id===id)!.name,remaining:Math.max(0,Math.ceil(Math.max(this.recovery,(this.cooldowns[id]??0)-this.clock)/1000))})),ink:p.inkMeter??0,ring:loadout.ring,burst:availableBurst(p,getStoryInventory())?.name??'Unavailable',maxHearts:maxCombatHearts(p)};
  const serialized=JSON.stringify(hud);if(serialized!==this.lastHud){this.lastHud=serialized;EventBus.emit('combat-hud',hud);}
 }
 block(source?:{x:number;y:number}){
  if(this.wardUntil&&this.wardHits>0){this.wardHits--;this.flash('WARD');if(!this.wardHits)this.wardUntil=this.clock;return true;}
  if(!source||!this.guarding||!frontalHit(this.player,this.player.facing,source))return false;
  const perfect=this.clock-this.guardStarted!<=150;this.guardSpent=true;this.recovery=500;this.flash(perfect?'PERFECT GUARD':'BLOCK');
  if(perfect){addInk(20);EventBus.emit('combat-effect',{scene:this.scene,id:'perfect-guard',x:this.player.x,y:this.player.y,source,facing:this.player.facing});}
  return true;
 }
}
