import type * as Phaser from 'phaser';
import type { AreaId } from '../story/areaTravel';

/** Door is the interaction point; the single aligned body ends one tile above it. */
export function drawGatehouse(scene:Phaser.Scene,x:number,y:number,obstacle:(x:number,y:number,w:number,h:number)=>void){
  const g=scene.add.graphics().setPosition(x,y).setScale(2).setDepth(2);
  const r=(a:number,b:number,w:number,h:number,c:number)=>g.fillStyle(c).fillRect(a,b,w,h);
  const ink=0x293a40,stone=0xb9b296,light=0xe0cea3,wood=0x72523c;
  r(-32,-48,64,40,ink);r(-30,-46,60,37,stone);r(26,-45,4,36,0x879080);
  for(let dy=-44;dy<-10;dy+=8){r(-30,dy,60,1,light);for(let dx=-26;dx<28;dx+=16)r(dx+(dy%16?4:0),dy+1,1,6,0x879080);}
  for(let row=0;row<24;row++){
    const half=16+row;r(-half,-72+row,half*2,1,ink);
    r(-half+2,-72+row,half*2-4,1,row%6===0?0x91a29b:row%6===5?0x354b55:0x526e76);
    for(let joint=-32+(Math.floor(row/6)%2)*6;joint<32;joint+=12)if(Math.abs(joint)<half-2)r(joint,-72+row,1,1,0x354b55);
  }
  r(-17,-73,34,2,light);r(-40,-48,80,3,ink);r(-37,-48,74,1,0x9da991);
  for(const px of [-30,27]){r(px,-44,3,35,wood);r(px,-44,1,34,0xc29b69);}
  // Open passage, inset jambs and threshold read as a walk-through lodge.
  r(-12,-38,24,30,wood);r(-10,-36,20,28,0x17292c);r(-8,-34,16,26,0x102125);
  r(-13,-40,26,3,light);r(-13,-37,2,29,0x9b977e);r(11,-37,2,29,0x697f74);
  for(const wx of [-25,18]){r(wx,-35,8,13,ink);r(wx+1,-34,6,10,0xddc18a);r(wx+3,-34,1,10,wood);r(wx,-23,8,2,wood);}
  for(let sy=-8;sy<0;sy+=4){r(-12,sy,24,4,0x839285);r(-12,sy,24,1,light);}
  obstacle(x,y-64,128,96);
}

export function enterGatehouse(scene:Phaser.Scene,source:AreaId){
  scene.scene.pause();
  scene.scene.launch('GatehouseScene',{source,parent:scene.scene.key});
}
