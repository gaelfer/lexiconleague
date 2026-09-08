import * as Phaser from 'phaser';
import Player from '../entities/Player';
import type { StoryAvatarConfig } from '../avatar';
import {
  VILLAGE_BUILDINGS,
  type VillageBuildingId,
  type VillageBuildingSpec,
} from '../story/buildings';

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

/** Reusable Pokémon-style interior scene for ordinary village buildings. */
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
  }

  create() {
    this.physics.world.setBounds(0, 0, 800, 600);
    this.walls = this.physics.add.staticGroup();
    this.drawRoomShell();
    if (this.buildingId === 'home') this.drawHome();
    else if (this.buildingId === 'scriptorium') this.drawScriptorium();
    else if (this.buildingId === 'mapmaker') this.drawMapmakerHouse();
    else this.drawTeaRoom();

    this.addWall(400, 14, 800, 28);
    this.addWall(14, 300, 28, 600);
    this.addWall(786, 300, 28, 600);

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
    this.cameras.main.fadeIn(250, 8, 18, 26);
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

  private drawRoomShell() {
    const g = this.add.graphics().setDepth(-10);
    g.fillStyle(0x0b151d);
    g.fillRect(0, 0, 800, 600);
    g.fillStyle(0x182b34);
    g.fillRoundedRect(20, 20, 760, 151, 8);
    for (let x = 44; x < 780; x += 72) {
      g.fillStyle(0x223942, 0.4);
      g.fillRect(x, 27, 2, 130);
    }
    g.fillStyle(0x6b452f);
    g.fillRect(20, 157, 760, 14);
    g.fillRect(98, 20, 12, 151);
    g.fillRect(690, 20, 12, 151);
    g.fillRect(20, 45, 760, 9);
    g.fillStyle(this.building.accent, 0.22);
    g.fillRect(20, 158, 760, 3);
    for (let y = 171; y < 600; y += 32) {
      g.fillStyle((y / 32) % 2 === 0 ? 0x2e4148 : 0x263941);
      g.fillRect(20, y, 760, 29);
      g.fillStyle(0x13252e, 0.65);
      g.fillRect(20, y + 28, 760, 3);
    }
    g.fillStyle(0x071018, 0.48);
    g.fillRect(20, 171, 10, 429);
    g.fillRect(770, 171, 10, 429);
    g.fillStyle(this.building.accent, 0.2);
    g.fillRoundedRect(305, 168, 190, 400, 36);
    g.lineStyle(3, this.building.accent, 0.35);
    g.strokeRoundedRect(310, 173, 180, 390, 31);
    g.fillStyle(0x08131c);
    g.fillRoundedRect(350, 557, 100, 43, 14);

    // Soft window light and a woven threshold make the shell feel inhabited.
    for (const x of [184, 616]) {
      g.fillStyle(0x0c2230);
      g.fillRoundedRect(x - 34, 69, 68, 58, 7);
      g.fillStyle(0x9ed9d0, 0.42);
      g.fillRoundedRect(x - 27, 76, 54, 44, 5);
      g.lineStyle(3, 0x6b452f, 0.9);
      g.lineBetween(x, 76, x, 120);
      g.lineBetween(x - 27, 98, x + 27, 98);
      g.fillStyle(this.building.accent, 0.07);
      g.fillTriangle(x - 42, 127, x + 42, 127, x + 92, 410);
    }
    g.fillStyle(0xd8c99d, 0.55);
    g.fillRoundedRect(350, 535, 100, 24, 7);
    for (let x = 360; x < 445; x += 14) {
      g.fillStyle(this.building.accent, 0.38);
      g.fillRect(x, 539, 7, 16);
    }
  }

  private drawHome() {
    const g = this.add.graphics().setDepth(0);

    // Bed and patchwork quilt.
    g.fillStyle(0x6b452f);
    g.fillRoundedRect(55, 62, 190, 126, 14);
    g.fillStyle(0xe8d8b0);
    g.fillRoundedRect(67, 73, 166, 104, 10);
    g.fillStyle(0x3f6f65);
    g.fillRoundedRect(69, 113, 162, 62, 8);
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 5; col++) {
        g.fillStyle((row + col) % 2 === 0 ? 0x8fcfb7 : 0x31526b, 0.7);
        g.fillRect(76 + col * 29, 119 + row * 24, 26, 21);
      }
    }
    this.addWall(150, 125, 190, 126);

    // Family table with a half-finished breakfast from before the attack.
    g.fillStyle(0x6b452f);
    g.fillRoundedRect(324, 70, 152, 94, 18);
    g.fillStyle(0xc8aa72);
    g.fillEllipse(363, 105, 40, 22);
    g.fillEllipse(438, 105, 40, 22);
    g.fillStyle(0xf8e7b3);
    g.fillCircle(363, 105, 8);
    g.fillStyle(0x7c3f58);
    g.fillCircle(438, 105, 8);
    this.addWall(400, 117, 152, 94);

    // Portrait and keepsake chest.
    g.fillStyle(0x6b452f);
    g.fillRoundedRect(600, 58, 136, 120, 10);
    g.fillStyle(0x173f38);
    g.fillRoundedRect(610, 68, 116, 100, 6);
    g.fillStyle(0xf59e9e);
    g.fillCircle(642, 119, 22);
    g.fillStyle(0x73a8e8);
    g.fillCircle(692, 119, 22);
    g.fillStyle(0x6b452f);
    g.fillRoundedRect(612, 328, 112, 70, 10);
    g.fillStyle(0xf4c96b, 0.65);
    g.fillRoundedRect(661, 343, 14, 17, 3);
    this.addWall(668, 363, 112, 70);

    this.interactions = [
      {
        x: 150, y: 218, label: 'CHECK YOUR BED', heading: 'A HURRIED MORNING',
        lines: ['The quilt is still thrown aside. You left in such a hurry that you never noticed the alarm bells had stopped.'],
      },
      {
        x: 400, y: 188, label: 'EXAMINE THE TABLE', heading: 'BREAKFAST FOR TWO',
        lines: ['Two plates were set this morning. The second has gone cold.', 'Whoever shared this home with you left before the attack—and has not returned.'],
      },
      {
        x: 668, y: 423, label: 'OPEN THE KEEPSAKE CHEST', heading: 'A SEALED LETTER',
        lines: ['Inside is a letter addressed to you in Archivist Vellum’s handwriting.', 'The seal bears the same narrow silver mark worn by the thief. The letter is dated tomorrow.'],
      },
      {
        x: 668, y: 208, label: 'VIEW THE FAMILY PORTRAIT', heading: 'THE OLD PORTRAIT',
        lines: ['One figure has faded almost completely from the ink. Only a silver bracelet remains clear.'],
      },
    ];
  }

  private drawScriptorium() {
    const g = this.add.graphics().setDepth(0);

    // Central repair bench.
    g.fillStyle(0x5d3b2b);
    g.fillRoundedRect(280, 62, 240, 112, 12);
    g.fillStyle(0xc8aa72);
    g.fillRoundedRect(291, 73, 218, 22, 6);
    for (let i = 0; i < 5; i++) {
      g.fillStyle([0x58e0b0, 0xc4b5fd, 0xf59e9e, 0x93c5fd, 0xf4c96b][i]);
      g.fillCircle(320 + i * 40, 130, 12);
    }
    this.addWall(400, 118, 240, 112);

    // Quill racks and punctuation press.
    for (const x of [78, 618]) {
      g.fillStyle(0x6b452f);
      g.fillRoundedRect(x, 60, 104, 245, 10);
      for (let i = 0; i < 5; i++) {
        g.fillStyle(i % 2 === 0 ? 0xe2e8f0 : 0x8fcfb7);
        g.fillTriangle(x + 24, 88 + i * 40, x + 68, 76 + i * 40, x + 41, 103 + i * 40);
      }
      this.addWall(x + 52, 182, 104, 245);
    }
    g.fillStyle(0x334155);
    g.fillRoundedRect(574, 353, 152, 96, 12);
    g.fillStyle(0xc4b5fd, 0.5);
    g.fillRoundedRect(596, 367, 108, 56, 8);
    this.addWall(650, 401, 152, 96);

    this.interactions = [
      {
        x: 400, y: 205, label: 'INSPECT THE REPAIR BENCH', heading: 'UNFINISHED WORDS',
        lines: ['Labels from all over town are waiting to be repaired.', 'Every damaged word contains the same violet stain found on the torn Archive page.'],
      },
      {
        x: 180, y: 230, label: 'CHECK THE QUILL RACK', heading: 'MASTER QUILL RACK',
        lines: ['One silver-tipped quill is missing. The inventory says it was borrowed by Mayor Quill three nights ago.'],
      },
      {
        x: 650, y: 477, label: 'USE THE PUNCTUATION PRESS', heading: 'PUNCTUATION PRESS',
        lines: ['The press stamps rhythm into repaired sentences.', 'Its comma die is warm, although the workshop has supposedly been empty all day.'],
      },
    ];
  }

  private drawMapmakerHouse() {
    const g = this.add.graphics().setDepth(0);

    // A worktable covered in hand-drawn routes and weighted map corners.
    g.fillStyle(0x5d3b2b);
    g.fillRoundedRect(268, 66, 264, 124, 14);
    g.fillStyle(0xe8d8b0);
    g.fillRoundedRect(284, 78, 232, 91, 7);
    g.lineStyle(2, 0x668b78, 0.72);
    g.lineBetween(306, 145, 356, 96);
    g.lineBetween(356, 96, 414, 134);
    g.lineBetween(414, 134, 486, 91);
    for (const [x, y] of [[306, 145], [356, 96], [414, 134], [486, 91]]) {
      g.fillStyle(0xb8654a);
      g.fillCircle(x, y, 5);
    }
    this.addWall(400, 128, 264, 124);

    // Rolled maps, travel pack, and a tiny family supper tell a life beyond the plot.
    g.fillStyle(0x6b452f);
    g.fillRoundedRect(55, 67, 120, 258, 10);
    for (let i = 0; i < 6; i++) {
      g.fillStyle(i % 2 ? 0xd8c99d : 0xbfa77b);
      g.fillRoundedRect(71, 83 + i * 36, 88, 18, 8);
      g.fillStyle(0x7c4d32);
      g.fillCircle(78, 92 + i * 36, 6);
    }
    this.addWall(115, 196, 120, 258);
    g.fillStyle(0x684c3b);
    g.fillRoundedRect(620, 328, 112, 78, 14);
    g.fillStyle(0xd8c99d);
    g.fillCircle(650, 363, 15);
    g.fillCircle(702, 363, 15);
    g.fillStyle(0x789f72);
    g.fillCircle(650, 363, 6);
    g.fillStyle(0xb8654a);
    g.fillCircle(702, 363, 6);
    this.addWall(676, 367, 112, 78);

    this.interactions = [
      { x: 400, y: 220, label: 'STUDY THE VILLAGE MAP', heading: 'THE VILLAGE BENEATH', lines: ['Mara has drawn old Inkwell Village beneath the streets you know.', 'Several modern houses sit directly over places labeled “words we agreed to forget.”'] },
      { x: 150, y: 240, label: 'CHECK THE MAP RACK', heading: 'MAPS THAT DISAGREE', lines: ['No two maps give Wordwood the same border.', 'On the oldest roll, the forest begins inside the village square.'] },
      { x: 676, y: 440, label: 'EXAMINE THE SUPPER', heading: 'A PLACE KEPT READY', lines: ['Two bowls are warm. A third place is set with a folded map instead of a napkin.', 'Mara still expects her daughter home from the eastern survey.'] },
    ];
  }

  private drawTeaRoom() {
    const g = this.add.graphics().setDepth(0);

    // Curved counter, steaming kettles, and mismatched community tables.
    g.fillStyle(0x604432);
    g.fillRoundedRect(72, 72, 194, 108, 16);
    g.fillStyle(0xb88758);
    g.fillRoundedRect(83, 82, 172, 18, 7);
    for (const x of [116, 166, 216]) {
      g.fillStyle(0x94a3b8);
      g.fillRoundedRect(x - 13, 119, 26, 22, 7);
      g.lineStyle(2, 0xcbd5e1, 0.36);
      g.strokeCircle(x + 13, 130, 7);
    }
    this.addWall(169, 126, 194, 108);
    for (const [x, y, color] of [[390, 105, 0x8fcfb7], [610, 116, 0xc4b5fd], [515, 328, 0xf0b77d]] as const) {
      g.fillStyle(0x654832);
      g.fillCircle(x, y, 54);
      g.fillStyle(color, 0.52);
      g.fillCircle(x, y, 39);
      g.fillStyle(0xe8d8b0);
      g.fillCircle(x - 12, y - 4, 8);
      g.fillCircle(x + 15, y + 7, 8);
      this.addWall(x, y, 92, 92);
    }

    // Noticeboard is dense but label-free: the room tells its story through use.
    g.fillStyle(0x6b452f);
    g.fillRoundedRect(620, 220, 116, 76, 8);
    for (const [x, y, color] of [[640, 239, 0xfde68a], [681, 234, 0xf9a8d4], [657, 266, 0x93c5fd], [705, 262, 0xe8d8b0]] as const) {
      g.fillStyle(color, 0.78);
      g.fillRoundedRect(x, y, 26, 18, 2);
    }

    this.interactions = [
      { x: 169, y: 215, label: 'SMELL THE KETTLES', heading: 'THE MOSSBELL BLEND', lines: ['The house blend changes with every village emergency.', 'Today it tastes of mint for courage, smoke for mourning, and far too much honey.'] },
      { x: 678, y: 320, label: 'READ THE NOTICEBOARD', heading: 'VILLAGE NOTICES', lines: ['“Lost: one silver quill. Please return before anyone notices.”', 'Below it: “Wordwood survey volunteers—meeting postponed again.”'] },
      { x: 515, y: 420, label: 'COUNT THE CUPS', heading: 'THE REGULARS', lines: ['Every chair has a favorite cup. One is painted with Archivist Vellum’s crest.', 'Its tea is fresh. Nobody remembers serving it.'] },
    ];
  }

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
        distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, 400, 548),
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
    const panel = this.add.rectangle(400, 501, 700, 150, 0x071820, 0.97)
      .setStrokeStyle(2, this.building.accent, 0.62).setDepth(100);
    const heading = this.add.text(72, 450, interaction.heading, {
      fontFamily: 'Georgia, serif', fontSize: '13px', fontStyle: 'bold', color: '#cbd5e1', letterSpacing: 2,
    }).setDepth(101);
    const text = this.add.text(72, 480, interaction.lines[0], {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#f8fafc', lineSpacing: 6, wordWrap: { width: 630 },
    }).setDepth(101);
    const hint = this.add.text(730, 556, 'E  NEXT', {
      fontFamily: 'Arial, sans-serif', fontSize: '10px', fontStyle: 'bold', color: '#8fcfb7',
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
    this.cameras.main.fadeOut(220, 7, 18, 26);
    this.time.delayedCall(240, () => {
      this.scene.stop();
      this.scene.resume('DungeonScene');
    });
  }
}
