import * as Phaser from 'phaser';
import {openDoorAnimation,drawDoorLeaves} from '../world/doorOpening';
import {interactionScore} from '../interaction';
import Player from '../entities/Player';
import { AVATAR_BODY_OFFSETS, hexToNumber, type StoryAvatarConfig } from '../avatar';
import {sleepingInkling} from '../entities/sleepingInkling';
import { AVATAR_LAYER_WIDTH, AVATAR_LAYER_HEIGHT } from '../pixelAvatar';
import { createInkFoot, createInkHand } from '../entities/inkHand';
import { registerSpeaker, speak } from '../entities/inklingSpeech';
import { buildTileInterior } from '../world/tileInterior';
import { frameWorld } from '../world/framing';
import { ROOM_GRID } from '../story/interiorPlans';
import { canEnterInnRoom, innPlan, innRoutine, INN_ROOM_COLUMNS, INN_PEOPLE, isPlayerInnRoom } from '../story/inn';
import { getStoryProgress, saveStoryProgress } from '@/lib/story/progress';
import {acceptSidequest} from '@/lib/story/adventure';
import {copperLocation} from '../story/villageRoutine';
import {clockPhase} from '../../lib/story/worldClock';
import {storyResident} from '../entities/storyResident';
import {dailyWork} from '../world/dailyWork';

type Arrival={floor?:1|2;room?:number;hearts?:number;rested?:boolean;x?:number;y?:number};
type Site={x:number;y:number;label:string;action:()=>void};

export default class InnScene extends Phaser.Scene{
  private player!:Player;
  private floor:1|2=1;
  private room?:number;
  private arrival:Arrival={};
  private rested=false;
  private sites:Site[]=[];
  private prompt!:Phaser.GameObjects.Text;
  private dialogue:{text:Phaser.GameObjects.Text;objects:Phaser.GameObjects.GameObject[];choices?:boolean}|null=null;
  private readyAt=0;
  private transitioning=false;
  private pendingChoice:boolean|null=null;
  private sleepPose?:ReturnType<typeof sleepingInkling>;
  private sleepUntil=0;
  private routineKey='';
  private guest?:{npc:Phaser.GameObjects.Container;body:Phaser.Physics.Arcade.Image;site:Site;stops:ReturnType<typeof innRoutine>;index:number;elapsed:number;walking:boolean};
  get guestActivity(){const g=this.guest;return this.floor===1&&this.room===3?{x:272,y:240,activity:'sleeping'}:g?{x:g.site.x,y:g.site.y,activity:g.walking?'walking':g.stops[g.index].activity}:null;}

