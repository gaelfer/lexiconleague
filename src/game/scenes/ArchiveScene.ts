import * as Phaser from 'phaser';
import {interactionScore} from '../interaction';
import { frameWorld } from '../world/framing';
import { buildTileInterior } from '../world/tileInterior';
import { ROOM_GRID } from '../story/interiorPlans';
import Player from '../entities/Player';
import { registerSpeaker, speak } from '../entities/inklingSpeech';
import { EventBus } from '../EventBus';
import type { StoryAvatarConfig } from '../avatar';
import { getStoryProgress, saveStoryProgress } from '@/lib/story/progress';
import { OPENING_STORY } from '../story/openingStory';
import {expedition,saveExpedition,TABLET_RESEARCH} from '../story/repository';
import { AVATAR_LAYER_WIDTH, AVATAR_LAYER_HEIGHT, AVATAR_FACE_LAYER_WIDTH, AVATAR_FACE_LAYER_HEIGHT } from '../pixelAvatar';
import { createInkHand, createInkFoot } from '../entities/inkHand';

interface ArchiveDialogue {
  speaker:string;
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
    const scholar = this.add.container(464,288).setScale(0.78).setDepth(10);
    scholar.add([
      this.add.ellipse(0,23,30,10,0x020617,0.3),
      createInkFoot(this,-10,21,0xcd7f32),createInkFoot(this,10,21,0xcd7f32),
      this.add.image(0,0,'scholar-base').setDisplaySize(AVATAR_LAYER_WIDTH,AVATAR_LAYER_HEIGHT),
      this.add.image(0,0,'scholar-eyes').setDisplaySize(AVATAR_FACE_LAYER_WIDTH,AVATAR_FACE_LAYER_HEIGHT),
      this.add.image(0,0,'scholar-glasses').setDisplaySize(AVATAR_LAYER_WIDTH,AVATAR_LAYER_HEIGHT),
      this.add.image(0,0,'scholar-quill').setDisplaySize(AVATAR_LAYER_WIDTH,AVATAR_LAYER_HEIGHT),
      createInkHand(this,-15,7,0xcd7f32),createInkHand(this,15,7,0xcd7f32),
    ]);
    this.addWall(464,304,32,32);
    registerSpeaker(this,'SCHOLAR BELLUM',scholar);
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
      { x:464, y:304, label:'TALK TO SCHOLAR BELLUM', action:()=>this.talkToScholar() },
      { x: 400, y: 272, label: 'INSPECT THE EMPTY PEDESTAL', action: () => this.inspectPedestal() },
      { x: 272, y: 336, label: 'LISTEN TO BELLUM’S CHIMES', action: () => this.readFieldGuide() },
      { x: 528, y: 336, label: 'EXAMINE THE CRACKED MURAL', action: () => this.examineMural() },
      { ...ROOM_GRID.exit, label: 'LEAVE THE ARCHIVE', action: () => this.exitArchive() },
    ];

    const nearest = interactions
      .map((interaction) => ({
        interaction,
        distance: interactionScore(this.player,interaction),
      }))
      .filter(({ distance }) => Number.isFinite(distance))
      .sort((a, b) => a.distance - b.distance)[0];

    if (!nearest) {
      this.prompt.setVisible(false);
      return;
    }

    if(nearest.interaction.label==='LEAVE THE ARCHIVE'){
      this.prompt.setVisible(false);
      if(this.player.wantsDoorAt(ROOM_GRID.exit.x,ROOM_GRID.exit.y,'down'))nearest.interaction.action();
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
      ? ['The damaged clasp rests on a clean cloth. A label reads: Evidence. Not a paperweight. — Bellum']
      : [
          'The dictionary stand has been disturbed. Its retaining clasp is bent open.',
          'Purple ink has seeped into the fresh scratches. The same colour as the creatures on the road.',
          'Bellum has laid a clean cloth over the broken clasp. He is keeping it for evidence.',
        ];
    this.openDialogue('THE FIRST DICTIONARY', lines, () => {
      if (this.inspectedPedestal) return;
      this.inspectedPedestal = true;
      this.pedestalGlow.setFillStyle(0xf4c96b, 0.12);
      EventBus.emit('archive-investigation-complete');
    });
  }

  private talkToScholar() {
    const progress = getStoryProgress();
    if(expedition().tablet){
      this.openDialogue('SCHOLAR BELLUM',expedition().studied?[
        'The Tablet’s original lettering survives beneath the violet ink. Interference, not erasure. I’ve labelled the samples. And, this time, my tea.',
        'I’m recording the changes before drawing any conclusions. You brought back evidence, not a guess. Thank you.',
      ]:TABLET_RESEARCH,()=>saveExpedition({studied:true}));return;
    }
    if (progress.opening === 'wordwood') {
      this.openDialogue('SCHOLAR BELLUM', progress.completedChapters.includes(2) ? [
        'Back! In one piece, too. Good. That was the part I couldn’t check in a reference book.',
        'You describe the restored signs and the sanctuary gate opening.',
        'Seed, sprout, bloom. An ordered growth sequence! I could spend a week on that. I won’t. Probably.',
        'It tells us the inscriptions still respond. It doesn’t tell us what those creatures are. Let me compare your observations with my records before we call it an explanation.',
      ] : [
        'Wordwood first: restore the signs, then investigate beyond the sanctuary gate. Take the eastern exit in the northern gatehouse.',
        'I’ve made a column for observations and a column for guesses. The guesses are winning. We need to do something about that.',
      ]);
      return;
    }
    if (!progress.completedChapters.includes(1)) {
      this.openDialogue('SCHOLAR BELLUM', ['The road—please, check the road. There are people out there. My notes can wait. All of them.']);
      return;
    }
    this.openDialogue('SCHOLAR BELLUM', OPENING_STORY.scholar, () => {
      saveStoryProgress({opening:'wordwood'});
    });
  }

  private readFieldGuide() {
    this.openDialogue('BELLUM’S MEMORY CHIMES', [
      'Bellum’s recorded voice: “Violet residue. Origin unknown. Do not file under ordinary stains merely because the drawer is nearer.”',
      'A pause. “Also, buy bread. That is not part of the experiment. Stop recording.”',
    ]);
  }

  private examineMural() {
    this.openDialogue('THE FOUNDING MURAL', [
      'The mural shows Inkwell’s founders carrying books beneath unfinished rafters. One has fallen asleep on a stack.',
      'Bellum has tucked a note beside the crack: “A structural problem, not an artistic choice. Ask a mason.”',
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
    this.dialogue = { speaker, lines, index: 0, text, objects: [panel, heading, text, hint], onComplete };
    speak(this,speaker,lines[0]);
    this.nextDialogueAt = this.time.now + 260;
  }

  private advanceDialogue() {
    if (!this.dialogue) return;
    const next = this.dialogue.index + 1;
    if (next < this.dialogue.lines.length) {
      this.dialogue.index = next;
      this.dialogue.text.setText(this.dialogue.lines[next]);
      speak(this,this.dialogue.speaker,this.dialogue.lines[next]);
      this.nextDialogueAt = this.time.now + 220;
      return;
    }
    const { objects, onComplete } = this.dialogue;
    objects.forEach((object) => object.destroy());
    this.dialogue = null;
    speak(this,'');
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
