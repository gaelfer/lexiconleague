import * as Phaser from 'phaser';
import type {InteriorPalette} from '../story/interiorPlans';

/** Preserve the awake 32×64 body scale; the quilt occludes, never shrinks, it. */
export function sleepingInkling(scene:Phaser.Scene,x:number,y:number,color:number,palette:InteriorPalette,baseKey='player-base',quilt=`bed-head-${palette}`){
  const key=`sleeping-full-size-${baseKey}-${color}`;
  if(!scene.textures.exists(key)){
    const texture=scene.textures.createCanvas(key,32,64)!;
    const ctx=texture.context;
    ctx.imageSmoothingEnabled=false;
    // Hide only the covered portion, keeping the actual body and its markings.
    ctx.drawImage(scene.textures.get(baseKey).getSourceImage() as CanvasImageSource,0,0,32,40,0,0,32,40);
    ctx.fillStyle=((color>>16&255)+(color>>8&255)+(color&255))<180?'#cbd3cd':'#202a33';
    ctx.fillRect(8,32,6,2);ctx.fillRect(20,32,6,2);
    texture.refresh();texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  const head=scene.add.image(0,0,key).setDisplaySize(32,64);
  // Character compositor routes containers through the world camera.
  const rig=scene.add.container(x+16,y+12,[head]).setDepth(20);
  const cover=scene.add.image(x,y,`interior-${quilt}`).setOrigin(0).setDisplaySize(32,32).setCrop(quilt.endsWith('right')?0:3,10,quilt.startsWith('double-')?13:10,6).setDepth(21);
  return {destroy:()=>{rig.destroy();cover.destroy();}};
}
