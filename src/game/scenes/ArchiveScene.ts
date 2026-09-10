import * as Phaser from 'phaser';
import Player from '../entities/Player';
import { EventBus } from '../EventBus';
import type { StoryAvatarConfig } from '../avatar';

interface ArchiveDialogue {
  lines: readonly string[];
  index: number;
  text: Phaser.GameObjects.Text;
  objects: Phaser.GameObjects.GameObject[];
  onComplete?: () => void;
}

/** First village interior: a lore-rich room preserved while the outdoor scene is paused. */
export default class ArchiveScene extends Phaser.Scene {
  private avatar: StoryAvatarConfig;
  private player!: Player;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private prompt!: Phaser.GameObjects.Text;
  private dialogue: ArchiveDialogue | null = null;
  private nextDialogueAt = 0;
  private inspectedPedestal = false;
  private pedestalGlow!: Phaser.GameObjects.Arc;

  constructor(avatar: StoryAvatarConfig) {
    super({ key: 'ArchiveScene' });
    this.avatar = avatar;
  }

  /**
   * The scene instance is reused for every visit, so per-visit state has to be
   * cleared explicitly. `inspectedPedestal` is deliberately *not* reset: it is
   * chapter progress, and DungeonScene now preserves its matching
   * investigationStage across a respawn.
   */
  init() {
    this.dialogue = null;
    this.nextDialogueAt = 0;
  }

  create() {
    this.physics.world.setBounds(0, 0, 800, 600);
    this.drawArchive();
    this.walls = this.physics.add.staticGroup();
    this.addWall(400, 12, 800, 24);
    this.addWall(12, 300, 24, 600);
    this.addWall(788, 300, 24, 600);
    this.addWall(150, 94, 220, 84);
    this.addWall(650, 94, 220, 84);
    this.addWall(400, 112, 120, 70);
    this.addWall(400, 206, 76, 62);
    this.addWall(150, 271, 150, 96);
    this.addWall(681, 257, 116, 126);

    this.player = new Player(this, 400, 520, this.avatar);
    this.physics.add.collider(this.player.sprite, this.walls);

    this.prompt = this.add.text(0, 0, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#e2e8f0',
      backgroundColor: '#10263a',
      padding: { x: 11, y: 6 },
      letterSpacing: 1,
    }).setOrigin(0.5).setDepth(80).setVisible(false);

    this.cameras.main.fadeIn(320, 8, 18, 26);
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

