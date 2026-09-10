import * as Phaser from 'phaser';
import { frameWorld } from '../world/framing';
import { AVATAR_LAYER_WIDTH, AVATAR_LAYER_HEIGHT } from '../pixelAvatar';
import { buildTown } from '../world/InkwellVillage';
import { TOWN, townDoor } from '../story/townPlan';
import { buildInkwellApproach } from '../world/inkwellApproach';
import { drawGatehouse,enterGatehouse } from '../world/gatehouse';
import { getStoryProgress,saveStoryProgress,markChapterComplete } from '@/lib/story/progress';
import Player from '../entities/Player';
import { createInkHand, createInkFoot } from '../entities/inkHand';
import Blotling from '../entities/Blotling';
import { EventBus } from '../EventBus';
import { AVATAR_BODY_OFFSETS, hexToNumber, type StoryAvatarConfig } from '../avatar';
import { facingVector, isInSwordArc } from '../combat';
import type { Facing } from '../movement';
import { VILLAGE_NPCS, type VillageNpcSpec } from '../npcs';
import { CHAPTER_ONE_STORY,ROAD_CHATTER } from '../story/chapterOne';
import { VILLAGE_BUILDINGS, type VillageBuildingId } from '../story/buildings';
import {
  buildInkwellVillage,
  buildResidentialLanes,
  drawWordGate,
  VILLAGE_HEIGHT,
  VILLAGE_ROOM_COUNT,
  VILLAGE_ROOM_WIDTH,
} from '../world/InkwellVillage';

const WALL_T = 24;       // wall thickness
const DOOR_H = 132;
const INTERACT_DIST = 105;
const TOTAL_WORD_GATES = 3;

interface DoorData {
  id: string;
  image: Phaser.Physics.Arcade.Image;
  isOpen: boolean;
  /** centre x,y of the door */
  x: number;
  y: number;
  gateNumber: number;
}

interface NpcData {
  spec: VillageNpcSpec;
  body: Phaser.Physics.Arcade.Image;
}

interface DialogueData {
  speaker: string;
  lines: readonly string[];
  lineIndex: number;
  text: Phaser.GameObjects.Text;
  objects: Phaser.GameObjects.GameObject[];
  onComplete?: () => void;
}

/**
 * DungeonScene — the main playable dungeon.
 *
 * Chapter 1 mockup: three connected Inkwell Village districts, built
 * programmatically so the visual direction can be tested before a Tiled pass.
 */
export default class DungeonScene extends Phaser.Scene {
  private chapterId!: number;
  private player!: Player;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private doors: DoorData[] = [];
  private doorColliders: Phaser.Physics.Arcade.Collider[] = [];
  private pendingQuestionDoor: string | null = null;
  private interactPrompt!: Phaser.GameObjects.Text;
  private chapterCompleteTriggered = false;
  /** When true, ignore player input (word lock open, transition, etc.) */
  private locked = false;
  private avatar: StoryAvatarConfig;
  private openedGates = 0;
  private enemies: Blotling[] = [];
  private openingEnemies: Blotling[] = [];
  private introObjects: Phaser.GameObjects.GameObject[] = [];
  private npcs: NpcData[] = [];
  private activeDialogue: DialogueData | null = null;
  private dialogueNextAllowedAt = 0;
  private investigationStage: 'defend' | 'inspect' | 'archive' | 'seals' = 'defend';
  /** Gate numbers already answered correctly; survives a death respawn. */
  private solvedGates = new Set<number>();
  /** True when this create() is a death respawn rather than a fresh chapter. */
  private isRespawn = false;
  private evidenceGlow!: Phaser.GameObjects.Arc;
  private evidenceTrail!: Phaser.GameObjects.Graphics;

  constructor(chapterId: number, avatar: StoryAvatarConfig) {
    super({ key: 'DungeonScene' });
    this.chapterId = chapterId;
    this.avatar = avatar;
  }

  init(data: { chapterId?: number; respawn?: boolean }) {
    if (data?.chapterId !== undefined) this.chapterId = data.chapterId;
    this.doors = [];
    this.doorColliders = [];
    this.pendingQuestionDoor = null;
    this.chapterCompleteTriggered = false;
    this.locked = false;
    this.enemies = [];
    this.openingEnemies = [];
    this.introObjects = [];
    this.npcs = [];
    this.activeDialogue = null;

    // Story progress must outlive a death respawn. ArchiveScene keeps its own
    // "already inspected" flag for the lifetime of the game instance, so wiping
    // investigationStage here used to strand the player: the Archive would
    // refuse to re-emit its completion event and the Word Seals stayed locked
    // forever. Death now only costs position and hearts.
    this.isRespawn = data?.respawn === true;
    if (!this.isRespawn) {
      this.investigationStage = 'defend';
      this.solvedGates = new Set();
    }
    if (this.chapterId === 0) this.investigationStage = 'seals';
    if(this.chapterId===1&&!this.isRespawn){
      const progress=getStoryProgress();
      if(progress.completedChapters.includes(1)){this.solvedGates=new Set([1,2,3]);this.investigationStage='seals';this.isRespawn=true;}
      else try{
        const saved=JSON.parse(progress.chapterCheckpoints[1]||'{}');
        this.solvedGates=new Set((Array.isArray(saved.gates)?saved.gates:[]).filter((n:number)=>[1,2,3].includes(n)));
        if(saved.roadCleared){this.investigationStage='seals';this.isRespawn=true;}
      }catch{/* Legacy room checkpoint: leave the existing progress untouched. */}
    }
    this.openedGates = this.solvedGates.size;
  }

