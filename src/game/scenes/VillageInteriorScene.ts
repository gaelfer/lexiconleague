import * as Phaser from 'phaser';
import Player from '../entities/Player';
import type { StoryAvatarConfig } from '../avatar';
import {
  VILLAGE_BUILDINGS,
  type VillageBuildingId,
  type VillageBuildingSpec,
} from '../story/buildings';
import {
  ambientShading,
  box,
  castShadow,
  darken,
  DEPTH,
  dome,
  dustMotes,
  exitThreshold,
  hangingLamp,
  lighten,
  lightPool,
  PALETTE,
  plankFloor,
  plasterWall,
  ROOM,
  rug,
  shelfUnit,
  sideWalls,
  wallHanging,
  wallWindow,
} from '../world/interiorKit';

interface InteriorInteraction {
  x: number;
  y: number;
  label: string;
  heading: string;
  lines: readonly string[];
}

interface InteriorDialogue {
  interaction: InteriorInteraction;
  index: number;
  text: Phaser.GameObjects.Text;
  objects: Phaser.GameObjects.GameObject[];
}

const EXIT = { x: 400, y: 560 };

/**
 * Reusable 3/4-view interior for ordinary village buildings.
 *
 * Rooms are drawn with the shared `interiorKit`, which fixes the light direction
 * and the cel-shading rules, so every building reads as part of one world.
 */
export default class VillageInteriorScene extends Phaser.Scene {
  private avatar: StoryAvatarConfig;
  private buildingId: VillageBuildingId = 'home';
  private building!: VillageBuildingSpec;
  private player!: Player;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private prompt!: Phaser.GameObjects.Text;
  private interactions: InteriorInteraction[] = [];
  private dialogue: InteriorDialogue | null = null;
  private nextDialogueAt = 0;

  constructor(avatar: StoryAvatarConfig) {
    super({ key: 'VillageInteriorScene' });
    this.avatar = avatar;
  }

  init(data: { buildingId?: VillageBuildingId }) {
    this.buildingId = data.buildingId ?? 'home';
    this.building = VILLAGE_BUILDINGS.find((building) => building.id === this.buildingId)
      ?? VILLAGE_BUILDINGS[0];
    this.interactions = [];
    this.dialogue = null;
    this.nextDialogueAt = 0;
  }

  create() {
    this.physics.world.setBounds(0, 0, ROOM.width, ROOM.height);
    this.walls = this.physics.add.staticGroup();

    this.drawRoomShell();
    const furniture = this.add.graphics().setDepth(DEPTH.furniture);
    if (this.buildingId === 'home') this.drawHome(furniture);
    else if (this.buildingId === 'scriptorium') this.drawScriptorium(furniture);
    else if (this.buildingId === 'mapmaker') this.drawMapmakerHouse(furniture);
    else this.drawTeaRoom(furniture);

    // Shading sits above the floor but below furniture so objects stay crisp.
    ambientShading(this.add.graphics().setDepth(DEPTH.shading));
    dustMotes(this);

    // Room bounds.
    this.addWall(400, 96, 800, 192);
    this.addWall(14, 300, 28, 600);
    this.addWall(786, 300, 28, 600);

    this.player = new Player(this, EXIT.x, 500, this.avatar);
    this.physics.add.collider(this.player.sprite, this.walls);

    this.prompt = this.add.text(0, 0, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#fdf3dc',
      backgroundColor: '#3a2419',
      padding: { x: 11, y: 6 },
      letterSpacing: 1,
    }).setOrigin(0.5).setDepth(80).setVisible(false);

