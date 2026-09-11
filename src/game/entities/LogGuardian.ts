import * as Phaser from 'phaser';

/** A single post-Tablet encounter. All attack clocks pause with the scene UI. */
export class LogGuardian {
  sprite:Phaser.Physics.Arcade.Image;
  defeated=false;
  hp=10;
  get canReceiveHit(){return !this.defeated&&!this.emerging&&this.invulnerable<=0;}
  hurtbox:Phaser.Physics.Arcade.Image;
  meleeRadius=18;
  private elapsed=0;
  private attackMs=0;
  private emerging=true;
  private cooldown=2000;
  private invulnerable=0;
  private contact=0;
  private bars:Phaser.GameObjects.Graphics;
  private strikes:{x:number;y:number;elapsed:number;ring:Phaser.GameObjects.Graphics;wood:Phaser.GameObjects.Image}[]=[];
  constructor(private scene:Phaser.Scene,private freed:(x:number,y:number)=>void){
    if(!scene.textures.exists('log-guardian-walk-0')){
      const g=scene.add.graphics();
      for(let frame=0;frame<6;frame++){
      const lift=frame>=4?-10:frame%2?2:0;
      g.fillStyle(0x25302c).fillRect(3,15+lift,8,23).fillRect(25,12+lift,7,26).fillRect(9,5,18,36);
      g.fillStyle(0x785b3d).fillRect(10,8,16,31).fillRect(4,18+lift,6,16).fillRect(26,15+lift,5,19);
      g.fillStyle(0xc1a16b).fillRect(11,8,3,29).fillRect(16,6,3,28).fillRect(22,10,2,26);
      g.fillStyle(0x624372).fillRect(18,13,5,19).fillRect(8,24,8,6).fillRect(25,17,5,5);
      g.fillStyle(0x9972b1).fillRect(19,14,2,14).fillRect(10,25,5,2);
      g.fillStyle(0x172429).fillRect(12,17,5,4).fillRect(21,17,4,4);
      g.fillStyle(0xe0c9ee).fillRect(13,18,2,2).fillRect(22,18,2,2);
      g.fillStyle(0x47563d).fillRect(7,5,8,6).fillRect(23,3,5,8);
      g.fillStyle(0x3d342e).fillRect(9,39+(frame<4&&frame%2?2:0),7,5).fillRect(22,39+(frame<4&&!(frame%2)?2:0),7,5);
      // Split crown, layered bark plates and cool undersides keep the timber readable.
      g.fillStyle(0x25302c).fillRect(10,2,4,7).fillRect(19,3,3,6).fillRect(28,7,3,8);
      g.fillStyle(0xa58353).fillRect(10,2,2,6).fillRect(19,3,2,4).fillRect(28,7,1,5);
      g.fillStyle(0x493b35).fillRect(14,10,2,6).fillRect(24,23,2,12).fillRect(15,32,2,8)
        .fillRect(11,29,5,2).fillRect(20,35,5,2).fillRect(6,22+lift,2,9).fillRect(28,25+lift,2,8);
      g.fillStyle(0xb59562).fillRect(4,18+lift,4,2).fillRect(26,15+lift,3,2)
        .fillRect(10,31,3,1).fillRect(21,33,3,1);
      // A knot below the face and broken root fingers describe living wood.
      g.fillStyle(0x453835).fillRect(15,25,4,5).fillRect(14,26,6,3);
      g.fillStyle(0x9c7950).fillRect(16,26,2,3);
      g.fillStyle(0x25302c).fillRect(3,33+lift,2,5).fillRect(7,34+lift,2,4)
        .fillRect(26,34+lift,2,4).fillRect(30,32+lift,2,5);
      // Ink follows the splits rather than covering the bark with a flat tint.
      g.fillStyle(0x322d4e).fillRect(19,10,3,7).fillRect(18,21,3,4)
        .fillRect(20,28,3,7).fillRect(22,33,2,7).fillRect(8,27+lift,3,5);
      g.fillStyle(0x82629b).fillRect(20,11,1,5).fillRect(19,22,1,3)
        .fillRect(21,29,1,5).fillRect(23,35,1,4).fillRect(9,28+lift,1,3);
      g.fillStyle(0x526547).fillRect(7,5,5,2).fillRect(23,3,3,2).fillRect(10,7,3,2);
      g.fillStyle(0x172429).fillRect(13,22,3,1).fillRect(21,22,3,1);
      if(frame===4){g.fillStyle(0x9d744b).fillRect(3,1,29,6);g.fillStyle(0xd7b479).fillRect(4,1,27,2);}
      g.generateTexture(`log-guardian-walk-${frame}`,36,48);g.clear();
      }
      g.fillStyle(0x362d2b).fillRect(1,3,14,10);g.fillStyle(0x9d744b).fillRect(2,4,12,8);
      g.fillStyle(0xd7b479).fillRect(2,4,3,7);g.fillStyle(0x644337).fillRect(6,6,8,2);
      g.generateTexture('guardian-timber',16,16);g.destroy();
    }
    this.sprite=scene.physics.add.image(1223,457,'log-guardian-walk-0').setScale(2).setDepth(10);
    // Feet collide with scenery; a separate torso hurtbox receives arrows.
    this.sprite.body!.setSize(20,10).setOffset(8,34);this.sprite.body!.enable=false;
    this.hurtbox=scene.physics.add.image(1223,457,'__DEFAULT').setVisible(false);
    this.hurtbox.body!.setSize(44,68);this.hurtbox.body!.enable=false;
    this.bars=scene.add.graphics().setDepth(40);
    scene.tweens.add({targets:this.sprite,x:1168,y:512,duration:1000,onComplete:()=>{this.emerging=false;this.sprite.body!.enable=true;this.hurtbox.body!.enable=true;}});
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.clearStrikes());
  }
  private clearStrikes(){for(const strike of this.strikes){strike.ring.destroy();strike.wood.destroy();}this.strikes=[];}
  update(delta:number,target:{x:number;y:number}){
    if(this.defeated)return false;
    const dt=Math.min(delta,50);this.invulnerable=Math.max(0,this.invulnerable-dt);
    this.elapsed+=dt;this.attackMs=Math.max(0,this.attackMs-dt);
    this.hurtbox.body!.reset(this.sprite.x,this.sprite.y);
    this.sprite.setTexture(`log-guardian-walk-${this.attackMs>0?(this.attackMs>300?4:5):Math.floor(this.elapsed/160)%4}`);
    this.bars.clear();for(let i=0;i<10;i++){
      const x=this.sprite.x-25+(i%5)*10,y=this.sprite.y-65+Math.floor(i/5)*10;
      this.bars.fillStyle(i<this.hp?0xb98bc9:0x353745).fillRect(x,y,3,3).fillRect(x+4,y,3,3)
        .fillRect(x,y+2,7,3).fillRect(x+1,y+5,5,1).fillRect(x+2,y+6,3,1).fillRect(x+3,y+7,1,1);
    }
    if(this.emerging)return false;
    if((this.sprite.getData('staggerUntil')??0)>this.scene.time.now){this.sprite.setVelocity(0,0);return false;}
    this.cooldown-=dt;this.contact-=dt;
    const dx=target.x-this.sprite.x,dy=target.y-this.sprite.y,d=Math.hypot(dx,dy);
    this.sprite.setVelocity(d>45?dx/d*64:0,d>45?dy/d*64:0);
    // If an obstacle blocks one axis, continue around its edge on the other.
    const body=this.sprite.body as Phaser.Physics.Arcade.Body;
    if(body.blocked.left||body.blocked.right)body.setVelocityY(dy>=0?64:-64);
    if(body.blocked.up||body.blocked.down)body.setVelocityX(dx>=0?64:-64);
    if(this.cooldown<=0){
      this.cooldown=2400;
      this.attackMs=700;
      this.strikes.push({x:target.x,y:target.y,elapsed:0,ring:this.scene.add.graphics().setDepth(5),wood:this.scene.add.image(target.x,target.y-200,'guardian-timber').setScale(2).setDepth(35).setVisible(false)});
    }
    if(this.attackMs>0)this.sprite.setVelocity(0,0);
    let hit=false;
    for(const s of [...this.strikes]){
      s.elapsed+=dt;s.ring.clear();
      s.ring.fillStyle(0x83579d,.18).fillCircle(s.x,s.y,32);
      s.ring.lineStyle(2,0xd5b9db).strokeCircle(s.x,s.y,32);
      s.ring.lineStyle(2,0xad7fc2).strokeCircle(s.x,s.y,32*Math.min(1,s.elapsed/1200));
      if(s.elapsed>=800)s.wood.setVisible(true).setY(s.y-200*(1-Math.min(1,(s.elapsed-800)/400)));
      if(s.elapsed>=1200){
        hit ||= Math.hypot(target.x-s.x,target.y-s.y)<32;
        s.ring.destroy();s.wood.destroy();this.strikes.splice(this.strikes.indexOf(s),1);
        const burst=this.scene.add.graphics().setDepth(3);burst.lineStyle(3,0xb18c61).strokeCircle(s.x,s.y,28);
        this.scene.tweens.add({targets:burst,alpha:0,duration:300,onComplete:()=>burst.destroy()});
      }
    }
    if(d<40&&this.contact<=0){hit=true;this.contact=1200;}
    return hit;
  }
  takeHit(_x:number,_y:number,damage=1){
    if(this.defeated||this.emerging||this.invulnerable>0)return false;
    this.hp=Math.max(0,this.hp-damage);this.invulnerable=300;
    this.sprite.setTint(0xd8b8eb);this.scene.time.delayedCall(120,()=>{if(this.sprite.active)this.sprite.clearTint();});
    if(this.hp>0)return false;
    this.defeated=true;this.sprite.disableBody();this.hurtbox.destroy();this.bars.destroy();this.clearStrikes();
    const {x,y}=this.sprite;
    this.scene.tweens.add({targets:this.sprite,alpha:0,duration:600,onComplete:()=>this.sprite.destroy()});
    this.freed(x,y);return true;
  }
}
