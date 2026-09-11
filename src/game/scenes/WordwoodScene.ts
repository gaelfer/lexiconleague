import * as Phaser from 'phaser';
import { frameWorld } from '../world/framing';
import {foreground} from '../world/foreground';
import {drawBuildingSign} from '../world/buildingSign';
import {wallSignReader} from '../world/wallSignReader';
import Player from '../entities/Player';
import type { StoryAvatarConfig } from '../avatar';
import { CLUES, WORDS, checkWordwood, type Word } from '../story/wordwoodPuzzle';
import { getStoryProgress, saveStoryProgress } from '@/lib/story/progress';
import { grassTiles, villagePaths } from '../world/pixelTerrain';
import { leafCluster } from '../world/InkwellVillage';
import { drawGatehouse,enterGatehouse } from '../world/gatehouse';
import {openDoorAnimation} from '../world/doorOpening';
import { advanceEcho } from '../story/areaTravel';
import { wordwoodDetails } from '../world/wordwoodDetails';
import {wordwoodRain} from '../world/wordwoodRain';
import {expedition,saveExpedition,landmarkRestored,canOpenGardenGate,type RepositoryRoom} from '../story/repository';
import {wordwoodExterior} from '../world/wordwoodExteriors';
import {EventBus} from '../EventBus';
import {LogGuardian} from '../entities/LogGuardian';
import {expeditionCombat} from '../world/expeditionCombat';
import {createKeeper,keeperSpeech} from '../world/keepers';
import {rollKeeperActivities} from '../story/keeperActivities';
import {keeperWalkHome} from '../world/keeperWalkHome';
import {compactDialogue} from '../world/compactDialogue';
import {wordwoodStream} from '../world/wordwoodStream';
import {secondaryBridge} from '../world/secondaryBridge';

interface Site { x: number; y: number; label: string; action: () => void }

/** A quiet, interconnected exploration puzzle. All clues and signs remain reachable. */
export default class WordwoodScene extends Phaser.Scene {
  private player!: Player;
  private puzzleObjects:Phaser.GameObjects.GameObject[]=[];
  private gardenPlanted=false;
  private guardian?:LogGuardian;
  private guardianCombat?:(delta:number)=>void;
  private prompt!: Phaser.GameObjects.Text;
  private sites: Site[] = [];
  private words: Word[] = ['hollow', 'hollow', 'hollow'];
  private found = new Set<number>();
  private labels: Phaser.GameObjects.Text[] = [];
  private panel: Phaser.GameObjects.Container | null = null;
  private nextInput = 0;
  private solved = false;
  private gate!: Phaser.Physics.Arcade.Image;
  private gateArt!:Phaser.GameObjects.Graphics;
  private gateGrowth!:Phaser.GameObjects.Graphics;
  private completed = false;
  private locked=false;
  private echoStep=0;
  private echoOpen=false;
  private lastStone=-1;
  private echoTiles:Phaser.GameObjects.Rectangle[]=[];
  private feedback!:Phaser.GameObjects.Text;
  private landmarkChanges!:Phaser.GameObjects.Graphics;
  private returnPoint?:{x:number;y:number};
  private returnHearts=3;
  private enteredAt=0;

  constructor(private avatar: StoryAvatarConfig) { super({ key: 'WordwoodScene' }); }
  init(data:{returnPoint?:{x:number;y:number};hearts?:number}={}){this.returnPoint=data.returnPoint;this.returnHearts=data.hearts??3;}

