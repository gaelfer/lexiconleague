import type * as Phaser from 'phaser';
import {foreground} from './foreground';
import { leafCluster } from './InkwellVillage';

/** Authored landmarks and quiet forest texture; no noise on the readable walking lanes. */
export function wordwoodDetails(scene:Phaser.Scene,obstacle:(x:number,y:number,w:number,h:number)=>void){
  const g=scene.add.graphics().setDepth(-15);
  for(const [cx,cy] of [[464,176],[1056,176],[480,496],[1088,496],[432,720],[1120,720],[560,1008],[1072,1040]]){
    for(const [dx,dy] of [[-32,-16],[32,0],[0,32]]){
      g.fillStyle(0x294331).fillRect(cx+dx-6,cy+dy,12,28);
      foreground(scene,cx+dx-32,cy+dy-52,64,64,canopy=>{
        canopy.translateCanvas(32-cx-dx,52-cy-dy);
        leafCluster(canopy,cx+dx,cy+dy-18,28,0x1d4233,0x507349);
        leafCluster(canopy,cx+dx-8,cy+dy-29,18,0x426942,0x819662);
      });
      obstacle(cx+dx,cy+dy+16,32,32);
    }
  }
  // Ferns, mushrooms and old roots arranged in small clusters rather than uniform speckles.
  for(const [x,y] of [[336,368],[592,384],[944,384],[1216,368],[352,768],[592,752],[976,816],[1216,832],[688,1008],[912,1008]]){
    for(let i=0;i<3;i++){
      const px=x+i*9,py=y+(i%2)*8;
      g.fillStyle(0x335c43).fillRect(px,py,3,11).fillRect(px-4,py+2,11,3);
      g.fillStyle(0x88996a).fillRect(px-3,py+1,4,2);
    }
    g.fillStyle(0xc3b08b).fillRect(x+27,y+15,3,7);
    g.fillStyle(0xa77965).fillRect(x+23,y+12,11,4);
    g.fillStyle(0xe0c49a).fillRect(x+25,y+12,3,1);
  }
  // Northern sanctuary terraces and masonry establish a destination above the forest loop.
  g.fillStyle(0x506c61).fillRect(704,32,192,96);
  for(let y=32;y<128;y+=32)for(let x=704;x<896;x+=32){
    g.fillStyle(0x8c9b82).fillRect(x+1,y+1,30,30);g.fillStyle(0xc8caaa).fillRect(x+2,y+1,28,2);
  }
  scene.add.image(784,48,'interior-tablet').setDisplaySize(32,32).setOrigin(0).setDepth(2);
  // Fireflies: restrained movement, confined to foliage away from clue text.
  for(const [x,y] of [[448,384],[1136,400],[496,752],[1152,784]]){
    const light=scene.add.rectangle(x,y,2,2,0xd9ddb0,0.7).setDepth(3);
    scene.tweens.add({targets:light,y:y-12,alpha:0.2,duration:1800+x,yoyo:true,repeat:-1});
  }
}
