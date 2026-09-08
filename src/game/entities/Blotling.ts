import * as Phaser from 'phaser';

const CHASE_RANGE = 310;
const ATTACK_RANGE = 38;
const MOVE_SPEED = 43;

export default class Blotling {
  public sprite: Phaser.Physics.Arcade.Image;
  private shadow: Phaser.GameObjects.Ellipse;
  private hp = 2;
  private attackCooldown = 0;
  private hitStun = 0;
  private elapsed = 0;
  public defeated = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.shadow = scene.add.ellipse(x, y + 18, 34, 11, 0x020617, 0.42).setDepth(8);
    this.sprite = scene.physics.add.image(x, y, 'blotling').setDepth(10);
    this.sprite.setCircle(18, 4, 2);
    this.sprite.setCollideWorldBounds(true);
  }

  update(delta: number, target: { x: number; y: number }): boolean {
    if (this.defeated) return false;
    this.elapsed += delta;
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    this.hitStun = Math.max(0, this.hitStun - delta);

    const dx = target.x - this.sprite.x;
    const dy = target.y - this.sprite.y;
    const distance = Math.hypot(dx, dy);

    if (this.hitStun > 0) {
      this.sprite.setVelocity(this.sprite.body!.velocity.x * 0.86, this.sprite.body!.velocity.y * 0.86);
    } else if (distance <= ATTACK_RANGE) {
      this.sprite.setVelocity(0, 0);
      if (this.attackCooldown === 0) {
        this.attackCooldown = 1450;
        this.sprite.scene.tweens.add({
          targets: this.sprite,
          scaleX: 1.25,
          scaleY: 0.78,
          duration: 90,
          yoyo: true,
        });
        return true;
      }
    } else if (distance < CHASE_RANGE) {
      this.sprite.setVelocity((dx / distance) * MOVE_SPEED, (dy / distance) * MOVE_SPEED);
      this.sprite.setFlipX(dx < 0);
    } else {
      this.sprite.setVelocity(0, 0);
    }

    const bob = Math.sin(this.elapsed * 0.012) * 2;
    this.shadow.setPosition(this.sprite.x, this.sprite.y + 18).setScale(1 - Math.abs(bob) * 0.02);
    return false;
  }

  takeHit(fromX: number, fromY: number, damage = 1): boolean {
    if (this.defeated || this.hitStun > 0) return false;
    this.hp -= damage;
    this.hitStun = 260;

    const angle = Phaser.Math.Angle.Between(fromX, fromY, this.sprite.x, this.sprite.y);
    this.sprite.setVelocity(Math.cos(angle) * 230, Math.sin(angle) * 230);
    this.sprite.setTintFill(0xffffff);
    this.sprite.scene.time.delayedCall(90, () => {
      if (!this.defeated) this.sprite.clearTint();
    });

    if (this.hp <= 0) {
      this.defeat();
      return true;
    }
    return false;
  }

  private defeat() {
    this.defeated = true;
    this.sprite.disableBody();
    this.sprite.scene.tweens.add({
      targets: [this.sprite, this.shadow],
      alpha: 0,
      scaleX: 1.55,
      scaleY: 0.15,
      duration: 260,
      ease: 'Power2',
      onComplete: () => {
        this.sprite.destroy();
        this.shadow.destroy();
      },
    });
  }
}
