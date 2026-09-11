import * as Phaser from 'phaser';
import {interactionScore} from '../interaction';
import { frameWorld } from '../world/framing';
import { AVATAR_LAYER_WIDTH, AVATAR_LAYER_HEIGHT, AVATAR_FACE_LAYER_WIDTH, AVATAR_FACE_LAYER_HEIGHT } from '../pixelAvatar';
import { buildTileInterior } from '../world/tileInterior';
import { ROOM_GRID } from '../story/interiorPlans';
import Player from '../entities/Player';
import { registerSpeaker, speak } from '../entities/inklingSpeech';
import { createInkHand, createInkFoot } from '../entities/inkHand';
import { VILLAGE_NPCS } from '../npcs';
import { AVATAR_BODY_OFFSETS, hexToNumber } from '../avatar';
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

const EXIT = ROOM_GRID.exit;

/**
 * Reusable 3/4-view interior for ordinary village buildings.
 *
 * Rooms assemble the shared native-size pixel kit with tile-aligned collision.
 * Each building keeps its own authored layout and recolorable fabric palette.
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
    this.walls = this.physics.add.staticGroup();
    this.interactions = buildTileInterior(this,this.buildingId,(x,y,w,h)=>this.addWall(x,y,w,h))
      .map(site=>({...site,heading:this.building.name}));
    if (this.buildingId === 'mapmaker') {
      const luma = this.add.container(496, 356).setDepth(10).setScale(0.6);
      const base = this.add.image(0, 0, 'luma-base').setDisplaySize(AVATAR_LAYER_WIDTH, AVATAR_LAYER_HEIGHT);
      const eyes = this.add.image(0, -4, 'npc-0-eyes').setDisplaySize(AVATAR_FACE_LAYER_WIDTH, AVATAR_FACE_LAYER_HEIGHT);
      luma.add([this.add.ellipse(0, 19, 28, 9, 0x10263a, 0.3), base, eyes,
        ...[-7,7].map((x) => createInkFoot(this,x,17,0xf0a6aa).setScale(0.75)),
        ...[-12,12].map((x) => createInkHand(this,x,6,0xf0a6aa).setScale(0.8))]);
      this.addWall(496,368,32,32);
      registerSpeaker(this,'LUMA',luma);
      this.interactions.push({ x:496, y:368, label:'TALK TO LUMA', heading:'LUMA', lines:[
        'You found Mum! I knew you would. Well… I hoped very loudly.',
        'She says I’m not allowed to run off again. Not even to get help. We’re still discussing that part.',
        'I drew you on my map. You’re bigger than the bakery. Don’t tell Pip.',
      ] });
    }

    VILLAGE_NPCS.forEach((resident, index) => {
      if (resident.house !== this.buildingId) return;
      const color = hexToNumber(resident.color);
      const offsets = AVATAR_BODY_OFFSETS[resident.base] ?? AVATAR_BODY_OFFSETS.droplet_01;
      const person = this.add.container(496, 352).setDepth(10).setScale(0.78);
      const shadow = this.add.ellipse(0, 23, 36, 12, 0x10263a, 0.3);
      const feet = [-10, 10].map((x) => createInkFoot(this,x,21,color));
      const base = this.add.image(0, 0, `npc-${index}-base`).setDisplaySize(AVATAR_LAYER_WIDTH, AVATAR_LAYER_HEIGHT);
      const eyes = this.add.image(0, offsets.eyesY, `npc-${index}-eyes`).setDisplaySize(AVATAR_FACE_LAYER_WIDTH, AVATAR_FACE_LAYER_HEIGHT);
      const accessory = this.add.image(0, offsets.accessoryY, `npc-${index}-accessory`).setDisplaySize(AVATAR_LAYER_WIDTH, AVATAR_LAYER_HEIGHT);
      const hands = [-15, 15].map((x) => createInkHand(this, x, 7, color));
      person.add([shadow, ...feet, base, eyes, accessory, ...hands]);
      registerSpeaker(this,resident.name,person);
      // Keep all resident layers planted on the same pixel grid.
      this.addWall(496, 368, 32, 32);
      this.interactions.push({ x: 496, y: 368, label: `TALK TO ${resident.name.toUpperCase()}`, heading: resident.name.toUpperCase(), lines: resident.dialogue });
    });

    this.player = new Player(this, ROOM_GRID.spawn.x, ROOM_GRID.spawn.y, this.avatar);
    this.physics.add.collider(this.player.sprite, this.walls);
    frameWorld(this);
    this.cameras.main.setBackgroundColor('#080f1a');

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
        distance: interactionScore(this.player,interaction,interaction.label.startsWith('TALK TO')?48:34),
      })),
      {
        interaction: null,
        distance: interactionScore(this.player,EXIT),
      },
    ].filter(({ distance }) => Number.isFinite(distance)).sort((a, b) => a.distance - b.distance
      || Number(!!b.interaction?.label.startsWith('TALK TO'))-Number(!!a.interaction?.label.startsWith('TALK TO')))[0];

    if (!nearest) {
      this.prompt.setVisible(false);
      return;
    }
    if (!nearest.interaction) {
      this.prompt.setVisible(false);
      if (this.player.wantsDoorAt(EXIT.x,EXIT.y,'down'))this.exitBuilding();
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
    speak(this,interaction.heading,interaction.lines[0]);
    this.nextDialogueAt = this.time.now + 240;
  }

  private advanceDialogue() {
    if (!this.dialogue) return;
    const next = this.dialogue.index + 1;
    if (next < this.dialogue.interaction.lines.length) {
      this.dialogue.index = next;
      this.dialogue.text.setText(this.dialogue.interaction.lines[next]);
      speak(this,this.dialogue.interaction.heading,this.dialogue.interaction.lines[next]);
      this.nextDialogueAt = this.time.now + 220;
      return;
    }
    this.dialogue.objects.forEach((object) => object.destroy());
    this.dialogue = null;
    speak(this,'');
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
