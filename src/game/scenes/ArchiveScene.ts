import * as Phaser from 'phaser';
import { frameWorld } from '../world/framing';
import { buildTileInterior } from '../world/tileInterior';
import { ROOM_GRID } from '../story/interiorPlans';
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
    this.walls = this.physics.add.staticGroup();
    buildTileInterior(this,'archive',(x,y,w,h)=>this.addWall(x,y,w,h));
    this.pedestalGlow=this.add.circle(400,272,14,0x9dd5ba,0.05).setDepth(1);
    this.player = new Player(this, ROOM_GRID.spawn.x, ROOM_GRID.spawn.y, this.avatar);
    this.physics.add.collider(this.player.sprite, this.walls);
    frameWorld(this);

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


  private addWall(x: number, y: number, width: number, height: number) {
    const wall = this.physics.add.staticImage(x, y, '__DEFAULT');
    wall.setDisplaySize(width, height).setAlpha(0).refreshBody();
    this.walls.add(wall);
  }

  private checkInteractions() {
    const interactions = [
      { x: 400, y: 272, label: 'INSPECT THE EMPTY PEDESTAL', action: () => this.inspectPedestal() },
      { x: 272, y: 336, label: 'LISTEN TO VELLUM’S CHIMES', action: () => this.readFieldGuide() },
      { x: 528, y: 336, label: 'EXAMINE THE CRACKED MURAL', action: () => this.examineMural() },
      { ...ROOM_GRID.exit, label: 'LEAVE THE ARCHIVE', action: () => this.exitArchive() },
    ];

    const nearest = interactions
      .map((interaction) => ({
        interaction,
        distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, interaction.x, interaction.y),
      }))
      .filter(({ distance }) => distance < 34)
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
          'The First Dictionary’s tablet is split through the middle. The edges are clean: someone knew exactly where to cut.',
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