  private drawArchive() {
    const g = this.add.graphics().setDepth(-10);

    // Deep ink void beyond the chamber.
    g.fillStyle(0x050d14);
    g.fillRect(0, 0, 800, 600);

    // Carved apse wall: large, simple shapes with strong top-left light.
    g.fillStyle(0x102631);
    g.fillRoundedRect(18, 18, 764, 174, 18);
    g.fillStyle(0x193843);
    g.fillRoundedRect(30, 30, 740, 146, 13);
    g.fillStyle(0x214650);
    g.fillTriangle(30, 30, 770, 30, 400, 106);
    g.fillStyle(0x091820, 0.42);
    g.fillTriangle(30, 176, 770, 176, 596, 93);

    // Ribbed timber canopy and hanging roots frame a living sanctuary.
    for (let x = 54; x <= 746; x += 58) {
      g.fillStyle(0x503b2f);
      g.fillRoundedRect(x, 22, 9, 153, 4);
      g.fillStyle(0x76543b, 0.8);
      g.fillRect(x + 2, 25, 2, 137);
    }
    g.fillStyle(0x755139);
    g.fillRoundedRect(24, 166, 752, 18, 7);
    g.fillStyle(0xb18458, 0.36);
    g.fillRect(30, 168, 735, 3);

    // Flagstone floor with directional shading.
    g.fillStyle(0x172b34);
    g.fillRect(18, 184, 764, 416);
    for (let row = 0; row < 9; row++) {
      const y = 184 + row * 48;
      const offset = row % 2 ? -42 : 0;
      for (let x = 20 + offset; x < 790; x += 84) {
        const lightness = ((Math.floor((x + 42) / 84) + row) % 3) * 0x030303;
        g.fillStyle(0x203841 + lightness);
        g.fillRoundedRect(x, y + 2, 80, 44, 4);
        g.fillStyle(0x0b1a22, 0.48);
        g.fillRect(x + 4, y + 43, 73, 3);
        g.fillStyle(0xa6b6a3, 0.14);
        g.fillRect(x + 5, y + 5, 66, 2);
        g.fillRect(x + 4, y + 7, 2, 24);
      }
    }

    // Central processional carpet is made of flowing ink, not fabric.
    g.fillStyle(0x071a21, 0.78);
    g.fillRoundedRect(326, 181, 148, 390, 50);
    g.lineStyle(3, 0x4fa995, 0.24);
    g.strokeRoundedRect(332, 187, 136, 378, 44);
    for (let y = 276; y < 536; y += 52) {
      g.fillStyle(0x75c9b1, 0.16);
      g.fillCircle(400, y, 9);
      g.fillTriangle(382, y + 16, 418, y + 16, 400, y + 31);
    }

    // Word banks: carved niches holding softly glowing language stones.
    this.drawGlyphBank(g, 44, 50, ['A', 'R', 'S', 'T', 'O', 'Y']);
    this.drawGlyphBank(g, 548, 50, ['M', 'E', 'A', 'N', 'I', 'N']);

    // Massive pillars create foreground depth around the shrine.
    this.drawArchivePillar(g, 276, 126);
    this.drawArchivePillar(g, 524, 126);

    // Living Lexicon shrine: a broken ring of meanings suspended above an ink basin.
    g.fillStyle(0x061219, 0.72);
    g.fillEllipse(400, 235, 176, 68);
    g.fillStyle(0x2c4650);
    g.fillEllipse(400, 219, 142, 58);
    g.fillStyle(0x07171e);
    g.fillEllipse(400, 211, 112, 40);
    g.lineStyle(6, 0x76b8a7, 0.62);
    g.beginPath();
    g.arc(400, 171, 56, Math.PI * 0.14, Math.PI * 0.84, false);
    g.arc(400, 171, 56, Math.PI * 1.12, Math.PI * 1.78, false);
    g.strokePath();
    g.lineStyle(2, 0xcbe9df, 0.35);
    g.beginPath();
    g.arc(400, 171, 45, Math.PI * 0.08, Math.PI * 0.79, false);
    g.strokePath();

    // Missing central definition leaves a conspicuous, jagged absence.
    g.fillStyle(0xcce3d8, 0.9);
    g.fillPoints([
      new Phaser.Geom.Point(378, 154), new Phaser.Geom.Point(394, 143),
      new Phaser.Geom.Point(414, 148), new Phaser.Geom.Point(422, 170),
      new Phaser.Geom.Point(411, 190), new Phaser.Geom.Point(387, 187),
      new Phaser.Geom.Point(375, 172),
    ], true);
    g.fillStyle(0x08151d);
    g.fillPoints([
      new Phaser.Geom.Point(391, 151), new Phaser.Geom.Point(406, 148),
      new Phaser.Geom.Point(414, 161), new Phaser.Geom.Point(407, 181),
      new Phaser.Geom.Point(390, 178), new Phaser.Geom.Point(383, 166),
    ], true);

    // Root-like ink veins feed the ring from the walls.
    g.lineStyle(6, 0x4e3a2e, 0.92);
    for (const points of [
      [[375, 139], [350, 112], [327, 100], [306, 74]],
      [[425, 139], [449, 110], [474, 97], [491, 68]],
      [[400, 137], [400, 108], [389, 84], [402, 57]],
    ]) {
      g.beginPath();
      g.moveTo(points[0][0], points[0][1]);
      for (const [x, y] of points.slice(1)) g.lineTo(x, y);
      g.strokePath();
    }

    // Violet theft scar pulls the eye eastward.
    g.fillStyle(0x613473, 0.28);
    g.fillEllipse(445, 259, 82, 24);
    g.fillCircle(486, 276, 8);
    g.fillCircle(507, 287, 5);
    g.lineStyle(3, 0x7d4b8c, 0.44);
    g.lineBetween(420, 222, 454, 259);
    g.lineBetween(454, 259, 491, 280);

    // Vellum's memory chimes replace a conventional reading desk.
    g.fillStyle(0x304b54);
    g.fillRoundedRect(75, 223, 150, 96, 16);
    g.fillStyle(0x456671);
    g.fillRoundedRect(85, 233, 130, 70, 11);
    for (let i = 0; i < 5; i++) {
      const x = 106 + i * 23;
      g.lineStyle(2, 0x9fd4c7, 0.55);
      g.lineBetween(x, 242, x, 271 + (i % 2) * 11);
      g.fillStyle(i === 2 ? 0xc4b5fd : 0x8fcfb7, 0.75);
      g.fillCircle(x, 280 + (i % 2) * 11, 7);
    }

    // Founding mural is formed from inset ink-glass tiles.
    g.fillStyle(0x091820);
    g.fillRoundedRect(620, 202, 126, 142, 18);
    g.fillStyle(0x24434c);
    g.fillRoundedRect(631, 213, 104, 120, 12);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        g.fillStyle((row + col) % 2 ? 0x31566a : 0x376c62);
        g.fillRoundedRect(640 + col * 30, 222 + row * 32, 25, 27, 5);
      }
    }
    g.fillStyle(0x9b62aa, 0.78);
    g.fillCircle(666, 270, 19);
    g.fillStyle(0x81d4bd, 0.85);
    g.fillCircle(708, 270, 19);
    g.lineStyle(3, 0xd4e7df, 0.42);
    g.lineBetween(647, 218, 719, 327);

    // Exit threshold and deep foreground vignette.
    g.fillStyle(0x061117);
    g.fillRoundedRect(347, 556, 106, 44, 16);
    g.fillStyle(0x9ed7c8, 0.18);
    g.fillRoundedRect(359, 558, 82, 8, 4);
    g.fillStyle(0x02080c, 0.28);
    g.fillRect(18, 572, 329, 28);
    g.fillRect(453, 572, 329, 28);

    // Broad translucent shadows anchor structures to the floor.
    const shadows = this.add.graphics().setDepth(-8);
    shadows.fillStyle(0x02070b, 0.32);
    shadows.fillTriangle(44, 184, 252, 184, 320, 400);
    shadows.fillTriangle(548, 184, 756, 184, 488, 400);
    shadows.fillEllipse(400, 241, 188, 73);

    // Cool shafts of sanctuary light cut through the darkness.
    const light = this.add.graphics().setDepth(-7);
    light.fillStyle(0xa9ead7, 0.045);
    light.fillTriangle(298, 24, 390, 24, 330, 450);
    light.fillTriangle(502, 24, 574, 24, 470, 420);

    // Revisiting a solved shrine keeps its gold light rather than reverting to
    // the unsolved teal.
    const glowColor = this.inspectedPedestal ? 0xf4c96b : 0x73e0c0;
    this.pedestalGlow = this.add.circle(400, 174, 68, glowColor, 0.07).setDepth(-6);
    this.tweens.add({
      targets: this.pedestalGlow,
      alpha: { from: 0.035, to: 0.15 },
      scale: { from: 0.94, to: 1.06 },
      duration: 1700,
      yoyo: true,
      repeat: -1,
    });

    for (const [x, y, delay] of [[106, 280, 0], [152, 291, 250], [198, 280, 500]]) {
      const mote = this.add.circle(x, y, 3, 0xb8f2df, 0.55).setDepth(1);
      this.tweens.add({ targets: mote, y: y - 12, alpha: 0.12, duration: 1250, delay, yoyo: true, repeat: -1 });
    }
  }

  private drawGlyphBank(g: Phaser.GameObjects.Graphics, x: number, y: number, glyphs: string[]) {
    g.fillStyle(0x07151c, 0.72);
    g.fillRoundedRect(x + 7, y + 9, 208, 119, 15);
    g.fillStyle(0x35515a);
    g.fillRoundedRect(x, y, 208, 119, 15);
    g.fillStyle(0x172b34);
    g.fillRoundedRect(x + 11, y + 12, 186, 94, 10);
    for (let i = 0; i < glyphs.length; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const gx = x + 27 + col * 58;
      const gy = y + 23 + row * 42;
      g.fillStyle(i % 2 ? 0x5c8379 : 0x55717b);
      g.fillRoundedRect(gx, gy, 42, 31, 8);
      g.lineStyle(2, 0xb9e1d5, 0.22);
      g.strokeRoundedRect(gx, gy, 42, 31, 8);
      g.fillStyle(0xd6eee7, 0.68);
      this.drawGlyph(g, glyphs[i], gx + 21, gy + 16);
    }
  }

  private drawGlyph(g: Phaser.GameObjects.Graphics, glyph: string, x: number, y: number) {
    const seed = glyph.charCodeAt(0);
    g.fillCircle(x, y, 3);
    g.fillRoundedRect(x - 10, y - 1, 20, 3, 1);
    if (seed % 2 === 0) g.fillRoundedRect(x - 1, y - 10, 3, 20, 1);
    else {
      g.lineStyle(3, 0xd6eee7, 0.68);
      g.lineBetween(x - 8, y + 8, x + 7, y - 8);
    }
  }

  private drawArchivePillar(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillStyle(0x071119, 0.48);
    g.fillEllipse(x + 12, y + 153, 64, 25);
    g.fillStyle(0x314b54);
    g.fillRoundedRect(x - 19, y, 38, 145, 11);
    g.fillStyle(0x49656c);
    g.fillRoundedRect(x - 27, y - 8, 54, 20, 7);
    g.fillRoundedRect(x - 28, y + 133, 56, 21, 7);
    g.fillStyle(0x83b7aa, 0.16);
    g.fillRoundedRect(x - 11, y + 10, 7, 117, 3);
  }

  private addWall(x: number, y: number, width: number, height: number) {
    const wall = this.physics.add.staticImage(x, y, '__DEFAULT');
    wall.setDisplaySize(width, height).setAlpha(0).refreshBody();
    this.walls.add(wall);
  }

  private checkInteractions() {
    const interactions = [
      { x: 400, y: 232, label: 'INSPECT THE EMPTY PEDESTAL', action: () => this.inspectPedestal() },
      { x: 150, y: 350, label: 'LISTEN TO VELLUM’S CHIMES', action: () => this.readFieldGuide() },
      { x: 681, y: 335, label: 'EXAMINE THE CRACKED MURAL', action: () => this.examineMural() },
      { x: 400, y: 548, label: 'LEAVE THE ARCHIVE', action: () => this.exitArchive() },
    ];

    const nearest = interactions
      .map((interaction) => ({
        interaction,
        distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, interaction.x, interaction.y),
      }))
      .filter(({ distance }) => distance < 82)
      .sort((a, b) => a.distance - b.distance)[0];

    if (!nearest) {
      this.prompt.setVisible(false);
      return;
    }

    this.prompt
      .setText(`[ E ]  ${nearest.interaction.label}`)
      .setPosition(this.player.x, this.player.y - 62)
      .setVisible(true);
    if (this.player.isInteractJustDown()) nearest.interaction.action();
  }

  private inspectPedestal() {
    const lines = this.inspectedPedestal
      ? ['The heart of the living tablet is still missing. Fine silver dust points toward Wordwood.']
      : [
          'The First Dictionary was never a book. Its meanings live inside this ring—and its heart has been cut away.',
          'The missing entry once defined “meaning” itself. Without it, nearby words are beginning to shift.',
          'Cut into the shrine is a symbol matching the masked stranger’s silver band.',
        ];
    this.openDialogue('THE FIRST DICTIONARY', lines, () => {
      if (this.inspectedPedestal) return;
      this.inspectedPedestal = true;
      this.pedestalGlow.setFillStyle(0xf4c96b, 0.12);
      EventBus.emit('archive-investigation-complete');
    });
  }

  private readFieldGuide() {
    this.openDialogue('VELLUM’S MEMORY CHIMES', [
      'The chimes replay Vellum’s voice: “Blotlings gather where abandoned ink has forgotten what it meant.”',
      'One damaged chime whispers a forbidden ending: “Restoration may still be possible.”',
    ]);
  }

  private examineMural() {
    this.openDialogue('THE FOUNDING MURAL', [
      'The oldest Inkling and the first Blotling are painted with the same green light at their centers.',
      'Someone recently cracked the mural exactly between them.',
    ]);
  }

  private openDialogue(speaker: string, lines: readonly string[], onComplete?: () => void) {
    this.player.stopMovement();
    this.prompt.setVisible(false);
    const panel = this.add.rectangle(400, 501, 700, 150, 0x071820, 0.97)
      .setStrokeStyle(2, 0x58e0b0, 0.58).setDepth(100);
    const heading = this.add.text(72, 450, speaker, {
      fontFamily: 'Georgia, serif', fontSize: '13px', fontStyle: 'bold', color: '#cbd5e1', letterSpacing: 2,
    }).setDepth(101);
    const text = this.add.text(72, 480, lines[0], {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#f8fafc', lineSpacing: 6, wordWrap: { width: 630 },
    }).setDepth(101);
    const hint = this.add.text(730, 556, 'E  NEXT', {
      fontFamily: 'Arial, sans-serif', fontSize: '10px', fontStyle: 'bold', color: '#8fcfb7',
    }).setOrigin(1, 0.5).setDepth(101);
    this.dialogue = { lines, index: 0, text, objects: [panel, heading, text, hint], onComplete };
    this.nextDialogueAt = this.time.now + 260;
  }

  private advanceDialogue() {
    if (!this.dialogue) return;
    const next = this.dialogue.index + 1;
    if (next < this.dialogue.lines.length) {
      this.dialogue.index = next;
      this.dialogue.text.setText(this.dialogue.lines[next]);
      this.nextDialogueAt = this.time.now + 220;
      return;
    }
    const { objects, onComplete } = this.dialogue;
    objects.forEach((object) => object.destroy());
    this.dialogue = null;
    onComplete?.();
  }

  private exitArchive() {
    this.player.stopMovement();
    this.cameras.main.fadeOut(240, 7, 18, 26);
    this.time.delayedCall(260, () => {
      this.scene.stop();
      this.scene.resume('DungeonScene');
    });
  }
}
