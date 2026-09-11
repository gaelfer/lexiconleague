import type * as Phaser from 'phaser';
import type {BuildingSign} from '../story/buildingSigns';

/** A wall-mounted plaque, with no post or additional ground collision. */
export function drawBuildingSign(scene:Phaser.Scene,sign:BuildingSign){
  const g=scene.add.graphics().setPosition(sign.x,sign.mountY).setDepth(3);
  const r=(x:number,y:number,w:number,h:number,c:number)=>g.fillStyle(c).fillRect(x,y,w,h);
  r(-11,-7,24,18,0x534b39);
  r(-12,-8,24,16,0x29383b);r(-10,-6,20,12,0x8d704d);
  r(-10,-6,20,2,0xd3b783);r(-10,4,20,2,0x574632);
  for(const [x,y,w] of [[-6,-2,12],[-6,2,5],[2,2,4]])r(x,y,w,1,0x4c4336);
  r(-10,-4,1,1,0xd9c28e);r(9,-4,1,1,0xd9c28e);
}
