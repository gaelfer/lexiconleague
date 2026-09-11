import * as Phaser from 'phaser';
import { getStoryProgress } from '@/lib/story/progress';
import { EventBus } from '../EventBus';
import { hexToNumber, type StoryAvatarConfig } from '../avatar';
import { convertAvatarTexture, convertAvatarGroup } from '../world/pixelAvatarTextures';
import { VILLAGE_NPCS } from '../npcs';
import { INTERIOR_ASSETS, INTERIOR_PLANS } from '../story/interiorPlans';

/**
 * BootScene — generates all placeholder textures then hands off to DungeonScene.
 * Phase 2+: this scene will load actual sprite sheets and Tiled tileset images.
 */
export default class BootScene extends Phaser.Scene {
  private chapterId: number;
  private avatar: StoryAvatarConfig;

  constructor(chapterId: number, avatar: StoryAvatarConfig) {
    super({ key: 'BootScene' });
    this.chapterId = chapterId;
    this.avatar = avatar;
  }

  preload() {
    for (const asset of INTERIOR_ASSETS) this.load.image(`interior-${asset}`, `/story/interiors/${asset}.png`);
    // Every Inkling cosmetic shares a 100x100 viewBox, so the existing locker
    // assets can be layered directly inside Phaser without pre-baking every
    // possible avatar combination.
    this.load.svg('player-base', `/ink/base/${this.avatar.base}.svg`, { width: 64, height: 64 });
    this.load.svg('player-eyes', `/ink/eyes/${this.avatar.eyes}.svg`, { width: 64, height: 64 });

    if (this.avatar.accessory !== 'none') {
      this.load.svg('player-accessory-1', `/ink/accessories/${this.avatar.accessory}.svg`, {
        width: 64,
        height: 64,
      });
    }
    if (this.avatar.accessory2 !== 'none') {
      this.load.svg('player-accessory-2', `/ink/accessories/${this.avatar.accessory2}.svg`, {
        width: 64,
        height: 64,
      });
    }
    if (this.avatar.aura !== 'none') {
      this.load.svg('player-aura', `/ink/auras/${this.avatar.aura}.svg`, { width: 76, height: 76 });
    }

    VILLAGE_NPCS.forEach((npc, index) => {
      this.load.svg(`npc-${index}-base`, `/ink/base/${npc.base}.svg`, { width: 64, height: 64 });
      this.load.svg(`npc-${index}-eyes`, `/ink/eyes/${npc.eyes}.svg`, { width: 64, height: 64 });
      this.load.svg(`npc-${index}-accessory`, `/ink/accessories/${npc.accessory}.svg`, { width: 64, height: 64 });
    });

    this.load.svg('scholar-base', '/ink/base/droplet_01.svg', { width:64, height:64 });
    this.load.svg('scholar-eyes', '/ink/eyes/eyes_01.svg', { width:64, height:64 });
    this.load.svg('scholar-glasses', '/ink/accessories/glasses_01.svg', { width:64, height:64 });
    this.load.svg('scholar-quill', '/ink/accessories/quill_01.svg', { width:64, height:64 });

    // The thief reuses the established Inkling silhouette so the cutscene
    // belongs to the same visual world as the player and villagers.
    this.load.svg('thief-base', '/ink/base/droplet_04.svg', { width: 64, height: 64 });
    this.load.svg('thief-eyes', '/ink/eyes/eyes_07.svg', { width:64, height:64 });
    this.load.svg('thief-scarf', '/ink/accessories/scarf_01.svg', { width: 64, height: 64 });
  }

