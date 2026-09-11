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
  private attackMs=-1;
  private attackDirection={x:0,y:0};
  private struck=false;
  private variant:'blotling'|'woodling';
  get attackPhase(){return this.attackMs<0?'idle':this.attackMs<300?'windup':this.attackMs<440?'strike':'recover';}
  public defeated = false;
  get canReceiveHit(){return !this.defeated&&this.hitStun<=0;}

  constructor(scene: Phaser.Scene, x: number, y: number, hp = 2, variant:'blotling'|'woodling'='blotling') {
    this.hp=hp;
    this.variant=variant;
    this.shadow = scene.add.ellipse(x, y + 18, 34, 11, 0x020617, 0.42).setDepth(8);
    this.sprite = scene.physics.add.image(x, y, variant==='woodling'?'woodling-idle':'blotling').setDepth(10);
    this.sprite.setCircle(18, 4, 2);
    this.sprite.setCollideWorldBounds(true);
  }

  update(delta: number, target: { x: number; y: number }): boolean {
    if (this.defeated) return false;
    if(Math.max(this.sprite.getData('boundUntil')??0,this.sprite.getData('staggerUntil')??0)>this.sprite.scene.time.now){this.hitStun=Math.max(0,this.hitStun-delta);this.sprite.setVelocity(0,0);this.attackMs=-1;return false;}
    this.elapsed += delta;
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    this.hitStun = Math.max(0, this.hitStun - delta);

    const dx = target.x - this.sprite.x;
    const dy = target.y - this.sprite.y;
    const distance = Math.hypot(dx, dy);
    this.shadow.setPosition(this.sprite.x,this.sprite.y+18);

    if(this.attackMs>=0&&this.hitStun===0){
      this.attackMs+=Math.min(delta,50);
      if(this.attackMs<300){
        const p=this.attackMs/300;
        this.sprite.setVelocity(0,0).setScale(1+p*.18,1-p*.12).setTint(this.variant==='woodling'?0xd0bc7c:0xc4a1e2);
        if(this.variant==='woodling')this.sprite.setTexture('woodling-windup');
      }else if(this.attackMs<440){
        this.sprite.clearTint().setScale(.86,1.14);
        if(this.variant==='woodling')this.sprite.setTexture('woodling-strike');
        this.sprite.setVelocity(this.attackDirection.x*170,this.attackDirection.y*170);
        if(!this.struck&&this.attackMs>=350&&distance<=ATTACK_RANGE+10){this.struck=true;return true;}
      }else{
        this.sprite.setVelocity(0,0);
        const p=Math.min(1,(this.attackMs-440)/200);
        this.sprite.setScale(.86+.14*p,1.14-.14*p);
        if(p===1){this.attackMs=-1;this.attackCooldown=900;this.sprite.setScale(1);if(this.variant==='woodling')this.sprite.setTexture('woodling-idle');}
      }
      return false;
    }

    if (this.hitStun > 0) {
      this.sprite.setVelocity(this.sprite.body!.velocity.x * 0.86, this.sprite.body!.velocity.y * 0.86);
    } else if (distance <= 58) {
      this.sprite.setVelocity(0, 0);
      if (this.attackCooldown === 0) {
        this.attackMs=0;this.struck=false;
        this.attackDirection={x:dx/(distance||1),y:dy/(distance||1)};
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
    this.attackMs=-1;this.attackCooldown=600;this.sprite.setScale(1);
    if(this.variant==='woodling')this.sprite.setTexture('woodling-hurt');

    const angle = Phaser.Math.Angle.Between(fromX, fromY, this.sprite.x, this.sprite.y);
    this.sprite.setVelocity(Math.cos(angle) * 230, Math.sin(angle) * 230);
    this.sprite.setTintFill(0xffffff);
    this.sprite.scene.time.delayedCall(90, () => {
      if (!this.defeated){this.sprite.clearTint();if(this.variant==='woodling')this.sprite.setTexture('woodling-idle');}
    });

    if (this.hp <= 0) {
      this.defeat();
      return true;
    }
    return false;
  }

  /** World restoration removes lingering threats without another combat hit. */
  dismiss(){if(!this.defeated)this.defeat();}

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
