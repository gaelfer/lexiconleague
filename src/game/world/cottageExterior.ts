import type * as Phaser from 'phaser';

/** Six-tile facade and a deep roof, drawn in native pixels at exactly 2 map units. */
export function buildCottageExterior(scene:Phaser.Scene,x:number,y:number,roof:number,obstacle:(x:number,y:number,w:number,h:number)=>void){
  const bottom=Math.ceil((y+64)/32)*32;
  const g=scene.add.graphics().setPosition(x,bottom).setScale(2).setDepth(2);
  const r=(px:number,py:number,w:number,h:number,c:number)=>g.fillStyle(c).fillRect(px,py,w,h);
  const ink=0x28373b,light=0xe6d1a2,wood=0x694632;
  r(-46,-38,96,40,0x223b36);
  r(-48,-40,96,40,ink);r(-46,-39,92,36,0xc4b58e);r(-46,-39,6,36,light);
  r(39,-38,7,36,0x899077);r(-46,-38,92,5,0x7d7d68);
  for(const bx of [-43,-20,18,40]){r(bx,-34,3,32,wood);r(bx,-34,1,30,0xa67a50);}
  r(-46,-15,92,3,wood);r(-48,-3,96,3,0x596b66);r(-47,-3,94,1,0xb8b69a);
  // Broad trapezoid rather than a pinched triangular facade.
  for(let row=0;row<44;row++){
    const half=32+Math.floor(row/2);
    r(-half,-84+row,half*2,1,ink);
    if(row>1){
      r(-half+2,-84+row,half*2-4,1,row%6===0?0x344c51:roof);
      if(row%6===1)r(-half+3,-84+row,half*2-7,1,0x9b9e85);
      for(let joint=-48+(Math.floor(row/6)%2)*6;joint<48;joint+=12)
        if(joint>-half+3&&joint<half-3)r(joint,-84+row,1,1,0x3d5150);
    }
  }
  r(-54,-40,108,3,ink);r(-51,-40,102,1,0xa3a68b);
  r(-33,-85,66,2,0xb3b397);r(-31,-85,62,1,light);
  // Brick chimney, stone cap and dark flue.
  r(29,-86,11,22,ink);r(30,-84,9,18,0x9b8066);
  for(let cy=-82;cy<-65;cy+=4){r(30,cy,9,1,0xc6ad86);r(cy%8?33:36,cy+1,1,3,0x695d51);}
  r(27,-87,15,3,0xb9b598);r(30,-87,9,1,ink);
  // Recessed double door; one walkable threshold tile below it.
  r(-10,-29,20,27,wood);r(-8,-27,16,25,0x352f2d);r(-7,-26,14,23,0x805c3d);
  for(const dx of [-5,-2,1,4])r(dx,-25,1,22,0x5c4232);
  r(-7,-26,14,1,0xbf9866);r(-7,-10,14,2,0x37443e);r(4,-13,1,2,light);
  r(-12,0,24,3,0x849185);r(-12,0,24,1,light);
  for(const wx of [-35,25]){
    r(wx,-31,12,17,wood);r(wx+1,-30,10,14,ink);r(wx+2,-29,8,12,0xc1b57e);
    r(wx+2,-29,3,11,0xf0dda4);r(wx+6,-29,1,12,wood);r(wx+2,-24,8,1,wood);
    r(wx-2,-16,16,3,wood);r(wx-2,-16,16,1,0xb99564);
  }
  obstacle(x,bottom-64,192,128);
}
