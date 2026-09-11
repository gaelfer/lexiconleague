import * as Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import DungeonScene from './scenes/DungeonScene';
import ArchiveScene from './scenes/ArchiveScene';
import VillageInteriorScene from './scenes/VillageInteriorScene';
import WordwoodScene from './scenes/WordwoodScene';
import RepositoryScene from './scenes/RepositoryScene';
import GatehouseScene from './scenes/GatehouseScene';
import WakeScene from './scenes/WakeScene';
import InnScene from './scenes/InnScene';
import NorthernTrailScene from './scenes/NorthernTrailScene';
import { speechState } from './entities/inklingSpeech';
import { normalizeStoryAvatar } from './avatar';
import type { InkAvatarConfig } from '@/types';
import { DISPLAY_SCALE } from './pixelScale';
import {EventBus} from './EventBus';
import Blotling from './entities/Blotling';
import {installGlobalClock} from './world/globalClock';

/**
 * Creates and returns a Phaser.Game instance mounted inside `parent`.
 *
 * Called by StoryGameCanvas (which is dynamic-imported with ssr:false),
 * so this module is never evaluated during Next.js server-side rendering.
 */
export function createGame(
  parent: HTMLElement,
  chapterId: number,
  avatarConfig?: Partial<InkAvatarConfig>,
): Phaser.Game {
  const avatar = normalizeStoryAvatar(avatarConfig);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#080f1a',

    scale: {
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: Math.max(1, Math.floor(parent.clientWidth / DISPLAY_SCALE)),
      height: Math.max(1, Math.floor(parent.clientHeight / DISPLAY_SCALE)),
      zoom: DISPLAY_SCALE,
      autoRound: true,
    },

    physics: {
      default: 'arcade',
      arcade: {
        // Top-down dungeon — no gravity
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },

    // Scenes run in order; BootScene starts first then transitions to DungeonScene
    pixelArt: true,
    antialias: false,
    antialiasGL: false,
    roundPixels: true,

    scene: [
      new BootScene(chapterId, avatar),
      new DungeonScene(chapterId, avatar),
      new ArchiveScene(avatar),
      new VillageInteriorScene(avatar),
      new WordwoodScene(avatar),
      new RepositoryScene(avatar),
      new GatehouseScene(avatar),
      new WakeScene(avatar),
      new InnScene(avatar),
      new NorthernTrailScene(avatar),
    ],
  });
  // Resize the native viewport, never stretch its pixels by a fractional FIT scale.
  game.canvas.style.imageRendering = 'pixelated';
  installGlobalClock(game);
  if (process.env.NODE_ENV === 'development' && new URLSearchParams(location.search).has('storyTest')) {
    const attacks:unknown[]=[];const arrows:unknown[]=[];
    const recordAttack=(e:unknown)=>attacks.push(e),recordArrow=(e:unknown)=>arrows.push(e);
    EventBus.on('player-attack',recordAttack);EventBus.on('player-bow',recordArrow);
    game.events.once(Phaser.Core.Events.DESTROY,()=>{EventBus.off('player-attack',recordAttack);EventBus.off('player-bow',recordArrow);});
    const state = () => game.scene.getScenes(true).map(scene => {
      const observed = scene as Phaser.Scene & { floor?:number;room?:number;player?: {x:number;y:number;hearts:number}; luma?:{x:number;y:number}; npcs?:{spec:{name:string}}[]; activeDialogue?: {text:Phaser.GameObjects.Text}; dialogue?: {text:Phaser.GameObjects.Text} };
      const body=scene.children.list.flatMap(object=>object instanceof Phaser.GameObjects.Container?object.list:[object])
        .find((object):object is Phaser.GameObjects.Image=>object instanceof Phaser.GameObjects.Image&&object.texture.key==='player-base');
      const sign=scene.children.getByName('building-sign-label') as Phaser.GameObjects.Text|undefined;
      const guardian=(scene as Phaser.Scene & {guardian?:{hp:number;defeated:boolean;sprite:{x:number;y:number};strikes:{x:number;y:number;elapsed:number}[]}}).guardian;
      return {scene:scene.scene.key,floor:observed.floor,room:observed.room,x:observed.player?.x,y:observed.player?.y,hearts:observed.player?.hearts,
        raining:scene.data.get('wordwood-raining'),keepers:scene.children.list.filter(o=>o instanceof Phaser.GameObjects.Container&&o.name.startsWith('rescued-')).map(o=>({name:o.name,x:(o as Phaser.GameObjects.Container).x,y:(o as Phaser.GameObjects.Container).y})),
        guardian:guardian?{hp:guardian.hp,defeated:guardian.defeated,x:guardian.sprite.x,y:guardian.sprite.y,strikes:guardian.strikes.map(s=>({x:s.x,y:s.y,elapsed:s.elapsed}))}:null,
        zoom:scene.cameras.main.zoom,body:body?{texture:body.texture.key,scaleX:body.scaleX,scaleY:body.scaleY,flipX:body.flipX,angle:body.angle}:null,
        dialogue:observed.activeDialogue?.text.text??observed.dialogue?.text.text,sign:sign?.visible?sign.text:undefined,
        luma:observed.luma?{x:observed.luma.x,y:observed.luma.y+16}:null,
        residents:observed.npcs?.map(npc=>npc.spec.name),speech:speechState(scene)};
    });
    const api={state,reviewCombatEnemy:(x:number,y:number)=>{const scene=game.scene.getScenes(true)[0] as Phaser.Scene&{enemies?:Blotling[]};if(!scene.enemies)return;const enemy=new Blotling(scene,x,y,5);enemy.sprite.setName('combat-test-enemy');scene.enemies.push(enemy);const targets=scene.data.get('combat-targets')?.();if(targets&&targets!==scene.enemies)targets.push(enemy);},reviewEnemies:()=>{const scene=game.scene.getScenes(true)[0] as Phaser.Scene&{enemies?:{hp:number;sprite:Phaser.GameObjects.Image}[]};return scene.enemies?.filter(e=>e.sprite.name==='combat-test-enemy').map(e=>({hp:e.hp,x:e.sprite.x,y:e.sprite.y,bound:(e.sprite.getData('boundUntil')??0)>scene.time.now,staggered:(e.sprite.getData('staggerUntil')??0)>scene.time.now}));},actionLog:()=>({attacks,arrows}),reviewFacing:(facing:string)=>{const s=game.scene.getScenes(true)[0] as Phaser.Scene&{player?:{facing:string}};if(s.player)s.player.facing=facing;},reviewHeal:()=>{const s=game.scene.getScenes(true)[0] as Phaser.Scene&{player?:{healFully():void}};s.player?.healFully();},equipmentState:()=>{
      const scene=game.scene.getScenes(true)[0] as Phaser.Scene & {player?:{gear:string[];slots:unknown;attackHoldMs:number;attackPoseType:string;attackPoseMs:number;bowPoseMs:number;sword:{visible:boolean}}};
      return {gear:scene.player?.gear,slots:scene.player?.slots,holdMs:scene.player?.attackHoldMs,attackType:scene.player?.attackPoseType,swordVisible:scene.player?.sword.visible,attackMs:scene.player?.attackPoseMs,bowMs:scene.player?.bowPoseMs};
    },keeperPositions:()=>game.scene.getScenes(true)[0].children.list.filter((o):o is Phaser.GameObjects.Container=>o instanceof Phaser.GameObjects.Container&&o.name.startsWith('keeper-')).map(o=>({name:o.name,x:o.x,y:o.y,activity:o.getData('activity')})),reviewDialogue:(text:string)=>{
      (game.scene.getScenes(true)[0] as Phaser.Scene & {say(text:string):void}).say(text);
    },reviewKeepers:(gardener:string,bridgekeeper:string)=>{
      game.registry.set('wordwood-keepers',{gardener,bridgekeeper});
      game.scene.getScenes(true)[0].scene.start('WordwoodScene',{returnPoint:{x:816,y:720}});
    },keeperState:()=>game.scene.getScenes(true)[0].children.list.filter(o=>o instanceof Phaser.GameObjects.Container&&o.name.startsWith('keeper-')).map(o=>({name:o.name,activity:o.getData('activity')})),expeditionState:()=>{
      const scene=game.scene.getScenes(true)[0] as Phaser.Scene & {room?:string;locked?:boolean;enemies?:{defeated:boolean}[];panel?:Phaser.GameObjects.Container};
      return {room:scene.room,locked:scene.locked,enemies:scene.enemies?.filter(e=>!e.defeated).length,
        panel:scene.panel?.list.filter((o):o is Phaser.GameObjects.Text=>o instanceof Phaser.GameObjects.Text).map(o=>o.text)};
    },reviewPosition:(x:number,y:number)=>{
      const scene=game.scene.getScenes(true)[0] as Phaser.Scene & {player?:{stopMovement():void;sprite:Phaser.Physics.Arcade.Sprite}};
      if(Number.isFinite(x)&&Number.isFinite(y)){scene.player?.stopMovement();scene.player?.sprite.body?.reset(x,y);}
    },puzzleState:()=>{
      const scene=game.scene.getScenes(true)[0] as Phaser.Scene & {solved?:boolean;echoOpen?:boolean;found?:Set<number>;gate?:Phaser.Physics.Arcade.Image;feedback?:Phaser.GameObjects.Text;panel?:Phaser.GameObjects.Container};
      return {solved:scene.solved,open:scene.echoOpen,notes:scene.found?.size,gateBlocked:scene.gate?.body?.enable,
        feedback:scene.feedback?.text,panel:scene.panel?.list.filter((o):o is Phaser.GameObjects.Text=>o instanceof Phaser.GameObjects.Text).map(o=>o.text)};
    },reviewInnRoom:(floor:1|2,room:number)=>{
      const active=game.scene.getScenes(true)[0];
      if(active.scene.key==='InnScene')active.scene.restart({floor,room});
      else if(active.scene.key==='DungeonScene'){active.scene.pause();active.scene.launch('InnScene',{floor,room});}
    },innActivity:()=>{
      const scene=game.scene.getScenes(true)[0] as Phaser.Scene & {guestActivity?:unknown};
      return scene.guestActivity;
    },combatState:()=>{
      const scene=game.scene.getScenes(true)[0] as Phaser.Scene & {player?:{isDying:boolean;swordStowed:boolean};enemies?:{defeated?:boolean;attackPhase:string;sprite:{x:number;y:number}}[]};
      return {dying:scene?.player?.isDying,swordStowed:scene?.player?.swordStowed,enemies:scene?.enemies?.filter(e=>!e.defeated).map(enemy=>({phase:enemy.attackPhase,x:enemy.sprite.x,y:enemy.sprite.y}))};
    },takeTestHit:(amount=1,source?:{x:number;y:number})=>{
      const scene=game.scene.getScenes(true)[0] as Phaser.Scene & {player?:{takeDamage(amount:number,source?:{x:number;y:number}):boolean}};
      return scene?.player?.takeDamage(amount,source);
    }};
    Object.assign(api,{worldClock:()=>game.registry.get('world-clock'),northernState:()=>{const s=game.scene.getScenes(true)[0] as Phaser.Scene&{enemies?:Blotling[];copper?:{rig:Phaser.GameObjects.Container}};return{enemies:s.enemies?.filter(e=>!e.defeated).map(e=>({x:e.sprite.x,y:e.sprite.y})),copper:s.copper?{x:s.copper.rig.x,y:s.copper.rig.y}:undefined};}});
    Object.assign(window,{__storyTest:api});
    Object.assign(api,{residentState:()=>game.scene.getScenes(true)[0].children.list.filter((o):o is Phaser.GameObjects.Container=>o instanceof Phaser.GameObjects.Container&&o.name.startsWith('resident-')).map(o=>({name:o.name,x:o.x,y:o.y,visible:o.visible}))});
    game.events.once(Phaser.Core.Events.DESTROY,()=>{
      if(Reflect.get(window,'__storyTest')===api)Reflect.deleteProperty(window,'__storyTest');
    });
  }
  const resize = new ResizeObserver(() => {
    game.scale.resize(Math.max(1, Math.floor(parent.clientWidth / DISPLAY_SCALE)),
      Math.max(1, Math.floor(parent.clientHeight / DISPLAY_SCALE)));
  });
  resize.observe(parent);
  game.events.once(Phaser.Core.Events.DESTROY, () => resize.disconnect());
  return game;
}
