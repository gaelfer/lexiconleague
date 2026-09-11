import * as Phaser from 'phaser';
import { inkPalette } from '../pixelAvatar';

/** Same ink as the body, with a shaded lower rim and a small upper-left glint. */
export function createInkHand(scene: Phaser.Scene, x: number, y: number, color: number) {
  const colors=inkPalette(color).map(([r,g,b])=>(r<<16)|(g<<8)|b);
  const g=scene.add.graphics();
  g.fillStyle(colors[0]).fillRect(-4,-6,8,12).fillRect(-6,-4,12,8);
  g.fillStyle(colors[1]).fillRect(-4,-4,8,8);
  g.fillStyle(colors[2]).fillRect(-4,-2,8,4).fillRect(-2,-4,4,8);
  g.fillStyle(colors[3]).fillRect(-4,-2,4,2);
  g.fillStyle(colors[4]).fillRect(-2,-4,2,2);
  return scene.add.container(x,y,[g]);
}

export function createInkFoot(scene:Phaser.Scene,x:number,y:number,color:number){
  const colors=inkPalette(color).map(([r,g,b])=>(r<<16)|(g<<8)|b);
  const g=scene.add.graphics().setPosition(x,y);
  g.fillStyle(colors[0]).fillRect(-4,-4,8,8).fillRect(-6,-2,12,4);
  g.fillStyle(colors[1]).fillRect(-4,-2,8,4);
  g.fillStyle(colors[2]).fillRect(-4,-2,6,2);
  g.fillStyle(colors[3]).fillRect(-2,-2,2,2);
  return g;
}
