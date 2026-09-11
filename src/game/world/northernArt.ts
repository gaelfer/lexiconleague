import type * as Phaser from 'phaser';
import {grassTiles} from './pixelTerrain';
import {foreground} from './foreground';
import {leafCluster} from './InkwellVillage';
import {footDepth} from './footDepth';
export const OUTPOST={x:464,y:336};
/** Open meadow, with perimeter woodland only. No invisible winding corridor. */
export function northernPlain(scene:Phaser.Scene,wall:(x:number,y:number,w:number,h:number)=>void){
 const g=scene.add.graphics().setDepth(-20);grassTiles(g,0,0,960,1536,true);
 for(let y=48;y<1500;y+=96)for(let x=48;x<960;x+=96){if(x>100&&x<850&&y>100&&y<1430)continue;if(y>1400&&Math.abs(x-464)<110)continue;
  wall(x,y,20,18);g.fillStyle(0x614f3a).fillRect(x-6,y-22,12,24);
  foreground(scene,x-44,y-76,88,88,c=>{c.translateCanvas(44-x,76-y);leafCluster(c,x,y-28,38,0x244536,0x648456);});
 }
 // Low wildflower drifts and worn patches, not a route painted through the hub.
 for(let i=0;i<110;i++){const x=144+(i*173)%672,y=480+(i*137)%850;g.fillStyle(i%3?0x91a86b:0xd7c68a).fillRect(x,y,2,3).fillStyle(0x446b42).fillRect(x,y+3,2,3);}
 for(const [x,y]of [[240,752],[752,1072],[176,1168]]){g.fillStyle(0x405947).fillRect(x-20,y-10,40,18).fillStyle(0x8b9980).fillRect(x-18,y-12,32,14).fillStyle(0xbdc3a1).fillRect(x-16,y-12,24,3);wall(x,y,32,16);}
 // A timber watchtower on a square mossy-stone foundation, four visible levels.
 const x=OUTPOST.x,y=OUTPOST.y;
 g.fillStyle(0x20372c,.4).fillRect(x-90,y-10,194,40);
 const tower=foreground(scene,x-128,y-274,256,298,g=>{g.translateCanvas(128-x,274-y);
 for(let row=0;row<3;row++)for(let col=0;col<6;col++)g.fillStyle((col+row)%2?0x637464:0x788675).fillRect(x-96+col*32,y-64+row*24,30,22);
 for(let floor=0;floor<4;floor++){
  const top=y-240+floor*48;
  g.fillStyle(0x332f2b).fillRect(x-64,top,128,48).fillStyle(0x846045).fillRect(x-58,top+4,116,40);
  for(let yy=top+6;yy<top+44;yy+=8)g.fillStyle(0xa27c50).fillRect(x-56,yy,112,2);
  for(const dx of [-60,54])g.fillStyle(0x493b2f).fillRect(x+dx,top,6,48);
  for(const dx of [-32,24])g.fillStyle(0x21342f).fillRect(x+dx,top+10,12,22).fillStyle(0xc4a76b).fillRect(x+dx,top+10,2,22);
  g.fillStyle(0x342f2a).fillRect(x-76,top+40,152,8).fillStyle(0xb18b59).fillRect(x-76,top+40,152,2);
 }
 g.fillStyle(0x243b35).fillRect(x-16,y-28,32,40).fillStyle(0xa58755).fillRect(x-22,y-32,6,44).fillRect(x+16,y-32,6,44);
 foreground(scene,x-88,y-274,176,42,c=>{c.fillStyle(0x273e3b).fillRect(0,30,176,10);for(let r=0;r<5;r++)c.fillStyle(r%2?0x4d6860:0x607b6b).fillRect(16-r*4,r*6,144+r*8,6);});
 // Base is solid; the elevated tower masks actors passing behind it.
 for(const dx of [-112,112]){g.fillStyle(0x684c35).fillRect(x+dx,y-80,6,92).fillStyle(0x927451).fillRect(x+dx-6,y-72,18,3);}
 });
 footDepth(scene,tower,y);wall(x-48,y-8,64,32);wall(x+48,y-8,64,32);
}

export function skeletonTexture(scene:Phaser.Scene){
 if(scene.textures.exists('night-skeleton'))return;
 const g=scene.make.graphics({x:0,y:0});
 const r=(x:number,y:number,w:number,h:number,c:number)=>g.fillStyle(c).fillRect(x*2,y*2,w*2,h*2);
 r(5,1,10,8,0x293a39);r(6,2,8,6,0xd8d1ad);r(7,2,6,1,0xf2e3bb);r(7,4,2,2,0x293a39);r(11,4,2,2,0x293a39);r(9,7,2,1,0x665f50);
 r(9,9,2,7,0xb7b69b);for(const y of [10,12,14])r(6,y,8,1,0xe2d8b3);r(4,10,1,6,0xb7b69b);r(15,10,1,6,0xb7b69b);r(6,16,2,3,0xd8d1ad);r(12,16,2,3,0xd8d1ad);r(5,19,4,1,0x829082);r(11,19,4,1,0x829082);
 g.generateTexture('night-skeleton',40,40);g.destroy();
}
