import * as Phaser from 'phaser';
import { EventBus } from '../EventBus';
import {
  AVATAR_BODY_OFFSETS,
  hexToNumber,
  type StoryAvatarConfig,
} from '../avatar';
import { resolveMovement, type Facing } from '../movement';
import { facingVector } from '../combat';
import { createInkHand } from './inkHand';

const SPEED = 180;
const SPIN_CHARGE_MS = 700;
const SWING_COOLDOWN_MS = 300;
const SPIN_COOLDOWN_MS = 600;

export default class Player {
  public sprite: Phaser.Physics.Arcade.Image;

  private shadow: Phaser.GameObjects.Ellipse;
  private visualLayers: Array<{ image: Phaser.GameObjects.Image; yOffset: number }> = [];
  private fillTintLayers: Array<{ image: Phaser.GameObjects.Image; color: number }> = [];
  private aura?: Phaser.GameObjects.Image;
  private sword: Phaser.GameObjects.Image;
  private hands: [Phaser.GameObjects.Container, Phaser.GameObjects.Container];
  private feet: [Phaser.GameObjects.Ellipse, Phaser.GameObjects.Ellipse];
  private walkElapsed = 0;
  private idleElapsed = 0;
  private idleBlend = 0;
  private isMoving = false;

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
  private attackHoldMs = 0;
  private attackCooldown = 0;
  private damageInvulnerabilityMs = 0;
  private attackPoseMs = 0;
  private attackPoseDuration = 1;
  private attackPoseType: 'swing' | 'spin' = 'swing';

