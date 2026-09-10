import * as Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import DungeonScene from './scenes/DungeonScene';
import ArchiveScene from './scenes/ArchiveScene';
import VillageInteriorScene from './scenes/VillageInteriorScene';
import WordwoodScene from './scenes/WordwoodScene';
import GatehouseScene from './scenes/GatehouseScene';
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
    ],
  });
  // Resize the native viewport, never stretch its pixels by a fractional FIT scale.
  game.canvas.style.imageRendering = 'pixelated';
  const resize = new ResizeObserver(() => {
    game.scale.resize(Math.max(1, Math.floor(parent.clientWidth / DISPLAY_SCALE)),
      Math.max(1, Math.floor(parent.clientHeight / DISPLAY_SCALE)));
  });
  resize.observe(parent);
  game.events.once(Phaser.Core.Events.DESTROY, () => resize.disconnect());
  return game;
}
