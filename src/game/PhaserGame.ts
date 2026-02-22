import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import DungeonScene from './scenes/DungeonScene';

/**
 * Creates and returns a Phaser.Game instance mounted inside `parent`.
 *
 * Called by StoryGameCanvas (which is dynamic-imported with ssr:false),
 * so this module is never evaluated during Next.js server-side rendering.
 */
export function createGame(parent: HTMLElement, chapterId: number): Phaser.Game {
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
        debug: process.env.NODE_ENV === 'development',
      },
    },

    // Scenes run in order; BootScene starts first then transitions to DungeonScene
    scene: [new BootScene(chapterId), new DungeonScene(chapterId)],
  });
}