  create() {
    const worldW = this.chapterId === 0 ? TOWN.width : VILLAGE_ROOM_WIDTH * VILLAGE_ROOM_COUNT;
    const top = this.chapterId === 0 ? TOWN.top : 0;
    const worldH = this.chapterId === 0 ? TOWN.height - TOWN.top : VILLAGE_HEIGHT;

    this.physics.world.setBounds(0, top, worldW, worldH);
    this.walls = this.physics.add.staticGroup();

    // Player begins on the main eastward road in Mossbell Lane.
    const reviewArchive = process.env.NODE_ENV === 'development' && this.chapterId === 0
      && new URLSearchParams(window.location.search).get('exteriorReview') === 'archive';
    this.player = new Player(this, reviewArchive ? 1040 : this.chapterId === 0 ? TOWN.spawn.x : 115,
      reviewArchive ? 400 : this.chapterId === 0 ? TOWN.spawn.y : VILLAGE_HEIGHT / 2, this.avatar);
    if(new URLSearchParams(window.location.search).get('arrival')==='gatehouse'){
      const point=this.chapterId===0?TOWN.gatehouse.spawn:{x:3056,y:336};
      this.player.sprite.body!.reset(point.x,point.y);
    }
    if(process.env.NODE_ENV==='development'&&this.chapterId===1){
      const review=new URLSearchParams(window.location.search).get('roadReview');
      const points:Record<string,[number,number]>={crossing:[400,304],camp:[1296,304],orchard:[1968,464],arrival:[2800,304]};
      if(review&&points[review])this.player.sprite.body!.reset(...points[review]);
    }

    // Scenery and gate colliders need the player to exist first.
    this.buildVillage();

    // Wall collision (single collider covers all static wall bodies)
    this.physics.add.collider(this.player.sprite, this.walls);
    if (this.chapterId !== 0 && !(this.chapterId===1&&getStoryProgress().completedChapters.includes(1))) this.spawnOpeningAttackers();
    this.buildVillageNpcs();
    if (this.chapterId !== 0) this.buildArchiveEvidence();

    // Camera
    this.cameras.main.setBounds(0, top, worldW, worldH);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    frameWorld(this, this.chapterId === 0);
    this.cameras.main.fadeIn(500, 8, 24, 28);

    // Interact prompt (follows player, hidden by default)
    this.interactPrompt = this.add
      .text(0, 0, '[ E ]  ANSWER WORD SEAL', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#fff0ba',
        backgroundColor: '#10263a',
        padding: { x: 11, y: 6 },
        letterSpacing: 1,
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setVisible(false);

    // EventBus: React → Phaser
    EventBus.on('question-result', this.onQuestionResult, this);
    EventBus.on('game-paused', this.onPause, this);
    EventBus.on('game-resumed', this.onResume, this);
    EventBus.on('player-attack', this.onPlayerAttack, this);
    EventBus.on('player-bow', this.onPlayerBow, this);
    EventBus.on('player-died', this.onPlayerDied, this);
    EventBus.on('archive-investigation-complete', this.onArchiveInvestigationComplete, this);
    this.events.on(Phaser.Scenes.Events.RESUME, this.onSceneResumed, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

    // Announce ready to React
    EventBus.emit('current-scene-ready', this);
    EventBus.emit('health-changed', { hearts: this.player.hearts });
    EventBus.emit('lexicoins-changed', { amount: this.player.lexicoins });
    EventBus.emit('word-gates-changed', { opened: this.openedGates, total: TOTAL_WORD_GATES });

    if (this.chapterId === 0) this.showWorldMessage('Inkwell — a little time between adventures', '#8fcfb7');
    else if(this.chapterId===1&&getStoryProgress().completedChapters.includes(1))this.showWorldMessage('The road is clear — Inkwell’s gatehouse is to the east.','#b4c99b');
    else if (this.isRespawn) this.resumeAfterDeath();
    else this.startOpeningCutscene();
  }

  /** Objective text for the current investigation stage, reused after a respawn. */
  private currentObjective(): string {
    switch (this.investigationStage) {
      case 'defend': return 'Clear the crossing on Inkwell Road';
      case 'inspect': return 'Inspect the torn page on the road';
      case 'archive': return 'Search the Inkwell Archive';
      default: return 'Restore the Word Seals and reach Inkwell’s gatehouse';
    }
  }

  /** A respawn skips the opening cutscene and simply restates the objective. */
  private resumeAfterDeath() {
    this.showWorldMessage(this.currentObjective(), '#f4c96b');
  }

  // ── Village builder ──────────────────────────────────────────────────────────

  private buildVillage() {
    if (this.chapterId === 0) {
      buildTown(this, this.addObstacle);
      drawGatehouse(this,TOWN.gatehouse.x,TOWN.gatehouse.y,this.addObstacle);
      this.addWall(TOWN.width / 2, 24, TOWN.width, 32);
      this.addWall(TOWN.width / 2, TOWN.height - 16, TOWN.width, 32);
      this.addWall(16, TOWN.height / 2, 32, TOWN.height);
      this.addWall(TOWN.width - 16, TOWN.height / 2, 32, TOWN.height);
      return;
    }
    const worldW = VILLAGE_ROOM_WIDTH * VILLAGE_ROOM_COUNT;
    if(this.chapterId===1)buildInkwellApproach(this,this.addObstacle);
    else buildInkwellVillage(this, this.addObstacle, this.chapterId === 0);
    if (this.chapterId === 0) buildResidentialLanes(this, this.addObstacle);

    // Invisible world bounds sit beneath the illustrated hedge border.
    if (this.chapterId === 0) {
      this.addWall(1320, 12, 2640, 24);
      this.addWall(2968, 12, 464, 24);
      this.addWall(800, -500, 1600, 1000);
      this.addWall(2400, -958, 1600, 28);
      this.addWall(3174, -500, 28, 1000);
    } else this.addWall(worldW / 2, WALL_T / 2, worldW, WALL_T);
    this.addWall(worldW / 2, VILLAGE_HEIGHT - WALL_T / 2, worldW, WALL_T);
    this.addWall(WALL_T / 2, VILLAGE_HEIGHT / 2, WALL_T, VILLAGE_HEIGHT);
    this.addWall(worldW - WALL_T / 2, VILLAGE_HEIGHT / 2, WALL_T, VILLAGE_HEIGHT);

    // Three questions are the chapter's critical path.
    for (const [gateIndex, x] of (this.chapterId === 0 ? [] : [VILLAGE_ROOM_WIDTH, VILLAGE_ROOM_WIDTH * 2, VILLAGE_ROOM_WIDTH * 3]).entries()) {
      this.buildDoorwall(x, gateIndex + 1);
    }

    if (this.chapterId !== 0 && this.chapterId !== 1) this.buildCompleteZone(VILLAGE_ROOM_WIDTH * 4 - 45);
  }

  /**
   * Build the wall + door combo between rooms.
   * Leaves a 120px gap in the middle for the door, fills above/below with wall.
   */
  private buildDoorwall(x: number, gateNumber: number) {
    const cy = VILLAGE_HEIGHT / 2;
    const opening = DOOR_H + 20; // gap in the wall for the door sprite
    const wallAboveH = cy - opening / 2 - WALL_T;
    const wallBelowH = cy - opening / 2 - WALL_T;

    // Wall above door gap
    this.addWall(x, wallAboveH / 2 + WALL_T, WALL_T, wallAboveH);
    // Wall below door gap
    this.addWall(x, VILLAGE_HEIGHT - WALL_T - wallBelowH / 2, WALL_T, wallBelowH);

    drawWordGate(this, x, cy, gateNumber);

    // Door image (physics static body used as collider)
    const doorImg = this.physics.add.staticImage(x, cy, 'door-closed');
    doorImg.setDepth(5);
    doorImg.refreshBody();

    const doorCollider = this.physics.add.collider(this.player.sprite, doorImg);

    const alreadySolved = this.solvedGates.has(gateNumber);
    const door: DoorData = {
      id: `word-seal-${gateNumber}`,
      image: doorImg,
      isOpen: alreadySolved,
      x,
      y: cy,
      gateNumber,
    };

    // Seals answered before a death stay open, so a respawn never re-asks them.
    if (alreadySolved) {
      doorCollider.destroy();
      (doorImg.body as Phaser.Physics.Arcade.StaticBody).enable = false;
      doorImg.setVisible(false);
    }

    this.doors.push(door);
    this.doorColliders.push(doorCollider);
  }

  private buildCompleteZone(x: number) {
    const zone = this.add
      .zone(x, VILLAGE_HEIGHT / 2, 30, VILLAGE_HEIGHT - WALL_T * 2)
      .setDepth(0);
    this.physics.add.existing(zone, false);
    (zone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.physics.add.overlap(this.player.sprite, zone, this.onChapterComplete, undefined, this);
  }

  private addWall(x: number, y: number, w: number, h: number) {
    const body = this.physics.add.staticImage(x, y, '__DEFAULT');
    body.setDisplaySize(w, h);
    body.refreshBody();
    body.setAlpha(0);
    this.walls.add(body);
  }

  private addObstacle = (x: number, y: number, width: number, height: number) => {
    this.addWall(x, y, width, height);
  };

  // ── Update loop ─────────────────────────────────────────────────────────────

  update(_time: number, delta: number) {
    if (this.activeDialogue) {
      this.player.stopMovement();
      if (this.time.now >= this.dialogueNextAllowedAt && this.player.isInteractJustDown()) {
        this.advanceDialogue();
      }
      return;
    }
    if (this.locked || !this.sys.isActive()) return;

    this.player.update(delta);
    let hasDefeated = false;
    for (const enemy of this.enemies) {
      if (enemy.defeated) {
        hasDefeated = true;
        continue;
      }
      if (enemy.update(delta, this.player) && this.player.takeDamage(1)) {
        this.cameras.main.shake(130, 0.008);
      }
    }
    // Defeated Blotlings destroy their sprites but used to stay in the array
    // forever, so every frame and every sword swing walked over dead entries.
    // `openingEnemies` keeps its own references, so the cutscene gate is safe.
    if (hasDefeated) this.enemies = this.enemies.filter((enemy) => !enemy.defeated);
    this.checkInteractionProximity();
  }

  // ── Opening attack and combat ──────────────────────────────────────────────

  private spawnOpeningAttackers() {
    const spawns = [
      [380, 278], [500, 330], [620, 280],
      [1040, 272], [1360, 304], [1488, 272],
      [1776, 336], [1904, 464], [2160, 400], [2288, 272],
    ];
    // The three road attackers belong to the opening beat; once the road has
    // been cleared they must not return, or a respawn would look like a reset.
    const roadCleared = this.investigationStage !== 'defend';
    spawns.forEach(([x, y], index) => {
      if (index < 3 && roadCleared) return;
      const enemy = new Blotling(this, x, y);
      this.enemies.push(enemy);
      if (index < 3) this.openingEnemies.push(enemy);
      this.physics.add.collider(enemy.sprite, this.walls);
      this.physics.add.collider(enemy.sprite, this.player.sprite);
    });
  }

  private startOpeningCutscene() {
    this.locked = true;
    this.player.stopMovement();

    const topBar = this.add.rectangle(400, 22, 800, 44, 0x050b12, 0.96)
      .setScrollFactor(0).setDepth(90);
    const bottomBar = this.add.rectangle(400, 535, 800, 130, 0x050b12, 0.95)
      .setScrollFactor(0).setDepth(90);
    const speaker = this.add.text(56, 493, 'INKWELL VILLAGE', {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#f4c96b',
      letterSpacing: 2,
    }).setScrollFactor(0).setDepth(91);
    const dialogue = this.add.text(56, 519, CHAPTER_ONE_STORY.opening[0], {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      color: '#f8fafc',
      wordWrap: { width: 680 },
    }).setScrollFactor(0).setDepth(91);
    const hint = this.add.text(744, 566, 'Q  STRIKE', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#58e0b0',
      letterSpacing: 1,
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(91).setAlpha(0);

    this.introObjects = [topBar, bottomBar, speaker, dialogue, hint];
    this.cameras.main.shake(380, 0.012);

    // A proper Inkling silhouette keeps the thief cohesive with the cast.
    const thiefShadow = this.add.ellipse(0, 23, 38, 12, 0x020617, 0.42);
    const thiefLeftFoot = createInkFoot(this,-10,21,0x111827);
    const thiefRightFoot = createInkFoot(this,10,21,0x111827);
    const thiefLeftHand = createInkHand(this, -15, 7, 0x111827);
    const thiefRightHand = createInkHand(this, 15, 7, 0x111827);
    const thiefBase = this.add.image(0, 0, 'thief-base').setDisplaySize(AVATAR_LAYER_WIDTH, AVATAR_LAYER_HEIGHT);
    const thiefEyes = this.add.image(0, -5, 'thief-eyes').setDisplaySize(AVATAR_LAYER_WIDTH, AVATAR_LAYER_HEIGHT).setTint(0xc4b5fd);
    const thiefScarf = this.add.image(0, -7, 'thief-scarf').setDisplaySize(AVATAR_LAYER_WIDTH, AVATAR_LAYER_HEIGHT).setTint(0x64748b);
    const stolenPage = this.add.rectangle(-28, 7, 14, 22, 0xf8e7b3).setStrokeStyle(1, 0xd6bd7d);
    const thief = this.add.container(690, 302, [
      thiefShadow, thiefLeftFoot, thiefRightFoot, thiefBase,
      thiefLeftHand, thiefEyes, thiefScarf, thiefRightHand, stolenPage,
    ]).setDepth(25).setScale(0.78);
    this.introObjects.push(thief);
    this.tweens.add({ targets: thief, x: 785, alpha: 0.15, duration: 1150, delay: 620, ease: 'Sine.in' });

    this.enemies.slice(0, 3).forEach((enemy, index) => {
      enemy.sprite.setScale(0.2).setAlpha(0);
      this.tweens.add({
        targets: enemy.sprite,
        alpha: 1,
        scale: 1,
        duration: 260,
        delay: 250 + index * 180,
        ease: 'Back.out',
      });
    });

    this.time.delayedCall(1900, () => {
      dialogue.setText(CHAPTER_ONE_STORY.opening[1]);
      hint.setAlpha(1);
    });
    this.time.delayedCall(3550, () => {
      this.tweens.add({
        targets: this.introObjects,
        alpha: 0,
        duration: 320,
        onComplete: () => this.introObjects.forEach((object) => object.destroy()),
      });
      this.locked = false;
      this.showWorldMessage('Clear the crossing on Inkwell Road', '#f0abfc');
    });
  }

  private onPlayerAttack = ({
    type,
    facing,
    x,
    y,
  }: {
    type: 'swing' | 'spin';
    facing?: Facing;
    x: number;
    y: number;
  }) => {
    if (this.locked || !this.sys.isActive()) return;

    let defeatedThisAttack = 0;

    for (const enemy of this.enemies) {
      if (enemy.defeated) continue;
      const inRange = type === 'spin'
        ? Phaser.Math.Distance.Between(x, y, enemy.sprite.x, enemy.sprite.y) <= 72
        : isInSwordArc({ x, y }, enemy.sprite, facing ?? this.player.facing, 64);
      if (inRange && enemy.takeHit(x, y, type === 'spin' ? 2 : 1)) {
        defeatedThisAttack += 1;
        this.spawnInkBurst(enemy.sprite.x, enemy.sprite.y);
      }
    }

    if (
      defeatedThisAttack > 0 &&
      this.investigationStage === 'defend' &&
      this.openingEnemies.every((enemy) => enemy.defeated)
    ) {
      this.investigationStage = 'inspect';
      this.evidenceTrail.setAlpha(0.9);
      this.tweens.add({ targets: this.evidenceGlow, alpha: 0.7, scale: 1.35, duration: 350, yoyo: true });
      this.showWorldMessage('The creatures dropped something — inspect the ink trail', '#f4c96b');
    }
  };

  private onPlayerBow = ({ x, y, facing }: { x: number; y: number; facing: Facing }) => {
    if (this.locked || !this.sys.isActive()) return;
    const direction = facingVector(facing);
    const arrow = this.physics.add.image(x, y, 'story-arrow').setDepth(15).setScale(0.78);
    arrow.setRotation(Math.atan2(direction.y, direction.x));
    arrow.body.setSize(10, 10);
    arrow.setVelocity(direction.x * 430, direction.y * 430);
    const colliders: Phaser.Physics.Arcade.Collider[] = [];
    const remove = () => {
      if (!arrow.active) return;
      colliders.forEach((collider) => { if (collider.world) collider.destroy(); });
      arrow.destroy();
    };
    colliders.push(this.physics.add.collider(arrow, this.walls, remove));
    for (const door of this.doors) {
      if (!door.isOpen) colliders.push(this.physics.add.collider(arrow, door.image, remove));
    }
    for (const enemy of this.enemies) {
      if (enemy.defeated) continue;
      colliders.push(this.physics.add.overlap(arrow, enemy.sprite, () => {
        if (!arrow.active || enemy.defeated) return;
        if (enemy.takeHit(arrow.x, arrow.y, 1)) this.spawnInkBurst(enemy.sprite.x, enemy.sprite.y);
        remove();
        if (this.investigationStage === 'defend' && this.openingEnemies.every((e) => e.defeated)) {
          this.investigationStage = 'inspect';
          this.evidenceTrail.setAlpha(0.9);
          this.showWorldMessage('Inspect the torn page beside the crossing', '#cbd5e1');
        }
      }));
    }
    this.time.delayedCall(1400, remove);
  };


  private spawnInkBurst(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const drop = this.add.circle(x, y, Phaser.Math.Between(2, 5), 0x9333ea, 0.9).setDepth(25);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(24, 66);
      this.tweens.add({
        targets: drop,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        duration: 360,
        onComplete: () => drop.destroy(),
      });
    }
  }

  private showWorldMessage(message: string, color: string) {
    const text = this.add.text(400, 94, message, {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color,
      backgroundColor: '#081820dd',
      padding: { x: 18, y: 10 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(80).setAlpha(0);
    this.tweens.add({
      targets: text,
      alpha: 1,
      y: 104,
      duration: 220,
      hold: 1900,
      yoyo: true,
      onComplete: () => text.destroy(),
    });
  }

  private onPlayerDied = () => {
    if (this.locked || !this.sys.isActive()) return;
    this.locked = true;
    this.player.stopMovement();
    this.cameras.main.fadeOut(700, 20, 5, 30);
    this.time.delayedCall(850, () =>
      this.scene.restart({ chapterId: this.chapterId, respawn: true }));
  };

  private buildVillageNpcs() {
    VILLAGE_NPCS.forEach((original, index) => {
      const position = this.chapterId === 0 ? TOWN.people[original.name] : undefined;
      const spec = position ? { ...original, x: position[0], y: position[1] } : original;
      if (spec.house || (spec.hubOnly && this.chapterId !== 0)) return;
      const offsets = AVATAR_BODY_OFFSETS[spec.base] ?? AVATAR_BODY_OFFSETS.droplet_01;
      const container = this.add.container(spec.x, spec.y - 16).setDepth(10).setScale(0.78);
      const shadow = this.add.ellipse(0, 23, 38, 13, 0x020617, 0.4);
      const bodyColor = hexToNumber(spec.color);
      const leftFoot = createInkFoot(this,-10,21,bodyColor);
      const rightFoot = createInkFoot(this,10,21,bodyColor);
      const leftHand = createInkHand(this, -15, 7, bodyColor);
      const rightHand = createInkHand(this, 15, 7, bodyColor);
      const base = this.add.image(0, 0, `npc-${index}-base`)
        .setDisplaySize(AVATAR_LAYER_WIDTH, AVATAR_LAYER_HEIGHT);
      const eyes = this.add.image(0, offsets.eyesY, `npc-${index}-eyes`).setDisplaySize(AVATAR_LAYER_WIDTH, AVATAR_LAYER_HEIGHT);
      const accessory = this.add.image(0, offsets.accessoryY, `npc-${index}-accessory`)
        .setDisplaySize(AVATAR_LAYER_WIDTH, AVATAR_LAYER_HEIGHT);
      container.add([shadow, leftFoot, rightFoot, base, eyes, accessory, leftHand, rightHand]);
      if (spec.name === 'Sir Serif') {
        const sword = this.add.image(15, 7, 'story-sword')
          .setOrigin(0.5, 54 / 66).setDisplaySize(14, 50).setAngle(12);
        container.add(sword);
        rightHand.setPosition(15, 7);
        container.bringToTop(rightHand);
      }

      // A planted pose avoids fractional layer wobble; the sword and its hand
      // keep one shared, stationary grip instead of separate idle tweens.

      const body = this.physics.add.staticImage(spec.x, spec.y + 8, '__DEFAULT');
      body.setDisplaySize(28, 28).setAlpha(0).refreshBody();
      this.physics.add.collider(this.player.sprite, body);
      this.npcs.push({ spec, body });
    });
  }

  private buildArchiveEvidence() {
    const x = 450;
    const y = 308;
    // Once the road is cleared the trail stays plainly visible, including after
    // a respawn that lands mid-investigation.
    const trailFound = this.investigationStage !== 'defend';
    this.evidenceTrail = this.add.graphics().setDepth(6).setAlpha(trailFound ? 0.9 : 0.22);
    this.evidenceTrail.fillStyle(0x6b21a8, 0.55);
    this.evidenceTrail.fillEllipse(x + 8, y + 7, 43, 12);
    this.evidenceTrail.fillCircle(x + 36, y, 5);
    this.evidenceTrail.fillCircle(x + 51, y + 7, 3);
    this.evidenceTrail.fillCircle(x + 65, y + 1, 2);
    this.evidenceTrail.fillStyle(0xe8d8b0);
    this.evidenceTrail.fillTriangle(x - 7, y - 10, x + 8, y - 12, x + 6, y + 10);
    this.evidenceTrail.lineStyle(1, 0x9b7a4d, 0.75);
    this.evidenceTrail.lineBetween(x - 1, y - 5, x + 5, y - 6);
    this.evidenceTrail.lineBetween(x, y, x + 4, y - 1);

    this.evidenceGlow = this.add.circle(x, y, 27, 0xcbd5e1, 0).setDepth(5);
    this.tweens.add({
      targets: this.evidenceGlow,
      alpha: { from: 0, to: 0.1 },
      scale: { from: 0.9, to: 1.12 },
      duration: 1250,
      yoyo: true,
      repeat: -1,
    });
  }

  private openDialogue(npc: NpcData) {
    this.openStoryDialogue(npc.spec.name, this.chapterId===1
      ? ROAD_CHATTER[npc.spec.name]??['Inkwell is just beyond the eastern gatehouse. We will follow once the road is clear.']
      : this.chapterId === 0 ? npc.spec.hubDialogue ?? npc.spec.dialogue : npc.spec.dialogue);
  }

  private openStoryDialogue(speakerLabel: string, lines: readonly string[], onComplete?: () => void) {
    this.locked = true;
    this.player.stopMovement();
    this.interactPrompt.setVisible(false);

    const panel = this.add.rectangle(400, 517, 700, 132, 0x071820, 0.96)
      .setStrokeStyle(2, 0x58e0b0, 0.65).setScrollFactor(0).setDepth(100);
    const name = this.add.text(72, 469, speakerLabel.toUpperCase(), {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#f4c96b',
      letterSpacing: 2,
    }).setScrollFactor(0).setDepth(101);
    const text = this.add.text(72, 497, lines[0], {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#f8fafc',
      lineSpacing: 7,
      wordWrap: { width: 630 },
    }).setScrollFactor(0).setDepth(101);
    const hint = this.add.text(730, 563, 'E  NEXT', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#8fcfb7',
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(101);

    this.activeDialogue = {
      speaker: speakerLabel,
      lines,
      lineIndex: 0,
      text,
      objects: [panel, name, text, hint],
      onComplete,
    };
    this.dialogueNextAllowedAt = this.time.now + 260;
  }

  private advanceDialogue() {
    if (!this.activeDialogue) return;
    const nextIndex = this.activeDialogue.lineIndex + 1;
    if (nextIndex < this.activeDialogue.lines.length) {
      this.activeDialogue.lineIndex = nextIndex;
      this.activeDialogue.text.setText(this.activeDialogue.lines[nextIndex]);
      this.dialogueNextAllowedAt = this.time.now + 220;
      return;
    }

    const { onComplete } = this.activeDialogue;
    this.activeDialogue.objects.forEach((object) => object.destroy());
    this.activeDialogue = null;
    this.locked = false;
    onComplete?.();
  }

  private checkInteractionProximity() {
    const travel=this.chapterId===0?TOWN.gatehouse:this.chapterId===1?{x:3056,y:304}:null;
    if(travel&&Phaser.Math.Distance.Between(this.player.x,this.player.y,travel.x,travel.y)<64){
      this.interactPrompt.setText('[ E ]  ENTER THE WAYFARER GATEHOUSE').setPosition(this.player.x,this.player.y-62).setVisible(true);
      if(this.player.isInteractJustDown()){
        if(this.chapterId===1){if(this.solvedGates.size<3){this.showWorldMessage('Restore the three road seals first.','#e3d1a2');return;}markChapterComplete(1);}
        this.player.stopMovement();enterGatehouse(this,this.chapterId===0?'village':'approach');
      }
      return;
    }
    for (const building of VILLAGE_BUILDINGS) {
      if(this.chapterId===1)continue;
      if (building.hubOnly && this.chapterId !== 0) continue;
      const entrance = this.chapterId === 0 ? townDoor(building.id) : building.entrance;
      if (!entrance || !this.isAtBuildingDoor(entrance.x, entrance.y)) continue;
      this.interactPrompt
        .setText(`[ E ]  ENTER ${building.name}`)
        .setPosition(this.player.x, this.player.y - 62)
        .setVisible(true);
      if (this.player.isInteractJustDown()) this.enterVillageBuilding(building.id);
      return;
    }

    const evidenceDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, 450, 308);
    if (this.investigationStage === 'inspect' && evidenceDistance < 86) {
      this.interactPrompt
        .setText('[ E ]  INSPECT THE TORN PAGE')
        .setPosition(this.player.x, this.player.y - 62)
        .setVisible(true);
      if (this.player.isInteractJustDown()) {
        this.openStoryDialogue('TORN ARCHIVE PAGE', CHAPTER_ONE_STORY.evidence, () => {
          this.investigationStage = this.chapterId===1?'seals':'archive';
          if(this.chapterId===1)this.saveRoad();
          this.showWorldMessage(this.chapterId===1?'Restore the road seals — Inkwell is beyond the gatehouse':'Search the Inkwell Archive', '#58e0b0');
        });
      }
      return;
    }

    const archiveDoor = this.chapterId === 0 ? townDoor('archive')! : { x: 315, y: 205 };
    if (this.chapterId!==1 && this.isAtBuildingDoor(archiveDoor.x, archiveDoor.y)) {
      const archiveReady = this.investigationStage === 'archive' || this.investigationStage === 'seals';
      this.interactPrompt
        .setText(archiveReady ? '[ E ]  ENTER THE INKWELL ARCHIVE' : '[ E ]  CHECK THE ARCHIVE DOOR')
        .setPosition(this.player.x, this.player.y - 62)
        .setVisible(true);
      if (this.player.isInteractJustDown()) {
        if (archiveReady) this.enterArchive();
        else this.showWorldMessage(
          this.investigationStage === 'defend'
            ? 'The doors are barred while Blotlings remain on Archive Road'
            : 'A torn page near the road is caught beneath the locked door',
          '#cbd5e1',
        );
      }
      return;
    }

    let nearestNpc: NpcData | null = null;
    let nearestNpcDistance = Infinity;
    for (const npc of this.npcs) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.spec.x, npc.spec.y);
      if (distance < 82 && distance < nearestNpcDistance) {
        nearestNpc = npc;
        nearestNpcDistance = distance;
      }
    }

    if (nearestNpc) {
      this.interactPrompt
        .setText(`[ E ]  TALK TO ${nearestNpc.spec.name.toUpperCase()}`)
        .setPosition(this.player.x, this.player.y - 62)
        .setVisible(true);
      if (this.player.isInteractJustDown()) this.openDialogue(nearestNpc);
      return;
    }

    let nearestDoor: DoorData | null = null;
    let nearestDist = Infinity;

    for (const door of this.doors) {
      if (door.isOpen) continue;
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        door.x, door.y,
      );
      if (dist < INTERACT_DIST && dist < nearestDist) {
        nearestDoor = door;
        nearestDist = dist;
      }
    }

    if (nearestDoor) {
      if (nearestDoor.gateNumber === 1 && this.investigationStage !== 'seals') {
        this.interactPrompt
          .setText('[ E ]  INVESTIGATE THE CROSSING FIRST')
          .setPosition(this.player.x, this.player.y - 62)
          .setVisible(true);
        if (this.player.isInteractJustDown()) {
          this.showWorldMessage(
            this.investigationStage === 'defend'
              ? 'The Blotlings are still guarding the road'
              : this.investigationStage === 'inspect'
                ? 'Inspect the torn page beside the crossing'
                : 'Search the Archive before following the thief',
            '#f4c96b',
          );
        }
        return;
      }
      this.interactPrompt
        .setText('[ E ]  ANSWER WORD SEAL')
        .setPosition(this.player.x, this.player.y - 62)
        .setVisible(true);

      if (this.player.isInteractJustDown()) {
        this.triggerWordLock(nearestDoor);
      }
    } else {
      this.interactPrompt.setVisible(false);
    }
  }

  /**
   * Door interaction uses a forgiving rectangle in front of the façade.
   * Circular checks made wide cottages frustrating because their collision body
   * stops the player below the visual door before they reach its exact point.
   */
  private isAtBuildingDoor(x: number, y: number) {
    return Math.abs(this.player.x - x) <= 72
      && this.player.y >= y - 24
      && this.player.y <= y + 118;
  }

  // Both doorway transitions lock input for the same reason every other
  // transition does: during the fade the scene still updates, so an unlocked
  // player could die or re-trigger the doorway and stack a second
  // pause()/launch() on top of the first.
  private enterArchive() {
    this.locked = true;
    this.player.stopMovement();
    this.interactPrompt.setVisible(false);
    this.cameras.main.fadeOut(220, 7, 18, 26);
    this.time.delayedCall(240, () => {
      this.scene.pause();
      this.scene.launch('ArchiveScene');
    });
  }

  private enterVillageBuilding(buildingId: VillageBuildingId) {
    this.locked = true;
    this.player.stopMovement();
    this.interactPrompt.setVisible(false);
    this.cameras.main.fadeOut(220, 7, 18, 26);
    this.time.delayedCall(240, () => {
      this.scene.pause();
      this.scene.launch('VillageInteriorScene', { buildingId });
    });
  }

  private onArchiveInvestigationComplete = () => {
    if (this.investigationStage !== 'archive') return;
    this.investigationStage = 'seals';
    this.showWorldMessage('The missing definition leads east — restore the Word Seals', '#58e0b0');
  };

  // ── Word lock flow ───────────────────────────────────────────────────────────

  private triggerWordLock(door: DoorData) {
    this.pendingQuestionDoor = door.id;
    this.locked = true;
    this.player.stopMovement();
    this.interactPrompt.setVisible(false);
    // Pause Phaser physics tick while modal is open
    this.physics.pause();
    EventBus.emit('player-near-door', { doorId: door.id, questionType: 'vocabulary' });
  }

  private onQuestionResult = ({ correct, doorId }: { correct: boolean; doorId: string }) => {
    if (!this.sys.isActive() || !this.locked || this.pendingQuestionDoor !== doorId) return;
    this.pendingQuestionDoor = null;
    const door = this.doors.find((d) => d.id === doorId);
    if (!door) {
      this.unlockInput();
      return;
    }

    if (correct) {
      this.openDoor(door);
    } else {
      // Brief shake of the door, then unlock
      this.tweens.add({
        targets: door.image,
        x: { from: door.x - 4, to: door.x + 4 },
        duration: 60,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          door.image.x = door.x;
          (door.image.body as Phaser.Physics.Arcade.StaticBody).reset(door.x, door.y);
          this.unlockInput();
        },
      });
    }
  };

  private openDoor(door: DoorData) {
    if (door.isOpen || !door.image.active || !door.image.body) return;
    door.isOpen = true;
    this.solvedGates.add(door.gateNumber);
    if(this.chapterId===1)this.saveRoad();

    // Remove physics collider for this door
    const idx = this.doors.indexOf(door);
    if (idx !== -1 && this.doorColliders[idx]?.world) {
      this.doorColliders[idx].destroy();
    }
    // Static bodies do not implement stop(), which disableBody() calls.
    (door.image.body as Phaser.Physics.Arcade.StaticBody).enable = false;

    // Fade out door sprite
    this.tweens.add({
      targets: door.image,
      alpha: 0,
      y: door.y - 20,
      duration: 350,
      ease: 'Power2',
      onComplete: () => door.image.setVisible(false),
    });

    // Reward lexicoins for correct answer
    this.player.addLexicoins(10);
    this.openedGates += 1;
    EventBus.emit('word-gates-changed', { opened: this.openedGates, total: TOTAL_WORD_GATES });
    this.spawnCoinBurst(door.x, door.y);

    this.time.delayedCall(400, () => this.unlockInput());
  }

  private unlockInput() {
    this.locked = false;
    this.physics.resume();
  }

  // ── Chapter complete ─────────────────────────────────────────────────────────

  private onChapterComplete = () => {
    if(this.chapterId===1){
      if(this.solvedGates.size<3||this.chapterCompleteTriggered)return;
      this.chapterCompleteTriggered=true;markChapterComplete(1);this.player.stopMovement();
      enterGatehouse(this,'approach');return;
    }
    if (this.chapterCompleteTriggered) return;
    this.chapterCompleteTriggered = true;
    this.locked = true;
    this.player.stopMovement();

    this.cameras.main.fade(600, 0, 0, 0, false, (_camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress === 1) {
        EventBus.emit('chapter-complete', { chapterId: this.chapterId });
      }
    });
  };

  // ── Visual helpers ───────────────────────────────────────────────────────────

  private spawnCoinBurst(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      const coin = this.add.image(x, y, 'lexicoin').setDepth(20);
      const angle = Phaser.Math.Between(0, 360);
      const dist = Phaser.Math.Between(30, 80);
      this.tweens.add({
        targets: coin,
        x: x + Math.cos(Phaser.Math.DegToRad(angle)) * dist,
        y: y + Math.sin(Phaser.Math.DegToRad(angle)) * dist,
        alpha: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => coin.destroy(),
      });
    }
  }

  // ── EventBus handlers ────────────────────────────────────────────────────────

  private onPause = () => {
    this.scene.pause();
  };

  private onResume = () => {
    this.scene.resume();
  };

  private onSceneResumed = () => {
    // Returning from an interior releases the lock taken by the doorway fade.
    this.locked = false;
    this.chapterCompleteTriggered=false;
    this.cameras.main.fadeIn(240, 7, 18, 26);
  };

  private saveRoad(){
    const progress=getStoryProgress();
    saveStoryProgress({chapterCheckpoints:{...progress.chapterCheckpoints,1:JSON.stringify({gates:[...this.solvedGates],roadCleared:this.investigationStage==='seals'})}});
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  shutdown() {
    EventBus.off('question-result', this.onQuestionResult, this);
    EventBus.off('game-paused', this.onPause, this);
    EventBus.off('game-resumed', this.onResume, this);
    EventBus.off('player-attack', this.onPlayerAttack, this);
    EventBus.off('player-bow', this.onPlayerBow, this);
    EventBus.off('player-died', this.onPlayerDied, this);
    EventBus.off('archive-investigation-complete', this.onArchiveInvestigationComplete, this);
    this.events.off(Phaser.Scenes.Events.RESUME, this.onSceneResumed, this);
  }
}
