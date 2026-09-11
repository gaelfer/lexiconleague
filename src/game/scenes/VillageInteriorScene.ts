import * as Phaser from 'phaser';
import {lumaConversation} from '../../lib/story/lumaQuest';
import {getStoryProgress} from '../../lib/story/progress';
import {northernProgress,clockPhase} from '../../lib/story/worldClock';
import {sleepingInkling} from '../entities/sleepingInkling';
import {dailyWork} from '../world/dailyWork';
import {storyResident} from '../entities/storyResident';
import {createKeeper} from '../world/keepers';
import {residentLocation} from '../story/villageRoutine';
import {interactionScore} from '../interaction';
import { frameWorld } from '../world/framing';
import { AVATAR_LAYER_WIDTH, AVATAR_LAYER_HEIGHT, AVATAR_FACE_LAYER_WIDTH, AVATAR_FACE_LAYER_HEIGHT } from '../pixelAvatar';
import { buildTileInterior } from '../world/tileInterior';
import { ROOM_GRID,INTERIOR_PLANS } from '../story/interiorPlans';
import Player from '../entities/Player';
import { registerSpeaker, speak } from '../entities/inklingSpeech';
import { createInkHand, createInkFoot } from '../entities/inkHand';
import { VILLAGE_NPCS } from '../npcs';
import { AVATAR_BODY_OFFSETS, hexToNumber } from '../avatar';
import type { StoryAvatarConfig } from '../avatar';
import {
  VILLAGE_BUILDINGS,
  type VillageBuildingId,
  type VillageBuildingSpec,
} from '../story/buildings';

interface InteriorInteraction {
  x: number;
  y: number;
  label: string;
  heading: string;
  lines: readonly string[];
  onComplete?:()=>unknown;
}

interface InteriorDialogue {
  interaction: InteriorInteraction;
  index: number;
  text: Phaser.GameObjects.Text;
  objects: Phaser.GameObjects.GameObject[];
}

const EXIT = ROOM_GRID.exit;

/**
 * Reusable 3/4-view interior for ordinary village buildings.
 *
 * Rooms assemble the shared native-size pixel kit with tile-aligned collision.
 * Each building keeps its own authored layout and recolorable fabric palette.
 */
export default class VillageInteriorScene extends Phaser.Scene {
  private avatar: StoryAvatarConfig;
  private buildingId: VillageBuildingId = 'home';
  private building!: VillageBuildingSpec;
  private player!: Player;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private prompt!: Phaser.GameObjects.Text;
  private interactions: InteriorInteraction[] = [];
  private dialogue: InteriorDialogue | null = null;
  private nextDialogueAt = 0;
  private serif?: ReturnType<typeof storyResident>;
  private serifWall?: Phaser.Physics.Arcade.Image;
  private approaching = false;
  private arrival?:{x:number;y:number};
  private routinePhase='';

  constructor(avatar: StoryAvatarConfig) {
    super({ key: 'VillageInteriorScene' });
    this.avatar = avatar;
  }

  init(data: { buildingId?: VillageBuildingId;position?:{x:number;y:number} }) {
    this.arrival=data.position;
    this.buildingId = data.buildingId ?? 'home';
    this.building = VILLAGE_BUILDINGS.find((building) => building.id === this.buildingId)
      ?? VILLAGE_BUILDINGS[0];
    this.interactions = [];
    this.dialogue = null;
    this.nextDialogueAt = 0;
    this.serif = undefined;
    this.serifWall = undefined;
    this.approaching = false;
  }

