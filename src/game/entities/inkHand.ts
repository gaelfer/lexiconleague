import * as Phaser from 'phaser';
import { inkPalette } from '../pixelAvatar';

/** Same ink as the body, with a shaded lower rim and a small upper-left glint. */
export function createInkHand(scene: Phaser.Scene, x: number, y: number, color: number) {
  const colors=inkPalette(color).map(([r,g,b])=>(r<<16)|(g<<8)|b);
  const g=scene.add.graphics();
  g.fillStyle(colors[0]).fillRect(-3,-5,6,10).fillRect(-5,-3,10,6);
  g.fillStyle(colors[1]).fillRect(-3,-3,7,7);
  g.fillStyle(colors[2]).fillRect(-4,-2,7,4).fillRect(-2,-4,4,7);
  g.fillStyle(colors[3]).fillRect(-3,-2,3,3);
  g.fillStyle(colors[4]).fillRect(-2,-3,2,1);
  return scene.add.container(x,y,[g]);
}

export function createInkFoot(scene:Phaser.Scene,x:number,y:number,color:number){
  const colors=inkPalette(color).map(([r,g,b])=>(r<<16)|(g<<8)|b);
  const g=scene.add.graphics().setPosition(x,y);
  g.fillStyle(colors[0]).fillRect(-4,-4,8,8).fillRect(-6,-2,12,4);
  g.fillStyle(colors[1]).fillRect(-4,-2,9,5);
  g.fillStyle(colors[2]).fillRect(-4,-2,7,3);
  g.fillStyle(colors[3]).fillRect(-3,-3,4,2);
  return g;
}
