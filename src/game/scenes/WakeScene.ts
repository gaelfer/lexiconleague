import * as Phaser from 'phaser';
import Player from '../entities/Player';
import {hexToNumber,type StoryAvatarConfig} from '../avatar';
import {sleepingInkling} from '../entities/sleepingInkling';
import { buildTileInterior } from '../world/tileInterior';
import { frameWorld } from '../world/framing';
import { EventBus } from '../EventBus';
import { saveStoryProgress } from '@/lib/story/progress';

/** Player-paced opening. The chase starts after leaving the cottage. */
export default class WakeScene extends Phaser.Scene {
  private player!: Player;
  private awake = false;
  private leaving = false;
  private hint!: Phaser.GameObjects.Text;
  private visit=false;
  private sleeping=false;
  private readyAt=0;
  private rested=false;
  private startHearts=3;
  private sleepPose?:ReturnType<typeof sleepingInkling>;
  constructor(private avatar: StoryAvatarConfig) { super('WakeScene'); }
  init(data:{visit?:boolean;hearts?:number}={}){this.visit=!!data.visit;this.sleeping=false;this.rested=false;this.startHearts=data.hearts??3;}
  create() {
    this.awake = this.visit; this.leaving = false;
    this.readyAt=this.time.now+350;
    const walls = this.physics.add.staticGroup();
    buildTileInterior(this, 'home', (x,y,w,h) => {
      const wall = this.physics.add.staticImage(x,y,'__DEFAULT').setVisible(false).setDisplaySize(w,h).refreshBody();
      walls.add(wall);
    });
    this.player = new Player(this,this.visit?400:240,this.visit?432:240,this.avatar,this.startHearts);
    if(!this.visit){this.player.setSleeping(true);this.sleepPose=sleepingInkling(this,224,224,hexToNumber(this.avatar.color),'teal');}
    this.physics.add.collider(this.player.sprite,walls);
    this.hint = this.add.text(400,510,'Inkwell’s warning bell cuts through your sleep.\n\nE  GET UP', {
      fontFamily:'Georgia, serif', fontSize:'18px',color:'#eee4cc',align:'center',
      backgroundColor:'#10232c',padding:{x:20,y:14},wordWrap:{width:620},
    }).setOrigin(0.5).setDepth(100);
    if(this.visit)this.hint.setText('Home, sweet home. Approach your bed and press E to sleep.');
    frameWorld(this);
    this.cameras.main.fadeIn(1800,8,15,24);
    EventBus.emit('current-scene-ready',this);
  }
  update(_time:number,delta:number) {
    if (this.leaving || this.sleeping || this.time.now<this.readyAt) return;
    if (!this.awake) {
      if (!this.player.isInteractJustDown()) return;
      this.awake = true;
      this.sleepPose?.destroy();this.sleepPose=undefined;this.player.setSleeping(false);
      // Begin sound on a gesture, respecting browser autoplay policy.
      if (!this.visit && this.sound instanceof Phaser.Sound.WebAudioSoundManager) {
        const context = this.sound.context;
        void context.resume().catch(() => {});
        for (let strike=0;strike<3;strike++) for (const [frequency,volume] of [[660,.1],[1320,.035],[1770,.018]]) {
          const tone=context.createOscillator(),gain=context.createGain(),start=context.currentTime+strike*.8;
          tone.frequency.value=frequency;gain.gain.setValueAtTime(volume,start);
          gain.gain.exponentialRampToValueAtTime(.0001,start+1.5);
          tone.connect(gain);gain.connect(context.destination);tone.start(start);tone.stop(start+1.6);
          tone.onended=()=>{tone.disconnect();gain.disconnect();};
        }
      }
      this.player.sprite.body!.reset(272,272);
      this.hint.setText(this.visit?'You wake feeling rested. Head south to leave.':'Someone is shouting outside.\nWASD  MOVE · Head to the southern doorway');
      return;
    }
    this.player.update(delta);
    if(this.visit){
      const nearBed=Math.min(Phaser.Math.Distance.Between(this.player.x,this.player.y,240,240),Phaser.Math.Distance.Between(this.player.x,this.player.y,240,272))<35;
      this.hint.setText(nearBed?'E  SLEEP':'Home, sweet home. Approach your bed and press E to sleep.');
      if(nearBed&&this.player.isInteractJustDown()){
        this.sleeping=true;this.player.stopMovement();this.hint.setText('You settle beneath the quilt…');
        this.cameras.main.fadeOut(450,8,15,24);
        this.time.delayedCall(500,()=>{
          this.player.sprite.body!.reset(240,240);this.player.setSleeping(true);
          this.sleepPose=sleepingInkling(this,224,224,hexToNumber(this.avatar.color),'teal');
          this.hint.setText('A little peace and quiet.\n\nE  GET UP');
          this.time.delayedCall(900,()=>{
            this.player.restoreAfterSleep();this.rested=true;
            this.hint.setText('Fully rested — hearts restored, plus one yellow heart.\n\nE  GET UP');
            this.cameras.main.fadeIn(600,8,15,24);this.sleeping=false;this.awake=false;this.readyAt=this.time.now+600;
          });
        });
        return;
      }
    }
    const atExit=Math.abs(this.player.x-400)<=40&&this.player.y>=416;
    if (atExit&&(this.player.y>=450||(this.player.facing==='down'&&this.player.isInteractJustDown()))) {
      this.leaving=true;this.player.stopMovement();this.cameras.main.fadeOut(300);
      this.time.delayedCall(320,()=>{
        if(this.visit){this.scene.stop();this.scene.resume('DungeonScene',{rested:this.rested});return;}
        saveStoryProgress({opening:'woke'});
        this.scene.start('DungeonScene',{chapterId:1});
      });
    }
  }
}
