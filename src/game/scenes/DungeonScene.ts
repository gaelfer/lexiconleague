import * as Phaser from 'phaser';
import Player from '../entities/Player';
import { EventBus } from '../EventBus';

const ROOM_W = 800;
const ROOM_H = 600;
const WALL_T = 24;       // wall thickness
const DOOR_W = 40;
const DOOR_H = 120;
const INTERACT_DIST = 90;

interface DoorData {
  id: string;
  image: Phaser.Physics.Arcade.Image;
  isOpen: boolean;
  /** centre x,y of the door */
  x: number;
  y: number;
}

/**
 * DungeonScene — the main playable dungeon.
 *
 * Phase 1: 3 rooms built programmatically (no Tiled maps yet).
 * The world is ROOM_W*3 × ROOM_H with a scrolling camera.
 *
 * Rooms:
 *   Room 0 — starting room (Inkwell Village entrance)
 *   Room 1 — middle room
 *   Room 2 — final room → chapter complete on reaching the right edge
 */
export default class DungeonScene extends Phaser.Scene {
  private chapterId!: number;
  private player!: Player;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private doors: DoorData[] = [];
  private doorColliders: Phaser.Physics.Arcade.Collider[] = [];
  private interactPrompt!: Phaser.GameObjects.Text;
  private chapterCompleteTriggered = false;
  /** When true, ignore player input (word lock open, transition, etc.) */
  private locked = false;

  constructor(chapterId: number) {
    super({ key: 'DungeonScene' });
    this.chapterId = chapterId;
  }

  init(data: { chapterId?: number }) {
    if (data?.chapterId !== undefined) this.chapterId = data.chapterId;
    this.doors = [];
    this.doorColliders = [];
    this.chapterCompleteTriggered = false;
    this.locked = false;
  }

  create() {
    const worldW = ROOM_W * 3;
    const worldH = ROOM_H;

    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.walls = this.physics.add.staticGroup();

    this.buildRooms(worldW, worldH);

    // Player spawns near left edge of room 0
    this.player = new Player(this, 120, ROOM_H / 2);

    // Wall collision (single collider covers all static wall bodies)
    this.physics.add.collider(this.player.sprite, this.walls);

    // Camera
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);