  constructor(private avatar:StoryAvatarConfig){super('InnScene');}
  init(data:Arrival={}){
    this.arrival=data;this.floor=data.floor===2?2:1;this.room=data.room;
    if(this.room&&!canEnterInnRoom(this.floor,this.room,getStoryProgress().innRoomBooked===true))this.room=undefined;
    this.rested=!!data.rested;this.sites=[];this.dialogue=null;this.transitioning=false;this.pendingChoice=null;
    this.guest=undefined;
    this.sleepPose=undefined;this.sleepUntil=0;
  }
  create(){
    const clock=getStoryProgress().worldClock;this.routineKey=`${clock?clockPhase(clock):''}:${copperLocation(clock)}`;
    const walls=this.physics.add.staticGroup();
    const wall=(x:number,y:number,w:number,h:number)=>{const body=this.physics.add.staticImage(x,y,'__DEFAULT').setVisible(false).setDisplaySize(w,h).refreshBody();walls.add(body);return body;};
    const furniture=buildTileInterior(this,'guest',wall,innPlan(this.floor,this.room));
    for(const item of furniture)this.sites.push({...item,action:()=>{
      if(item.label==='BED'&&this.room&&isPlayerInnRoom(this.floor,this.room)){
        const plan=innPlan(this.floor,this.room),bed=plan.props.find(p=>p.asset==='bed-head')!;
        this.player.setSleeping(true);this.prompt.setVisible(false);
        this.sleepPose=sleepingInkling(this,ROOM_GRID.x+bed.col*32,ROOM_GRID.floorY+bed.row*32,hexToNumber(this.avatar.color),plan.palette);
        this.sleepUntil=this.time.now+2200;
      }else this.say(item.lines[0]);
    }});
    if(this.room){
      const person=INN_PEOPLE.find(p=>p.room===this.floor*100+this.room!)!;
      if((person.id==='rue'&&!getStoryProgress().worldClock)||(person.id!=='fern'&&getStoryProgress().worldClock&&clockPhase(getStoryProgress().worldClock!)==='Night')){
        const plan=innPlan(this.floor,this.room),bed=plan.props.find(p=>p.asset==='bed-head')!;
        const x=ROOM_GRID.x+bed.col*32,y=ROOM_GRID.floorY;
        sleepingInkling(this,x,y,person.color,plan.palette,`inn-${person.id}-base`);
        this.sites=this.sites.filter(s=>s.label!=='BED');
        this.sites.push({x:x+16,y:y+48,label:`${person.name.toUpperCase()} — SLEEPING`,action:()=>this.say(`${person.name} is fast asleep. You leave them to rest.`)});
      }else{
      const stops=innRoutine(this.floor,this.room,getStoryProgress().worldClock),first=stops[0];
      const x=ROOM_GRID.x+first.col*32+16,y=ROOM_GRID.floorY+first.row*32+16;
      const {npc,body}=this.addPerson(person,x,y-16,wall);
      const site={x,y,label:`TALK TO ${person.name.toUpperCase()}`,action:()=>this.say(`${person.name}: ${person.line}`)};
      this.sites.push(site);this.guest={npc,body,site,stops,index:0,elapsed:0,walking:false};
      }
    }
    const copper=copperLocation(getStoryProgress().worldClock);
    if(this.floor===2&&this.room===1){
      if(copper==='inn-bed')sleepingInkling(this,224,224,0xcd7f32,'teal','road-knight-base');
      this.sites.push({x:240,y:272,label:'COPPER’S BUNK',action:()=>this.say(copper==='inn-bed'?'Copper is sleeping after her watch. Her helmet rests beside the bed.':'A spare uniform is folded beneath the pillow. Copper’s name is stitched into it.')});
    }
    if(!this.room&&this.floor===1&&copper==='inn-coffee'){
      storyResident(this,464,368,2,'DAME COPPER',0xcd7f32,true);wall(464,368,24,20);
      this.sites.push({x:464,y:368,label:'TALK TO DAME COPPER',action:()=>this.say('Copper: One coffee before the crossing. Give me a moment to wake up, then I’ll take my post.')});
    }
    if(!this.room){
      // A continuous wall band behind the doorframes, with no walkable pockets
      // between doors. The first corridor row is y=272.
      for(let col=0;col<ROOM_GRID.cols;col++)
        this.add.image(ROOM_GRID.x+col*32,ROOM_GRID.floorY,'interior-skirting').setOrigin(0).setDisplaySize(32,32).setDepth(-14);
      wall(400,240,ROOM_GRID.cols*32,32);
      INN_ROOM_COLUMNS.forEach((col,index)=>{
        const x=ROOM_GRID.x+col*32+16,y=ROOM_GRID.floorY+16;
        this.add.image(x-16,y-48,'interior-inn-door-top').setOrigin(0).setDisplaySize(32,32).setDepth(1);
        this.add.image(x-16,y-16,'interior-inn-door-bottom').setOrigin(0).setDisplaySize(32,32).setDepth(1);
        drawDoorLeaves(this,x,y+10,'bedroom',2);
        this.add.text(x,y-36,`${this.floor}0${index+1}`,{fontFamily:'Georgia',fontSize:'10px',color:'#f4e2b3',backgroundColor:'#49382d',padding:{x:2,y:2}}).setOrigin(.5).setDepth(3);
        this.sites.push({x,y,label:`ROOM ${this.floor}0${index+1}`,action:()=>{
          if(!canEnterInnRoom(this.floor,index+1,getStoryProgress().innRoomBooked===true)){
            this.say('Locked. A little brass tag reads “202”.\n\nAsk the innkeeper downstairs for a room.');return;
          }
          this.transitioning=true;this.player.stopMovement();
          openDoorAnimation(this,x,y+10,()=>this.player.walkThroughDoor(()=>this.change({floor:this.floor,room:index+1})),'bedroom');
        }});
      });
      // Three native tiles: recessed landing, shaded treads, and an open foot.
      const sx=528,sy=432;
      ['top','middle','foot'].forEach((part,index)=>{
        const y=sy-80+index*32;
        this.add.image(sx-16,y,`interior-inn-stairs-${part}`).setOrigin(0).setDisplaySize(32,32).setDepth(1);
        wall(sx,y+16,32,32);
      });
      this.sites.push({x:sx,y:sy,label:this.floor===1?'UPSTAIRS — FLOOR 2':'DOWNSTAIRS — FLOOR 1',action:()=>this.change({floor:this.floor===1?2:1,x:496,y:432})});
      if(this.floor===1)this.addInnkeeper(wall);
    }
    this.player=new Player(this,this.arrival.x??400,this.arrival.y??432,this.avatar,this.arrival.hearts??3);
    this.physics.add.collider(this.player.sprite,walls);
    frameWorld(this);
    this.cameras.main.setBackgroundColor('#080f1a');
    this.prompt=this.add.text(0,0,'',{fontFamily:'Arial',fontSize:'11px',color:'#fff0cf',backgroundColor:'#302b28',padding:{x:8,y:5}}).setOrigin(.5).setDepth(80).setVisible(false);
    this.input.keyboard!.addCapture('ONE,TWO');
    const choice=(event:KeyboardEvent)=>{
      if(!event.repeat&&this.dialogue?.choices&&(event.key==='1'||event.key==='2'))this.pendingChoice=event.key==='1';
    };
    this.input.keyboard!.on('keydown',choice);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.input.keyboard?.off('keydown',choice));
    this.readyAt=this.time.now+300;this.cameras.main.fadeIn(220,12,20,22);
  }
  private addPerson(person:typeof INN_PEOPLE[number],x:number,y:number,wall:(x:number,y:number,w:number,h:number)=>Phaser.Physics.Arcade.Image){
    const color=person.color,offset=AVATAR_BODY_OFFSETS[person.base];
    const npc=this.add.container(x,y).setScale(.78).setDepth(10);
    npc.add([createInkFoot(this,-10,21,color),createInkFoot(this,10,21,color),
      this.add.image(0,0,`inn-${person.id}-base`).setDisplaySize(AVATAR_LAYER_WIDTH,AVATAR_LAYER_HEIGHT),
      this.add.image(0,offset.eyesY,`inn-${person.id}-eyes`).setDisplaySize(AVATAR_LAYER_WIDTH,AVATAR_LAYER_HEIGHT),
      this.add.image(0,offset.accessoryY,`inn-${person.id}-accessory`).setDisplaySize(AVATAR_LAYER_WIDTH,AVATAR_LAYER_HEIGHT),
      createInkHand(this,-15,7,color),createInkHand(this,15,7,color)]);
    registerSpeaker(this,person.name,npc);const body=wall(x,y+16,32,32);
    return {npc,body};
  }
  private addInnkeeper(wall:(x:number,y:number,w:number,h:number)=>Phaser.Physics.Arcade.Image){
    const {npc}=this.addPerson(INN_PEOPLE[0],304,336,wall);
    dailyWork(this,npc,'concierge');
    npc.list.slice(0,2).forEach(part=>(part as Phaser.GameObjects.Graphics).setVisible(false));
    // Reception is reachable from the front of the desk.
    this.sites=this.sites.filter(site=>site.label!=='RECEPTION');
    this.sites.push({x:304,y:368,label:'TALK TO WREN',action:()=>{
      acceptSidequest('a-place-to-rest');
      const caretakers=acceptSidequest('lost-keepers');
      if(caretakers&&!getStoryProgress().wordwoodExpedition?.logGuardianFreed){this.say('Wren: The bridgekeeper and gardener haven’t come back from Wordwood. Would you look for them on your travels?\n\nAnd if you need a room, just ask me.');return;}
      if(getStoryProgress().innRoomBooked)this.say('Wren: Your key still fits, I promise. Upstairs, middle door — room 202.\n\nThere’s fresh linen if you need it.');
      else this.say('Wren: Welcome to the Lantern Inn. You look like the road has had its say. Shall I put you down for a room? It’s on the house.\n\n1 — Get a room     2 — No thanks',true);
    }});
  }
  update(_time:number,delta:number){
    if(this.transitioning||this.time.now<this.readyAt)return;
    if(this.sleepPose){
      if(this.time.now>=this.sleepUntil){
        this.sleepPose.destroy();this.sleepPose=undefined;this.player.setSleeping(false);
        this.player.restoreAfterSleep();this.rested=true;
        this.say('You wake beneath the warm quilt.\n\nAll hearts restored, plus one yellow bonus heart.');
      }
      return;
    }
    if(this.dialogue){
      this.player.stopMovement();
      if(this.dialogue.choices){
        if(this.pendingChoice!==null){const choice=this.pendingChoice;this.pendingChoice=null;this.choose(choice);}
      }else if(this.player.isInteractJustDown())this.closeDialogue();
      return;
    }
    this.player.update(delta);
    const clock=getStoryProgress().worldClock,key=`${clock?clockPhase(clock):''}:${copperLocation(clock)}`;
    if(key!==this.routineKey){this.player.stopMovement();this.scene.restart({floor:this.floor,room:this.room,hearts:this.player.hearts,rested:this.rested,x:this.player.x,y:this.player.y});return;}
    this.updateGuest(delta);
    const exit={x:400,y:464,label:this.room?'BACK TO THE LANDING':this.floor===1?'LEAVE THE INN':'DOWNSTAIRS',action:()=>{
      if(this.room){const col=INN_ROOM_COLUMNS[this.room-1];this.change({floor:this.floor,x:224+col*32+16,y:272});}
      else if(this.floor===2)this.change({floor:1,x:496,y:432});
      else this.leave();
    }};
    const near=[...this.sites,exit].map(site=>({site,d:interactionScore(this.player,site,site.label.startsWith('TALK TO')||site===exit||site.label.startsWith('ROOM')||site.label.includes('STAIRS')?48:34)})).filter(({d})=>Number.isFinite(d)).sort((a,b)=>a.d-b.d||Number(b.site.label.startsWith('TALK TO'))-Number(a.site.label.startsWith('TALK TO')))[0];
    const door=near&&(near.site===exit||near.site.label.startsWith('ROOM'));
    this.prompt.setVisible(!!near&&!door);
    if(near){
      if(door){if(this.player.wantsDoorAt(near.site.x,near.site===exit?exit.y:near.site.y+32,near.site===exit?'down':'up'))near.site.action();}
      else{this.prompt.setText(`[ E ] ${near.site.label}`).setPosition(this.player.x,this.player.y-62);if(this.player.isInteractJustDown())near.site.action();}
    }
  }
  private updateGuest(delta:number){
    const g=this.guest;if(!g)return;
    // Stop politely when approached; both the collision and talk target travel
    // with the complete rig, so guests never leave invisible blockers behind.
    const near=Math.hypot(this.player.x-g.site.x,this.player.y-g.site.y)<64;
    if(!near)g.elapsed+=Math.min(delta,50);
    if(!g.walking&&g.elapsed>=g.stops[g.index].wait){g.walking=true;g.elapsed=0;}
    if(g.walking&&!near){
      const from=g.stops[g.index],to=g.stops[1-g.index],p=Math.min(1,g.elapsed/800);
      const x=ROOM_GRID.x+16+32*(from.col+(to.col-from.col)*p);
      g.npc.x=Math.round(x);g.site.x=g.npc.x;g.body.setPosition(g.site.x,g.site.y).refreshBody();
      if(p===1){g.index=1-g.index;g.walking=false;g.elapsed=0;}
    }
    const eyes=g.npc.list[3] as Phaser.GameObjects.Image;
    eyes.setVisible(near||g.walking||(this.floor===1&&this.room===2)); // tea guest looks into the room
    const hands=g.npc.list.slice(-2) as Phaser.GameObjects.Container[];
    const working=!near&&!g.walking&&!(this.floor===1&&this.room===2);
    const kind=(this.floor-1)*3+(this.room??1)-1;
    const beat=Math.floor(g.elapsed/(kind===3?180:350))%4;
    hands.forEach((hand,i)=>{
      let x=i?15:-15,y=7;
      if(working){
        y=3;
        if(kind===4){x=i?10:-10;y-=beat<2?2:0;} // fold the linen inward
        else if(kind===2){x=i?10:-10;y-=i===1&&beat===3?2:0;} // turn a page
        else if(kind===1){x+=i===1?beat*2:0;y-=i===1?4:0;} // tend the pots
        else{x+=i===1?(beat%2)*2:0;y-=i===1&&beat%2===0?2:0;} // sort, repair, sketch
      }
      hand.setPosition(x,y);
    });
  }
  private say(line:string,choices=false){
    this.closeDialogue();this.player.stopMovement();this.prompt.setVisible(false);
    const panel=this.add.rectangle(400,492,704,176,0x182b2b,.98).setStrokeStyle(2,0xb59a70).setDepth(100);
    const text=this.add.text(66,422,line,{fontFamily:'Arial',fontSize:'16px',color:'#f3e9d0',wordWrap:{width:665},lineSpacing:5}).setDepth(101);
    const hint=this.add.text(730,566,choices?'1 / 2 — CHOOSE':'E — CONTINUE',{fontFamily:'Arial',fontSize:'11px',color:'#b8d0b8'}).setOrigin(1,.5).setDepth(101);
    this.dialogue={text,objects:[panel,text,hint],choices};this.readyAt=this.time.now+220;
    speak(this,line.startsWith('Wren:')?'WREN':'',line);
  }
  private choose(yes:boolean){
    if(yes){saveStoryProgress({innRoomBooked:true});this.say('Wren: Here’s your key. Second floor, second room — 202.\n\nThe bed is yours whenever you need a rest. If the stairs complain, tell them I sent you.');}
    else this.say('Wren: Of course. The fire’s free, and so is the company. Come back when your boots get tired.');
  }
  private closeDialogue(){this.dialogue?.objects.forEach(o=>o.destroy());this.dialogue=null;speak(this,'');}
  private change(data:Arrival){
    this.transitioning=true;this.player.stopMovement();this.cameras.main.fadeOut(180);
    this.time.delayedCall(200,()=>this.scene.restart({...data,hearts:this.player.hearts,rested:this.rested}));
  }
  private leave(){
    this.transitioning=true;this.player.stopMovement();this.cameras.main.fadeOut(180);
    this.time.delayedCall(200,()=>{this.scene.stop();this.scene.resume('DungeonScene',{rested:this.rested});});
  }
}
