import Phaser from 'phaser';
import { EventBus } from '../EventBus';

export type Facing = 'up' | 'down' | 'left' | 'right';

const SPEED = 180;
const SPIN_CHARGE_MS = 700;
const SWING_COOLDOWN_MS = 300;
const SPIN_COOLDOWN_MS = 600;

export default class Player {
  public sprite: Phaser.Physics.Arcade.Image;

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW: Phaser.Input.Keyboard.Key;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyS: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private keyZ: Phaser.Input.Keyboard.Key;
  private keyE: Phaser.Input.Keyboard.Key;
  private keySpace: Phaser.Input.Keyboard.Key;

  public facing: Facing = 'down';

  private attackHeld = false;
  private attackHoldMs = 0;
  private attackCooldown = 0;

  public hearts: number;
  public lexicoins = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, startHearts = 3) {
    this.sprite = scene.physics.add.image(x, y, 'player');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDepth(10);

    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyZ = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
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
    this.sprite.setVelocity(0, 0);
  }

  update(delta: number) {
    this.handleMovement();
    this.handleAttack(delta);
  }

  private handleMovement() {
    const up    = this.cursors.up.isDown    || this.keyW.isDown;
    const down  = this.cursors.down.isDown  || this.keyS.isDown;
    const left  = this.cursors.left.isDown  || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;

    let vx = 0;
    let vy = 0;

    if (left)  vx = -1;
    else if (right) vx = 1;
    if (up)    vy = -1;
    else if (down)  vy = 1;

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    this.sprite.setVelocity(vx * SPEED, vy * SPEED);

    // Track facing direction
    if (right && !left) this.facing = 'right';
    else if (left && !right) this.facing = 'left';
    else if (up && !down) this.facing = 'up';
    else if (down && !up) this.facing = 'down';
  }

  private handleAttack(delta: number) {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    if (this.keyZ.isDown && !this.attackHeld) {
      this.attackHeld = true;
      this.attackHoldMs = 0;
    }

    if (this.keyZ.isDown && this.attackHeld) {
      this.attackHoldMs += delta;
      // Visual charge cue at spin threshold
      if (this.attackHoldMs >= SPIN_CHARGE_MS) {
        this.sprite.setTint(0xfbbf24);
      }
    }

    if (!this.keyZ.isDown && this.attackHeld) {
      this.attackHeld = false;
      this.sprite.clearTint();

      if (this.attackHoldMs >= SPIN_CHARGE_MS) {
        this.performSpinAttack();
      } else {
        this.performSwordSwing();
      }
    }
  }

  private performSwordSwing() {
    if (this.attackCooldown > 0) return;
    this.attackCooldown = SWING_COOLDOWN_MS;
    EventBus.emit('player-attack', { type: 'swing', facing: this.facing, x: this.x, y: this.y });
  }

  private performSpinAttack() {
    if (this.attackCooldown > 0) return;
    this.attackCooldown = SPIN_COOLDOWN_MS;
    EventBus.emit('player-attack', { type: 'spin', x: this.x, y: this.y });
  }

  takeDamage(amount: number) {
    this.hearts = Math.max(0, this.hearts - amount);
    this.sprite.setTint(0xff0000);
    EventBus.emit('health-changed', { hearts: this.hearts });
    // Brief invincibility flash
    this.sprite.scene.time.delayedCall(200, () => this.sprite.clearTint());
    if (this.hearts <= 0) {
      EventBus.emit('player-died', {});
    }
  }

  addLexicoins(amount: number) {
    this.lexicoins += amount;
    EventBus.emit('lexicoins-changed', { amount: this.lexicoins });
  }
}