  create() {
    this.data.set('keeper-speaking',false);
    this.locked=false;
    this.puzzleObjects=[];this.gardenPlanted=false;
    this.guardian=undefined;this.guardianCombat=undefined;
    this.enteredAt=this.time.now;
    this.sites = []; this.labels = []; this.panel = null; this.completed = false;
    this.words=['hollow','hollow','hollow'];this.found=new Set();this.solved=false;
    this.echoStep=0;this.echoOpen=false;this.lastStone=-1;this.echoTiles=[];
    try {
      const saved = JSON.parse(getStoryProgress().chapterCheckpoints[2] || '{}');
      if (Array.isArray(saved.words) && saved.words.length === 3 && saved.words.every((w: Word) => WORDS.includes(w))) this.words = saved.words;
      if (Array.isArray(saved.found)) this.found = new Set(saved.found.filter((n: number) => Number.isInteger(n) && n >= 0 && n < 3));
      this.solved = saved.solved === true && checkWordwood(this.words) === null;
      this.echoOpen=this.solved&&saved.echoOpen===true;
      if(this.solved&&Number.isInteger(saved.echoStep)&&saved.echoStep>=0&&saved.echoStep<3)this.echoStep=saved.echoStep;
    } catch { /* Old checkpoint formats safely start a new puzzle. */ }
    this.physics.world.setBounds(0, 0, 1600, 1200);
    const walls = this.physics.add.staticGroup();
    const obstacle = (x: number, y: number, w: number, h: number) => {
      const body = this.physics.add.staticImage(x, y, '__DEFAULT').setVisible(false);
      body.setDisplaySize(w, h).refreshBody(); walls.add(body);
    };
    const g = this.add.graphics().setDepth(-20);
    grassTiles(g, 0, 0, 1600, 1200);
    grassTiles(g,0,-128,1600,128);
    wordwoodStream(this,g);
    // Paths make a loop around the central clearing; every clue is reachable in any order.
    villagePaths(g, [[256,320,64,576],[256,256,1088,64],[1280,320,64,576],
      [256,896,1088,64],[768,256,64,768],[256,576,1088,64]]);
    const repairSecondaryBridge=secondaryBridge(this,walls,!!expedition().logGuardianFreed);
    for (let sy = -64; sy <= 64; sy += 32) {
      for (let sx = -64; sx <= 64; sx += 32) {
        if (sx * sx + sy * sy > 80 * 80) continue;
        g.fillStyle((sx + sy) % 48 ? 0x778672 : 0x88937b);
        g.fillRect(784 + sx, 594 + sy, 30, 30);
        g.fillStyle(0xa0aa8c).fillRect(785 + sx, 594 + sy, 27, 1);
      }
    }
    for (let x = 40; x < 1600; x += 80) {
      if(x<704||x>896){this.tree(g,x,80);obstacle(x,75,68,95);}
      this.tree(g, x, 1135);obstacle(x, 1150, 68, 60);
    }
    for (let y = 170; y < 1100; y += 85) {
      this.tree(g, 70, y); this.tree(g, 1530, y);
      obstacle(65, y, 65, 55); obstacle(1535, y, 65, 55);
    }
    for (const [x, y] of [[440, 440], [540, 790], [1008, 445], [1110, 790], [450, 1080], [1190, 1050]]) {
      this.tree(g, x, y); obstacle(x, y + 10, 40, 38);
    }
    // Three exhibits illustrate the meanings without requiring outside knowledge.
    g.fillStyle(0x433e32).fillRect(256,400,64,128);
    for(let y=402;y<528;y+=10){
      g.fillStyle(0xa7895e).fillRect(258,y,60,8);g.fillStyle(0xd4bb85).fillRect(258,y,58,1);
      g.fillStyle(0x756044).fillRect(279+(y%3)*7,y+2,1,5);
    }
    for(const x of [250,320]){g.fillStyle(0x5c4b37).fillRect(x,400,5,128);g.fillStyle(0xb6a073).fillRect(x,400,2,128);}
    g.fillStyle(0x76583b); g.fillRoundedRect(1210, 415, 225, 82, 35);
    g.fillStyle(0x15251f); g.fillEllipse(1223, 457, 49, 63);
    g.lineStyle(5, 0xb39a65); g.strokeEllipse(1223, 457, 49, 63);
    villagePaths(g,[[640,800,64,32],[672,768,64,32],[704,768,32,64],[704,800,64,32],[736,768,32,64],[768,768,32,32]]);
    for(let x=1256;x<1424;x+=16){g.fillStyle(0x4f4634).fillRect(x,432,2,43);g.fillStyle(0xb59460).fillRect(x+3,432,2,30);}

    wordwoodDetails(this,obstacle);
    this.landmarkChanges=this.add.graphics().setDepth(-9);
    villagePaths(g,[[640,1056,128,64],[736,928,64,192]]);
    drawGatehouse(this,656,1072,obstacle);
    const gateSign={id:'wayfarer',x:688,y:1072,mountY:1044,name:'WAYFARER GATEHOUSE'};
    drawBuildingSign(this,gateSign);
    // The final gate spans the entire entrance to the little northern sanctuary.
    obstacle(384,144,768,32);obstacle(1216,144,768,32);
    for(let x=0;x<1600;x+=32)if(x<768||x>=832){g.fillStyle(0x435b4c).fillRect(x,128,32,32);g.fillStyle(0x8b9876).fillRect(x,128,32,3);}
    this.gate = this.physics.add.staticImage(800, 144, '__DEFAULT').setDisplaySize(64,32).setTint(0x72816c).refreshBody();
    this.gate.setVisible(false);walls.add(this.gate);
    this.gateArt=this.add.graphics().setDepth(2);
    this.gateArt.fillStyle(0x4e483a).fillRect(764,112,8,48).fillRect(828,112,8,48).fillRect(768,118,64,6).fillRect(768,150,64,6);
    this.gateArt.fillStyle(0xb7aa7b).fillRect(765,112,2,46).fillRect(768,118,64,2);
    for(let x=776;x<828;x+=12){this.gateArt.fillStyle(0x647b58).fillRect(x,123,4,27);this.gateArt.fillStyle(0x9ba778).fillRect(x,123,1,22);}
    this.gateGrowth=this.add.graphics().setDepth(3);
    for(let row=0;row<5;row++)for(let col=0;col<7;col++){
      const x=752+col*14+(row%2)*6,y=104+row*12;
      this.gateGrowth.fillStyle(0x203e32).fillRect(x,y,20,14);
      this.gateGrowth.fillStyle((col+row)%2?0x496a40:0x385b3b).fillRect(x+2,y,14,8);
      this.gateGrowth.fillStyle(0x81965d).fillRect(x+2,y,8,2);
      if(col%2===0)this.gateGrowth.fillStyle(0x756044).fillRect(x+8,y+8,4,10);
    }
    this.sites.push({x:816,y:176,label:'INSPECT THE GARDENER’S GATE',action:()=>{
      if(!this.echoOpen){this.say('Thick brambles swallow the gate. Small buds cling to the tangled stems.');return;}
      if(!canOpenGardenGate()){this.say(!expedition().maintenance?'Water still strains against the gate’s lower hinges.':!expedition().gardenGateKey?'The exposed lock bears a leaf. A water-stained carving beside it shows the bridgekeeper’s chest.':'Dark roots still grip the hinges. Something stirs in the gallery or storehouse.');return;}
      saveExpedition({gardenGateOpened:true});this.gate.body!.enable=false;this.tweens.add({targets:this.gateArt,y:-24,alpha:0,duration:500});
      this.say('The leaf key turns. Freed from the water and restless roots, the gate lifts.');
    }});
    const arriving=new URLSearchParams(window.location.search).get('arrival')==='gatehouse';
    const checkpoint=expedition().checkpoint&&this.echoOpen&&!arriving?{x:816,y:112}:undefined;
    this.player = new Player(this,this.returnPoint?.x??checkpoint?.x??(arriving?656:800),this.returnPoint?.y??checkpoint?.y??(arriving?1104:944),this.avatar,this.returnHearts);
    EventBus.emit('health-changed',{hearts:this.player.hearts});
    wallSignReader(this,this.player,[gateSign]);
    if(process.env.NODE_ENV==='development'){
      const review=new URLSearchParams(window.location.search).get('sceneReview');
      const points:Record<string,[number,number]>={stone:[816,784],bridge:[272,592],burrow:[1296,592],sanctuary:[816,208]};
      if(review&&points[review])this.player.sprite.body!.reset(...points[review]);
    }
    this.physics.add.collider(this.player.sprite, walls);
    this.cameras.main.setBounds(0, -128, 1600, 1328).startFollow(this.player.sprite, true, 0.12, 0.12);
    frameWorld(this);
    wordwoodRain(this);
    // Small separate interiors extend the woodland loop without replacing its puzzle.
    for(const [room,x,y] of [['maintenance',432,240],['gallery',1136,560],['store',1008,880],['hall',816,80]] as const){
      if(room!=='hall')villagePaths(g,[[x-16,y-16,32,room==='store'?64:80]]);
      const width=room==='hall'?96:128;
      const masonry=this.add.graphics().setDepth(-4);
      masonry.fillStyle(0x263d38).fillRect(x-width/2,y-80,width,64);
      for(let yy=y-80;yy<y-16;yy+=16)for(let xx=x-width/2;xx<x+width/2;xx+=32){
        masonry.fillStyle(yy%32?0x778675:0x657c6e).fillRect(xx+1,yy+1,30,14);
        masonry.fillStyle(0xa6ad8e).fillRect(xx+2,yy+1,27,2);
      }
      masonry.fillStyle(0x162b28).fillRect(x-16,y-48,32,32);
      masonry.fillStyle(0xb4b399).fillRect(x-20,y-52,40,5).fillRect(x-20,y-48,4,32).fillRect(x+16,y-48,4,32);
      masonry.fillStyle(0x425f48).fillRect(x-width/2,y-84,width,6);
      masonry.fillStyle(0x899568).fillRect(x-width/2+4,y-84,22,2).fillRect(x+20,y-84,12,2);
      masonry.fillStyle(0x788b73).fillRect(x-16,y-16,32,8);masonry.fillStyle(0xc1c3a1).fillRect(x-16,y-16,32,2);
      obstacle(x,y-64,width,32);obstacle(x-width/4-8,y-32,width/2-16,32);obstacle(x+width/4+8,y-32,width/2-16,32);
      masonry.destroy();wordwoodExterior(this,room,x,y);
      this.sites.push({x,y,label:`ENTER ${room}`,action:()=>this.enterRepository(room,{x,y})});
      const plaque={id:room,x:x+32,y,mountY:y-32,name:room==='hall'?'SUNKEN REPOSITORY':room==='gallery'?'RAIN GALLERY':room==='store'?'GARDENER’S STOREHOUSE':'BRIDGEKEEPER’S WORKSHOP'};
      drawBuildingSign(this,plaque);wallSignReader(this,this.player,[plaque]);
    }
    this.input.keyboard!.addCapture(Phaser.Input.Keyboard.KeyCodes.J);
    this.input.keyboard!.on('keydown-J', this.openJournal, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-J', this.openJournal, this);
    });
    this.prompt = this.add.text(0, 0, '', { fontFamily: 'Arial', fontSize: '12px', color: '#f3e3c2', backgroundColor: '#142b27', padding: { x: 10, y: 7 } }).setOrigin(0.5).setDepth(80);
    this.feedback=this.add.text(400,74,'',{fontFamily:'Georgia',fontSize:'14px',color:'#e5dab3',backgroundColor:'#283e34',padding:{x:12,y:6}}).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);
    const beforePuzzle=new Set(this.children.list);
    for(const [i,x] of [688,816,944].entries()){
      const pad=this.add.rectangle(x,720,32,32,0x657668,0).setStrokeStyle(1,0x67796a).setDepth(-3);this.echoTiles.push(pad);
      this.add.image(x,720,`interior-stone-${['seed','bloom','sprout'][i]}`).setDisplaySize(32,32).setDepth(2);
      this.add.text(x,749,['SEED','BLOOM','SPROUT'][i],{fontSize:'8px',color:'#d4cba5'}).setOrigin(0.5).setDepth(2);
    }
    const signPositions = [[272,560],[1296,560],[816,880]];
    ['BRIDGE', 'BURROW', 'TRAIL'].forEach((name, i) => {
      const [x, y] = signPositions[i];
      this.add.image(x,y,'interior-way-sign').setDisplaySize(32,32).setDepth(2);obstacle(x,y,32,32);
      const label = this.add.text(x, y - 29, '', { fontFamily: 'Georgia', fontSize: '10px', color: '#eddfb8',backgroundColor:'#31483c',padding:{x:4,y:3} }).setOrigin(0.5).setDepth(3);
      this.labels.push(label);
      this.sites.push({ x, y: y + 30, label: `CHANGE ${name} WORD`, action: () => {
        if (this.solved) { this.say('The restored sign holds steady. The sanctuary is north of the central stone.'); return; }
        this.words[i] = WORDS[(WORDS.indexOf(this.words[i]) + 1) % WORDS.length];
        this.refreshSigns(); this.save();
      } });
    });
    [[208,304],[1360,304],[1104,944]].forEach(([x, y], i) => {
      this.add.image(x,y,'interior-lectern').setDisplaySize(32,32).setDepth(2);obstacle(x,y,32,32);
      this.sites.push({ x, y: y + 28, label: 'READ FIELD NOTE', action: () => { this.found.add(i); this.save(); this.say(CLUES[i] + '\n\nCopied into your field notes. Press J to reread them anywhere.'); } });
    });
    const plinth=this.add.graphics().setDepth(-8);
    plinth.fillStyle(0x455f52).fillRect(768,608,64,32);plinth.fillStyle(0xb5bd9b).fillRect(768,608,64,3);
    this.add.image(768,576,'interior-tablet').setDisplaySize(32,32).setOrigin(0).setDepth(2);
    this.add.image(800,576,'interior-lectern').setDisplaySize(32,32).setOrigin(0).setDepth(2);
    obstacle(800,608,64,64);
    this.sites.push({ x: 800, y: 664, label: 'TEST THE THREE SIGNS', action: () => this.testSigns() });
    this.puzzleObjects=this.children.list.filter(object=>!beforePuzzle.has(object));
    const beforeVerse=new Set(this.children.list);
    this.add.image(608,768,'interior-desk').setDisplaySize(32,32).setOrigin(0).setDepth(2);obstacle(624,784,32,32);
    this.puzzleObjects.push(...this.children.list.filter(object=>!beforeVerse.has(object)));
    this.sites.push({x:656,y:1072,label:'RETURN THROUGH THE GATEHOUSE',action:()=>{this.save();this.player.stopMovement();this.locked=true;openDoorAnimation(this,656,1056,()=>this.player.walkThroughDoor(()=>enterGatehouse(this,'wordwood')),'wayfarer');}});
    const resumeVisit=()=>{if(expedition().logGuardianFreed){this.scene.restart({hearts:this.player.hearts});return;}this.locked=false;this.cameras.main.fadeIn(180);};
    this.events.on(Phaser.Scenes.Events.RESUME,resumeVisit);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.events.off(Phaser.Scenes.Events.RESUME,resumeVisit));
    this.sites.push({x:624,y:784,label:'READ THE GARDENER’S VERSE',action:()=>this.say('First a SEED sleeps below.\nThen a SPROUT greets the sun.\nAt last the BLOOM opens.\n\nWhen the signs agree, walk this story across the three stones. A wrong step begins the verse again; nothing else is lost.')});
    this.refreshSigns(); if (this.echoOpen) this.openRoute();
    if(expedition().logGuardianFreed){
      this.plantGarden();
      if(!this.returnPoint||!this.registry.has('wordwood-keepers'))this.registry.set('wordwood-keepers',rollKeeperActivities());
      const activities=this.registry.get('wordwood-keepers');
      if(activities.gardener==='garden'){
        const gardener=createKeeper(this,'gardener',848,688,'garden');
        this.sites.push({x:848,y:720,label:'TALK TO THE GARDENER',action:()=>keeperSpeech(this,gardener,'A little water, a little sun. They’re coming along nicely.')});
      }
      if(activities.bridgekeeper!=='home'){
        const tree=activities.bridgekeeper==='tree',x=tree?400:272,y=tree?336:464;
        const keeper=createKeeper(this,'bridgekeeper',x,y,activities.bridgekeeper);
        if(tree){
          obstacle(x+34,y+16,20,16);
          const timber=this.add.graphics().setDepth(9);
          timber.fillStyle(0x433b30).fillRect(x+24,y-36,20,58);
          timber.fillStyle(0x947047).fillRect(x+26,y-36,15,55);
          timber.fillStyle(0xc2a271).fillRect(x+26,y-35,3,48);
          timber.fillStyle(0x263e33).fillRect(x+22,y+7,10,6);
          leafCluster(timber,x+35,y-51,25,0x284a37,0x6a8050);
        }
        this.sites.push({x,y:y+32,label:'TALK TO THE BRIDGEKEEPER',action:()=>keeperSpeech(this,keeper,tree?'A few sound timbers will keep that bridge standing.':'Good to hear the stream again.')});
      }
    }
    if(!expedition().logGuardianFreed&&expedition().tablet){
      this.guardian=new LogGuardian(this,(x,y)=>{
        saveExpedition({logGuardianFreed:true});repairSecondaryBridge();this.refreshSigns();this.plantGarden();
        EventBus.emit('wordwood-rain-stop');
        this.feedback.setVisible(false);this.rescuedKeepers(x,y,walls);
      });
      this.guardianCombat=expeditionCombat(this,this.player,walls,[this.guardian],()=>this.locked||!!this.panel,()=>{
        this.locked=true;this.cameras.main.fadeOut(350);
        this.time.delayedCall(400,()=>this.scene.restart({returnPoint:{x:816,y:208},hearts:3}));
      });
      this.cameras.main.stopFollow().pan(1223,457,650);
      this.time.delayedCall(1800,()=>this.cameras.main.startFollow(this.player.sprite,true,.12,.12));
      this.feedback.setText('The hollow log cracks. Something tangled in violet ink is coming out.').setVisible(true);
      this.time.delayedCall(5000,()=>this.feedback.setVisible(false));
    }
    // The gatehouse URL survives indoor trips; returnPoint distinguishes an
    // actual arrival from a building exit or a local death restart.
    if(arriving&&!this.returnPoint&&this.found.size===0&&!this.solved&&!(process.env.NODE_ENV==='development'&&new URLSearchParams(window.location.search).has('sceneReview')))
      this.say('THE PATHS THAT FORGOT\n\nRestore the bridge, burrow and winding trail by changing their describing words, then test your answers at the central stone. The field notes offer hints if you need them — collecting them is optional.\n\nThe old gardener left one last puzzle for the sanctuary. J keeps your notes close. Your progress stays saved when you return to Inkwell.');
  }

  private plantGarden(){
    if(this.gardenPlanted)return;this.gardenPlanted=true;
    this.puzzleObjects.forEach(object=>object.destroy());this.puzzleObjects=[];
    this.labels=[];this.echoTiles=[];
    this.sites=this.sites.filter(site=>!site.label.startsWith('CHANGE ')&&!['READ FIELD NOTE','TEST THE THREE SIGNS','READ THE GARDENER’S VERSE'].includes(site.label));
    const garden=this.add.graphics().setDepth(-4).setName('restored-wordwood-garden');
    // Four planted beds leave the central north–south walking lane unobstructed.
    for(const [x,y] of [[656,672],[864,672],[656,768],[864,768]]){
      garden.fillStyle(0x354a32).fillRect(x-4,y-4,104,72);
      garden.fillStyle(0xa6a37e).fillRect(x-4,y-4,104,4).fillRect(x-4,y,4,64);
      garden.fillStyle(0x715841).fillRect(x,y,96,64);
      for(let row=0;row<3;row++)for(let col=0;col<5;col++){
        const fx=x+10+col*18,fy=y+12+row*18;
        garden.fillStyle(0x3c653f).fillRect(fx,fy,2,10).fillRect(fx-4,fy+4,10,2);
        garden.fillStyle((row+col)%3===0?0xd6b971:(row+col)%3===1?0xc48881:0xc7d2a1).fillRect(fx-3,fy-3,8,5).fillRect(fx-1,fy-5,4,9);
        garden.fillStyle(0xf0dba1).fillRect(fx,fy-1,2,2);
      }
    }
    for(const x of [752,832]){this.add.image(x,608,'interior-gallery-bench').setDisplaySize(32,32).setDepth(2);}
    this.sites.push({x:816,y:656,label:'ENJOY THE GARDEN',action:()=>this.say('Flowers have taken root where the old word stones stood. The rain has finally passed.')});
  }

  private rescuedKeepers(x:number,y:number,walls:Phaser.Physics.Arcade.StaticGroup){
    this.registry.set('wordwood-keepers',{gardener:'cooking',bridgekeeper:'home'});
    for(const [name,dx,kind] of [['BRIDGEKEEPER',-32,'bridgekeeper'],['GARDENER',32,'gardener']] as const){
      const actor=createKeeper(this,kind,x+dx,y-16,'walking').setName(`rescued-${kind}`);
      this.time.delayedCall(name==='BRIDGEKEEPER'?650:3200,()=>{
        const bubble=this.add.text(actor.x,actor.y-58,name==='BRIDGEKEEPER'?'Thanks! I don’t remember a thing.':'Thank you! What happened?',{fontSize:'12px',fontFamily:'Georgia',color:'#eee1be',backgroundColor:'#1c3430',padding:{x:8,y:6},wordWrap:{width:170}}).setOrigin(.5,1).setDepth(80);
        this.time.delayedCall(2500,()=>{bubble.destroy();keeperWalkHome(this,actor,walls,{x:432,y:272});});
      });
    }
  }

  private enterRepository(room:RepositoryRoom,point:{x:number;y:number}){
    if(room==='hall'&&(!this.echoOpen||!canOpenGardenGate()||!expedition().gardenGateOpened))return;
    if(room==='hall')saveExpedition({checkpoint:true});
    this.save();this.locked=true;this.player.stopMovement();
    const enter=()=>this.player.walkThroughDoor(()=>this.scene.start('RepositoryScene',{room,hearts:this.player.hearts,returnPoint:{x:point.x,y:point.y+32}}));
    if(room!=='maintenance')enter();else openDoorAnimation(this,point.x,point.y-16,enter,'cottage');
  }

  private tree(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillStyle(0x0c2926, 0.6); g.fillEllipse(x + 14, y + 35, 90, 34);
    g.fillStyle(0x76533b); g.fillRect(x - 9, y, 18, 35);
    g.fillStyle(0xa28355).fillRect(x - 8, y + 3, 4, 29);
    foreground(this,x-48,y-68,96,96,canopy=>{
      canopy.translateCanvas(48-x,68-y);
      leafCluster(canopy, x, y - 20, 43, 0x183d32, 0x386747);
      leafCluster(canopy, x - 14, y - 34, 28, 0x315d40, 0x62824f);
      leafCluster(canopy, x + 20, y - 25, 24, 0x284f38, 0x4b7548);
    });
  }
  private openJournal() {
    if (this.panel||this.locked) return;
    if(this.gardenPlanted){this.say('The keepers are safe. A garden now grows in the old puzzle clearing.');return;}
    this.say('FIELD NOTES\n\n' + (this.found.size ? [...this.found].sort().map((i) => CLUES[i]).join('\n\n') : 'No notes yet. Look for pale survey papers beside the paths.')+'\n\nSanctuary verse: seed → sprout → bloom.');
  }
  private refreshSigns() {
    this.labels.forEach((label, i) => label.setText(this.words[i].toUpperCase()));
    const g=this.landmarkChanges;g.clear();
    if(this.words[0]==='sturdy'&&(this.solved||landmarkRestored(0)))for(const x of [248,318])for(const y of [402,442,482,520]){
      g.fillStyle(0x384334).fillRect(x,y,9,12);g.fillStyle(0xd1b980).fillRect(x,y,9,3);g.fillStyle(0x8a754d).fillRect(x+1,y+3,3,8);
    }
    if(this.words[1]==='hollow'&&(this.solved||landmarkRestored(1))){g.fillStyle(0x101f1c).fillEllipse(1223,457,34,48);if(!expedition().logGuardianFreed&&!expedition().tablet)g.fillStyle(0x91a96e).fillRect(1216,451,3,3).fillRect(1230,451,3,3);}
    if(this.words[2]==='winding'&&(this.solved||landmarkRestored(2)))for(const [x,y] of [[672,828],[704,804],[736,844],[768,804]]){g.fillStyle(0xd8c993).fillRect(x,y,8,8);g.fillStyle(0x768a58).fillRect(x+3,y+8,2,6);}
    for(const [i,x,y] of [[0,272,544],[1,1296,544],[2,816,864]]){
      g.fillStyle(this.solved||landmarkRestored(i)?0xbace99:0x4a5051).fillRect(x-8,y-8,16,4);
    }
  }
  private save() {
    if(process.env.NODE_ENV==='development'&&new URLSearchParams(window.location.search).has('sceneReview'))return;
    const progress = getStoryProgress();
    saveStoryProgress({ chapterCheckpoints: { ...progress.chapterCheckpoints, 2: JSON.stringify({ words: this.words, found: [...this.found], solved: this.solved,echoOpen:this.echoOpen,echoStep:this.echoStep }) } });
  }
  private testSigns() {
    if (this.solved) { this.say(this.echoOpen?'The northern gate is uncovered. Its leaf-shaped lock is within reach.':'The signs agree. Now walk the gardener’s verse across the stones: seed, sprout, bloom.'); return; }
    const error = checkWordwood(this.words);
    if (error) { this.say(error + '\n\nNothing is lost. Revisit a sign with E and consult your field notes with J.'); return; }
    this.solved = true; this.save();
    this.say('STURDY bears weight. HOLLOW leaves space inside. WINDING bends along its route.\n\nThe three stones south of here wake up. Read the gardener’s verse and walk its stages in order to open the sanctuary.');
  }
  private openRoute(animate=false) {
    if(expedition().gardenGateOpened&&canOpenGardenGate()){this.gate.body!.enable=false;this.gateArt.setVisible(false);}
    if(animate)this.tweens.add({targets:this.gateGrowth,y:12,alpha:0,duration:900,ease:'Sine.easeInOut',onComplete:()=>this.gateGrowth.setVisible(false)});
    else this.gateGrowth.setVisible(false);
  }
  private say(text: string) {
    this.panel?.destroy(); this.player.stopMovement(); this.prompt.setVisible(false);
    this.panel=compactDialogue(this,'Wordwood',text,()=>{this.panel=null;});
    this.nextInput = this.time.now + 220;
  }
  update(_time: number, delta: number) {
    if(this.data.get('keeper-speaking')||this.time.now<(this.data.get('dialogue-closed-until')??0)){this.player.isInteractJustDown();this.player.stopMovement();this.prompt.setVisible(false);return;}
    if((this.locked||this.panel)&&this.guardian&&!this.guardian.defeated)this.guardian.sprite.setVelocity(0,0);
    if(this.locked)return;
    if (this.panel) {
      return;
    }
    this.player.update(delta);
    this.guardianCombat?.(delta);if(this.player.isDying)return;
    this.labels.forEach(label=>label.setVisible(Phaser.Math.Distance.Between(this.player.x,this.player.y,label.x,label.y+29)<160));
    const stone=[688,816,944].findIndex(x=>Phaser.Math.Distance.Between(this.player.x,this.player.y,x,720)<9);
    if(stone!==this.lastStone){
      this.lastStone=stone;
      if(stone>=0&&this.solved&&!this.echoOpen){
        this.echoStep=advanceEcho(this.echoStep,stone);
        this.echoTiles.forEach(tile=>tile.setStrokeStyle(1,0x67796a));
        this.echoTiles[stone].setStrokeStyle(2,0xdce1a7);
        this.feedback.setText(this.echoStep===3?'The northern brambles bloom and loosen, uncovering an old gate.':this.echoStep?`${this.echoStep} / 3 — the verse continues.`:'The verse restarts. Seed, sprout, bloom.').setVisible(true);
        if(this.echoStep!==3)this.time.delayedCall(3200,()=>{if(!this.echoOpen)this.feedback.setVisible(false);});
        if(this.echoStep===3){this.echoOpen=true;this.openRoute(true);}
        this.save();
      }
    }
    const nearest = this.sites.filter((site) => Phaser.Math.Distance.Between(this.player.x, this.player.y, site.x, site.y) < 62)
      .sort((a, b) => Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y) - Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y))[0];
    this.prompt.setVisible(!!nearest&&!this.data.get('keeper-speaking'));
    if (nearest) {
      if(nearest.label.startsWith('ENTER ')){
        this.prompt.setVisible(false);
        if(this.time.now-this.enteredAt>500&&this.player.wantsDoorAt(nearest.x,nearest.y,'up'))nearest.action();
        return;
      }
      if(nearest.label==='RETURN THROUGH THE GATEHOUSE'){
        this.prompt.setVisible(false);
        if(this.player.wantsDoorAt(nearest.x,nearest.y,'up'))nearest.action();
        return;
      }
      this.prompt.setText('[ E ] ' + nearest.label).setPosition(this.player.x, this.player.y - 50);
      if (this.player.isInteractJustDown()) nearest.action();
    }
  }
}