  create() {
    const clock=getStoryProgress().worldClock;this.routinePhase=clock?clockPhase(clock):'';
    this.walls = this.physics.add.staticGroup();
    this.interactions = buildTileInterior(this,this.buildingId,(x,y,w,h)=>this.addWall(x,y,w,h))
      .map(site=>({...site,heading:this.building.name}));
    if (this.buildingId === 'mapmaker') {
      const luma = this.add.container(496, 356).setDepth(10).setScale(0.6);
      const base = this.add.image(0, 0, 'luma-base').setDisplaySize(AVATAR_LAYER_WIDTH, AVATAR_LAYER_HEIGHT);
      const eyes = this.add.image(0, -4, 'npc-0-eyes').setDisplaySize(AVATAR_FACE_LAYER_WIDTH, AVATAR_FACE_LAYER_HEIGHT);
      luma.add([this.add.ellipse(0, 19, 28, 9, 0x10263a, 0.3), base, eyes,
        ...[-7,7].map((x) => createInkFoot(this,x,17,0xf0a6aa).setScale(0.75)),
        ...[-12,12].map((x) => createInkHand(this,x,6,0xf0a6aa).setScale(0.8))]);
      if(this.routinePhase!=='Night')this.addWall(496,368,24,20);
      registerSpeaker(this,'LUMA',luma);
      dailyWork(this,luma,'child');
      if(getStoryProgress().worldClock&&clockPhase(getStoryProgress().worldClock!)==='Night'){luma.setVisible(false);sleepingInkling(this,288,224,0xf0a6aa,'rust','luma-base');}
      this.interactions.push({ x:this.routinePhase==='Night'?304:496, y:this.routinePhase==='Night'?272:368, label:this.routinePhase==='Night'?'LUMA — SLEEPING':'TALK TO LUMA', heading:'LUMA', lines:[
        'You found Mum! I knew you would. Well… I hoped very loudly.',
        'She says I’m not allowed to run off again. Not even to get help. We’re still discussing that part.',
        'I drew you on my map. You’re bigger than the bakery. Don’t tell Pip.',
      ] });
    }

    let residentCount=0;
    VILLAGE_NPCS.forEach((resident, index) => {
      const p=getStoryProgress(),location=residentLocation(resident.name,p.worldClock);
      if(p.worldClock?(location!==this.buildingId||this.buildingId==='tea-room'):resident.house!==this.buildingId)return;
      if(p.worldClock&&clockPhase(p.worldClock)==='Night'){
        const plan=INTERIOR_PLANS[this.buildingId],beds=plan.props.filter(prop=>prop.asset==='bed-head'),bed=beds.find(bed=>bed.label.includes(resident.name.toUpperCase()))??beds[residentCount++]??beds[0];
        if(bed){sleepingInkling(this,ROOM_GRID.x+bed.col*32,ROOM_GRID.floorY+bed.row*32,hexToNumber(resident.color),plan.palette,`npc-${index}-base`);this.interactions.push({x:ROOM_GRID.x+bed.col*32+16,y:ROOM_GRID.floorY+(bed.row+1)*32+16,label:`${resident.name.toUpperCase()} — SLEEPING`,heading:resident.name.toUpperCase(),lines:['Fast asleep. You leave them to rest.']});return;}
      }
      const residentX=p.worldClock?(residentCount++%2===0?336:496):496;
      const color = hexToNumber(resident.color);
      const offsets = AVATAR_BODY_OFFSETS[resident.base] ?? AVATAR_BODY_OFFSETS.droplet_01;
      const person = this.add.container(residentX, 352).setDepth(10).setScale(0.78);
      const shadow = this.add.ellipse(0, 23, 36, 12, 0x10263a, 0.3);
      const feet = [-10, 10].map((x) => createInkFoot(this,x,21,color));
      const base = this.add.image(0, 0, `npc-${index}-base`).setDisplaySize(AVATAR_LAYER_WIDTH, AVATAR_LAYER_HEIGHT);
      const eyes = this.add.image(0, offsets.eyesY, `npc-${index}-eyes`).setDisplaySize(AVATAR_FACE_LAYER_WIDTH, AVATAR_FACE_LAYER_HEIGHT);
      const accessory = this.add.image(0, offsets.accessoryY, `npc-${index}-accessory`).setDisplaySize(AVATAR_LAYER_WIDTH, AVATAR_LAYER_HEIGHT);
      const hands = [-15, 15].map((x) => createInkHand(this, x, 7, color));
      person.add([shadow, ...feet, base, eyes, accessory, ...hands]);
      registerSpeaker(this,resident.name,person);
      // Keep all resident layers planted on the same pixel grid.
      this.addWall(residentX, 368, 24, 20);
      this.interactions.push({ x: residentX, y: 368, label: `TALK TO ${resident.name.toUpperCase()}`, heading: resident.name.toUpperCase(), lines: resident.dialogue });
    });

    this.player = new Player(this, this.arrival?.x??ROOM_GRID.spawn.x, this.arrival?.y??ROOM_GRID.spawn.y, this.avatar);
    if(this.buildingId==='tea-room'&&residentLocation('Nell',getStoryProgress().worldClock)==='tea-room'){
      this.interactions=this.interactions.filter(site=>site.label!=='CHAIR');
      const seats=[['Mira',400,336],['Nell',272,272],['Pip',240,336],['Fenn',304,336],['Tansy',496,336],['Oren',528,400]] as const;
      for(const [name,x,y] of seats){
        const index=VILLAGE_NPCS.findIndex(n=>n.name===name),resident=VILLAGE_NPCS[index];
        const guest=storyResident(this,x,y,index,name.toUpperCase(),hexToNumber(resident.color));
        const cup=this.add.graphics({x:12,y:7});
        cup.fillStyle(0xefe0b6).fillRect(-3,-3,6,6).lineStyle(1,0xefe0b6).strokeRect(3,-2,3,3);guest.rig.add(cup);
        this.tweens.add({targets:cup,y:0,duration:550,hold:800,yoyo:true,repeat:-1,repeatDelay:3000+index*350});
        this.interactions.push({x,y,label:name==='Nell'?'TALK TO NELL · SHARE TEA':`TALK TO ${name.toUpperCase()}`,heading:name.toUpperCase(),
          lines:name==='Nell'?['To our friends from Wordwood. It’s good to have you both at the table again.','Pip: I saved you a cake. Well… the second one.','You share a warm pot while the evening bell rolls over the rooftops.']:name==='Fenn'?['The honey cakes are still warm. Pass them along.']:resident.hubDialogue??resident.dialogue,
          onComplete:name==='Nell'?()=>northernProgress({tea:true}):undefined});
      }
      for(const [kind,x] of [['gardener',432],['bridgekeeper',464]] as const){
        const actor=createKeeper(this,kind,x,384,'home');registerSpeaker(this,kind.toUpperCase(),actor);
        this.interactions.push({x,y:400,label:`TALK TO THE ${kind.toUpperCase()}`,heading:kind.toUpperCase(),lines:[kind==='gardener'?'I brought mint for the pot. He carried it all the way here without spilling a leaf.':'She said we were going out. I thought she meant the garden. This is better.']});
      }
      this.addWall(272,272,22,18);
      this.serif=storyResident(this,368,272,2,'SIR SERIF',0x73a8e8);
      this.serifWall=this.addWall(368,272,24,20);
      this.interactions.push({x:368,y:272,label:'TALK TO SIR SERIF',heading:'SIR SERIF',lines:['Enjoy the company. I’ll catch you before you head out.']});
    }
    this.physics.add.collider(this.player.sprite, this.walls);
    frameWorld(this);
    this.cameras.main.setBackgroundColor('#080f1a');

    this.prompt = this.add.text(0, 0, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#fdf3dc',
      backgroundColor: '#3a2419',
      padding: { x: 11, y: 6 },
      letterSpacing: 1,
    }).setOrigin(0.5).setDepth(80).setVisible(false);

