import * as Phaser from 'phaser';
import Player from '../entities/Player';
import Blotling from '../entities/Blotling';
import type {StoryAvatarConfig} from '../avatar';
import {EventBus} from '../EventBus';
import {frameWorld} from '../world/framing';
import {repositoryArt} from '../world/repositoryArt';
import {wordwoodRain} from '../world/wordwoodRain';
import {expeditionCombat} from '../world/expeditionCombat';
import {ROOM_EXITS,ROOM_NAMES,expedition,saveExpedition,repositoryDrained,canEnterVault,collectTablet,type RepositoryRoom} from '../story/repository';

type Site={x:number;y:number;label:string;act:()=>void};
export default class RepositoryScene extends Phaser.Scene{
  private player!:Player;
  private walls!:Phaser.Physics.Arcade.StaticGroup;
  private enemies:Blotling[]=[];
  private room:RepositoryRoom='hall';
  private spawn={x:400,y:464};
  private hearts=3;
  private locked=false;
  private panel:Phaser.GameObjects.Container|null=null;
  private nextInput=0;
  private prompt!:Phaser.GameObjects.Text;
  private sites:Site[]=[];
  private combat!:(delta:number)=>void;
  private water!:Phaser.GameObjects.Graphics;
  private waterBlock?:Phaser.Physics.Arcade.Image;
  private block?:Phaser.Physics.Arcade.Image;
  private question?:{id:string;done:()=>void};
  private returnPoint={x:816,y:112};
  private arrivedAt=0;
  private tabletArt?:Phaser.GameObjects.Image;
  private sealArt?:Phaser.GameObjects.Graphics;
  private sideLatch?:Phaser.GameObjects.Graphics;
  constructor(private avatar:StoryAvatarConfig){super('RepositoryScene');}
  init(data:{room?:RepositoryRoom;x?:number;y?:number;hearts?:number;returnPoint?:{x:number;y:number}}){
    this.room=data.room??'hall';this.spawn={x:data.x??400,y:data.y??432};this.hearts=data.hearts??3;
    this.returnPoint=data.returnPoint??{x:816,y:112};
  }
  create(){
    this.locked=false;this.panel=null;this.question=undefined;this.sites=[];this.enemies=[];this.waterBlock=undefined;this.block=undefined;this.tabletArt=undefined;
    this.arrivedAt=this.time.now;
    this.physics.world.setBounds(160,160,480,320);
    this.walls=this.physics.add.staticGroup();
    const wall=(x:number,y:number,w:number,h:number)=>{
      const o=this.physics.add.staticImage(x,y,'__DEFAULT').setVisible(false).setDisplaySize(w,h).refreshBody();this.walls.add(o);return o;
    };
    const art=repositoryArt(this,this.room,wall);
    this.player=new Player(this,this.spawn.x,this.spawn.y,this.avatar,this.hearts);
    const depth=()=>art.updateDepth(this.player.y);
    depth();this.events.on(Phaser.Scenes.Events.POST_UPDATE,depth);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.events.off(Phaser.Scenes.Events.POST_UPDATE,depth));
    this.physics.add.collider(this.player.sprite,this.walls);
    this.water=this.add.graphics().setDepth(-7);
    const p=expedition();
    this.sideLatch=undefined;
    if((this.room==='hall'&&!p.key)||(this.room==='seal'&&!p.seal)){
      this.sealArt=this.add.graphics().setDepth(-3);
      for(let x=388;x<416;x+=8)this.sealArt.fillStyle(0x82988c).fillRect(x,112,3,46);
      this.sealArt.fillStyle(0xb4aa78).fillRect(384,132,32,4).fillRect(397,128,6,10);
    }
    if(this.room==='hall'){
      if(!repositoryDrained())this.waterBlock=wall(400,256,480,64);
      this.drawWater(!repositoryDrained());
      this.sites.push({x:432,y:368,label:'READ THE FLOOR PLAN',act:()=>this.say('SUNKEN REPOSITORY\n\nWest: sluice controls. East: records and chamber key.\nNorth: sealed Tablet vault.\n\nA caretaker has added: Drain the passage before crossing. The water is deeper than it looks.')});
      art.prop('way-sign',448,352);
    }
    if(this.room==='drain'||this.room==='maintenance'){
      const outdoor=this.room==='maintenance',done=outdoor?p.maintenance:p.drained;
      this.drawWater(!done,true);
      this.sites.push({x:528,y:240,label:'OPERATE THE SLUICE',act:()=>outdoor?this.say(expedition().maintenance?'The channel is empty. The Gallery’s release cord has lifted the sluice.':'The wheel will not turn. A taut brass cord runs through the wall toward the Rain Gallery.'):done||expedition().drained?this.say('The channel is clear. Rainwater flows safely through the open sluice.'):this.ask('The flooded passage needs to empty. Which instruction belongs on the sluice?',['RETAIN — keep the water here','RELEASE — let the water out','REPLENISH — fill it again'],1,()=>{
        saveExpedition(outdoor?{maintenance:true}:{drained:true});this.drawWater(false,true);
        this.say(outdoor?'The wheel turns. Outside, the bridge braces settle firmly into place.\n\nREMOTE SLUICE RESTORED\nThe same channel drains the Repository hall, making it safe to cross.\n\nA keeper’s carving reads: STURDY timber bears a loaded cart.':'The sluice opens. Water rushes out of the entrance hall, exposing its submerged steps.');
      })});
      if(outdoor){
        art.prop('chest',320,288);
        this.sites.push({x:336,y:336,label:'OPEN THE WATERLOGGED CHEST',act:()=>{
          if(!expedition().maintenance){this.say('Water presses against the chest lid. A brass key glints beneath the surface.');return;}
          if(this.enemies.some(e=>!e.defeated)){this.say('The creatures crowd the chest. There is no room to lift its heavy lid.');return;}
          if(expedition().gardenGateKey){this.say('Only a leaf-shaped impression remains in the chest’s lining.');return;}
          saveExpedition({gardenGateKey:true});this.say('GARDENER’S GATE KEY\n\nA rain-darkened key rests in the drained chest. Its bow bears the same leaf carved on the northern gate.');
        }});
        this.sites.push({x:256,y:272,label:'INSPECT THE BRIDGEKEEPER’S BENCH',act:()=>this.say('Drawknives, pegs and a small bridge model share the scarred oak bench. Each joint is marked in charcoal: STURDY enough for rain, wheels and hurried travellers.')});
      }
    }
    if(this.room==='records'){
      art.prop('chest',384,192);
      this.sites.push({x:400,y:272,label:'OPEN THE KEEPER’S CHEST',act:()=>{
        if(this.enemies.some(e=>!e.defeated)){this.say('Blotlings are crowding the records. Clear the room before opening the chest.');return;}
        if(expedition().key){this.say('The chest is empty. You already have the chamber key.');return;}
        saveExpedition({key:true});this.say('REPOSITORY KEY\n\nA heavy brass key with a leaf-shaped bow. It fits the northern seal chamber. The passage back to the hall is clear.');
      }});
    }
    if(this.room==='seal')this.sites.push({x:400,y:272,label:'RESTORE THE VAULT SEAL',act:()=>{
      if(expedition().seal){this.say('The inscription holds. The vault passage to the north is open.');return;}
      this.ask('“Keep the original inscription intact.” Which word has the same meaning as PRESERVE?',['ERASE','SCATTER','PROTECT'],2,()=>{saveExpedition({seal:true});this.sealArt?.destroy();this.say('PROTECT: keep safe from harm. The seal settles into place. The northern vault passage opens.');});
    }});
    if(this.room==='vault'){
      if(!p.tablet)this.tabletArt=this.add.image(400,231,'interior-tablet').setDisplaySize(32,32).setDepth(3);
      this.sites.push({x:400,y:272,label:expedition().tablet?'EXAMINE THE EMPTY STAND':'TAKE THE WORDWOOD TABLET',act:()=>this.takeTablet()});
    }
    if(this.room==='gallery'){
      const mount=this.add.graphics().setDepth(2);
      mount.fillStyle(0x20383d,.65).fillRect(388,130,28,30);
      mount.fillStyle(0x56483d).fillRect(398,112,4,18);
      mount.fillStyle(0xd1b980).fillRect(398,112,2,16);
      const target=this.add.image(400,144,'interior-archery-target').setDisplaySize(32,32).setDepth(3);
      this.sites.push({x:400,y:208,label:'INSPECT THE BRASS TARGET',act:()=>this.say(expedition().gallery?'The struck target hangs loose. Water no longer pulls against its cord.':'Arrow dents surround a brass release plate. Its cord leads to a pipe marked with the bridgekeeper’s crest. A bowshot would reach it from below.')});
      this.sites.push({x:400,y:272,label:'READ THE GALLERY INSCRIPTION',act:()=>this.say('Tiny punctures surround the keeper’s brass mark. A taut cord disappears into the northern lintel.\n\nAlong the wall: HOLLOW means empty inside. A tunnel needs room to pass through.')});
      this.sites.push({x:272,y:400,label:'EXAMINE THE RAIN COLLECTOR',act:()=>this.say('A copper tongue guides each drop into a measuring bowl. The framed records compare rainfall, river height and the slow swelling of bridge timbers.')});
      this.combat=expeditionCombat(this,this.player,this.walls,this.enemies,()=>this.locked||!!this.panel||!!this.question,()=>this.die(),arrow=>{
        if((!expedition().gallery||!expedition().maintenance)&&Math.hypot(arrow.x-400,arrow.y-176)<24){arrow.destroy();saveExpedition({gallery:true,maintenance:true});target.setY(146);this.sideLatch?.destroy();this.say('The target releases its brass cord. Water thunders through the pipe toward the bridge. The bridgekeeper’s flooded channel empties, leaving the chest above water.\n\nRAINSTRING ACQUIRED\nYour arrows deal double damage in Wordwood’s buildings and Repository.');}
      });
    }
    if(this.room==='store'){
      this.add.image(464,336,'interior-stone-seed').setDisplaySize(32,32).setDepth(-6);
      if(!p.store){this.block=this.physics.add.staticImage(368,336,'interior-stone').setDisplaySize(32,32).refreshBody();this.walls.add(this.block);}
      else this.add.image(464,336,'interior-stone').setDisplaySize(32,32).setTint(0xaebf95);
      this.sites.push({x:336,y:336,label:'EXAMINE THE WORN STONE',act:()=>{
        if(!this.block){this.say('The stone holds the plate down. The seed cabinet is open.');return;}
        const x=this.block.x+32;this.block.setX(x).refreshBody();this.sites[0].x=x-32;
        if(x===464){saveExpedition({store:true});this.player.healFully();this.block=undefined;this.sideLatch?.destroy();this.say('The seed cabinet opens. Roots stir beneath the floor, reaching for the winding trail.\n\nHERBAL RESERVE ACQUIRED\nHealth restored. Three extra bundles will heal you automatically when an enemy leaves you at one heart.\n\nThe cabinet shelves are stocked again.');}
      }});
      this.sites.push({x:544,y:384,label:'READ THE SEED LEDGER',act:()=>this.say('Acorn, ash and cedar are separated into dovetailed bins. Bundles of mint and yarrow dry below a note: Plant for the path that will be here in fifty years.')});
    }
    if(!p.cleared?.includes(this.room)&&['records','vault','gallery','maintenance','store','seal'].includes(this.room)){
      const points=this.room==='vault'?[[272,336],[528,336],[400,400]]:[[336,368],[464,368]];
      for(const [i,[x,y]] of points.entries())this.enemies.push(new Blotling(this,x,y,this.room==='vault'&&i===2?4:2,i%2?'blotling':'woodling'));
    }
    // Setup after spawning so projectiles and enemies share the same collision set.
    if(this.room!=='gallery')this.combat=expeditionCombat(this,this.player,this.walls,this.enemies,()=>this.locked||!!this.panel||!!this.question,()=>this.die());
    else for(const e of this.enemies)this.physics.add.collider(e.sprite,this.walls);
    frameWorld(this);this.cameras.main.centerOn(400,304);
    if(['drain','maintenance','gallery'].includes(this.room))wordwoodRain(this,[{x:320,y:160,w:160,h:96}]);
    this.prompt=this.add.text(0,0,'',{fontSize:'12px',color:'#eee1be',backgroundColor:'#142b2d',padding:{x:8,y:6}}).setOrigin(.5).setDepth(80);
    const answer=({doorId,correct}:{doorId:string;correct:boolean})=>{
      if(this.question?.id!==doorId)return;
      const done=this.question.done;this.question=undefined;
      if(correct)done();
    };
    EventBus.on('repository-question-result',answer);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
      EventBus.off('repository-question-result',answer);
      EventBus.emit('repository-question-closed');
    });
    const title=this.add.text(400,65,ROOM_NAMES[this.room],{fontFamily:'Georgia',fontSize:'22px',color:'#e4d9b6',backgroundColor:'#15272e',padding:{x:16,y:8}}).setOrigin(.5).setScrollFactor(0).setDepth(101);
    this.tweens.add({targets:title,alpha:0,delay:1800,duration:500,onComplete:()=>title.destroy()});
    EventBus.emit('health-changed',{hearts:this.player.hearts});
    this.cameras.main.fadeIn(180);
  }
  private drawWater(full:boolean,channel=false){
    const g=this.water;g.clear();const x=channel?288:160,y=channel?256:224,w=channel?64:480,h=channel?160:64;
    g.fillStyle(full?0x294d60:0x3d5655).fillRect(x,y,w,h);
    for(let yy=y+4;yy<y+h;yy+=16)for(let xx=x+4;xx<x+w;xx+=32){
      g.fillStyle(full?0x648d94:0x7c9180).fillRect(xx,yy,20,2);
      if(!full)g.fillStyle(0xa8af96).fillRect(xx,yy+8,24,3);
    }
  }
  private say(text:string){
    this.question=undefined;this.panel?.destroy();this.player.stopMovement();this.prompt?.setVisible(false);
    const bg=this.add.rectangle(400,424,704,248,0x10242b,.98).setStrokeStyle(2,0x859b8c);
    const copy=this.add.text(72,324,text,{fontFamily:'Georgia',fontSize:'17px',color:'#eee1be',wordWrap:{width:656},lineSpacing:5});
    const hint=this.add.text(728,524,'E · CONTINUE',{fontSize:'12px',color:'#a9c1b4'}).setOrigin(1,0);
    this.panel=this.add.container(0,0,[bg,copy,hint]).setDepth(100).setScrollFactor(0);this.nextInput=this.time.now+250;
    this.enemies.forEach(e=>{if(!e.defeated)e.sprite.setVelocity(0,0);});
  }
  private ask(text:string,options:string[],correct:number,done:()=>void){
    this.panel?.destroy();this.panel=null;this.player.stopMovement();this.prompt.setVisible(false);
    this.enemies.forEach(e=>{if(!e.defeated)e.sprite.setVelocity(0,0);});
    const id=`repository-${this.room}-${this.time.now}`;this.question={id,done};
    EventBus.emit('repository-question',{doorId:id,title:ROOM_NAMES[this.room],gateNumber:1,question:{prompt:text,choices:options,answer_index:correct,skill_tag:'word-meaning'}});
  }
  private travel(room:RepositoryRoom,x=400,y=432){
    this.locked=true;this.player.stopMovement();this.scene.restart({room,x,y,hearts:this.player.hearts,returnPoint:this.returnPoint});
  }
  private outside(point=this.returnPoint){
    this.locked=true;this.player.stopMovement();this.scene.start('WordwoodScene',{returnPoint:point,hearts:this.player.hearts});
  }
  private die(){this.locked=true;this.cameras.main.fadeOut(350);this.time.delayedCall(380,()=>this.scene.restart({room:this.room,x:400,y:432,hearts:3,returnPoint:this.returnPoint}));}
  private takeTablet(){
    if(expedition().tablet){this.say('The stand is empty. Bring the Wordwood Tablet to Bellum in Inkwell’s Archive.');return;}
    if(this.enemies.some(e=>!e.defeated)){this.say('Violet ink still stirs around the stand. Clear the vault first.');return;}
    if(!collectTablet())return;
    this.tabletArt?.destroy();
    this.locked=true;this.player.holdItemAboveHead();this.prompt.setVisible(false);
    const item=this.add.image(this.player.x,this.player.y-58,'interior-tablet').setDisplaySize(32,32).setDepth(25);
    const title=this.add.text(400,130,'WORDWOOD TABLET',{fontFamily:'Georgia',fontSize:'26px',color:'#eee4be',backgroundColor:'#142730',padding:{x:20,y:12}}).setOrigin(.5).setDepth(110).setScrollFactor(0);
    const sound=this.sound as Phaser.Sound.WebAudioSoundManager;
    if(!sound.mute&&sound.context){
      const ctx=sound.context;void ctx.resume();
      [392,523.25,659.25,783.99].forEach((hz,i)=>{const o=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+i*.17;
        o.type='triangle';o.frequency.value=hz;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(.08*sound.volume,start+.02);gain.gain.exponentialRampToValueAtTime(.001,start+.5);o.connect(gain);gain.connect(ctx.destination);o.start(start);o.stop(start+.55);});
    }
    this.time.delayedCall(2400,()=>{item.destroy();title.destroy();this.locked=false;this.say('WORDWOOD TABLET\n\nAn ancient inscription, stained with unfamiliar violet ink.\n\nBring it to Bellum in the Inkwell Archive. The southern passage leads straight back outside.');});
  }
  update(_time:number,delta:number){
    if(this.locked)return;
    if(this.question)return;
    if(this.panel){
      if(this.time.now<this.nextInput)return;
      if(this.panel&&this.player.isInteractJustDown()){this.panel.destroy();this.panel=null;this.question=undefined;}
      return;
    }
    this.player.update(delta);this.combat(delta);if(this.player.isDying)return;
    if(this.enemies.length&&this.enemies.every(e=>e.defeated)&&!expedition().cleared?.includes(this.room))saveExpedition({cleared:[...(expedition().cleared??[]),this.room]});
    const nearby=this.sites.find(s=>Math.abs(s.x-this.player.x)+Math.abs(s.y-this.player.y)<=40);
    this.prompt.setVisible(!!nearby);if(nearby){this.prompt.setText('[ E ] '+nearby.label).setPosition(this.player.x,this.player.y-52);if(this.player.isInteractJustDown()){nearby.act();return;}}
    if(this.time.now-this.arrivedAt<450)return;
    const at=(x:number,y:number)=>Math.abs(this.player.x-x)<1&&Math.abs(this.player.y-y)<1;
    if(ROOM_EXITS[this.room].includes('south')&&at(400,464)&&this.player.wantsDoor('down')){
      if(['hall','maintenance','gallery','store'].includes(this.room))this.outside();
      else if(this.room==='records')this.travel('hall',592,336);
      else if(this.room==='drain')this.travel('hall',208,336);
      else this.travel(this.room==='vault'?'seal':'hall',400,208);return;
    }
    if(ROOM_EXITS[this.room].includes('west')&&at(176,336)){if(this.room==='hall')this.travel('drain',592,336);else if(this.room==='records')this.travel('hall',592,336);return;}
    if(ROOM_EXITS[this.room].includes('east')&&at(624,336)){if(this.room==='hall')this.travel('records',208,336);else if(this.room==='drain')this.travel('hall',208,336);return;}
    if(ROOM_EXITS[this.room].includes('north')&&at(400,176)&&this.player.wantsDoor('up')){
      if(this.room==='hall'){
        if(!repositoryDrained()||!expedition().key)this.say('The northern seal chamber needs its brass key. Look in the record room to the east.');else this.travel('seal');
      }else if(this.room==='seal'){
        if(canEnterVault())this.travel('vault');else this.say('Restore the inscription on the lectern before entering the vault.');
      }
    }
  }
}
