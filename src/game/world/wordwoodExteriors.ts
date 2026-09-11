import type * as Phaser from 'phaser';
import {foreground} from './foreground';
import {drawDoorLeaves} from './doorOpening';

/** Projected roofs are overhead; the existing tile-aligned footprint stays authoritative. */
export function wordwoodExterior(scene:Phaser.Scene,kind:string,x:number,y:number){
  const g=scene.add.graphics().setDepth(1);
  const r=(a:number,b:number,w:number,h:number,c:number)=>g.fillStyle(c).fillRect(x+a,y+b,w,h);
  const hall=kind==='hall',gallery=kind==='gallery',store=kind==='store';
  const stone=hall||gallery||store;
  if(gallery||store){
    // Low ruined stone vaults: recessed open portals, buttresses and broken coping.
    r(-72,-12,152,16,0x193330);
    r(-64,-88,128,72,store?0x647863:0x658185);
    for(let yy=-86;yy<-16;yy+=14){
      r(-62,yy,124,2,store?0xa7b292:0xb0c1b8);
      for(let xx=-62;xx<60;xx+=28)r(xx+(yy%28?12:0),yy+2,2,12,0x3e5754);
    }
    for(const a of [-66,48]){r(a,-100,18,84,0x405952);r(a,-100,4,80,0xa3b39b);r(a-4,-104,26,6,0xb6bba2);}
    r(-22,-64,44,48,0x102a2d);r(-16,-76,32,12,0x102a2d);
    r(-28,-66,6,50,0xaab29b);r(22,-66,6,50,0x687c70);r(-20,-80,40,6,0xc0c4a9);
    r(-24,-16,48,6,0x859786);r(-24,-16,48,2,0xc5c7a6);
    for(const a of [-42,34]){r(a,-65,8,27,0x283f3e);r(a,-65,2,24,0x93a89b);}
    foreground(scene,x-72,y-116,144,30,roof=>{
      roof.fillStyle(0x405952).fillRect(0,10,144,20);
      roof.fillStyle(0xa8b59c).fillRect(0,10,144,4);
      for(const a of [0,28,88,116]){roof.fillStyle(0x738b79).fillRect(a,0,24,12);roof.fillStyle(0xc2c6a7).fillRect(a,0,24,2);}
      roof.fillStyle(store?0x617d47:0x517d73).fillRect(4,20,32,6).fillRect(98,18,34,8);
    });
    if(gallery){for(const a of [-36,36]){r(a,-36,2,12,0x9cc0b4);r(a-3,-24,8,2,0x698e8c);}}
    else{for(const a of [-56,44]){r(a,-32,12,5,0x82925f);r(a+4,-27,3,9,0x4b653e);}}
    return;
  }
  r(-72,-12,152,18,0x183530);
  r(-64,-88,128,72,stone?(gallery?0x8b9d9b:0x75877e):0x8d694a);
  for(let yy=-84;yy<-18;yy+=12){
    r(-62,yy,124,2,stone?0xb8bfaa:0xb29467);
    if(stone)for(let xx=-60;xx<60;xx+=24)r(xx+(yy%24?8:0),yy,2,12,0x4b6661);
  }
  for(const a of [-64,-22,20,60]){r(a,-86,stone?8:4,70,stone?0x485e59:0x503f33);r(a,-86,2,68,stone?0xa4ac92:0xc4a575);}
  r(-18,-66,36,50,0x152b29);r(-22,-70,44,4,0xd0c19a);
  r(-18,-16,36,8,0x8c9883);r(-18,-16,36,2,0xd1c7a3);
  if(!hall)drawDoorLeaves(scene,x,y-16,'cottage');
  if(gallery){
    for(const a of [-54,30]){r(a,-74,24,38,0x3d5c60);r(a+2,-72,20,32,0x8ea9a1);r(a+3,-71,8,13,0xd5d6b0);r(a+11,-73,2,35,0x576658);r(a,-55,24,2,0x576658);}
    r(-68,-26,8,12,0x667a73);r(-66,-82,4,56,0xb0b495);
  }else if(store){
    for(const a of [-52,32]){r(a,-62,18,24,0x3c4936);r(a+2,-60,14,20,0x748158);r(a+4,-60,2,18,0xb7b58b);}
    for(const a of [-56,44]){r(a,-30,12,12,0x384e37);r(a+2,-30,8,4,0x92a06a);}
  }else if(!hall){
    r(-56,-59,28,22,0x263c3c);r(-54,-57,24,18,0xd2bb84);r(-44,-57,3,18,0x72543b);
    r(30,-60,24,28,0x4c4235);for(let a=32;a<52;a+=6)r(a,-57,2,20,0xa8a282);
    r(-56,-28,28,4,0xd0ab72);r(-56,-24,28,5,0x60452f);
  }else{
    for(const a of [-64,48]){r(a,-108,16,92,0x4b6661);r(a,-108,4,90,0xa4b198);r(a-4,-110,24,6,0xc1c5a6);}
    r(-14,-94,28,20,0x344e51);r(-10,-90,8,12,0xc6c6a0);r(2,-90,8,12,0x98ae9c);
    r(-2,-89,2,12,0x445f58);
  }
  foreground(scene,x-76,y-(hall?168:136),152,72,roof=>{
    const rr=(a:number,b:number,w:number,h:number,c:number)=>roof.fillStyle(c).fillRect(a,b,w,h);
    const base=store?0x536a42:gallery?0x45696a:hall?0x384d56:0x654e42;
    for(let row=0;row<8;row++){
      const inset=hall?Math.max(0,56-row*8):store?Math.max(0,32-row*5):Math.max(0,48-row*8);
      rr(inset,8+row*7,152-inset*2,9,base);
      rr(inset,8+row*7,152-inset*2,2,store?0x9ba376:gallery?0x91aca1:hall?0x84968c:0xad8761);
      for(let col=inset+12+(row%2)*8;col<148-inset;col+=24)rr(col,10+row*7,2,5,0x34473f);
    }
    rr(0,64,152,6,0x2e4037);rr(2,64,148,2,0xb3ad84);
    if(gallery){rr(58,14,36,33,0x304d53);rr(62,17,28,26,0x8ea9a2);rr(74,17,3,26,0xc7c7a6);rr(62,29,28,3,0x4e6a62);}
    if(!hall&&!store&&!gallery){rr(118,0,16,35,0x59695e);rr(116,0,20,5,0xb3b092);}
    if(store){for(const a of [12,36,108]){rr(a,48,20,6,0x738953);rr(a+4,46,8,2,0xb0b783);}}
  });
}
