import Phaser from 'phaser';

/**
 * Shared event emitter for Phaser ↔ React communication.
 *
 * Phaser scenes emit events; React components subscribe in useEffect.
 * React components emit events back to control the game.
 *
 * Phaser → React events:
 *   'player-near-door'     { doorId: string; questionType: string }
 *   'health-changed'       { hearts: number }
 *   'lexicoins-changed'    { amount: number }
 *   'show-dialogue'        { lines: string[]; portrait: string }
 *   'chapter-complete'     { chapterId: number }
 *   'current-scene-ready'  scene: Phaser.Scene
 *
 * React → Phaser events:
 *   'question-result'      { correct: boolean; doorId: string }
 *   'use-consumable'       { itemId: string }
 *   'game-paused'
 *   'game-resumed'
 */
export const EventBus = new Phaser.Events.EventEmitter();
