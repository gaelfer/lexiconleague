import type * as Phaser from 'phaser';
import {foreground} from './foreground';
import { grassTiles,villagePaths } from './pixelTerrain';
import { leafCluster } from './InkwellVillage';
import { drawGatehouse } from './gatehouse';
import { buildCottageExterior } from './cottageExterior';
import { ROAD_PATHS,ROAD_CLEARINGS,roadWalkableTile } from '../story/roadPlan';

/** A crossing, survey camp, abandoned orchard and a sheltered village approach. */
export function buildInkwellApproach(scene:Phaser.Scene,obstacle:(x:number,y:number,w:number,h:number)=>void){
  const ground=scene.add.graphics().setDepth(-20);
  const props=scene.add.graphics().setDepth(1);
  const r=(x:number,y:number,w:number,h:number,c:number)=>props.fillStyle(c).fillRect(x,y,w,h);
  grassTiles(ground,0,0,3200,600);
  for(const [x,y,w,h] of ROAD_CLEARINGS){
    for(let sy=y;sy<y+h;sy+=32)for(let sx=x;sx<x+w;sx+=32)
      if((sx/32+sy/32)%5===0)ground.fillStyle(0x446449).fillRect(sx+4,sy+6,12,2);
  }
  villagePaths(ground,ROAD_PATHS.map(rect=>[...rect]));
  // Deep forest pockets bend around the route rather than repeating two tree rows.
  const tree=(x:number,y:number,fruit=false)=>{
    ground.fillStyle(0x203e34).fillEllipse(x+8,y+13,68,26);
    r(x-6,y-22,12,36,0x493f32);r(x-4,y-20,3,30,0x95734b);
    foreground(scene,x-40,y-76,80,80,canopy=>{
      canopy.translateCanvas(40-x,76-y);
      leafCluster(canopy,x,y-35,35,0x1c3b32,fruit?0x6d8051:0x426746);
      leafCluster(canopy,x-12,y-48,23,0x365b40,fruit?0x99a468:0x718b59);
      if(fruit)for(const [dx,dy] of [[-18,-31],[12,-46],[20,-22]]){canopy.fillStyle(0xa56449).fillRect(x+dx,y+dy,5,5);canopy.fillStyle(0xe2b47d).fillRect(x+dx,y+dy,2,2);}
    });
    obstacle(x,y,32,32);
  };
  for(let y=80;y<592;y+=64)for(let x=48;x<3184;x+=64){
    if(x < 320 && y < 256)continue;
    if(x>=480&&x<=672)continue;
    if([800,1600,2400].some(gate=>Math.abs(x-gate)<64))continue;
    if(roadWalkableTile(x,y)||roadWalkableTile(x-32,y)||roadWalkableTile(x+32,y)||roadWalkableTile(x,y+32))continue;
    if((x/16+y/16)%5===0&&y>112&&y<496)continue;
    tree(x,y);
  }
  const fence=(x:number,y:number,length:number)=>{
    r(x,y,length,5,0x624b37);r(x,y,length,2,0xb4996c);r(x,y+12,length,4,0x6e553e);
    for(let px=x;px<=x+length;px+=24){r(px,y-5,6,27,0x423e31);r(px,y-5,2,24,0xbda67a);}
  };
  villagePaths(ground,[[192,224,32,96]]);
  buildCottageExterior(scene,208,144,0x536e6a,obstacle);
  // Slate riverbanks, reeds and a broad timber crossing.
  ground.fillStyle(0x223e4c).fillRect(512,32,128,536);
  ground.fillStyle(0x365f6b).fillRect(522,32,108,536);
  for(let y=40;y<568;y+=16){
    ground.fillStyle(y%32?0x62888a:0x436e7a).fillRect(532+(y%48),y,38,2);
    for(const x of [496,640]){
      r(x,y,16,16,0x4f6058);r(x+2,y,12,3,0x9aab8e);r(x+2,y+12,10,2,0x384b46);
      if(y%48===8){r(x-4,y+2,2,14,0x82965f);r(x+4,y-2,2,15,0xb2b27c);}
    }
  }
  r(480,256,192,96,0x383b33);
  for(let x=480;x<672;x+=12){r(x,260,10,86,0xa08055);r(x,260,2,86,0xd0b47b);r(x+8,264,2,80,0x735b41);}
  for(const y of [250,346]){
    r(472,y,208,6,0x594736);r(472,y,208,2,0xc4a572);
    for(const x of [480,528,624,672]){r(x,y-8,8,22,0x413b32);r(x,y-8,6,3,0xb8a47a);}
  }
  obstacle(576,144,128,224);obstacle(576,464,128,224);
  fence(144,400,192);
  // Empty roadside rest stop tells a small story without duplicating town houses.
  for(const [x,y,key] of [[176,384,'barrel'],[368,208,'chest'],[1136,304,'barrel'],[1200,304,'desk'],[1264,304,'chest'],[1968,368,'barrel']] as const){
    scene.add.image(x,y,`interior-${key}`).setDisplaySize(32,32).setDepth(2);obstacle(x,y,32,32);
  }
  // Stitched canvas awning: an open survey shelter, with warm timber framing.
  r(1072,270,224,48,0x2c4337);
  for(const x of [1088,1272]){r(x,232,6,80,0x5f4736);r(x,232,2,76,0xbe9a67);}
  for(let row=0;row<48;row+=2){
    const half=40+row;r(1184-half,192+row,half*2,2,0xc3b68b);
    r(1184,192+row,half,2,0x8d997b);
    if(row%12===0)r(1184-half,192+row,half*2,2,0xe0cda1);
  }
  r(1094,240,182,6,0x7b7557);
  fence(1088,368,160);
  // The third section curls around the remains of a kitchen orchard.
  for(const x of [1840,1936,2032])tree(x,304,true);
  fence(1824,208,256);
  r(1888,352,128,8,0x536451);r(1892,352,120,2,0x99a384);
  for(let x=1888;x<2016;x+=32){r(x,360,28,12,0x697861);r(x+2,360,24,2,0xa2ab87);}
  for(const [x,y] of [[1904,400],[2000,400],[2064,400]]){r(x,y,8,2,0x8c9967);r(x+2,y-4,2,8,0xaeb477);}
  // Gate boundaries are visibly wooded, matching the existing question barriers.
  for(const x of [800,1600,2400])for(const y of [64,128,192,416,480,544]){
    r(x-16,y-16,32,32,0x40584b);r(x-14,y-16,28,4,0x8b9978);
    leafCluster(props,x-18,y-12,24,0x203e34,0x5e7950);
  }
  // Last clearing: broken waystones lead past travellers to the open gatehouse.
  for(const [x,y] of [[2512,384],[2720,384],[2864,384]]){
    r(x-12,y-24,24,36,0x435b53);r(x-10,y-22,20,30,0x81937c);r(x-8,y-22,16,3,0xc4c3a0);
    r(x-4,y-12,8,2,0x50685d);r(x-2,y-8,4,8,0x50685d);
  }
  fence(2848,464,256);
  for(const x of [2960,3120]){
    r(x,312,4,50,0x67513a);r(x-5,308,14,18,0x31413b);r(x-3,310,10,12,0xe5c997);r(x-3,310,3,12,0xffe7b8);
  }
  drawGatehouse(scene,3056,304,obstacle);
}
