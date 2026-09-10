import * as Phaser from 'phaser';
import Player from '../entities/Player';
import type { StoryAvatarConfig } from '../avatar';
import { AREAS,canTravel,type AreaId } from '../story/areaTravel';
import { getStoryProgress, isChapterUnlocked } from '@/lib/story/progress';
import { frameWorld } from '../world/framing';

/** A walk-through three-way lodge. Returning through the entry resumes its paused scene. */
export default class GatehouseScene extends Phaser.Scene{
  private source:AreaId='village';private parent='DungeonScene';private player!:Player;
  private leaving=false;private readyAt=0;private hint!:Phaser.GameObjects.Text;
  constructor(private avatar:StoryAvatarConfig){super({key:'GatehouseScene'});}
  init(data:{source:AreaId;parent:string}){this.source=data.source;this.parent=data.parent;this.leaving=false;}
  create(){
    this.cameras.main.setBackgroundColor('#080f1a');
    this.physics.world.setBounds(224,224,352,256);
    const g=this.add.graphics().setDepth(-20);
    g.fillStyle(0x28373b).fillRect(220,156,360,328);
    for(let row=0;row<8;row++)for(let col=0;col<11;col++)this.add.image(224+col*32,224+row*32,'interior-stone').setDisplaySize(32,32).setOrigin(0).setDepth(-10);
    for(let row=0;row<2;row++)for(let col=0;col<11;col++)this.add.image(224+col*32,160+row*32,`interior-${col%5===0?'beam':row?'skirting':'wall'}`).setDisplaySize(32,32).setOrigin(0).setDepth(-10);
    for(const x of [288,480])this.add.image(x,176,'interior-window').setDisplaySize(32,32).setOrigin(0).setDepth(-9);
    // Reuse existing furniture PNGs, with exact one-tile bodies.
    for(const [x,y,key] of [[240,240,'shelf'],[528,240,'shelf'],[368,240,'map'],[400,240,'desk']] as const){
      this.add.image(x-16,y-16,`interior-${key}`).setDisplaySize(32,32).setOrigin(0);
      this.physics.add.staticImage(x,y,'__DEFAULT').setVisible(false).setDisplaySize(32,32).refreshBody();
    }
    const thresholds=this.add.graphics().setDepth(-5);
    thresholds.fillStyle(0x526358).fillRect(224,224,3,256).fillRect(573,224,3,256);
    for(const area of Object.values(AREAS)){
      const {x,y}=area.door;
      thresholds.fillStyle(0x172929).fillRect(x-16,y-16,32,32);
      thresholds.fillStyle(0xc7b992).fillRect(x-16,y-16,32,3);
      this.add.text(x,y-30,area.name,{fontFamily:'Georgia',fontSize:'10px',color:'#e5d6b1',backgroundColor:'#344a43',padding:{x:5,y:3}}).setOrigin(0.5).setDepth(3);
    }
    const spawn=AREAS[this.source].spawn;
    this.player=new Player(this,spawn.x,spawn.y,this.avatar);
    this.readyAt=this.time.now+400;
    this.hint=this.add.text(400,520,'Walk through a doorway to travel. Return through your entry to go back.',{fontSize:'12px',color:'#d6c8a7',wordWrap:{width:500},align:'center'}).setOrigin(0.5).setDepth(100);
    frameWorld(this);this.cameras.main.fadeIn(200);
  }
  update(_time:number,delta:number){
    if(this.leaving)return;
    this.player.update(delta);
    if(this.time.now<this.readyAt)return;
    for(const [id,area] of Object.entries(AREAS)){
      if(Phaser.Math.Distance.Between(this.player.x,this.player.y,area.door.x,area.door.y)>8)continue;
      const target=id as AreaId;
      if(target === 'wordwood' && !isChapterUnlocked(2)) {
        this.hint.setText('Sir Serif asked you to speak to Scholar Vellum first. Find him in Inkwell’s Archive, on the east side of town.');return;
      }
      if(!canTravel(target,getStoryProgress().completedChapters)){
        this.hint.setText('Clear the three Word Seals on Inkwell Road first.');return;
      }
      this.leaving=true;this.player.stopMovement();this.cameras.main.fadeOut(180);
      this.time.delayedCall(200,()=>{
        if(target===this.source){this.scene.stop();this.scene.resume(this.parent);}
        else window.location.assign(area.url);
      });
      return;
    }
  }
}