    this.cameras.main.fadeIn(250, 26, 16, 12);
  }

  update(_time: number, delta: number) {
    if (this.dialogue) {
      this.player.stopMovement();
      if (this.time.now >= this.nextDialogueAt && this.player.isInteractJustDown()) this.advanceDialogue();
      return;
    }
    this.player.update(delta);
    this.checkInteractions();
  }

  // ── Shell ──────────────────────────────────────────────────────────────────

  private drawRoomShell() {
    const g = this.add.graphics().setDepth(DEPTH.shell);
    plankFloor(g, this.building.accent);
    sideWalls(g);
    plasterWall(g, this.building.accent);

    // Windows sit in the bays between wall studs. The tea room keeps its right
    // bay clear because the hearth is built into it.
    const bays = this.buildingId === 'tea-room' ? [162, 318] : [162, 482];
    for (const bay of bays) wallWindow(this, g, bay);

    exitThreshold(g, this.building.accent);
    // Hangs below the wall line so it reads as suspended in the room.
    hangingLamp(this, 400, 206);
  }

  // ── Rooms ──────────────────────────────────────────────────────────────────

  private drawHome(g: Phaser.GameObjects.Graphics) {
    rug(g, 400, 430, 250, 150, 0xa8544a);

    // Bed: carved headboard at the wall, then pillow, sheet and a thrown-back
    // quilt, so it reads as a bed slept in rather than a tiled rectangle.
    g.fillStyle(darken(PALETTE.timber, 0.35));
    g.fillRoundedRect(52, 196, 190, 30, 9);
    g.fillStyle(PALETTE.timber);
    g.fillRoundedRect(56, 194, 182, 26, 8);
    g.fillStyle(lighten(PALETTE.timber, 0.4), 0.8);
    g.fillRoundedRect(62, 198, 170, 5, 2);
    for (let i = 0; i < 5; i++) {
      g.fillStyle(darken(PALETTE.timber, 0.45), 0.75);
      g.fillRoundedRect(74 + i * 34, 202, 8, 14, 3);
    }
    box(g, 56, 220, 182, 118, PALETTE.timber, { face: 18, radius: 10 });

    // Mattress and pillow.
    g.fillStyle(darken(PALETTE.linen, 0.2));
    g.fillRoundedRect(68, 228, 158, 102, 8);
    g.fillStyle(PALETTE.linen);
    g.fillRoundedRect(68, 226, 158, 100, 8);
    g.fillStyle(lighten(PALETTE.linen, 0.55));
    g.fillRoundedRect(78, 232, 138, 34, 12);
    g.fillStyle(darken(PALETTE.linen, 0.14), 0.6);
    g.fillRoundedRect(80, 258, 134, 6, 3);

    // Quilt, pulled aside and gathered — soft folds instead of a grid.
    g.fillStyle(darken(0x3f6f65, 0.3));
    g.fillRoundedRect(66, 272, 156, 62, 10);
    g.fillStyle(0x3f6f65);
    g.fillRoundedRect(66, 270, 156, 60, 10);
    for (let i = 0; i < 4; i++) {
      const stripe = i % 2 === 0 ? 0x8fcfb7 : 0x4a7fa5;
      g.fillStyle(stripe, 0.7);
      g.fillRoundedRect(72, 278 + i * 13, 144 - i * 10, 9, 4);
      g.fillStyle(lighten(stripe, 0.5), 0.45);
      g.fillRoundedRect(72, 278 + i * 13, 144 - i * 10, 2, 1);
    }
    // The turned-back corner that says somebody left in a hurry.
    g.fillStyle(lighten(PALETTE.linen, 0.3));
    g.fillTriangle(176, 270, 222, 270, 222, 306);
    g.fillStyle(darken(PALETTE.linen, 0.22), 0.5);
    g.lineStyle(2, darken(PALETTE.linen, 0.3), 0.7);
    g.lineBetween(176, 270, 222, 306);

    g.lineStyle(2, darken(PALETTE.timber, 0.6), 0.85);
    g.strokeRoundedRect(56, 220, 182, 136, 10);
    this.addWall(147, 282, 182, 152);

    // Family table, still set for a breakfast nobody finished.
    box(g, 320, 236, 162, 92, PALETTE.oak, { face: 20, radius: 12 });
    for (const [px, food] of [[364, 0xf8e7b3], [438, 0x7c3f58]] as const) {
      g.fillStyle(darken(0xd9c091, 0.3));
      g.fillEllipse(px, 284, 46, 26);
      g.fillStyle(0xd9c091);
      g.fillEllipse(px, 281, 42, 23);
      g.fillStyle(lighten(0xd9c091, 0.5), 0.7);
      g.fillEllipse(px - 6, 276, 18, 8);
      g.fillStyle(food);
      g.fillCircle(px, 281, 9);
    }
    g.fillStyle(PALETTE.iron);
    g.fillRect(392, 272, 3, 20);
    g.fillRect(410, 272, 3, 20);
    this.addWall(401, 292, 162, 112);

    // Reading chair, angled toward the window.
    g.fillStyle(darken(0x8a5a38, 0.3));
    g.fillRoundedRect(258, 380, 82, 30, 9);
    g.fillStyle(0x8a5a38);
    g.fillRoundedRect(260, 378, 78, 26, 8);
    g.fillStyle(lighten(0x8a5a38, 0.4), 0.7);
    g.fillRoundedRect(266, 382, 66, 4, 2);
    box(g, 262, 402, 76, 46, 0x8a5a38, { face: 24, radius: 10 });
    g.fillStyle(0xb04a3a);
    g.fillRoundedRect(270, 408, 60, 34, 8);
    g.fillStyle(lighten(0xb04a3a, 0.4), 0.6);
    g.fillRoundedRect(274, 412, 52, 6, 3);
    g.fillStyle(darken(0xb04a3a, 0.3), 0.6);
    g.fillRoundedRect(274, 432, 52, 6, 3);
    this.addWall(300, 424, 80, 92);

    // Keepsake chest with a heavy iron lock.
    box(g, 596, 400, 124, 60, PALETTE.timber, { face: 26, radius: 8 });
    g.fillStyle(darken(PALETTE.timber, 0.45));
    g.fillRect(624, 400, 10, 86);
    g.fillRect(682, 400, 10, 86);
    g.fillStyle(PALETTE.flame);
    g.fillRoundedRect(650, 442, 16, 20, 4);
    g.fillStyle(darken(PALETTE.flame, 0.5));
    g.fillCircle(658, 450, 3);
    this.addWall(658, 436, 124, 86);

    // Faded family portrait on the back wall.
    wallHanging(g, 638, 44, 132, 106, 0x2c4a52, (ix, iy, iw, ih) => {
      g.fillStyle(0x3c626b);
      g.fillRect(ix, iy + ih * 0.6, iw, ih * 0.4);
      g.fillStyle(0xf59e9e);
      g.fillCircle(ix + iw * 0.34, iy + ih * 0.52, 19);
      g.fillStyle(0xfbd0d0, 0.55);
      g.fillCircle(ix + iw * 0.3, iy + ih * 0.46, 7);
      // The second figure has all but bled out of the ink.
      g.fillStyle(0x9fb6c4, 0.22);
      g.fillCircle(ix + iw * 0.68, iy + ih * 0.52, 19);
      g.fillStyle(0xd8d8e8, 0.85);
      g.fillRect(ix + iw * 0.6, iy + ih * 0.74, 16, 5);
    });

    this.interactions = [
      {
        x: 147, y: 392, label: 'CHECK YOUR BED', heading: 'A HURRIED MORNING',
        lines: ['The quilt is still thrown aside. You left in such a hurry that you never noticed the alarm bells had stopped.'],
      },
      {
        x: 401, y: 380, label: 'EXAMINE THE TABLE', heading: 'BREAKFAST FOR TWO',
        lines: ['Two plates were set this morning. The second has gone cold.', 'Whoever shared this home with you left before the attack—and has not returned.'],
      },
      {
        x: 658, y: 512, label: 'OPEN THE KEEPSAKE CHEST', heading: 'A SEALED LETTER',
        lines: ['Inside is a letter addressed to you in Archivist Vellum’s handwriting.', 'The seal bears the same narrow silver mark worn by the thief. The letter is dated tomorrow.'],
      },
      {
        x: 638, y: 232, label: 'VIEW THE FAMILY PORTRAIT', heading: 'THE OLD PORTRAIT',
        lines: ['One figure has faded almost completely from the ink. Only a silver bracelet remains clear.'],
      },
    ];
  }

  private drawScriptorium(g: Phaser.GameObjects.Graphics) {
    rug(g, 400, 452, 236, 132, 0x5b5285);

    // Repair bench: ink pots, offcuts of damaged words, a work lamp.
    box(g, 296, 234, 208, 100, 0x8a5a38, { face: 22, radius: 10 });
    g.fillStyle(darken(0x8a5a38, 0.2));
    g.fillRoundedRect(306, 244, 188, 24, 5);
    g.fillStyle(lighten(0x8a5a38, 0.25), 0.6);
    g.fillRoundedRect(306, 244, 188, 4, 2);
    const inks = [0x58e0b0, 0xc4b5fd, 0xf59e9e, 0x93c5fd, 0xf4c96b];
    inks.forEach((color, i) => dome(g, 324 + i * 40, 296, 11, color, false));
    // Violet stain creeping across the workpiece.
    g.fillStyle(0x7c3aa8, 0.35);
    g.fillEllipse(452, 300, 54, 20);
    g.fillStyle(0x7c3aa8, 0.5);
    g.fillCircle(470, 305, 5);
    this.addWall(400, 292, 208, 122);

    // Quill racks flanking the room.
    for (const x of [46, 642]) {
      shelfUnit(g, x, 206, 112, 210, 4, (index, shelfY) => {
        for (let i = 0; i < 4; i++) {
          const featherColor = i % 2 === 0 ? PALETTE.linen : 0x8fcfb7;
          const qx = x + 18 + i * 22;
          g.fillStyle(darken(featherColor, 0.4));
          g.fillTriangle(qx + 1, shelfY - 5, qx + 11, shelfY - 39, qx + 15, shelfY - 5);
          g.fillStyle(featherColor);
          g.fillTriangle(qx, shelfY - 6, qx + 9, shelfY - 38, qx + 13, shelfY - 6);
          g.fillStyle(lighten(featherColor, 0.5), 0.7);
          g.fillRect(qx + 5, shelfY - 34, 2, 26);
        }
        // One rack is conspicuously short a silver quill.
        if (x === 46 && index === 1) {
          g.fillStyle(darken(PALETTE.timber, 0.7));
          g.fillRect(x + 84, shelfY - 34, 14, 30);
        }
      });
      this.addWall(x + 56, 311, 112, 210);
    }

    // Punctuation press: iron frame, warm die, stacked sheets.
    box(g, 580, 448, 156, 72, 0x4a4a58, { face: 24, radius: 10 });
    g.fillStyle(0xc4b5fd, 0.55);
    g.fillRoundedRect(598, 460, 120, 48, 8);
    g.fillStyle(darken(0xc4b5fd, 0.35), 0.8);
    g.fillRoundedRect(608, 470, 100, 30, 6);
    g.fillStyle(PALETTE.linen);
    g.fillRect(622, 478, 20, 16);
    g.fillRect(648, 478, 20, 16);
    g.fillStyle(PALETTE.iron);
    g.fillRoundedRect(670, 432, 14, 40, 5);
    g.fillStyle(0xd6c7ff);
    g.fillCircle(677, 430, 9);
    // The comma die is still warm in an empty workshop.
    lightPool(this, 658, 500, 160, 110, 0xffa4d8, 0.14, DEPTH.floorDecor);
    this.addWall(658, 482, 156, 96);

    // Wall of pinned, half-repaired labels.
    wallHanging(g, 638, 40, 138, 112, 0x2f3b52, (ix, iy, iw, ih) => {
      const notes = [0xfde68a, 0xf9a8d4, 0x93c5fd, 0xe8d8b0, 0xa7f3d0, 0xfca5a5];
      notes.forEach((color, i) => {
        const nx = ix + 6 + (i % 3) * (iw / 3);
        const ny = iy + 8 + Math.floor(i / 3) * (ih / 2);
        g.fillStyle(0x2a1a20, 0.3);
        g.fillRect(nx + 2, ny + 2, 28, 24);
        g.fillStyle(color, 0.9);
        g.fillRect(nx, ny, 28, 24);
        g.fillStyle(0x2f3b52, 0.55);
        g.fillRect(nx + 4, ny + 6, 20, 2);
        g.fillRect(nx + 4, ny + 12, 14, 2);
      });
    });

    this.interactions = [
      {
        x: 400, y: 380, label: 'INSPECT THE REPAIR BENCH', heading: 'UNFINISHED WORDS',
        lines: ['Labels from all over town are waiting to be repaired.', 'Every damaged word contains the same violet stain found on the torn Archive page.'],
      },
      {
        x: 102, y: 452, label: 'CHECK THE QUILL RACK', heading: 'MASTER QUILL RACK',
        lines: ['One silver-tipped quill is missing. The inventory says it was borrowed by Mayor Quill three nights ago.'],
      },
      {
        x: 552, y: 468, label: 'USE THE PUNCTUATION PRESS', heading: 'PUNCTUATION PRESS',
        lines: ['The press stamps rhythm into repaired sentences.', 'Its comma die is warm, although the workshop has supposedly been empty all day.'],
      },
    ];
  }

  private drawMapmakerHouse(g: Phaser.GameObjects.Graphics) {
    rug(g, 400, 452, 240, 138, 0x8a6a3f);

    // Survey table: a working map, weighted at its corners.
    box(g, 280, 228, 244, 112, 0x8a5a38, { face: 22, radius: 12 });
    g.fillStyle(darken(PALETTE.linen, 0.2));
    g.fillRoundedRect(296, 240, 212, 88, 6);
    g.fillStyle(PALETTE.linen);
    g.fillRoundedRect(294, 238, 212, 88, 6);
    g.fillStyle(0xdcc9a2, 0.6);
    g.fillRoundedRect(294, 238, 212, 12, 6);
    // Coastline, route and survey pins.
    g.lineStyle(2, 0x6f8f72, 0.7);
    g.beginPath();
    g.moveTo(310, 312);
    g.lineTo(342, 268);
    g.lineTo(392, 300);
    g.lineTo(438, 258);
    g.lineTo(492, 286);
    g.strokePath();
    g.lineStyle(2, 0xb8654a, 0.85);
    g.beginPath();
    g.moveTo(316, 300);
    g.lineTo(360, 282);
    g.lineTo(414, 306);
    g.lineTo(478, 272);
    g.strokePath();
    for (const [px, py] of [[316, 300], [360, 282], [414, 306], [478, 272]]) {
      g.fillStyle(0x2a1a20, 0.3);
      g.fillCircle(px + 2, py + 2, 5);
      g.fillStyle(0xb8654a);
      g.fillCircle(px, py, 5);
      g.fillStyle(lighten(0xb8654a, 0.5), 0.8);
      g.fillCircle(px - 1.5, py - 1.5, 2);
    }
    g.fillStyle(PALETTE.iron);
    g.fillRoundedRect(470, 246, 26, 8, 3);
    this.addWall(402, 288, 244, 134);

    // Rack of rolled maps, each tied with a different cord.
    shelfUnit(g, 46, 202, 126, 262, 5, (index, shelfY) => {
      for (let i = 0; i < 2; i++) {
        const rollColor = (index + i) % 2 ? PALETTE.linen : 0xdcc9a2;
        const rx = 58 + i * 52;
        g.fillStyle(darken(rollColor, 0.35));
        g.fillRoundedRect(rx, shelfY - 26, 44, 22, 10);
        g.fillStyle(rollColor);
        g.fillRoundedRect(rx, shelfY - 28, 44, 22, 10);
        g.fillStyle(lighten(rollColor, 0.45), 0.7);
        g.fillRoundedRect(rx + 4, shelfY - 26, 36, 4, 2);
        g.fillStyle([0xb8654a, 0x5c8a4a, 0x4a7fa5][(index + i) % 3]);
        g.fillRect(rx + 18, shelfY - 28, 6, 22);
      }
    });
    this.addWall(109, 333, 126, 262);

    // Supper table with a third place kept ready.
    this.roundTable(g, 648, 424, 62, 0x8a5a38);
    for (const [bx, by, stew] of [[622, 414, 0x789f72], [676, 416, 0xb8654a]] as const) {
      dome(g, bx, by, 15, PALETTE.linen, false);
      g.fillStyle(stew);
      g.fillCircle(bx, by - 2, 7);
      g.fillStyle(lighten(stew, 0.5), 0.6);
      g.fillCircle(bx - 3, by - 5, 2.5);
    }
    // The absent daughter's setting: a folded map instead of a napkin.
    g.fillStyle(PALETTE.linen);
    g.fillRoundedRect(634, 448, 34, 22, 3);
    g.fillStyle(0xb8654a, 0.6);
    g.fillRect(640, 454, 22, 2);
    g.fillRect(640, 460, 16, 2);
    this.addWall(648, 434, 128, 100);

    // Wall map of the village as it used to be.
    wallHanging(g, 638, 40, 142, 112, 0x3a4b3f, (ix, iy, iw, ih) => {
      g.fillStyle(0xdcc9a2, 0.85);
      g.fillRect(ix, iy, iw, ih);
      g.lineStyle(2, 0x6f8f72, 0.6);
      g.strokeRect(ix + 8, iy + 8, iw - 16, ih - 16);
      g.fillStyle(0x8a5a38, 0.7);
      for (let i = 0; i < 5; i++) {
        g.fillRect(ix + 14 + (i * 23) % (iw - 30), iy + 20 + (i * 17) % (ih - 40), 12, 10);
      }
      // Wordwood, drawn where the village square now stands.
      g.fillStyle(0x2f6e4f, 0.55);
      g.fillCircle(ix + iw * 0.62, iy + ih * 0.6, 22);
      g.lineStyle(2, 0xb8654a, 0.8);
      g.strokeCircle(ix + iw * 0.62, iy + ih * 0.6, 22);
    });

    this.interactions = [
      {
        x: 402, y: 386, label: 'STUDY THE VILLAGE MAP', heading: 'THE VILLAGE BENEATH',
        lines: ['Mara has drawn old Inkwell Village beneath the streets you know.', 'Several modern houses sit directly over places labeled “words we agreed to forget.”'],
      },
      {
        x: 109, y: 498, label: 'CHECK THE MAP RACK', heading: 'MAPS THAT DISAGREE',
        lines: ['No two maps give Wordwood the same border.', 'On the oldest roll, the forest begins inside the village square.'],
      },
      {
        x: 648, y: 512, label: 'EXAMINE THE SUPPER', heading: 'A PLACE KEPT READY',
        lines: ['Two bowls are warm. A third place is set with a folded map instead of a napkin.', 'Mara still expects her daughter home from the eastern survey.'],
      },
    ];
  }

  private drawTeaRoom(g: Phaser.GameObjects.Graphics) {
    // Hearth set into the back wall, with a real fire and its light on the room.
    g.fillStyle(darken(PALETTE.timberDark, 0.3));
    g.fillRoundedRect(432, 74, 116, 118, 10);
    g.fillStyle(0x4a3b33);
    g.fillRoundedRect(442, 92, 96, 100, 8);
    g.fillStyle(0x1a1114);
    g.fillRoundedRect(452, 108, 76, 84, 6);
    g.fillStyle(0x5a2a1c);
    for (let i = 0; i < 3; i++) g.fillRoundedRect(460 + i * 22, 168, 18, 10, 4);
    const fire = this.add.graphics().setDepth(DEPTH.furniture + 1);
    fire.fillStyle(0xd9541f, 0.9);
    fire.fillEllipse(490, 162, 52, 34);
    fire.fillStyle(0xf59e2c, 0.95);
    fire.fillEllipse(490, 166, 36, 24);
    fire.fillStyle(0xffd487);
    fire.fillEllipse(490, 170, 18, 13);
    this.tweens.add({
      targets: fire,
      scaleY: { from: 0.9, to: 1.1 },
      alpha: { from: 0.85, to: 1 },
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
    const fireGlow = lightPool(this, 490, 300, 560, 440, 0xff9a3c, 0.22, DEPTH.floorDecor);
    this.tweens.add({
      targets: fireGlow,
      alpha: { from: 0.17, to: 0.25 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
    this.addWall(490, 150, 116, 116);

    rug(g, 300, 462, 224, 128, 0x5a8a7d);

    // Curved counter with the kettles of the house blend.
    box(g, 46, 214, 214, 108, 0x8a5a38, { face: 26, radius: 14 });
    g.fillStyle(0xb88758);
    g.fillRoundedRect(58, 224, 190, 22, 8);
    g.fillStyle(lighten(0xb88758, 0.4), 0.7);
    g.fillRoundedRect(58, 224, 190, 4, 2);
    for (const [x, tint] of [[104, 0x94a3b8], [156, 0xb08a3c], [208, 0x94a3b8]] as const) {
      g.fillStyle(darken(tint, 0.35));
      g.fillRoundedRect(x - 15, 268, 30, 26, 8);
      g.fillStyle(tint);
      g.fillRoundedRect(x - 15, 264, 30, 26, 8);
      g.fillStyle(lighten(tint, 0.55), 0.8);
      g.fillRoundedRect(x - 10, 268, 8, 12, 3);
      g.lineStyle(2, darken(tint, 0.5), 0.9);
      g.strokeCircle(x + 15, 276, 7);
      g.fillStyle(darken(tint, 0.6));
      g.fillRect(x - 4, 256, 8, 8);
      // Steam.
      const steam = this.add.circle(x, 248, 7, 0xffffff, 0.18).setDepth(DEPTH.furniture + 2);
      this.tweens.add({
        targets: steam,
        y: 216,
        alpha: 0,
        scale: 1.7,
        duration: 1900 + x * 3,
        repeat: -1,
        ease: 'Sine.out',
      });
    }
    this.addWall(153, 282, 214, 134);

    // Mismatched community tables, each with its regulars' cups.
    const tables: readonly [number, number, number][] = [
      [330, 330, 0x8fcfb7],
      [628, 336, 0xc4b5fd],
      [520, 440, 0xf0b77d],
    ];
    for (const [x, y, cloth] of tables) {
      this.roundTable(g, x, y, 58, PALETTE.oak, cloth);
      dome(g, x - 16, y - 6, 9, PALETTE.linen, false);
      dome(g, x + 17, y + 8, 9, PALETTE.linen, false);
      g.fillStyle(0x8a5a38, 0.8);
      g.fillCircle(x - 16, y - 8, 4);
      g.fillCircle(x + 17, y + 6, 4);
      this.addWall(x, y + 10, 116, 104);
    }
    // One cup carries the Archivist's crest, and its tea is still fresh.
    g.fillStyle(0xc4b5fd, 0.9);
    g.fillCircle(645, 342, 4);
    g.lineStyle(2, 0xf4c96b, 0.9);
    g.strokeCircle(645, 344, 8);

    // Noticeboard, papered over many times.
    wallHanging(g, 638, 44, 132, 108, 0x4a3b2a, (ix, iy, iw, ih) => {
      const notes: readonly [number, number, number][] = [
        [0, 0, 0xfde68a], [1, 0, 0xf9a8d4], [0, 1, 0x93c5fd], [1, 1, 0xe8d8b0],
      ];
      for (const [cx, cy, color] of notes) {
        const nx = ix + 6 + cx * (iw / 2);
        const ny = iy + 8 + cy * (ih / 2);
        g.fillStyle(0x2a1a20, 0.3);
        g.fillRect(nx + 2, ny + 2, 44, 34);
        g.fillStyle(color, 0.92);
        g.fillRect(nx, ny, 44, 34);
        g.fillStyle(0x4a3b2a, 0.5);
        g.fillRect(nx + 5, ny + 7, 34, 2);
        g.fillRect(nx + 5, ny + 14, 26, 2);
        g.fillRect(nx + 5, ny + 21, 30, 2);
        g.fillStyle(0xb04a3a);
        g.fillCircle(nx + 22, ny + 3, 3);
      }
    });

    this.interactions = [
      {
        x: 153, y: 396, label: 'SMELL THE KETTLES', heading: 'THE MOSSBELL BLEND',
        lines: ['The house blend changes with every village emergency.', 'Today it tastes of mint for courage, smoke for mourning, and far too much honey.'],
      },
      {
        x: 638, y: 240, label: 'READ THE NOTICEBOARD', heading: 'VILLAGE NOTICES',
        lines: ['“Lost: one silver quill. Please return before anyone notices.”', 'Below it: “Wordwood survey volunteers—meeting postponed again.”'],
      },
      {
        x: 520, y: 534, label: 'COUNT THE CUPS', heading: 'THE REGULARS',
        lines: ['Every chair has a favorite cup. One is painted with Archivist Vellum’s crest.', 'Its tea is fresh. Nobody remembers serving it.'],
      },
    ];
  }

  /** Round table with a skirt, an optional cloth, and four legs in shadow. */
  private roundTable(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    radius: number,
    wood: number,
    cloth?: number,
  ) {
    castShadow(g, cx, cy + radius * 0.72, radius * 1.9, radius * 0.6, 0.3);
    // A shallow edge, not a deep bowl: only a few pixels of rim show below the
    // top surface, which is what keeps it reading as a table from above.
    g.fillStyle(darken(wood, 0.42));
    g.fillEllipse(cx, cy + 7, radius * 2, radius * 1.3);
    g.fillStyle(wood);
    g.fillEllipse(cx, cy, radius * 2, radius * 1.3);
    g.fillStyle(lighten(wood, 0.28), 0.8);
    g.fillEllipse(cx, cy - 1, radius * 1.94, radius * 1.24);
    g.fillStyle(lighten(wood, 0.5), 0.5);
    g.fillEllipse(cx - radius * 0.24, cy - radius * 0.34, radius * 0.9, radius * 0.3);
    if (cloth !== undefined) {
      g.fillStyle(cloth, 0.55);
      g.fillEllipse(cx, cy + 2, radius * 1.34, radius * 0.86);
      g.fillStyle(lighten(cloth, 0.45), 0.45);
      g.fillEllipse(cx - radius * 0.12, cy - radius * 0.1, radius * 0.72, radius * 0.3);
    }
    g.lineStyle(2, darken(wood, 0.58), 0.8);
    g.strokeEllipse(cx, cy, radius * 2, radius * 1.3);
  }

  // ── Interaction ────────────────────────────────────────────────────────────

  private addWall(x: number, y: number, width: number, height: number) {
    const wall = this.physics.add.staticImage(x, y, '__DEFAULT');
    wall.setDisplaySize(width, height).setAlpha(0).refreshBody();
    this.walls.add(wall);
  }

  private checkInteractions() {
    const nearest = [
      ...this.interactions.map((interaction) => ({
        interaction,
        distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, interaction.x, interaction.y),
      })),
      {
        interaction: null,
        distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, EXIT.x, EXIT.y),
      },
    ].filter(({ distance }) => distance < 82).sort((a, b) => a.distance - b.distance)[0];

    if (!nearest) {
      this.prompt.setVisible(false);
      return;
    }
    if (!nearest.interaction) {
      this.prompt.setText('[ E ]  LEAVE').setPosition(this.player.x, this.player.y - 62).setVisible(true);
      if (this.player.isInteractJustDown()) this.exitBuilding();
      return;
    }
    this.prompt.setText(`[ E ]  ${nearest.interaction.label}`)
      .setPosition(this.player.x, this.player.y - 62).setVisible(true);
    if (this.player.isInteractJustDown()) this.openDialogue(nearest.interaction);
  }

  private openDialogue(interaction: InteriorInteraction) {
    this.player.stopMovement();
    this.prompt.setVisible(false);
    const panel = this.add.rectangle(400, 501, 700, 150, 0x2b1a12, 0.97)
      .setStrokeStyle(2, this.building.accent, 0.7).setDepth(100);
    const heading = this.add.text(72, 450, interaction.heading, {
      fontFamily: 'Georgia, serif', fontSize: '13px', fontStyle: 'bold', color: '#f4c96b', letterSpacing: 2,
    }).setDepth(101);
    const text = this.add.text(72, 480, interaction.lines[0], {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#fdf3dc', lineSpacing: 6, wordWrap: { width: 630 },
    }).setDepth(101);
    const hint = this.add.text(730, 556, 'E  NEXT', {
      fontFamily: 'Arial, sans-serif', fontSize: '10px', fontStyle: 'bold', color: '#f0b77d',
    }).setOrigin(1, 0.5).setDepth(101);
    this.dialogue = { interaction, index: 0, text, objects: [panel, heading, text, hint] };
    this.nextDialogueAt = this.time.now + 240;
  }

  private advanceDialogue() {
    if (!this.dialogue) return;
    const next = this.dialogue.index + 1;
    if (next < this.dialogue.interaction.lines.length) {
      this.dialogue.index = next;
      this.dialogue.text.setText(this.dialogue.interaction.lines[next]);
      this.nextDialogueAt = this.time.now + 220;
      return;
    }
    this.dialogue.objects.forEach((object) => object.destroy());
    this.dialogue = null;
  }

  private exitBuilding() {
    this.player.stopMovement();
    this.cameras.main.fadeOut(220, 26, 16, 12);
    this.time.delayedCall(240, () => {
      this.scene.stop();
      this.scene.resume('DungeonScene');
    });
  }
}
