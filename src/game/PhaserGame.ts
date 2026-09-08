import * as Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import DungeonScene from './scenes/DungeonScene';
import ArchiveScene from './scenes/ArchiveScene';
import VillageInteriorScene from './scenes/VillageInteriorScene';
import { normalizeStoryAvatar } from './avatar';
import type { InkAvatarConfig } from '@/types';

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

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#080f1a',

    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 800,
      height: 600,
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
    roundPixels: true,

    scene: [
      new BootScene(chapterId, avatar),
      new DungeonScene(chapterId, avatar),
      new ArchiveScene(avatar),
      new VillageInteriorScene(avatar),
    ],
  });
}
