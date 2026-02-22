import Phaser from 'phaser';
import { EventBus } from '../EventBus';

/**
 * BootScene — generates all placeholder textures then hands off to DungeonScene.
 * Phase 2+: this scene will load actual sprite sheets and Tiled tileset images.
 */
export default class BootScene extends Phaser.Scene {
  private chapterId: number;

  constructor(chapterId: number) {
    super({ key: 'BootScene' });
    this.chapterId = chapterId;
  }

  create() {
    this.makePlayerTexture();
    this.makeDoorTextures();
    this.makeEnemyTexture();
    this.makeCheckpointTexture();
    this.makeCoinTexture();

    EventBus.emit('current-scene-ready', this);
    this.scene.start('DungeonScene', { chapterId: this.chapterId });
  }

  // ── Texture generators ──────────────────────────────────────────────────────

  private makePlayerTexture() {
    // Mint circle with a darker nub indicating facing direction (down by default)
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x34d399);
    g.fillCircle(20, 20, 18);
    // Direction nub (top = facing up indicator at bottom of circle for "down")
    g.fillStyle(0x065f46);
    g.fillCircle(20, 32, 6);
    g.generateTexture('player', 40, 40);
    g.destroy();
  }

  private makeDoorTextures() {
    // Closed door — red with a lock icon
    const closed = this.make.graphics({ add: false });
    closed.fillStyle(0x7f1d1d);
    closed.fillRect(0, 0, 40, 120);
    closed.fillStyle(0xdc2626);
    closed.fillRect(2, 2, 36, 116);
    // Lock body
    closed.fillStyle(0xfbbf24);
    closed.fillRect(13, 55, 14, 16);
    // Lock shackle
    closed.lineStyle(3, 0xfbbf24);
    closed.strokeCircle(20, 52, 8);
    closed.generateTexture('door-closed', 40, 120);
    closed.destroy();

    // Open door — subtle green ghost
    const open = this.make.graphics({ add: false });
    open.fillStyle(0x34d399, 0.15);
    open.fillRect(0, 0, 40, 120);
    open.lineStyle(1, 0x34d399, 0.4);
    open.strokeRect(0, 0, 40, 120);
    open.generateTexture('door-open', 40, 120);
    open.destroy();
  }

  private makeEnemyTexture() {
    // Corrupted red inkling
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xef4444);
    g.fillCircle(16, 16, 14);
    g.fillStyle(0x7f1d1d);
    g.fillCircle(16, 6, 5);
    // Red eyes
    g.fillStyle(0xfca5a5);
    g.fillCircle(11, 14, 3);
    g.fillCircle(21, 14, 3);
    g.generateTexture('enemy', 32, 32);
    g.destroy();
  }

  private makeCheckpointTexture() {
    const g = this.make.graphics({ add: false });
    // Glowing ink pool
    g.fillStyle(0x34d399, 0.3);
    g.fillEllipse(24, 12, 48, 24);
    g.fillStyle(0x34d399, 0.6);
    g.fillEllipse(24, 12, 32, 16);
    g.fillStyle(0x6ee7b7);
    g.fillEllipse(24, 12, 16, 8);
    g.generateTexture('checkpoint', 48, 24);
    g.destroy();
  }

  private makeCoinTexture() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xfbbf24);
    g.fillCircle(8, 8, 8);
    g.fillStyle(0xfde68a);
    g.fillCircle(6, 6, 4);
    g.generateTexture('lexicoin', 16, 16);
    g.destroy();
  }
}