  create() {
    // Bake each cosmetic separately so facing, gear and avatar customization remain intact.
    convertAvatarTexture(this,'npc-0-base',0xf0a6aa,'luma-base');
    convertAvatarGroup(this,[{key:'scholar-base',color:0xcd7f32},
      {key:'scholar-eyes'},{key:'scholar-glasses',color:0x483a32},{key:'scholar-quill'}]);
    convertAvatarTexture(this,'npc-2-base',0xcd7f32,'road-knight-base');
    convertAvatarGroup(this,[{key:'player-base',color:hexToNumber(this.avatar.color)},
      ...['player-eyes','player-accessory-1','player-accessory-2'].map(key=>({key}))]);
    VILLAGE_NPCS.forEach((npc,index)=>{
      convertAvatarGroup(this,[{key:`npc-${index}-base`,color:hexToNumber(npc.color)},
        {key:`npc-${index}-eyes`},{key:`npc-${index}-accessory`}]);
    });
    convertAvatarGroup(this,[{key:'thief-base',color:0x111827},{key:'thief-eyes'},{key:'thief-scarf'}]);
    this.makePlayerHitboxTexture();
    this.makeStorySwordTexture();
    const arrow = this.add.graphics();
    arrow.lineStyle(2, 0xd8bd89);
    arrow.lineBetween(3, 5, 23, 5);
    arrow.fillStyle(0xdce8e5);
    arrow.fillTriangle(30, 5, 21, 1, 21, 9);
    arrow.lineStyle(2, 0x8fcfb7);
    arrow.lineBetween(2, 1, 7, 5);
    arrow.lineBetween(2, 9, 7, 5);
    arrow.generateTexture('story-arrow', 32, 10);
    arrow.destroy();
    this.makeDoorTextures();
    this.makeEnemyTexture();
    this.makeCheckpointTexture();
    this.makeCoinTexture();

    EventBus.emit('current-scene-ready', this);
    // Local visual-review entry point; never enabled in production builds.
    const review = process.env.NODE_ENV === 'development'
      ? new URLSearchParams(window.location.search).get('interiorReview') : null;
    if (review && Object.hasOwn(INTERIOR_PLANS,review)) {
      this.scene.start(review === 'archive' ? 'ArchiveScene' : 'VillageInteriorScene', { buildingId:review });
      return;
    }
    const progress = getStoryProgress();
    if (this.chapterId === 1 && !progress.opening && !progress.completedChapters.includes(1) && !progress.chapterCheckpoints[1]) {
      this.scene.start('WakeScene');
      return;
    }
    this.scene.start(this.chapterId === 2 ? 'WordwoodScene' : 'DungeonScene', { chapterId: this.chapterId });
  }

  // ── Texture generators ──────────────────────────────────────────────────────

