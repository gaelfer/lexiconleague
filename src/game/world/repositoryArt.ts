import * as Phaser from 'phaser';
import {ROOM_EXITS,expedition,type RepositoryRoom,type RoomExit} from '../story/repository';
import {foreground} from './foreground';

/** Existing native 16px masonry/furniture kit, layered individually at 2x. */
export function repositoryArt(scene:Phaser.Scene,room:RepositoryRoom,wall:(x:number,y:number,w:number,h:number)=>void){
  const layers:{image:Phaser.GameObjects.Image;foot:number}[]=[];
  const tile=(name:string,x:number,y:number,depth=-10)=>scene.add.image(x,y,`interior-${name}`).setDisplaySize(32,32).setOrigin(0).setDepth(depth);
  const g=scene.add.graphics().setDepth(-22);
  g.fillStyle(0x101d23).fillRect(120,72,560,464);
  const floor=scene.add.graphics().setDepth(-20);
  const timber=room==='maintenance';
  const gallery=room==='gallery';
  const store=room==='store';
  for(let y=160;y<480;y+=32)for(let x=160;x<640;x+=32){
    const n=(x/32*7+y/32*13)%7;
    const base=gallery?0x647f7e:store?0x65715a:0x667674;
    floor.fillStyle(base).fillRect(x,y,32,32);
    // Broad worn slabs, not a bright checkerboard of individual tiles.
    floor.fillStyle(gallery?0x748e89:store?0x778066:0x7d8980).fillRect(x,y+2,32,28);
    floor.fillStyle(gallery?0x526d70:store?0x55614e:0x526565).fillRect(x,y+30,32,2);
    if((x/32+y/32)%2===0)floor.fillRect(x,y+2,2,28);
    if(n===3)floor.fillStyle(base).fillRect(x+20,y+22,8,2).fillRect(x+18,y+24,4,2);
    if(timber)tile('floor',x,y,-19);
  }
  // A thick, legible rear wall with buttresses; darker sides frame the floor.
  for(let x=160;x<640;x+=32)for(let y=96;y<160;y+=32)tile(timber?(x%96===0?'beam':'wall'):'stone',x,y,-15).setTint(timber?0xffffff:gallery?0xa5c5c1:store?0x99ab87:y===96?0x788e88:0xaebcb0);
  for(const x of [144,640]){
    g.fillStyle(0x293d40).fillRect(x,96,16,400);
    g.fillStyle(0x71867d).fillRect(x,96,4,400);
  }
  for(const x of [160,320,448,608]){
    for(let y=96;y<160;y+=32)tile(timber?'beam':'stone',x,y,-12).setTint(timber?0xffffff:0x78877c);
    g.fillStyle(0x233735).fillRect(x+28,98,4,62);
    g.fillStyle(0xc1c4a2).fillRect(x,96,30,4);
  }
  g.fillStyle(0x142a29,.6).fillRect(160,160,480,8).fillRect(160,472,480,8);
  // Open archways, not a mismatched house door pasted into a dungeon wall.
  const doors=scene.add.graphics().setDepth(-5);
  const exits=new Set<RoomExit>(ROOM_EXITS[room]);
  for(const [direction,x,y,w,h] of [['north',384,96,32,64],['west',160,320,32,32],['east',608,320,32,32],['south',384,464,32,32]] as const){
    const open=exits.has(direction);
    if(!open)continue;
    doors.fillStyle(0x112024).fillRect(x,y,w,h);
    doors.fillStyle(0x61756b).fillRect(x-8,y,8,h).fillRect(x+w,y,8,h);
    doors.fillStyle(0xaab49c).fillRect(x-6,y,2,h).fillRect(x+w,y,2,h);
    doors.fillStyle(0xd1c7a1).fillRect(x-8,y,w+16,4);
    doors.fillStyle(0x839080).fillRect(x,y+h-6,w,6);
    doors.fillStyle(0xb7bea5).fillRect(x,y+h-6,w,2);
  }
  if(!exits.has('north'))wall(400,144,32,32);
  if(!exits.has('west'))wall(144,336,32,32);
  if(!exits.has('east'))wall(656,336,32,32);
  if(!exits.has('south'))wall(400,496,32,32);
  // Collisions share exact tile edges; portals are the only gaps.
  wall(272,144,224,32);wall(528,144,224,32);
  wall(272,496,224,32);wall(528,496,224,32);
  wall(144,240,32,160);wall(144,416,32,128);
  wall(656,240,32,160);wall(656,416,32,128);
  const prop=(asset:string,x:number,y:number)=>{
    const image=tile(asset,x,y,2);
    layers.push({image,foot:y+(asset.startsWith('bed-head')?64:32)});
    scene.add.rectangle(x+20,y+29,28,10,0x172d30,.35).setDepth(-6);
    wall(x+16,y+16,32,32);
  };
  // Solid wall returns shape alcoves and remove unused corners. The vertical
  // face is also an occluder, sharing the pillars' foreground mask.
  const mass=(x:number,y:number,w:number,h:number,wood=false)=>{
    const face=foreground(scene,x,y-32,w,h+32,art=>{
      art.fillStyle(0x172b2c).fillRect(0,0,w,h+32);
      art.fillStyle(wood?0x72533c:store?0x4d5e46:0x435b59).fillRect(0,0,w,h);
      for(let yy=0;yy<h;yy+=16){
        art.fillStyle(wood?0x9c7954:store?0x81916b:0x6c8277).fillRect(2,yy+2,w-4,2);
        for(let xx=(yy%32?16:0);xx<w;xx+=32)art.fillStyle(wood?0x513e31:0x334c4d).fillRect(xx,yy+4,2,12);
      }
      art.fillStyle(wood?0x553d31:store?0x344732:0x2a4344).fillRect(0,h,w,32);
      art.fillStyle(wood?0xc09b68:0x9caa90).fillRect(0,h,w,4);
      art.fillStyle(0x12282a).fillRect(0,h+28,w,4);
    });layers.push({image:face,foot:y+h});wall(x+w/2,y+h/2,w,h);
  };
  const channel=(x:number,y:number,w:number,h:number)=>{
    const water=scene.add.graphics().setDepth(-9);
    water.fillStyle(0x203d47).fillRect(x,y,w,h);
    water.fillStyle(0x3b6471).fillRect(x+4,y+4,w-8,h-8);
    for(let yy=y+10;yy<y+h-4;yy+=20)water.fillStyle(0x7baca8).fillRect(x+8,yy,w-16,2);
    water.fillStyle(0xa2ac94).fillRect(x,y,3,h);
    wall(x+w/2,y+h/2,w,h);
  };
  const lights=gallery?[[256,192],[512,192]]:timber?[[192,192],[512,352]]:store?[[288,192],[576,416]]:[[288,192],[480,192]];
  for(const [x,y] of lights){
    prop('candles',x,y);
    scene.add.ellipse(x+16,y+14,54,32,0xe0c18b,.045).setDepth(1);
  }
  if(room==='records'){
    for(const x of [160,576]){mass(x,160,64,128);mass(x,384,64,96);}
    for(const y of [192,224,384,416])for(const x of [224,256,512,544])prop('shelf',x,y);
    prop('lectern',384,224);
  }else if(room==='gallery'){
    // A long hydraulic gallery: stone wings, twin channels and a dry shooting walk.
    mass(160,160,64,320);mass(576,160,64,320);
    channel(288,192,32,224);channel(480,192,32,224);
    for(const x of [224,544]){prop('rain-cascade-top',x,224);prop('rain-cascade-basin',x,256);}
    for(const x of [256,512])tile('rain-relief',x,112,-11);
    for(const x of [224,256,512,544])prop('gallery-bench',x,448);
    prop('rain-collector',256,352);prop('rain-collector',512,352);
    prop('gallery-lectern',384,224);
    for(let y=288;y<448;y+=32)for(const x of [352,384,416])tile('rug-mc-teal',x,y,-18);
  }else if(room==='store'){
    mass(160,160,96,64);mass(544,160,96,64);
    mass(160,416,128,64);mass(576,288,64,32);
    prop('seedling-rack',608,352);prop('seed-bin',608,384);
    // A working potting bay opposite the sealed apothecary cabinet.
    for(const x of [192,224,256])for(const y of [384,416])tile('rug-mc-moss',x,y,-18);
    prop('seedling-rack',544,384);prop('seed-sacks',576,384);
    prop('garden-spades',608,256);
    prop('potting-tray',192,384);prop('root-basket',224,384);
    prop('barrel',576,448);
    for(const x of [192,224])prop('potting-tray',x,256);
    for(const x of [544,576])prop('root-basket',x,256);
    for(const x of [192,224,256,512,544])prop(x===224||x===544?'seed-sacks':'seed-bin',x,224);
    prop('drying-herbs',544,416);
    for(const [x,y] of [[256,160],[512,160],[160,288],[608,224]]){
      const roots=scene.add.graphics().setDepth(1);
      roots.lineStyle(4,0x46513a).lineBetween(x,y,x+16,y+24).lineBetween(x+16,y+24,x+8,y+40);
      roots.fillStyle(0x829561).fillRect(x+4,y+12,12,4).fillRect(x+16,y+24,8,4);
    }
  }else if(room==='vault'){
    mass(160,160,96,96);mass(544,160,96,96);
    mass(160,416,128,64);mass(512,416,128,64);
    for(let y=224;y<=352;y+=32)for(let x=320;x<=448;x+=32)tile('stone',x,y,-18).setTint(0xd7d1ae);
    prop('stone',384,224);
  }else if(room==='seal'){
    mass(160,160,64,128);mass(576,160,64,128);
    mass(160,384,64,96);mass(576,384,64,96);
    prop('lectern',384,224);
    for(const [x,asset] of [[256,'stone-seed'],[384,'stone-sprout'],[512,'stone-bloom']] as const)tile(asset,x,384,-8);
  }else if(room==='maintenance'){
    mass(160,384,96,96,true);
    prop('double-bed-head-left',576,352);prop('double-bed-foot-left',576,384);
    prop('double-bed-head-right',608,352);prop('double-bed-foot-right',608,384);
    for(const x of [448,480,512])for(const y of [352,384,416])tile('rug-mc-rust',x,y,-18);
    prop('table',448,384);prop('tea-table',480,384);prop('chair-rust',448,416);prop('chair-moss',480,416);
    // Shared kitchen: hearth, preparation counter, bread board and pantry.
    for(const x of [480,512,544])prop('counter-straight',x,160);
    prop('bread',576,160);prop('counter-corner',608,160);
    prop('hearth',576,192);prop('counter-side',608,192);prop('counter-side',608,224);prop('cupboard',608,256);
    prop('counter-straight',480,256);prop('counter-straight',512,256);prop('barrel',192,256);
    tile('window',224,112,-11);tile('window',512,112,-11);
    prop('rope-coil',192,320);prop('sawhorse',224,352);prop('sawhorse',256,416);
    for(const x of [192,224,256])prop('workbench',x,192);
    prop('sluice-wheel',512,192);prop('tool-rack',256,224);
    for(let y=224;y<448;y+=32)tile('stone',288,y,-18).setTint(0x698882);
  }else if(room==='drain'){
    mass(160,160,64,128);mass(160,384,96,96);mass(544,384,96,96);
    prop('desk',224,192);prop('lectern',512,192);
    for(let y=224;y<448;y+=32)tile('stone',288,y,-18).setTint(0x698882);
  }else if(room==='hall'){
    mass(160,160,64,128);mass(576,160,64,128);
    mass(160,384,64,96);mass(576,384,64,96);
  }
  // Sparse damp seams and moss at the walls, never noisy walking lanes.
  const detail=scene.add.graphics().setDepth(-8);
  const p=expedition();
  // Material evidence makes the unresolved mechanisms visible from the doorway.
  if(room==='store'){
    detail.fillStyle(0xb6ab80).fillRect(352,350,128,2).fillRect(352,356,128,2);
    detail.lineStyle(2,p.store?0x9ebd8a:0xc3a879).strokeRect(448,320,32,32);
  }
  if(room==='gallery'){
    const cord=scene.add.graphics().setDepth(1);
    cord.lineStyle(2,p.gallery?0x7e9a78:0xc2a66f).lineBetween(400,116,424,116).lineBetween(424,116,424,128);
  }
  if(room==='hall'||room==='seal'||room==='vault'){
    // Pale raised columns against deep slate aisles: capitals, shafts and plinths
    // have their own layer, rather than disappearing beneath the floor tiles.
    for(const x of room==='vault'?[272,528]:[240,528])for(const y of [256,416]){
      scene.add.rectangle(x+12,y+2,48,24,0x20343d,.55).setDepth(-6);
      const column=foreground(scene,x-20,y-72,40,72,masonry=>{
      masonry.translateCanvas(20-x,72-y);
      masonry.fillStyle(0x20343d,.7).fillRect(x-12,y-18,48,32);
      masonry.fillStyle(0x435861).fillRect(x-16,y-64,32,64);
      masonry.fillStyle(0xa9b5a5).fillRect(x-12,y-62,20,54);
      masonry.fillStyle(0xd6d4b3).fillRect(x-12,y-62,4,52);
      masonry.fillStyle(0x6d8784).fillRect(x+4,y-60,6,52);
      masonry.fillStyle(0x879e94).fillRect(x-20,y-72,40,12).fillRect(x-20,y-12,40,12);
      masonry.fillStyle(0xd9d7b9).fillRect(x-20,y-72,40,4).fillRect(x-20,y-12,40,4);
      });
      layers.push({image:column,foot:y});
      wall(x,y-16,32,32);
    }
    const aisle=scene.add.graphics().setDepth(-17);
    aisle.fillStyle(0x465e62).fillRect(352,192,96,272);
    aisle.fillStyle(0x9ba58b).fillRect(352,192,2,272).fillRect(446,192,2,272);
    for(let y=208;y<464;y+=32)aisle.fillStyle(0x526d6d).fillRect(356,y,88,2);
    for(const x of [288,480])tile('mural',x,112,-9).setTint(0x9cae99);
    detail.lineStyle(2,0x637e78).strokeRect(352,304,96,96);
    for(const x of [368,400,432])detail.fillStyle(0xb9b794).fillRect(x,312,4,8);
  }
  detail.fillStyle(0x233b35,.6).fillRect(160,160,480,10).fillRect(160,170,6,310).fillRect(634,170,6,310);
  for(const x of [192,272,480,576]){
    detail.fillStyle(0x456e55).fillRect(x,162,18,4).fillRect(x+4,166,8,4);
    detail.fillStyle(0x819469).fillRect(x+2,162,8,2);
  }
  return {tile,prop,updateDepth:(playerY:number)=>{
    for(const {image,foot} of layers){
      const inFront=playerY<foot-8;
      image.setDepth(inFront?30:2).setData('story-foreground',inFront).setData('story-occlusion-foot',foot);
    }
  }};
}
