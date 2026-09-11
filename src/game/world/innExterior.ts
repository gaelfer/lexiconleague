import type * as Phaser from 'phaser';
import {drawDoorLeaves} from './doorOpening';

/** Two timber floors, broad slate roof, and a wall-mounted hanging inn sign. */
export function buildInnExterior(scene:Phaser.Scene,x:number,y:number,obstacle:(x:number,y:number,w:number,h:number)=>void){
  const bottom=Math.ceil((y+64)/32)*32;
  const g=scene.add.graphics().setPosition(x,bottom).setScale(2).setDepth(2);
  const r=(x:number,y:number,w:number,h:number,c:number)=>g.fillStyle(c).fillRect(x,y,w,h);
  const ink=0x29393b,wood=0x68503c;
  r(-60,-76,124,80,0x254139);r(-64,-80,128,80,ink);
  r(-62,-78,124,76,0xc1b18a);r(-62,-78,5,76,0xe0cda2);r(55,-78,7,76,0x8f9279);
  for(const by of [-78,-42,-4]){r(-62,by,124,4,wood);r(-60,by,120,1,0xa68c63);}
  for(const bx of [-60,-22,20,57]){r(bx,-76,3,72,wood);r(bx,-76,1,70,0xab8b62);}
  for(const wy of [-70,-34])for(const wx of [-48,32]){
    r(wx,wy,16,23,wood);r(wx+2,wy+2,12,18,ink);
    r(wx+3,wy+3,10,16,0xbfb788);r(wx+3,wy+3,4,16,0xf0dba1);
    r(wx+7,wy+3,1,17,wood);r(wx+3,wy+10,10,1,wood);
    r(wx-2,wy+21,20,3,wood);r(wx-2,wy+21,20,1,0xc4a67a);
  }
  for(let row=0;row<38;row++){
    const half=49+Math.floor(row/2);r(-half,-118+row,half*2,1,ink);
    if(row>1){r(-half+2,-118+row,half*2-4,1,row%6===0?0x3c5558:0x647a75);
      if(row%6===1)r(-half+3,-118+row,half*2-6,1,0x9da78c);
      for(let joint=-60+(Math.floor(row/6)%2)*6;joint<60;joint+=12)if(Math.abs(joint)<half-3)r(joint,-118+row,1,1,0x354c4e);}
  }
  r(-50,-120,100,2,0xc4bc94);r(-68,-81,136,4,ink);r(-66,-81,132,1,0xabb092);
  r(-12,-30,24,30,wood);r(-10,-28,20,28,ink);r(-8,-26,16,26,0x876345);
  for(let dx=-6;dx<8;dx+=4)r(dx,-26,1,25,0x594433);
  r(-8,-26,16,2,0xc2a078);r(4,-14,2,3,0xe5cc8f);r(-14,0,28,3,0x939b88);
  r(-14,0,28,1,0xd8cfaa);
  // Iron bracket and two chain links attach the sign outside the window bays.
  r(59,-60,3,17,ink);r(59,-60,35,3,ink);r(60,-60,33,1,0x81918a);
  for(let i=0;i<8;i++)r(62+i,-48-i,2,2,ink);
  for(const sx of [71,88]){r(sx,-57,2,8,ink);r(sx,-56,1,5,0x9b9e87);}
  r(66,-49,28,16,ink);r(67,-48,26,14,wood);
  r(68,-47,24,12,0x795c40);r(67,-48,26,1,0xc3a477);r(68,-35,24,1,0x473c30);
  // Hand-painted native pixel letters stay sharp with the rest of the façade.
  const letters=[['11111','00100','00100','00100','00100','00100','11111'],
    ['10001','11001','11001','10101','10011','10011','10001']];
  [letters[0],letters[1],letters[1]].forEach((glyph,index)=>glyph.forEach((row,gy)=>{
    [...row].forEach((pixel,gx)=>{if(pixel==='1')r(71+index*6+gx,-44+gy,1,1,0xf0ddb0);});
  }));
  drawDoorLeaves(scene,x,bottom,'inn');
  obstacle(x,bottom-80,256,160);
}
