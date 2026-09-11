import type * as Phaser from 'phaser';
import {APPROACH_RIVER,APPROACH_BRIDGE as bridge,approachRiverDistance} from '../story/wordwoodApproach';
import {wordwoodStream} from './wordwoodStream';
export function wordwoodApproachRiver(scene:Phaser.Scene,g:Phaser.GameObjects.Graphics,obstacle:(x:number,y:number,w:number,h:number)=>void){
 const onBridge=(x:number,y:number)=>x>=bridge.x&&x<bridge.x+bridge.width&&y>=bridge.y&&y<bridge.y+bridge.height;
 wordwoodStream(scene,g,{points:APPROACH_RIVER,covered:onBridge,name:'approach-river-current'});
 for(let y=1328;y<2224;y+=32)for(let x=16;x<1600;x+=32)if(approachRiverDistance(x,y)<40&&!onBridge(x,y))obstacle(x,y,32,32);
 const deck=scene.add.graphics().setDepth(-18);
 deck.fillStyle(0x344a40).fillRect(bridge.x-6,bridge.y+8,bridge.width+18,bridge.height);
 for(let y=bridge.y;y<bridge.y+bridge.height;y+=16){
  deck.fillStyle(0x6b5037).fillRect(bridge.x,y,bridge.width,16);
  deck.fillStyle(0xa18456).fillRect(bridge.x+2,y+2,bridge.width-4,12);
  deck.fillStyle(0xc8ad77).fillRect(bridge.x+2,y+2,bridge.width-6,2);
  deck.fillStyle(0x735b3f).fillRect(bridge.x+16+(y%32),y+6,28,2);
 }
 for(const x of [bridge.x,bridge.x+bridge.width-4]){
  deck.fillStyle(0x4c4634).fillRect(x,bridge.y,4,bridge.height);deck.fillStyle(0xb5a171).fillRect(x,bridge.y,2,bridge.height);
  for(let y=bridge.y;y<=bridge.y+bridge.height;y+=64){deck.fillStyle(0x554b35).fillRect(x-2,y-8,8,12);deck.fillStyle(0xc7b283).fillRect(x-2,y-8,8,3);}
 }
}
