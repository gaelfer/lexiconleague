import * as Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import DungeonScene from './scenes/DungeonScene';
import ArchiveScene from './scenes/ArchiveScene';
import VillageInteriorScene from './scenes/VillageInteriorScene';
import WordwoodScene from './scenes/WordwoodScene';
import GatehouseScene from './scenes/GatehouseScene';
import WakeScene from './scenes/WakeScene';
import InnScene from './scenes/InnScene';
import { speechState } from './entities/inklingSpeech';
import { normalizeStoryAvatar } from './avatar';
import type { InkAvatarConfig } from '@/types';
import { DISPLAY_SCALE } from './pixelScale';

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
      new GatehouseScene(avatar),
      new WakeScene(avatar),
      new InnScene(avatar),
    ],
  });
  // Resize the native viewport, never stretch its pixels by a fractional FIT scale.
  game.canvas.style.imageRendering = 'pixelated';
  if (process.env.NODE_ENV === 'development' && new URLSearchParams(location.search).has('storyTest')) {
    const state = () => game.scene.getScenes(true).map(scene => {
      const observed = scene as Phaser.Scene & { floor?:number;room?:number;player?: {x:number;y:number;hearts:number}; luma?:{x:number;y:number}; npcs?:{spec:{name:string}}[]; activeDialogue?: {text:Phaser.GameObjects.Text}; dialogue?: {text:Phaser.GameObjects.Text} };
      const body=scene.children.list.flatMap(object=>object instanceof Phaser.GameObjects.Container?object.list:[object])
        .find((object):object is Phaser.GameObjects.Image=>object instanceof Phaser.GameObjects.Image&&object.texture.key==='player-base');
      return {scene:scene.scene.key,floor:observed.floor,room:observed.room,x:observed.player?.x,y:observed.player?.y,hearts:observed.player?.hearts,
        zoom:scene.cameras.main.zoom,body:body?{texture:body.texture.key,scaleX:body.scaleX,scaleY:body.scaleY,flipX:body.flipX,angle:body.angle}:null,
        dialogue:observed.activeDialogue?.text.text??observed.dialogue?.text.text,
        luma:observed.luma?{x:observed.luma.x,y:observed.luma.y+16}:null,
        residents:observed.npcs?.map(npc=>npc.spec.name),speech:speechState(scene)};
    });
    const api={state,reviewInnRoom:(floor:1|2,room:number)=>{
      const active=game.scene.getScenes(true)[0];
      if(active.scene.key==='InnScene')active.scene.restart({floor,room});
      else if(active.scene.key==='DungeonScene'){active.scene.pause();active.scene.launch('InnScene',{floor,room});}
    },innActivity:()=>{
      const scene=game.scene.getScenes(true)[0] as Phaser.Scene & {guestActivity?:unknown};
      return scene.guestActivity;
    },combatState:()=>{
      const scene=game.scene.getScenes(true)[0] as Phaser.Scene & {player?:{isDying:boolean;swordStowed:boolean};enemies?:{attackPhase:string;sprite:{x:number;y:number}}[]};
      return {dying:scene?.player?.isDying,swordStowed:scene?.player?.swordStowed,enemies:scene?.enemies?.map(enemy=>({phase:enemy.attackPhase,x:enemy.sprite.x,y:enemy.sprite.y}))};
    },takeTestHit:(amount=1,source?:{x:number;y:number})=>{
      const scene=game.scene.getScenes(true)[0] as Phaser.Scene & {player?:{takeDamage(amount:number,source?:{x:number;y:number}):boolean}};
      return scene?.player?.takeDamage(amount,source);
    }};
    Object.assign(window,{__storyTest:api});
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