    // Interact prompt (follows player, hidden by default)
    this.interactPrompt = this.add
      .text(0, 0, '[ E ]  Open word lock', {
        fontSize: '13px',
        color: '#34d399',
        backgroundColor: '#080f1a',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setVisible(false);

    // EventBus: React → Phaser
    EventBus.on('question-result', this.onQuestionResult, this);
    EventBus.on('game-paused', this.onPause, this);
    EventBus.on('game-resumed', this.onResume, this);

    // Announce ready to React
    EventBus.emit('current-scene-ready', this);
    EventBus.emit('health-changed', { hearts: this.player.hearts });
    EventBus.emit('lexicoins-changed', { amount: this.player.lexicoins });
  }

  // ── Room builder ─────────────────────────────────────────────────────────────

  private buildRooms(worldW: number, worldH: number) {
    const roomLabels = [
      'Room 1 — Inkwell Village Entrance',
      'Room 2 — Village Square',
      'Room 3 — Eastern Gate',
    ];
    const floorColors = [0x0d1b2a, 0x0f2033, 0x0d1b2a];

    for (let i = 0; i < 3; i++) {
      const rx = i * ROOM_W;

      // Floor
      this.add
        .rectangle(rx + ROOM_W / 2, ROOM_H / 2, ROOM_W, ROOM_H, floorColors[i])
        .setDepth(0);

      // Subtle grid overlay (visual flavour)
      this.drawFloorGrid(rx, ROOM_W, ROOM_H);

      // Room label (top centre, faint)
      this.add
        .text(rx + ROOM_W / 2, 18, roomLabels[i], {
          fontSize: '11px',
          color: '#1e3a5f',
        })
        .setOrigin(0.5)
        .setDepth(2);

      // ── Walls ──
      // Top
      this.addWall(rx + ROOM_W / 2, WALL_T / 2, ROOM_W, WALL_T);
      // Bottom
      this.addWall(rx + ROOM_W / 2, ROOM_H - WALL_T / 2, ROOM_W, WALL_T);
      // Left boundary (only for first room, others have doorway on left)
      if (i === 0) {
        this.addWall(WALL_T / 2, ROOM_H / 2, WALL_T, ROOM_H);
      }
      // Right wall for last room
      if (i === 2) {
        this.addWall(rx + ROOM_W - WALL_T / 2, ROOM_H / 2, WALL_T, ROOM_H);
      }

      // ── Door between rooms i and i+1 ──
      if (i < 2) {
        this.buildDoorwall(rx + ROOM_W, i);
      }

      // ── Room separator wall (left side of room > 0) ──
      // Thin wall strip so player can't slip back (one-way progression in Phase 1)
      if (i > 0) {
        this.addWall(rx + WALL_T / 2, ROOM_H / 2, WALL_T, ROOM_H);
      }
    }

    // Chapter complete zone at right edge of room 2
    this.buildCompleteZone(ROOM_W * 2);
  }

  /**
   * Build the wall + door combo between rooms.
   * Leaves a 120px gap in the middle for the door, fills above/below with wall.
   */
  private buildDoorwall(x: number, fromRoomIndex: number) {
    const cy = ROOM_H / 2;
    const opening = DOOR_H + 20; // gap in the wall for the door sprite
    const wallAboveH = cy - opening / 2 - WALL_T;
    const wallBelowH = cy - opening / 2 - WALL_T;

    // Wall above door gap
    this.addWall(x, wallAboveH / 2 + WALL_T, WALL_T, wallAboveH);
    // Wall below door gap
    this.addWall(x, ROOM_H - WALL_T - wallBelowH / 2, WALL_T, wallBelowH);

    // Door image (physics static body used as collider)
    const doorImg = this.physics.add.staticImage(x, cy, 'door-closed');
    doorImg.setDepth(5);
    doorImg.refreshBody();

    const doorCollider = this.physics.add.collider(this.player.sprite, doorImg);

    const door: DoorData = {
      id: `door_${fromRoomIndex}_${fromRoomIndex + 1}`,
      image: doorImg,
      isOpen: false,
      x,
      y: cy,
    };

    this.doors.push(door);
    this.doorColliders.push(doorCollider);
  }

  private buildCompleteZone(roomStartX: number) {
    const zone = this.add
      .zone(roomStartX + ROOM_W - WALL_T - 20, ROOM_H / 2, 30, ROOM_H - WALL_T * 2)
      .setDepth(0);
    this.physics.add.existing(zone, false);
    (zone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.physics.add.overlap(this.player.sprite, zone, this.onChapterComplete, undefined, this);
  }

  private addWall(x: number, y: number, w: number, h: number) {
    // Visual
    this.add.rectangle(x, y, w, h, 0x1e3a5f).setDepth(1);
    // Physics body — use staticImage with __DEFAULT texture, resized
    const body = this.physics.add.staticImage(x, y, '__DEFAULT');
    body.setDisplaySize(w, h);
    body.refreshBody();
    body.setAlpha(0);
    this.walls.add(body);
  }

  private drawFloorGrid(rx: number, w: number, h: number) {
    const g = this.add.graphics().setDepth(0.5);
    g.lineStyle(1, 0x0f2a44, 0.3);
    const step = 48;
    for (let gx = rx; gx <= rx + w; gx += step) {
      g.moveTo(gx, 0);
      g.lineTo(gx, h);
    }
    for (let gy = 0; gy <= h; gy += step) {
      g.moveTo(rx, gy);
      g.lineTo(rx + w, gy);
    }
    g.strokePath();
  }

  // ── Update loop ─────────────────────────────────────────────────────────────

  update(_time: number, delta: number) {
    if (this.locked) return;

    this.player.update(delta);
    this.checkDoorProximity();
  }

  private checkDoorProximity() {
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
      this.interactPrompt
        .setPosition(this.player.x, this.player.y - 56)
        .setVisible(true);

      if (this.player.isInteractJustDown()) {
        this.triggerWordLock(nearestDoor);
      }
    } else {
      this.interactPrompt.setVisible(false);
    }
  }

  // ── Word lock flow ───────────────────────────────────────────────────────────

  private triggerWordLock(door: DoorData) {
    this.locked = true;
    this.player.stopMovement();
    this.interactPrompt.setVisible(false);
    // Pause Phaser physics tick while modal is open
    this.physics.pause();
    EventBus.emit('player-near-door', { doorId: door.id, questionType: 'vocabulary' });
  }

  private onQuestionResult = ({ correct, doorId }: { correct: boolean; doorId: string }) => {
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
    door.isOpen = true;

    // Remove physics collider for this door
    const idx = this.doors.indexOf(door);
    if (idx !== -1 && this.doorColliders[idx]) {
      this.doorColliders[idx].destroy();
    }
    (door.image as Phaser.Physics.Arcade.Image).disableBody();

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
    this.spawnCoinBurst(door.x, door.y);

    this.time.delayedCall(400, () => this.unlockInput());
  }

  private unlockInput() {
    this.locked = false;
    this.physics.resume();
  }

  // ── Chapter complete ─────────────────────────────────────────────────────────

  private onChapterComplete = () => {
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

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  shutdown() {
    EventBus.off('question-result', this.onQuestionResult, this);
    EventBus.off('game-paused', this.onPause, this);
    EventBus.off('game-resumed', this.onResume, this);
  }
}