    this.cameras.main.fadeIn(250, 26, 16, 12);
  }

  update(_time: number, delta: number) {
    if(this.approaching){this.player.stopMovement();this.serif?.pose(this.time.now,true);if(this.serif)this.serifWall?.setPosition(this.serif.rig.x,this.serif.rig.y+16).refreshBody();return;}
    if (this.dialogue) {
      this.player.stopMovement();
      if (this.time.now >= this.nextDialogueAt && this.player.isInteractJustDown()) this.advanceDialogue();
      return;
    }
    this.player.update(delta);
    const clock=getStoryProgress().worldClock,phase=clock?clockPhase(clock):'';
    if(phase!==this.routinePhase){this.player.stopMovement();this.scene.restart({buildingId:this.buildingId,position:{x:this.player.x,y:this.player.y}});return;}
    this.checkInteractions();
  }

  // ── Interaction ────────────────────────────────────────────────────────────

  private addWall(x: number, y: number, width: number, height: number) {
    const wall = this.physics.add.staticImage(x, y, '__DEFAULT');
    wall.setDisplaySize(width, height).setAlpha(0).refreshBody();
    this.walls.add(wall);
    return wall;
  }

  private checkInteractions() {
    const nearest = [
      ...this.interactions.map((interaction) => ({
        interaction,
        distance: interactionScore(this.player,interaction,interaction.label.startsWith('TALK TO')?48:34),
      })),
      {
        interaction: null,
        distance: interactionScore(this.player,EXIT),
      },
    ].filter(({ distance }) => Number.isFinite(distance)).sort((a, b) => a.distance - b.distance
      || Number(!!b.interaction?.label.startsWith('TALK TO'))-Number(!!a.interaction?.label.startsWith('TALK TO')))[0];

    if (!nearest) {
      this.prompt.setVisible(false);
      return;
    }
    if (!nearest.interaction) {
      this.prompt.setVisible(false);
      if (this.player.wantsDoorAt(EXIT.x,EXIT.y,'down'))this.exitBuilding();
      return;
    }
    this.prompt.setText(`[ E ]  ${nearest.interaction.label}`)
      .setPosition(this.player.x, this.player.y - 62).setVisible(true);
    if (this.player.isInteractJustDown()) this.openDialogue(nearest.interaction);
  }

  private openDialogue(interaction: InteriorInteraction) {
    if(interaction.heading==='SIR SERIF'&&!getStoryProgress().northernStory?.tea)interaction={...interaction,lines:['Take a moment with Nell and Pip first. Copper sent news, but it can wait until you’ve had something warm.'],onComplete:undefined};
    if(interaction.heading==='LUMA'){const story=lumaConversation();interaction=this.routinePhase==='Night'?{...interaction,lines:['Luma is fast asleep. Her sketchbook is tucked beside the pillow.'],onComplete:undefined}:{...interaction,lines:story.lines,onComplete:story.done};}
    this.player.stopMovement();
    this.prompt.setVisible(false);
    const panel = this.add.rectangle(400, 501, 700, 150, 0x2b1a12, 0.97)
      .setStrokeStyle(2, this.building.accent, 0.7).setDepth(100);
    const heading = this.add.text(72, 450, interaction.heading, {
      fontFamily: 'Georgia, serif', fontSize: '13px', fontStyle: 'bold', color: '#f4c96b', letterSpacing: 2,
    }).setDepth(101);
    const text = this.add.text(72, 480, interaction.lines[0], {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#fdf3dc', lineSpacing: 6, wordWrap: { width: 630 },
    }).setDepth(101);
    const hint = this.add.text(730, 556, 'E  NEXT', {
      fontFamily: 'Arial, sans-serif', fontSize: '10px', fontStyle: 'bold', color: '#f0b77d',
    }).setOrigin(1, 0.5).setDepth(101);
    this.dialogue = { interaction, index: 0, text, objects: [panel, heading, text, hint] };
    speak(this,interaction.heading,interaction.lines[0]);
    this.nextDialogueAt = this.time.now + 240;
  }

  private advanceDialogue() {
    if (!this.dialogue) return;
    const next = this.dialogue.index + 1;
    if (next < this.dialogue.interaction.lines.length) {
      this.dialogue.index = next;
      this.dialogue.text.setText(this.dialogue.interaction.lines[next]);
      speak(this,this.dialogue.interaction.heading,this.dialogue.interaction.lines[next]);
      this.nextDialogueAt = this.time.now + 220;
      return;
    }
    const done=this.dialogue.interaction.onComplete;
    this.dialogue.objects.forEach((object) => object.destroy());
    this.dialogue = null;
    speak(this,'');
    done?.();
  }

  private exitBuilding() {
    const progress=getStoryProgress();
    if(this.buildingId==='tea-room'&&progress.northernStory?.tea&&!progress.northernStory.rumour&&this.serif){
      this.player.stopMovement();this.approaching=true;
      this.tweens.add({targets:this.serif.rig,y:EXIT.y-48,duration:1500,onComplete:()=>{this.tweens.add({targets:this.serif!.rig,x:400,duration:350,onComplete:()=>{
        this.approaching=false;this.serif?.pose(this.time.now,false);
        this.serifWall?.setPosition(400,EXIT.y-32).refreshBody();
        const site=this.interactions.find(site=>site.heading==='SIR SERIF');
        if(site){site.x=400;site.y=EXIT.y-32;site.lines=['Copper will be at the eastern crossing tomorrow. Sleep well.'];}
        this.openDialogue({x:400,y:432,label:'SIR SERIF',heading:'SIR SERIF',lines:[
          'A moment before you go. Copper has spotted bandits north of the survey camp. Could you accompany her tomorrow morning?',
          'She’ll meet you at the eastern crossing on Inkwell Road. I’ll keep watch here.',
          'Get some rest first. Sleeping in your bed—or your room at the inn—will take you straight to morning.'
        ],onComplete:()=>northernProgress({rumour:true,escortDay:(getStoryProgress().worldClock?.day??1)+1})});
      }});}});
      return;
    }
    this.player.stopMovement();
    this.cameras.main.fadeOut(220, 26, 16, 12);
    this.time.delayedCall(240, () => {
      this.scene.stop();
      this.scene.resume('DungeonScene');
    });
  }
}
