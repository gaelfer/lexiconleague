import * as Phaser from 'phaser';
import Player from '../entities/Player';
import Blotling from '../entities/Blotling';
import OutpostBandit from '../entities/OutpostBandit';
import {storyResident} from '../entities/storyResident';
import {TrailFollower} from '../entities/trailFollower';
import {frameWorld} from '../world/framing';
import {expeditionCombat} from '../world/expeditionCombat';
import type {StoryAvatarConfig} from '../avatar';
import {getStoryProgress} from '../../lib/story/progress';
import {northernProgress,clockPhase} from '../../lib/story/worldClock';
import {EventBus} from '../EventBus';
import {northernPlain,skeletonTexture,OUTPOST} from '../world/northernArt';
import {footDepth} from '../world/footDepth';

type Foe=Blotling|OutpostBandit;
/** Open northern hub and four connected outpost floors. Progress saves per floor. */
export default class NorthernTrailScene extends Phaser.Scene{
 private player!:Player;private walls!:Phaser.Physics.Arcade.StaticGroup;private enemies:Foe[]=[];
 private copper!:ReturnType<typeof storyResident>;private follower!:TrailFollower;private swing!:Phaser.GameObjects.Image;private swingAt=0;private hitAt=0;
 private prompt!:Phaser.GameObjects.Text;private patient?:Phaser.GameObjects.Image;private dictionary?:Phaser.GameObjects.Image;
 private dialogue:{lines:string[];index:number;text:Phaser.GameObjects.Text;done?:()=>void}|null=null;
 private next=0;private leaving=false;private readyAt=0;private floor=0;private fromAbove=false;private night=false;
 constructor(private avatar:StoryAvatarConfig){super('NorthernTrailScene');}
 init(data:{floor?:number;fromAbove?:boolean}={}){this.floor=data.floor??0;this.fromAbove=!!data.fromAbove;}
 create(){
  this.enemies=[];this.dialogue=null;this.leaving=false;this.swingAt=0;this.hitAt=0;this.readyAt=this.time.now+500;this.patient=undefined;this.dictionary=undefined;this.night=false;
  this.walls=this.physics.add.staticGroup();
  const wall=(x:number,y:number,w:number,h:number)=>{const b=this.physics.add.staticImage(x,y,'__DEFAULT').setVisible(false).setDisplaySize(w,h).refreshBody();this.walls.add(b);};
  const p=getStoryProgress().northernStory??{};
  if(!this.floor){this.physics.world.setBounds(0,0,960,1536);northernPlain(this,wall);skeletonTexture(this);}
  else{
   this.add.rectangle(400,300,5000,5000,0x111d1b).setDepth(-100);
   this.physics.world.setBounds(160,192,480,288);
   for(let row=0;row<10;row++)for(let col=0;col<15;col++)this.add.image(160+col*32,160+row*32,`interior-${row===0?'skirting':this.floor===1?'stone':'floor'}`).setOrigin(0).setDisplaySize(32,32).setDepth(-20);
   wall(176,336,32,288);wall(624,336,32,288);wall(400,464,480,32);
   const prop=(asset:string,x:number,y:number)=>{footDepth(this,this.add.image(x,y-10,`interior-${asset}`).setDisplaySize(32,32),y);wall(x,y,26,22);};
   for(const x of [240,560]){prop('barrel',x,208);prop(this.floor===2?'bed-head-rust':this.floor===3?'shelf':'chest',x,240);if(this.floor===2)prop('bed-foot-rust',x,272);}
   if(this.floor===3){prop('map',336,208);prop('desk',368,208);prop('candles',496,208);}
   if(this.floor===4){prop('rain-relief',304,208);prop('candles',528,208);}
   for(const x of [208,592]){for(const [i,part]of ['cap','shaft','base'].entries())footDepth(this,this.add.image(x,272+i*32,`interior-outpost-pillar-${part}`).setDisplaySize(32,32),336);wall(x,336,22,20);}
   this.add.image(560,384,'interior-inn-stairs-top').setDisplaySize(32,32).setDepth(0);
   this.add.image(560,416,'interior-inn-stairs-foot').setDisplaySize(32,32).setDepth(0);
   this.add.image(208,416,'interior-threshold').setDisplaySize(32,32).setDepth(0);
   this.add.text(400,176,`WATCHTOWER · ${this.floor} / 4`,{fontSize:'11px',color:'#ecd5a0'}).setOrigin(.5).setDepth(2);
   if(!(p.outpostFloors??(p.cured?[1,2,3,4]:[])).includes(this.floor))for(const [i,x]of [304,400,496].entries())this.enemies.push(new OutpostBandit(this,x,272+i%2*64,i+this.floor,this.floor===4?['ROOK','FINCH','LOOKOUT'][i]:undefined));
   else if(this.floor===4){storyResident(this,304,304,5,'ROOK',0x83b5ab);storyResident(this,496,304,8,'FINCH',0xb9a4cb);}
   if(this.floor===4){this.patient=this.add.image(400,224,'blotling').setDepth(10).setVisible(!p.cured);if(p.cured)storyResident(this,400,224,1,'MALLOW',0x65c58f);this.dictionary=this.add.image(464,214,'interior-lectern').setDisplaySize(32,32).setDepth(6).setVisible(!p.dictionary);wall(464,224,24,20);}
  }
  const spawn=this.floor?{x:this.fromAbove?528:240,y:416}:{x:464,y:this.fromAbove?368:1488};
  this.player=new Player(this,spawn.x,spawn.y,this.avatar);this.physics.add.collider(this.player.sprite,this.walls);
  this.copper=storyResident(this,spawn.x,spawn.y-32,2,'DAME COPPER',0xcd7f32,true);this.copper.rig.setVisible(!!p.escort&&!p.returnedToPost);this.follower=new TrailFollower({x:spawn.x,y:spawn.y-32},spawn);
  this.swing=this.add.image(15,7,'story-sword').setOrigin(.5,54/66).setDisplaySize(14,50).setAngle(12);this.copper.rig.add(this.swing);
  expeditionCombat(this,this.player,this.walls,this.enemies,()=>!!this.dialogue||this.leaving,()=>{this.leaving=true;this.time.delayedCall(900,()=>this.scene.restart({floor:this.floor,fromAbove:this.fromAbove}));});
  this.prompt=this.add.text(0,0,'',{fontSize:'12px',color:'#eee0b5',backgroundColor:'#183630',padding:{x:8,y:5}}).setOrigin(.5).setDepth(80);
  frameWorld(this);if(!this.floor)this.cameras.main.setBounds(0,0,960,1536).startFollow(this.player.sprite,true,.1,.1);this.cameras.main.fadeIn(300);EventBus.emit('current-scene-ready',this);
 }
 private change(floor:number,fromAbove=false){this.leaving=true;this.player.stopMovement();this.scene.restart({floor,fromAbove});}
 private refreshNight(){
  if(this.floor)return;const clock=this.registry.get('world-clock')??getStoryProgress().worldClock,night=!!clock&&clockPhase(clock)==='Night';if(night===this.night)return;this.night=night;
  if(!night){for(const enemy of this.enemies)if(enemy instanceof Blotling)enemy.dismiss();return;}
  for(const [i,[x,y]]of [[240,560],[720,624],[304,1040],[688,1232],[464,816],[176,1360]].entries()){const enemy=new Blotling(this,x,y,i%2?3:2);if(i%2){enemy.sprite.setTexture('night-skeleton');enemy.sprite.setCircle(12,8,10);}this.enemies.push(enemy);this.physics.add.collider(enemy.sprite,this.walls);}
 }
 update(_time:number,delta:number){
  if(this.leaving)return;
  if(this.dialogue){this.player.stopMovement();this.enemies.forEach(e=>{if(!e.defeated)e.sprite.setVelocity(0,0);});if(this.time.now>this.next&&this.player.isInteractJustDown()){const d=this.dialogue;d.index++;if(d.index<d.lines.length){d.text.setText(d.lines[d.index]);this.next=this.time.now+240;}else{d.text.destroy();this.dialogue=null;d.done?.();}}return;}
  this.player.update(delta);this.refreshNight();
  if(!this.floor)this.cameras.main.setFollowOffset(0,this.player.y<560?80:0);
  if(this.copper.rig.visible){const old={x:this.copper.rig.x,y:this.copper.rig.y+16},point=this.follower.update(this.player,delta);this.copper.rig.setPosition(Math.round(point.x),Math.round(point.y)-16);this.copper.pose(this.time.now,Math.hypot(point.x-old.x,point.y-old.y)>.1,point.y-old.y);}
  for(const e of this.enemies){if(e.defeated)continue;const ally={x:this.copper.rig.x,y:this.copper.rig.y+16},distance=Math.hypot(e.sprite.x-ally.x,e.sprite.y-ally.y),target=this.copper.rig.visible&&distance<Math.hypot(e.sprite.x-this.player.x,e.sprite.y-this.player.y)?ally:this.player;
   if(e.update(delta,target)){if(target===this.player)this.player.takeDamage(1,e.sprite);else if(this.time.now>this.hitAt){this.hitAt=this.time.now+700;this.copper.body.setAlpha(.45);this.tweens.add({targets:this.copper.body,alpha:1,duration:200});}}
   if(this.copper.rig.visible&&distance<72&&this.time.now>this.swingAt){this.swingAt=this.time.now+950;this.tweens.add({targets:this.swing,angle:{from:-65,to:70},duration:180,yoyo:true});e.takeHit(ally.x,ally.y,1);}
  }
  const p=getStoryProgress().northernStory??{};
  if(this.floor&&this.enemies.length&&this.enemies.every(e=>e.defeated)&&!p.outpostFloors?.includes(this.floor)){const floors=[...new Set([...(p.outpostFloors??[]),this.floor])];northernProgress({outpostFloors:floors,campCleared:floors.length===4});this.say([this.floor===4?'Rook: Enough! We thought you’d come for the book. Our friend is sick. Please—help him.':'The guards lower their weapons. Copper: Stay here. We’re going upstairs.']);return;}
  if(this.time.now<this.readyAt)return;
  if(!this.floor){if(this.player.wantsDoorAt(464,1488,'down')){this.leaving=true;this.scene.stop();this.scene.resume('DungeonScene',{fromNorth:true});return;}if(this.player.wantsDoorAt(OUTPOST.x,OUTPOST.y,'up')){this.change(1);return;}this.prompt.setVisible(false);return;}
  const near=(x:number,y:number)=>Math.hypot(this.player.x-x,this.player.y-y)<42,clear=(p.outpostFloors??(p.cured?[1,2,3,4]:[])).includes(this.floor);
  const action=near(208,416)?'DOWNSTAIRS':near(560,416)&&this.floor<4?(clear?'UPSTAIRS':'CLEAR THIS FLOOR FIRST'):this.floor===4&&near(464,224)&&!p.dictionary?'EXAMINE THE DICTIONARY':this.floor===4&&near(400,224)?p.cured?'TALK TO MALLOW':'HELP MALLOW':null;
  this.prompt.setVisible(!!action);if(!action)return;this.prompt.setText(`[ E ] ${action}`).setPosition(this.player.x,this.player.y-64);if(!this.player.isInteractJustDown())return;
  if(action==='DOWNSTAIRS'){this.change(this.floor-1,true);return;}if(!clear){this.say(['Copper: Watch their weapons. We need to make this floor safe first.']);return;}if(action==='UPSTAIRS'){this.change(this.floor+1);return;}
  if(action==='EXAMINE THE DICTIONARY'){this.say(['The clasp matches Bellum’s pedestal. The First Dictionary opens to “remember.”','Finch: Mallow used to read to us. Let me try his name.'],()=>{northernProgress({dictionary:true});this.dictionary?.setVisible(false);this.player.holdItemAboveHead();});return;}
  if(p.cured){this.say(['Mallow: Finch kept my cup. Somehow that’s the part I can’t stop thinking about.']);return;}if(!p.dictionary){this.say(['Finch: That dictionary reacts whenever Mallow is near. Please, look at it.']);return;}
  this.say(['Finch: Mallow. You’re home. Rook burned the soup again. I kept your cup.','You hold the page open. The violet ink loosens, and an Inkling looks up.','Mallow: …You kept my cup?','Rook: We were wrong about you. Take the book. There’s always a place for you here.','Copper: Bellum needs to hear this. I’ll walk back with you as far as my post.'],()=>{northernProgress({cured:true});this.patient?.setVisible(false);storyResident(this,400,224,1,'MALLOW',0x65c58f);});
 }
 private say(lines:string[],done?:()=>void){this.player.stopMovement();this.prompt.setVisible(false);const text=this.add.text(60,458,lines[0],{fontSize:'16px',color:'#f3e8c5',backgroundColor:'#142d2b',padding:{x:18,y:14},wordWrap:{width:640}}).setDepth(101);this.dialogue={lines,index:0,text,done};this.next=this.time.now+250;}
}