  private makePlayerHitboxTexture() {
    // Physics stays on a tiny invisible texture while the layered avatar art
    // can bob and lean independently without moving the collision body.
    const g = this.make.graphics({ x: 0, y: 0, add: false } as never);
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 34, 28);
    g.generateTexture('player-hitbox', 34, 28);
    g.destroy();
  }

  private makeStorySwordTexture() {
    // Draw the weapon around its hilt so Player can rotate it from the hand,
    // instead of rotating an entire 100x100 cosmetic canvas.
    const g = this.make.graphics({ x: 0, y: 0, add: false } as never);
    g.fillStyle(0xe2e8f0);
    g.fillTriangle(10, 0, 4, 12, 16, 12);
    g.fillStyle(0xcbd5e1);
    g.fillRoundedRect(4, 9, 12, 36, 3);
    g.fillStyle(0xf8fafc, 0.82);
    g.fillRect(7, 10, 3, 31);
    g.lineStyle(2, 0x64748b, 0.9);
    g.lineBetween(15, 12, 15, 43);
    g.fillStyle(0x475569);
    g.fillRoundedRect(3, 43, 14, 4, 2);
    g.fillStyle(0x3f2d27);
    g.fillRoundedRect(7, 47, 6, 13, 2);
    g.lineStyle(1, 0x94a3b8, 0.7);
    g.lineBetween(7, 51, 13, 51);
    g.lineBetween(7, 55, 13, 55);
    g.fillStyle(0x64748b);
    g.fillCircle(10, 62, 3);
    g.generateTexture('story-sword', 20, 66);
    g.destroy();
  }

  private makeDoorTextures() {
    // Closed Word Seal — an ornate, luminous book-gate.
    const closed = this.make.graphics({ x: 0, y: 0, add: false } as never);
    closed.fillStyle(0x071820, 0.65);
    closed.fillRoundedRect(3, 4, 50, 126, 18);
    closed.fillStyle(0x173c49);
    closed.fillRoundedRect(6, 2, 44, 124, 17);
    closed.lineStyle(3, 0xf4c96b, 0.9);
    closed.strokeRoundedRect(7, 3, 42, 122, 16);
    closed.lineStyle(2, 0x58e0b0, 0.75);
    closed.strokeRoundedRect(12, 9, 32, 110, 12);

    // Open book glyph.
    closed.fillStyle(0xf8e7b3);
    closed.fillRoundedRect(13, 49, 14, 28, 4);
    closed.fillRoundedRect(29, 49, 14, 28, 4);
    closed.fillStyle(0xd6bd7d);
    closed.fillTriangle(13, 49, 27, 53, 27, 78);
    closed.fillTriangle(43, 49, 29, 53, 29, 78);
    closed.lineStyle(2, 0x173c49, 0.75);
    closed.lineBetween(28, 53, 28, 78);

    // Floating seal rune.
    closed.lineStyle(2, 0xf4c96b, 0.95);
    closed.strokeCircle(28, 34, 8);
    closed.lineBetween(23, 34, 33, 34);
    closed.lineBetween(28, 29, 28, 39);
    closed.fillStyle(0xfff1ad);
    closed.fillCircle(28, 34, 2);
    closed.generateTexture('door-closed', 56, 132);
    closed.destroy();

    // Open state is retained as a subtle portal texture for later transitions.
    const open = this.make.graphics({ x: 0, y: 0, add: false } as never);
    open.fillStyle(0x58e0b0, 0.12);
    open.fillRoundedRect(6, 2, 44, 124, 17);
    open.lineStyle(2, 0x58e0b0, 0.45);
    open.strokeRoundedRect(7, 3, 42, 122, 16);
    open.generateTexture('door-open', 56, 132);
    open.destroy();
  }

  private makeEnemyTexture() {
    // Blotling: a small, animated-looking spill of hostile purple ink.
    const g = this.make.graphics({ x: 0, y: 0, add: false } as never);
    g.fillStyle(0x120b20, 0.35);
    g.fillEllipse(24, 37, 42, 12);
    g.fillStyle(0x4c1d6f);
    g.fillTriangle(5, 28, 11, 10, 18, 25);
    g.fillTriangle(30, 24, 39, 7, 43, 30);
    g.fillCircle(24, 24, 19);
    g.fillStyle(0x7e22ce);
    g.fillCircle(19, 18, 13);
    g.fillCircle(31, 24, 10);
    g.fillStyle(0xc4b5fd);
    g.fillCircle(17, 23, 4);
    g.fillCircle(30, 23, 4);
    g.fillStyle(0x160c24);
    g.fillCircle(18, 24, 2);
    g.fillCircle(29, 24, 2);
    g.lineStyle(2, 0xf0abfc, 0.9);
    g.lineBetween(13, 17, 20, 19);
    g.lineBetween(27, 19, 34, 16);
    g.fillStyle(0x7e22ce);
    g.fillCircle(9, 35, 5);
    g.fillCircle(39, 35, 4);
    g.generateTexture('blotling', 48, 44);
    g.destroy();
  }

  private makeCheckpointTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false } as never);
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
    const g = this.make.graphics({ x: 0, y: 0, add: false } as never);
    g.fillStyle(0xfbbf24);
    g.fillCircle(8, 8, 8);
    g.fillStyle(0xfde68a);
    g.fillCircle(6, 6, 4);
    g.generateTexture('lexicoin', 16, 16);
    g.destroy();
  }
}
