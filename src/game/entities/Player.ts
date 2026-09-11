import * as Phaser from 'phaser';
import { EventBus } from '../EventBus';
import {
  AVATAR_BODY_OFFSETS,
  hexToNumber,
  type StoryAvatarConfig,
} from '../avatar';
import { resolveMovement, type Facing } from '../movement';
import { facingVector } from '../combat';
import { createInkHand, createInkFoot } from './inkHand';
import { INKLING_SCALE } from '../world/pixelTerrain';
import { AVATAR_LAYER_WIDTH, AVATAR_LAYER_HEIGHT, AVATAR_FACE_LAYER_WIDTH, AVATAR_FACE_LAYER_HEIGHT } from '../pixelAvatar';
import { tileCenter, nextGridStep, interpolateStep, type GridPoint } from '../gridMovement';
import { bowPose,BOW_DURATION,BOW_RELEASE } from '../bowPose';
import {getStoryInventory,getStoryProgress,saveStoryInventory} from '../../lib/story/progress';
import {equippedGear,toolSlots,TOOL_KEYS,type GearId} from '../../lib/story/equipment';
import {spinProfile} from '../../lib/story/skills';
import {SWORD_HOLD_THRESHOLD_MS,swordChargeMs,swordReleaseAction} from '../swordInput';

const SPEED = 180;
const SWING_COOLDOWN_MS = 300;
const SPIN_COOLDOWN_MS = 600;

export default class Player {
  public sprite: Phaser.Physics.Arcade.Image;

  private shadow: Phaser.GameObjects.Ellipse;
  private artwork!: Phaser.GameObjects.Container;
  private visualLayers: Array<{ image: Phaser.GameObjects.Image; yOffset: number }> = [];
  private fillTintLayers: Array<{ image: Phaser.GameObjects.Image; color: number }> = [];
  private aura?: Phaser.GameObjects.Image;
  private sword: Phaser.GameObjects.Image;
  private eyes!: Phaser.GameObjects.Image;
  private bow: Phaser.GameObjects.Image;
  private bowTexture: Phaser.Textures.CanvasTexture;
  private queuedBow=false;
  private bowReview=false;
  private swordTrail: Phaser.GameObjects.Graphics;
  private trailPoints: Array<{ x: number; y: number; age: number }> = [];
  private bowPoseMs = 0;
  private keyR: Phaser.Input.Keyboard.Key;
  private keyF: Phaser.Input.Keyboard.Key;
  private slots=toolSlots(getStoryInventory());
  private spin=spinProfile(getStoryProgress());
  private spinCue!: Phaser.GameObjects.Graphics;
  private hands: [Phaser.GameObjects.Container, Phaser.GameObjects.Container];
  private feet: [Phaser.GameObjects.Graphics, Phaser.GameObjects.Graphics];
  private walkElapsed = 0;
  private idleElapsed = 0;
  private swordIdleMs = 0;
  get swordStowed(){return this.swordIdleMs>=15700;}
  private idleBlend = 0;
  private isMoving = false;
  private gridStep: { from: GridPoint; to: GridPoint; elapsed: number; duration: number } | null = null;
  private queuedDirection: ReturnType<typeof resolveMovement> | null = null;
  private interactQueuedUntil=0;
  private doorIntent:{direction:'up'|'down';until:number}|null=null;
  private doorReadyAt=0;

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW: Phaser.Input.Keyboard.Key;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyS: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private keyQ: Phaser.Input.Keyboard.Key;
  private keyE: Phaser.Input.Keyboard.Key;
  private keySpace: Phaser.Input.Keyboard.Key;

  public facing: Facing = 'down';

  private attackHeld = false;
  private swordPressAt:number|null=null;
  private swordReleaseMs:number|null=null;
  private attackHoldMs = 0;
  private attackCooldown = 0;
  private damageInvulnerabilityMs = 0;
  private hurtMs=0;
  private recoil:{from:GridPoint;to:GridPoint;elapsed:number}|null=null;
  public isDying=false;
  private attackPoseMs = 0;
  private attackPoseDuration = 1;
  private attackPoseType: 'swing' | 'spin' = 'swing';