  public hearts: number;
  public lexicoins = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    avatar: StoryAvatarConfig,
    startHearts = 3,
  ) {
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

    const bodyColor = hexToNumber(avatar.color);
    const footColor = Phaser.Display.Color.IntegerToColor(bodyColor).darken(22).color;
    const makeLimb = (width: number, height: number, color: number, depth: number) => scene.add
      .ellipse(x, y, width, height, color)
      .setStrokeStyle(2, 0x10263a, 0.72)
      .setDepth(depth);
    this.feet = [makeLimb(13, 10, footColor, 9.6), makeLimb(13, 10, footColor, 9.6)];
    this.hands = [createInkHand(scene, x, y, bodyColor), createInkHand(scene, x, y, bodyColor)];
    this.hands.forEach((hand) => hand.setDepth(13.5));

    const base = scene.add
      .image(x, y, 'player-base')
      .setDisplaySize(58, 58)
      .setTintFill(hexToNumber(avatar.color))
      .setDepth(10);
    this.fillTintLayers.push({ image: base, color: hexToNumber(avatar.color) });
    this.visualLayers.push({ image: base, yOffset: 0 });

    this.sword = scene.add.image(x + 20, y + 14, 'story-sword')
      .setOrigin(0.5, 54 / 66)
      .setDisplaySize(14, 50)
      .setDepth(14);

    const offsets = AVATAR_BODY_OFFSETS[avatar.base] ?? AVATAR_BODY_OFFSETS.droplet_01;
    const eyes = scene.add
      .image(x, y + offsets.eyesY, 'player-eyes')
      .setDisplaySize(58, 58)
      .setDepth(11);
    this.visualLayers.push({ image: eyes, yOffset: offsets.eyesY });

    [
      ['player-accessory-1', avatar.accessory],
      ['player-accessory-2', avatar.accessory2],
    ].forEach(([key, id], index) => {
      if (id === 'none' || id === 'sword_01' || !scene.textures.exists(key)) return;
      const isBottomAccessory = id === 'suit_01';
      const accessory = scene.add
        .image(x, y + (isBottomAccessory ? 0 : offsets.accessoryY), key)
        .setDisplaySize(58 * offsets.accessoryScale, 58 * offsets.accessoryScale)
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
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    ]);
    this.cursors = kb.createCursorKeys();
    this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyQ = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.keyE = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.hearts = startHearts;
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  isInteractJustDown(): boolean {
    return (
      Phaser.Input.Keyboard.JustDown(this.keyE) ||
      Phaser.Input.Keyboard.JustDown(this.keySpace)
    );
  }

  stopMovement() {
    if (!this.sprite.active || !this.sprite.body) return;
    this.sprite.setVelocity(0, 0);
    this.isMoving = false;
    this.syncVisuals(0);
  }

  update(delta: number) {
    this.damageInvulnerabilityMs = Math.max(0, this.damageInvulnerabilityMs - delta);
    this.attackPoseMs = Math.max(0, this.attackPoseMs - delta);
    this.handleMovement();
    this.handleAttack(delta);
    this.syncVisuals(delta);
  }

  private handleMovement() {
    const up    = this.cursors.up.isDown    || this.keyW.isDown;
    const down  = this.cursors.down.isDown  || this.keyS.isDown;
    const left  = this.cursors.left.isDown  || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;

    const movement = resolveMovement({ up, down, left, right });
    if (movement.facing) this.facing = movement.facing;

    this.sprite.setVelocity(movement.x * SPEED, movement.y * SPEED);
    this.isMoving = movement.x !== 0 || movement.y !== 0;
  }

  private syncVisuals(delta: number) {
    if (this.isMoving) this.walkElapsed += delta;
    else this.walkElapsed = 0;

    const idling = !this.isMoving && this.attackPoseMs <= 0 && !this.attackHeld;
    this.idleElapsed += delta;
    this.idleBlend = Phaser.Math.Linear(this.idleBlend, idling ? 1 : 0, 1 - Math.exp(-delta / 160));
    const breath = Math.sin(this.idleElapsed * Math.PI * 2 / 2400) * this.idleBlend;
    const bob = this.isMoving ? Math.sin(this.walkElapsed * 0.018) * 2 : breath * 1.4;
    const facesLeft = this.facing === 'left' || this.facing.endsWith('-left');
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
      image.setPosition(this.sprite.x, this.sprite.y + bob + yOffset);
      image.setFlipX(facesLeft);
      image.setAngle(lean);
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
    const charging = this.attackHeld && this.attackHoldMs >= SPIN_CHARGE_MS;
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
      .setDepth(attacking && (this.facing === 'up' || this.facing.startsWith('up-')) ? 9.5 : 14);

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
    // The sword origin is the center of its grip: hand and hilt share one pivot.
    this.hands[1].setPosition(swordX, swordY).setDepth(this.sword.depth + 0.1);

    if (this.aura) {
      const pulse = 1 + Math.sin(this.walkElapsed * 0.006) * 0.035;
      this.aura.setScale(pulse);
    }
  }

  private handleAttack(delta: number) {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    if (this.keyQ.isDown && !this.attackHeld) {
      this.attackHeld = true;
      this.attackHoldMs = 0;
      // Fire the normal slash on press for a crisp Zelda-like response.
      this.performSwordSwing();
    }

    if (this.keyQ.isDown && this.attackHeld) {
      this.attackHoldMs += delta;
      // Visual charge cue at spin threshold
      if (this.attackHoldMs >= SPIN_CHARGE_MS) {
        this.setAvatarTint(0xfbbf24);
      }
    }

    if (!this.keyQ.isDown && this.attackHeld) {
      this.attackHeld = false;
      this.clearAvatarTint();

      if (this.attackHoldMs >= SPIN_CHARGE_MS) {
        this.performSpinAttack();
      }
    }
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
    this.attackPoseDuration = 320;
    this.attackPoseMs = this.attackPoseDuration;
    EventBus.emit('player-attack', { type: 'spin', x: this.x, y: this.y });
  }

  takeDamage(amount: number): boolean {
    if (this.damageInvulnerabilityMs > 0 || this.hearts <= 0) return false;
    this.damageInvulnerabilityMs = 1300;
    this.hearts = Math.max(0, this.hearts - amount);
    this.setAvatarTint(0xff0000);
    EventBus.emit('health-changed', { hearts: this.hearts });
    // Brief invincibility flash
    this.sprite.scene.time.delayedCall(200, () => this.clearAvatarTint());
    if (this.hearts <= 0) {
      EventBus.emit('player-died', {});
    }
    return true;
  }

  addLexicoins(amount: number) {
    this.lexicoins += amount;
    EventBus.emit('lexicoins-changed', { amount: this.lexicoins });
  }

  private setAvatarTint(color: number) {
    this.visualLayers.forEach(({ image }) => image.setTint(color));
  }

  private clearAvatarTint() {
    this.visualLayers.forEach(({ image }) => image.clearTint());
    this.fillTintLayers.forEach(({ image, color }) => image.setTintFill(color));
  }
}
