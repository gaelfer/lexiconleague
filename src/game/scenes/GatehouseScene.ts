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
    for(const [id,area] of Object.entries(AREAS)){
      const {x,y}=area.door;
      thresholds.fillStyle(0x172929).fillRect(x-16,y-16,32,32);
      thresholds.fillStyle(0xc7b992).fillRect(x-16,y-16,32,3);
      const board=id==='approach'?{x:288,y:298,text:'← INKWELL ROAD'}:id==='wordwood'?{x:512,y:298,text:'WORDWOOD →'}:{x:488,y:424,text:'INKWELL VILLAGE\n↓ SOUTH EXIT'};
      this.add.text(board.x,board.y,board.text,{fontFamily:'Georgia',fontSize:'10px',color:'#e5d6b1',backgroundColor:'#344a43',padding:{x:6,y:5},align:'center'}).setOrigin(.5).setDepth(3);
    }
    const spawn=AREAS[this.source].spawn;
    this.player=new Player(this,spawn.x,spawn.y,this.avatar);
    this.readyAt=this.time.now+400;
    const title=this.add.text(400,10,'WAYFARER GATEHOUSE',{fontFamily:'Georgia',fontSize:'18px',color:'#ead9ac',letterSpacing:2}).setOrigin(.5).setScrollFactor(0).setDepth(100);
    const hintPanel=this.add.rectangle(400,564,650,56,0x172a29,.96).setStrokeStyle(1,0x756e55).setScrollFactor(0).setDepth(100);
    this.hint=this.add.text(400,564,'West: Inkwell Road · East: Wordwood · South: Inkwell Village\nWalk onto an exit tile to travel.',{fontFamily:'Arial',fontSize:'13px',color:'#e5dcc2',wordWrap:{width:608},align:'center',lineSpacing:5}).setOrigin(0.5).setScrollFactor(0).setDepth(101);
    frameWorld(this);
    const layout=()=>{
      const compact=this.scale.height<350;
      title.setY(compact?50:10);hintPanel.setY(compact?516:564);this.hint.setY(hintPanel.y);
      this.cameras.main.setZoom(compact?.5:.75).centerOn(400,332);
    };
    layout();this.scale.on(Phaser.Scale.Events.RESIZE,layout);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>this.scale.off(Phaser.Scale.Events.RESIZE,layout));
    this.cameras.main.fadeIn(200);
  }
  update(_time:number,delta:number){
    if(this.leaving)return;
    this.player.update(delta);
    if(this.time.now<this.readyAt)return;
    const nearest=Object.entries(AREAS).sort((a,b)=>Phaser.Math.Distance.Between(this.player.x,this.player.y,a[1].door.x,a[1].door.y)-Phaser.Math.Distance.Between(this.player.x,this.player.y,b[1].door.x,b[1].door.y))[0];
    const close=Phaser.Math.Distance.Between(this.player.x,this.player.y,nearest[1].door.x,nearest[1].door.y)<=80;
    this.hint.setText(close?(nearest[0]===this.source?`Return to ${nearest[1].name}.\nWalk onto the exit tile.`:nearest[0]==='wordwood'&&!isChapterUnlocked(2)?'Wordwood is not open yet.\nSpeak to Scholar Bellum in the Inkwell Archive.':`To ${nearest[1].name}.\nWalk onto the exit tile to travel.`):'West: Inkwell Road · East: Wordwood · South: Inkwell Village\nWalk onto an exit tile to travel.');
    for(const [id,area] of Object.entries(AREAS)){
      if(Phaser.Math.Distance.Between(this.player.x,this.player.y,area.door.x,area.door.y)>.5)continue;
      const target=id as AreaId;
      if(target!==this.source&&target === 'wordwood' && !isChapterUnlocked(2)) {
        this.hint.setText('Wordwood is not open yet.\nSpeak to Scholar Bellum in the Inkwell Archive.');return;
      }
      if(target!==this.source&&!canTravel(target,getStoryProgress().completedChapters)){
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