  public hearts: number;
  private gear:GearId[]=equippedGear(getStoryInventory());
  public get lexicoins(){return getStoryInventory().lexicoins;}

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    avatar: StoryAvatarConfig,
    startHearts = 3,
  ) {
    this.bowReview=process.env.NODE_ENV==='development'&&new URLSearchParams(window.location.search).get('bowReview')==='draw';
    x = tileCenter(x); y = tileCenter(y);
    this.shadow = scene.add.ellipse(x, y + 24, 38, 14, 0x020617, 0.45).setDepth(8);

    if (avatar.aura !== 'none' && scene.textures.exists('player-aura')) {
      this.aura = scene.add
        .image(x, y, 'player-aura')
        .setDisplaySize(76, 76)
        .setTintFill(hexToNumber(avatar.aura_color || avatar.color))
        .setAlpha(0.5)
        .setDepth(8.5);
      this.fillTintLayers.push({
        image: this.aura,
        color: hexToNumber(avatar.aura_color || avatar.color),
      });
      this.visualLayers.push({ image: this.aura, yOffset: 0 });
    }

    this.sprite = scene.physics.add.image(x, y, 'player-hitbox');
    this.sprite.setAlpha(0).setDepth(9);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setImmovable(true);
    this.sprite.setDisplaySize(28, 24);

    const bodyColor = hexToNumber(avatar.color);
    this.feet = [createInkFoot(scene,x,y,bodyColor).setDepth(9.6),createInkFoot(scene,x,y,bodyColor).setDepth(9.6)];
    this.hands = [createInkHand(scene, x, y, bodyColor), createInkHand(scene, x, y, bodyColor)];
    this.hands.forEach((hand) => hand.setDepth(13.5));

    const base = scene.add
      .image(x, y, 'player-base')
      .setDisplaySize(AVATAR_LAYER_WIDTH, AVATAR_LAYER_HEIGHT)
      .setDepth(10);
    this.visualLayers.push({ image: base, yOffset: 0 });

    this.sword = scene.add.image(x + 20, y + 14, 'story-sword')
      .setOrigin(0.5, 54 / 66)
      .setDisplaySize(14, 50)
      .setDepth(14);
    const bowKey=`story-bow-pose-${scene.scene.key}`;
    if(scene.textures.exists(bowKey))scene.textures.remove(bowKey);
    this.bowTexture=scene.textures.createCanvas(bowKey,64,64)!;
    this.bow = scene.add.image(0,0,bowKey).setDepth(14).setVisible(false);
    this.swordTrail = scene.add.graphics().setDepth(13.8);

    const offsets = AVATAR_BODY_OFFSETS[avatar.base] ?? AVATAR_BODY_OFFSETS.droplet_01;
    const eyes = scene.add
      .image(x, y + offsets.eyesY, 'player-eyes')
      .setDisplaySize(AVATAR_FACE_LAYER_WIDTH, AVATAR_FACE_LAYER_HEIGHT)
      .setDepth(11);
    this.eyes = eyes;
    this.visualLayers.push({ image: eyes, yOffset: offsets.eyesY });

    [
      ['player-accessory-1', avatar.accessory],
      ['player-accessory-2', avatar.accessory2],
    ].forEach(([key, id], index) => {
      if (id === 'none' || id === 'sword_01' || !scene.textures.exists(key)) return;
      const isBottomAccessory = id === 'suit_01';
      const accessory = scene.add
        .image(x, y + (isBottomAccessory ? 0 : offsets.accessoryY), key)
        .setDisplaySize(AVATAR_LAYER_WIDTH, AVATAR_LAYER_HEIGHT)
        .setDepth(12 + index);
      this.visualLayers.push({
        image: accessory,
        yOffset: isBottomAccessory ? 0 : offsets.accessoryY,
      });
    });

    const kb = scene.input.keyboard!;
    kb.addCapture([
      Phaser.Input.Keyboard.KeyCodes.W,
      Phaser.Input.Keyboard.KeyCodes.A,
      Phaser.Input.Keyboard.KeyCodes.S,
      Phaser.Input.Keyboard.KeyCodes.D,
      Phaser.Input.Keyboard.KeyCodes.E,
      Phaser.Input.Keyboard.KeyCodes.Q,
      Phaser.Input.Keyboard.KeyCodes.R,
      Phaser.Input.Keyboard.KeyCodes.F,
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    ]);
    this.cursors = kb.createCursorKeys();
    this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyQ = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.keyR = kb.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keyF = kb.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.keyE = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const queueStep = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      if(TOOL_KEYS.some(slot=>slot.toLowerCase()===key&&this.slots[slot]==='sword')){this.swordPressAt=performance.now();return;}
      if(['w','arrowup','s','arrowdown'].includes(key))this.doorIntent={direction:key==='w'||key==='arrowup'?'up':'down',until:scene.time.now+220};
      if(TOOL_KEYS.some(slot=>slot.toLowerCase()===key&&this.slots[slot]==='bow')){this.queuedBow=true;return;}
      if(key==='e'||key===' '){this.interactQueuedUntil=scene.time.now+250;return;}
      if (!['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)) return;
      this.queuedDirection = resolveMovement({
        up: key === 'w' || key === 'arrowup' || this.keyW.isDown || this.cursors.up.isDown,
        down: key === 's' || key === 'arrowdown' || this.keyS.isDown || this.cursors.down.isDown,
        left: key === 'a' || key === 'arrowleft' || this.keyA.isDown || this.cursors.left.isDown,
        right: key === 'd' || key === 'arrowright' || this.keyD.isDown || this.cursors.right.isDown,
      });
    };
    kb.on('keydown', queueStep);
    const releaseSword=(event:KeyboardEvent)=>{
      if(this.swordPressAt!==null&&TOOL_KEYS.some(slot=>slot.toLowerCase()===event.key.toLowerCase()&&this.slots[slot]==='sword')){
        this.swordReleaseMs=performance.now()-this.swordPressAt;this.swordPressAt=null;
      }
    };
    kb.on('keyup',releaseSword);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {kb.off('keydown', queueStep);kb.off('keyup',releaseSword);});

    // Scale the entire rig together: grip, blade, feet and cosmetics retain their alignment.
    this.artwork = scene.add.container(0, 0, [
      this.shadow, ...this.visualLayers.map(({ image }) => image),
      ...this.feet, ...this.hands, this.sword, this.bow, this.swordTrail,
    ]).setScale(INKLING_SCALE).setDepth(10);
    this.hearts = startHearts;
    this.spinCue=scene.add.graphics().setDepth(11);
    const refreshGear=()=>{
      const next=equippedGear(getStoryInventory());
      const slots=toolSlots(getStoryInventory());
      this.spin=spinProfile(getStoryProgress());
      if(JSON.stringify(slots)===JSON.stringify(this.slots))return;
      this.slots=slots;
      this.swordPressAt=null;this.swordReleaseMs=null;
      this.gear=next;this.attackHeld=false;this.attackHoldMs=0;this.attackPoseMs=0;this.bowPoseMs=0;this.queuedBow=false;
      this.swordTrail.clear();this.clearAvatarTint();this.syncVisuals(0);
    };
    window.addEventListener('story-save',refreshGear);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>window.removeEventListener('story-save',refreshGear));
    // Room scenes create their own Player, while the outdoor Player may remain
    // paused. Keep the timer on the game, not on any one of those instances.
    const restoreSword=()=>{
      if(this.doorReturn){this.sprite.body!.reset(this.doorReturn.x,this.doorReturn.y);this.sprite.body!.enable=true;this.doorReturn=null;}
      this.doorReadyAt=scene.time.now+450;this.doorIntent=null;
      this.swordIdleMs=scene.registry.get('story:swordIdleMs')??0;
      this.syncVisuals(0);
    };
    restoreSword();
    scene.events.on(Phaser.Scenes.Events.RESUME,restoreSword);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.events.off(Phaser.Scenes.Events.RESUME,restoreSword));
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
  private doorReturn:{x:number;y:number}|null=null;
  /** Only a finished step onto the threshold can request a doorway. */
  wantsDoorAt(x:number,y:number,direction:'up'|'down'){
    return !this.gridStep&&Math.abs(this.x-x)<1&&Math.abs(this.y-y)<1&&this.wantsDoor(direction);
  }
  isPushingSignAt(x:number,y:number){
    return !this.gridStep&&Math.abs(this.x-x)<1&&Math.abs(this.y-y)<1&&this.facing==='up'
      &&(this.keyW.isDown||this.cursors.up.isDown||(this.doorIntent?.direction==='up'&&this.doorIntent.until>this.sprite.scene.time.now));
  }
  walkThroughDoor(done:()=>void){
    this.stopMovement();this.facing='up';this.isMoving=true;
    const body=this.sprite.body!;
    this.doorReturn={x:this.x,y:this.y};body.enable=false;
    const pose={y:this.y},x=this.x;
    this.sprite.scene.tweens.add({targets:pose,y:this.y-32,duration:240,ease:'Linear',
      onUpdate:()=>{body.reset(x,pose.y);this.isMoving=true;this.syncVisuals(16);},
      onComplete:()=>{this.isMoving=false;done();}});
  }
  wantsDoor(direction:'up'|'down'){
    if(this.sprite.scene.time.now<this.doorReadyAt)return false;
    const requested=(direction==='up'?(this.keyW.isDown||this.cursors.up.isDown):(this.keyS.isDown||this.cursors.down.isDown))
      ||(this.doorIntent?.direction===direction&&this.doorIntent.until>this.sprite.scene.time.now);
    if(requested){this.doorReadyAt=this.sprite.scene.time.now+450;this.doorIntent=null;}
    return requested;
  }
  setSleeping(value:boolean){this.stopMovement();this.artwork.setVisible(!value);}

  healFully() {
    this.hearts=3;
    EventBus.emit('health-changed',{hearts:this.hearts});
  }

  /** Authored reward pose; preserves the avatar's size and actual cosmetics. */
  holdItemAboveHead(){
    this.stopMovement();this.facing='down';this.syncVisuals(0);
    this.sword.setVisible(false);this.bow.setVisible(false);this.swordTrail.clear();
    this.hands[0].setPosition(this.x-13,this.y-32).setDepth(15);
    this.hands[1].setPosition(this.x+13,this.y-32).setDepth(15);
    this.artwork.sort('depth');
  }

  /** Cutscene-only resting pose; normal update restores the equipped weapon. */
  rest() {
    this.stopMovement();
    this.sword.setVisible(false);
    this.bow.setVisible(false);
    this.artwork.setY(this.artwork.y + 14);
  }

  isInteractJustDown(): boolean {
    const e=Phaser.Input.Keyboard.JustDown(this.keyE);
    const space=Phaser.Input.Keyboard.JustDown(this.keySpace);
    const buffered=this.interactQueuedUntil>this.sprite.scene.time.now;
    this.interactQueuedUntil=0;
    return e||space||buffered;
  }

  stopMovement() {
    if (!this.sprite.active || !this.sprite.body) return;
    if(this.isDying){this.sprite.setVelocity(0,0);return;}
    if (this.gridStep) {
      this.sprite.body.reset(this.gridStep.to.x, this.gridStep.to.y);
      this.gridStep = null;
    }
    this.sprite.setVelocity(0, 0);
    this.queuedDirection = null;
    this.isMoving = false;
    this.syncVisuals(0);
  }

  update(delta: number) {
    if(this.isDying)return;
    this.damageInvulnerabilityMs=Math.max(0,this.damageInvulnerabilityMs-delta);
    if(this.hurtMs>0||this.recoil){
      this.hurtMs=Math.max(0,this.hurtMs-delta);
      if(this.recoil){
        this.recoil.elapsed+=Math.min(delta,50);
        const p=interpolateStep(this.recoil.from,this.recoil.to,this.recoil.elapsed,200);
        this.sprite.body!.reset(p.x,p.y);
        if(this.recoil.elapsed>=200)this.recoil=null;
      }
      this.syncVisuals(0);
      this.visualLayers.forEach(({image})=>image.setData('story-brightness',.4+.6*(1-this.hurtMs/320)));
      return;
    }
    this.visualLayers.forEach(({image})=>image.setData('story-brightness',1));
    if(this.bowReview){this.bowPoseMs=240;this.facing='right';this.syncVisuals(0);return;}
    const previousBowMs = this.bowPoseMs;
    this.bowPoseMs = Math.max(0, this.bowPoseMs - delta);
    if (previousBowMs > BOW_RELEASE && this.bowPoseMs <= BOW_RELEASE) {
      const pose=bowPose(this.x,this.y,this.facing,BOW_RELEASE,INKLING_SCALE);
      EventBus.emit('player-bow', { ...pose.release, facing: this.facing });
    }
    this.attackPoseMs = Math.max(0, this.attackPoseMs - delta);
    this.handleMovement(delta);
    this.handleAttack(delta);
    if(this.attackHeld||this.attackPoseMs>0)this.swordIdleMs=0;
    else if(this.bowPoseMs<=0)this.swordIdleMs=Math.min(15700,this.swordIdleMs+delta);
    if(this.sprite.scene.registry.get('story:swordIdleMs')!==this.swordIdleMs)
      this.sprite.scene.registry.set('story:swordIdleMs',this.swordIdleMs);
    this.syncVisuals(delta);
  }

  private handleMovement(delta: number) {
    if(this.bowPoseMs>0){this.sprite.setVelocity(0,0);this.isMoving=false;return;}
    const up    = this.cursors.up.isDown    || this.keyW.isDown;
    const down  = this.cursors.down.isDown  || this.keyS.isDown;
    const left  = this.cursors.left.isDown  || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;

    const held = resolveMovement({ up, down, left, right });
    const movement = held.facing ? held : this.queuedDirection ?? held;
    if (!this.gridStep && movement.facing && this.bowPoseMs <= 0 && this.attackPoseMs <= 0) this.facing = movement.facing;

    this.sprite.setVelocity(0, 0);
    if (!this.gridStep) {
      this.queuedDirection = null;
      const from = { x: tileCenter(this.x), y: tileCenter(this.y) };
      const to = nextGridStep(from, movement.x, movement.y, (a, b) => this.gridPathClear(a, b));
      if (to) this.gridStep = { from, to, elapsed: 0, duration: Math.hypot(to.x - from.x, to.y - from.y) / SPEED * 1000 };
    }
    this.isMoving = !!this.gridStep;
    if (this.gridStep) {
      const step = this.gridStep;
      step.elapsed += Math.min(delta, 50);
      const point = interpolateStep(step.from, step.to, step.elapsed, step.duration);
      this.sprite.body!.reset(point.x, point.y);
      if (step.elapsed >= step.duration) this.gridStep = null;
    }
  }

  private gridPathClear(from: GridPoint, to: GridPoint) {
    const world = this.sprite.scene.physics.world;
    const half = 15.9;
    const x = Math.min(from.x, to.x) - half;
    const y = Math.min(from.y, to.y) - half;
    const width = Math.abs(to.x - from.x) + half * 2;
    const height = Math.abs(to.y - from.y) + half * 2;
    if (x < world.bounds.left || y < world.bounds.top || x + width > world.bounds.right || y + height > world.bounds.bottom) return false;
    return !this.sprite.scene.physics.overlapRect(x, y, width, height, false, true).some((body) => body.enable);
  }

  private syncVisuals(delta: number) {
    if (this.isMoving) this.walkElapsed += delta;
    else this.walkElapsed = 0;

    const idling = !this.isMoving && this.attackPoseMs <= 0 && !this.attackHeld && this.bowPoseMs <= 0;
    this.idleElapsed += delta;
    this.idleBlend = Phaser.Math.Linear(this.idleBlend, idling ? 1 : 0, 1 - Math.exp(-delta / 160));
    const breath = Math.sin(this.idleElapsed * Math.PI * 2 / 2400) * this.idleBlend;
    const bob = this.isMoving ? Math.sin(this.walkElapsed * 0.018) * 2 : breath * 1.4;
    const spinning = this.attackPoseMs > 0 && this.attackPoseType === 'spin';
    const spinAngle = spinning ? (1 - this.attackPoseMs / this.attackPoseDuration) * Math.PI * 2 : 0;
    const startDirection = facingVector(this.facing);
    const visualAngle = Math.atan2(startDirection.y, startDirection.x) + spinAngle;
    const facesLeft = spinning ? Math.cos(visualAngle) < -0.25 : this.facing === 'left' || this.facing.endsWith('-left');
    const lean = this.isMoving
      ? facesLeft
        ? -3
        : this.facing === 'right' || this.facing.endsWith('-right')
          ? 3
          : 0
      : breath * 0.8;

    this.shadow.setPosition(this.sprite.x, this.sprite.y + 24);
    this.shadow.setScale(this.isMoving ? 0.92 : 1, this.isMoving ? 0.88 : 1);

    for (const { image, yOffset } of this.visualLayers) {
      image.setPosition(Math.round(this.sprite.x), Math.round(this.sprite.y + bob + yOffset));
      // Keep the body’s baked lighting and any markings fixed. Only the facial
      // and accessory layers turn; mirroring the body makes its texture pop.
      image.setFlipX(facesLeft && (image === this.eyes || image.texture.key.startsWith('player-accessory-')));
      image.setAngle(0);
    }
    const facesBack = spinning ? Math.sin(visualAngle) < -0.2 : this.facing === 'up' || this.facing.startsWith('up-');
    this.eyes.setVisible(!facesBack);
    // Shift the facial features toward the travel direction in side/diagonal poses.
    this.eyes.x += (spinning ? Math.cos(visualAngle) : startDirection.x) * 5;
    // Fixed pixel scale through the entire spin. Continuous profile squeezing
    // resampled the same texture every frame, making eyes and ink patterns crawl.
    for (const { image } of this.visualLayers) {
      if (image === this.aura) continue;
      image.setDisplaySize(image === this.eyes ? AVATAR_FACE_LAYER_WIDTH : AVATAR_LAYER_WIDTH,
        image === this.eyes ? AVATAR_FACE_LAYER_HEIGHT : AVATAR_LAYER_HEIGHT);
    }
    for (const { image } of this.visualLayers) {
      if (image.texture.key.startsWith('player-accessory-')) image.setDepth(facesBack ? 9.7 : 12);
    }

    const swordDirection = facingVector(this.facing);
    const baseSwordAngle = Phaser.Math.RadToDeg(Math.atan2(swordDirection.y, swordDirection.x)) + 90;
    const poseProgress = this.attackPoseMs > 0
      ? 1 - this.attackPoseMs / this.attackPoseDuration
      : 0;
    const attackAngle = this.attackPoseMs > 0
      ? this.attackPoseType === 'spin'
        ? poseProgress * 360
        : -72 + poseProgress * 144
      : 0;
    const attacking = this.attackPoseMs > 0;
    const chargeMs=swordChargeMs(this.attackHoldMs);
    const charging = this.spin.learned && this.attackHeld && chargeMs >= this.spin.chargeMs;
    this.spinCue?.clear();
    if(this.spinCue&&this.artwork.visible&&!this.isDying){
      // Match the rig's scaled offsets and lifted origin, not the invisible hitbox.
      const ringY=this.y+20*INKLING_SCALE-16;
      const meterY=this.y-48*INKLING_SCALE-16;
      if(this.spin.learned&&this.attackHeld&&this.attackHoldMs>=SWORD_HOLD_THRESHOLD_MS){
        const progress=Math.min(1,chargeMs/this.spin.chargeMs);
        this.spinCue.lineStyle(charging?3:2,charging?0xffedab:0x67dcca,.95);
        for(let i=0;i<12;i++)if(i/12<progress){const a=i*Math.PI/6;this.spinCue.strokeRect(this.x+Math.cos(a)*28-2,ringY+Math.sin(a)*15-2,4,4);}
        this.spinCue.fillStyle(0x162e30,.95).fillRect(this.x-22,meterY,44,7);
        this.spinCue.fillStyle(charging?0xffedab:0x67dcca,1).fillRect(this.x-20,meterY+2,40*progress,3);
        if(charging)this.spinCue.lineStyle(2,0xffedab,1).strokeCircle(this.x,ringY,24);
      }
      if(attacking&&this.attackPoseType==='spin'){
        this.spinCue.lineStyle(4,0x8ae7da,1-poseProgress).beginPath().arc(this.x,this.y+12*INKLING_SCALE-16,this.spin.radius*poseProgress,poseProgress*6,poseProgress*6+Math.PI*1.6).strokePath();
      }
    }
    const swordAngle = attacking ? baseSwordAngle + attackAngle : -8 + breath * 1.5;
    const swingRadians = Phaser.Math.DegToRad(swordAngle - 90);
    const swordX = this.sprite.x + (attacking ? Math.cos(swingRadians) * 15 : (facesLeft ? -15 : 15));
    const swordY = this.sprite.y + bob + (attacking ? 7 + Math.sin(swingRadians) * 10 : 10);
    const chargePulse = charging ? 1.08 + Math.sin(this.attackHoldMs * 0.025) * 0.08 : 1;
    this.sword
      .setPosition(swordX, swordY)
      .setFlipX(!attacking && facesLeft)
      .setAngle(swordAngle + (attacking ? 0 : lean))
      .setDisplaySize(14 * chargePulse, 50 * chargePulse)
      .setDepth(attacking && Math.sin(swingRadians) < -0.2 ? 9.5 : 14);

    // Sample the actual blade tip: a short tapered silver wake, always behind it.
    this.trailPoints.forEach((point) => { point.age += delta; });
    this.trailPoints = this.trailPoints.filter((point) => point.age < 85);
    if (attacking && delta > 0 && (spinning || poseProgress > 0.45)) {
      this.trailPoints.push({
        x: swordX + Math.cos(swingRadians) * 39,
        y: swordY + Math.sin(swingRadians) * 39,
        age: 0,
      });
    }
    this.swordTrail.clear().setDepth(this.sword.depth - 0.1);
    for (let i = 1; i < this.trailPoints.length; i++) {
      const previous = this.trailPoints[i - 1];
      const current = this.trailPoints[i];
      const strength = 1 - previous.age / 85;
      this.swordTrail.lineStyle(1 + strength * 3, 0xdce9ee, strength * 0.5);
      this.swordTrail.lineBetween(previous.x, previous.y, current.x, current.y);
    }

    const direction = facingVector(this.facing);
    const step = this.isMoving ? Math.sin(this.walkElapsed * 0.018) * 3.5 : 0;
    this.feet[0].setPosition(
      this.sprite.x - 10 + direction.x * step,
      this.sprite.y + 21 + (this.isMoving ? bob : 0) + direction.y * step,
    );
    this.feet[1].setPosition(
      this.sprite.x + 10 - direction.x * step,
      this.sprite.y + 21 + (this.isMoving ? bob : 0) - direction.y * step,
    );

    const armSwing = this.isMoving ? Math.sin(this.walkElapsed * 0.018) * 2 : breath * 0.65;
    this.hands[0].setPosition(this.sprite.x + (facesLeft ? 15 : -15), this.sprite.y + 8 + bob + armSwing);
    if (spinning) {
      this.hands[0].setPosition(this.x - Math.cos(visualAngle) * 15, this.y + bob + 7 - Math.sin(visualAngle) * 10);
      this.feet[0].setPosition(this.x - Math.sin(visualAngle) * 10, this.y + 21 - Math.cos(visualAngle) * 3);
      this.feet[1].setPosition(this.x + Math.sin(visualAngle) * 10, this.y + 21 + Math.cos(visualAngle) * 3);
    }
    // The sword origin is the center of its grip: hand and hilt share one pivot.
    this.hands[1].setPosition(swordX, swordY).setDepth(this.sword.depth + 0.1);
    this.sword.setVisible(this.gear.includes('sword')&&this.bowPoseMs <= 0&&!this.swordStowed).setAlpha(1);
    // Reach over the shoulder, slide the blade away, then relax the empty hand.
    // Interrupting with Q restores the normal grip in the same update as the hit.
    if(this.gear.includes('sword')&&this.swordIdleMs>15000&&this.bowPoseMs<=0){
      const p=Math.min(1,(this.swordIdleMs-15000)/700);
      const reach=Math.min(1,p/.4);
      const slide=Phaser.Math.Clamp((p-.4)/.4,0,1);
      const relax=Phaser.Math.Clamp((p-.8)/.2,0,1);
      const side=facesLeft?-1:1;
      const gripX=this.x+side*(15-7*reach+7*relax);
      const gripY=this.y+bob+10-26*reach+12*slide+14*relax;
      this.sword.setPosition(gripX,gripY).setAngle(side*( -8+150*reach))
        .setDepth(9.5).setAlpha(1-slide);
      this.hands[1].setPosition(gripX,gripY).setDepth(facesBack?14:9.6);
      if(this.swordStowed)this.hands[1].setPosition(this.x+side*15,this.y+bob+8-armSwing).setDepth(facesBack?9.6:13.5);
    }
    if(!this.gear.includes('sword')&&this.bowPoseMs<=0)this.hands[1].setPosition(this.x+(facesLeft?-15:15),this.y+bob+8-armSwing).setDepth(facesBack?9.6:13.5);
    this.bow.setVisible(this.gear.includes('bow')&&this.bowPoseMs > 0);
    if (this.bowPoseMs > 0) {
      const pose=bowPose(this.x,this.y,this.facing,this.bowPoseMs,INKLING_SCALE);
      this.bow.setPosition(pose.grip.x,pose.grip.y).setRotation(pose.angle).setDepth(facesBack?9.5:14);
      const ctx=this.bowTexture.context;
      ctx.clearRect(0,0,64,64);ctx.save();ctx.translate(32,32);
      ctx.strokeStyle='#9c7149';ctx.lineWidth=3;ctx.beginPath();ctx.arc(-19,0,19,-Math.PI/2,Math.PI/2);ctx.stroke();
      ctx.strokeStyle='#e8d8b0';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-19,-19);ctx.lineTo(pose.string,0);ctx.lineTo(-19,19);ctx.stroke();
      if(this.bowPoseMs>BOW_RELEASE){
        ctx.strokeStyle='#d8bd89';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(pose.string,0);ctx.lineTo(pose.string+28,0);ctx.stroke();
        ctx.fillStyle='#dce8e5';ctx.beginPath();ctx.moveTo(pose.string+30,0);ctx.lineTo(pose.string+23,-4);ctx.lineTo(pose.string+23,4);ctx.fill();
      }
      ctx.restore();this.bowTexture.refresh();
      this.hands[1].setPosition(this.bow.x, this.bow.y).setDepth(this.bow.depth + 0.1);
      this.hands[0].setPosition(this.bow.x + direction.x * pose.string, this.bow.y + direction.y * pose.string)
        .setDepth(this.bow.depth + 0.1);
    } else this.hands[0].setDepth(facesBack ? 9.6 : 13.5);

    if (this.aura) {
      const pulse = 1 + Math.sin(this.walkElapsed * 0.006) * 0.035;
      this.aura.setDisplaySize(76 * pulse, 76 * pulse);
    }
    // Children are authored around the world-space actor pivot. Compensate the
    // parent translation so scaling never moves the actor off its physics body.
    // The bottom half of the 16×32 frame is the occupied tile; the head is free
    // to overlap the tile above without giving the character a two-tile hitbox.
    this.artwork.setPosition(this.x * (1 - INKLING_SCALE), this.y * (1 - INKLING_SCALE) - 16);
    this.artwork.sort('depth');
  }

  private handleAttack(delta: number) {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }
    const keys={Q:this.keyQ,R:this.keyR,F:this.keyF};
    const bowSlot=TOOL_KEYS.find(key=>this.slots[key]==='bow');
    const swordSlot=TOOL_KEYS.find(key=>this.slots[key]==='sword');
    const swordDown=!!swordSlot&&keys[swordSlot].isDown;
    const bowPressed=(!!bowSlot&&Phaser.Input.Keyboard.JustDown(keys[bowSlot]))||this.queuedBow;
    this.queuedBow=false;
    if (this.gear.includes('bow') && bowPressed && this.attackCooldown <= 0 && !this.attackHeld) {
      this.stopMovement();
      this.bowPoseMs = BOW_DURATION;
      this.attackCooldown = 550;
    }
    if (this.bowPoseMs > 0) {this.swordPressAt=null;this.swordReleaseMs=null;return;}
    if(!this.gear.includes('sword'))return;

    const released=this.swordReleaseMs;
    this.swordReleaseMs=null;
    this.attackHeld=swordDown&&this.swordPressAt!==null;
    this.attackHoldMs=this.attackHeld?performance.now()-this.swordPressAt!:0;
    if(released!==null){
      const action=swordReleaseAction(released,this.spin.learned,this.spin.chargeMs);
      if(action==='swing')this.performSwordSwing();
      else if(action==='spin')this.performSpinAttack();
    }
    if(!swordDown)this.swordPressAt=null;
  }

  private performSwordSwing() {
    if (this.attackCooldown > 0) return;
    this.attackCooldown = SWING_COOLDOWN_MS;
    this.attackPoseType = 'swing';
    this.attackPoseDuration = 220;
    this.attackPoseMs = this.attackPoseDuration;
    EventBus.emit('player-attack', { type: 'swing', facing: this.facing, x: this.x, y: this.y });
  }

  private performSpinAttack() {
    if (this.attackCooldown > 0) return;
    this.attackCooldown = SPIN_COOLDOWN_MS;
    this.attackPoseType = 'spin';
    this.attackPoseDuration = this.spin.durationMs;
    this.attackPoseMs = this.attackPoseDuration;
    EventBus.emit('player-attack', { type: 'spin', x: this.x, y: this.y });
  }

  takeDamage(amount: number,source?:{x:number;y:number}): boolean {
    if (this.damageInvulnerabilityMs > 0 || this.hearts <= 0) return false;
    this.damageInvulnerabilityMs = 1300;
    this.swordPressAt=null;this.swordReleaseMs=null;
    this.stopMovement();
    this.attackHeld=false;this.attackHoldMs=0;this.attackPoseMs=0;this.bowPoseMs=0;this.queuedBow=false;
    this.clearAvatarTint();this.trailPoints=[];this.swordTrail.clear();
    this.hurtMs=320;
    if(source){
      const fallback=facingVector(this.facing);
      let dx=this.x-source.x,dy=this.y-source.y;
      if(dx===0&&dy===0){dx=-fallback.x;dy=-fallback.y;}
      const rx=Math.abs(dx)>=Math.abs(dy)?Math.sign(dx):0;
      const ry=Math.abs(dx)<Math.abs(dy)?Math.sign(dy):0;
      const from={x:tileCenter(this.x),y:tileCenter(this.y)};
      const to=nextGridStep(from,rx,ry,(a,b)=>this.gridPathClear(a,b));
      if(to)this.recoil={from,to,elapsed:0};
    }
    this.hearts = Math.max(0, this.hearts - amount);
    this.visualLayers.forEach(({image})=>image.setData('story-brightness',.4));
    EventBus.emit('health-changed', { hearts: this.hearts });
    if (this.hearts <= 0) {
      this.playDeath();
    }
    return true;
  }

  private playDeath(){
    this.isDying=true;this.recoil=null;this.sprite.setVelocity(0,0);
    this.sword.setVisible(false);this.bow.setVisible(false);this.swordTrail.clear();
    const layers=this.visualLayers.map(({image})=>({image,y:image.y,w:image.displayWidth,h:image.displayHeight}));
    const pose={progress:0};
    this.sprite.scene.tweens.add({targets:pose,progress:1,duration:760,ease:'Cubic.easeIn',
      onUpdate:()=>{
        for(const {image,y,w,h} of layers){
          image.setDisplaySize(w*(1+pose.progress*.5),h*(1-pose.progress*.88));
          image.y=y+pose.progress*24;image.setAlpha(1-pose.progress*.45);
          image.setData('story-brightness',.45-pose.progress*.25);
        }
        [...this.hands,...this.feet].forEach(limb=>limb.setAlpha(1-pose.progress));
      },
      onComplete:()=>EventBus.emit('player-died',{})});
  }

  addLexicoins(amount: number) {
    const lexicoins=this.lexicoins+amount;
    if(saveStoryInventory({lexicoins}))EventBus.emit('lexicoins-changed', { amount: lexicoins });
  }

  private setAvatarTint(color: number) {
    this.visualLayers.forEach(({ image }) => image.setTint(color));
  }

  private clearAvatarTint() {
    this.visualLayers.forEach(({ image }) => image.clearTint());
    this.fillTintLayers.forEach(({ image, color }) => image.setTintFill(color));
  }
}
