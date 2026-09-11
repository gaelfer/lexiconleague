import type * as Phaser from 'phaser';

export const HOME_OBJECTS = [
  { kind: 'bed', x:192, y:224, w:64, h:96, line:'A properly made bed. Your missing slipper has turned up underneath it.' },
  { kind: 'shelf', x:288, y:192, w:64, h:64, line:'Adventure books on the bottom shelf. The well-worn ones are all about home.' },
  { kind: 'tv', x:416, y:192, w:64, h:64, line:'The weather report says: “Unsettled words in the forest.” That sounds about right.' },
  { kind: 'sink', x:544, y:192, w:64, h:64, line:'Two washed cups are drying by the sink.' },
  { kind: 'table', x:384, y:320, w:96, h:64, line:'There is a note under your cup: Eat before you leave. — Mira' },
  { kind: 'chair', x:352, y:320, w:32, h:32, line:'Your usual seat.' },
  { kind: 'chair', x:352, y:352, w:32, h:32, line:'A chair pulled close to the table.' },
  { kind: 'chair', x:480, y:320, w:32, h:32, line:'A spare place for a visitor.' },
  { kind: 'chair', x:480, y:352, w:32, h:32, line:'The cushion is a little crooked.' },
  { kind: 'chest', x:192, y:416, w:64, h:64, line:'Bellum’s sealed letter is still here. It is dated tomorrow.' },
  { kind: 'plant', x:576, y:416, w:32, h:32, line:'New leaves. You must be doing something right.' },
] as const;

/** Integer-pixel, independently layered furniture; dimensions ARE blocked tiles. */
export function buildGridHome(scene: Phaser.Scene, wall: (x:number,y:number,w:number,h:number)=>void) {
  const floor=scene.add.graphics().setDepth(-20);
  floor.fillStyle(0x282c32).fillRect(156,124,488,392);
  for(let y=192;y<512;y+=32) for(let x=160;x<640;x+=32) {
    floor.fillStyle((x+y)%96?0xb6a281:0xbca98a).fillRect(x,y,32,32);
    floor.fillStyle(0x8d7e67).fillRect(x,y+30,32,2);
    floor.fillStyle(0xd0be9a).fillRect(x,y,32,1);
    floor.fillStyle(0x998970).fillRect(x+((y/32)%2?8:24),y+1,1,29);
  }
  const back=scene.add.graphics().setDepth(-10);
  back.fillStyle(0x9cacb5).fillRect(160,128,480,64);
  for(let x=160;x<640;x+=8) back.fillStyle(0xc0cbd0).fillRect(x,130,2,49);
  back.fillStyle(0x4d5259).fillRect(160,180,480,12);
  back.fillStyle(0xd4c4a5).fillRect(160,180,480,3);
  for(const x of [224,384,544]) {
    back.fillStyle(0x414f57).fillRect(x-2,134,52,38);
    back.fillStyle(0xede7ce).fillRect(x,134,48,4);
    back.fillStyle(0x8eb5bd).fillRect(x+3,140,42,26);
    back.fillStyle(0xd5e3dc).fillRect(x+23,140,3,27);
    back.fillStyle(0xeee8d7).fillRect(x,166,48,4);
  }
  const rug=scene.add.graphics().setDepth(-6);
  rug.fillStyle(0x3e566b).fillRect(352,288,160,128);
  rug.lineStyle(2,0xe0e3d1).strokeRect(355,291,154,122);
  rug.fillStyle(0x68869b).fillRect(361,297,142,110);
  for(const spec of HOME_OBJECTS) {
    const g=scene.add.graphics().setPosition(spec.x,spec.y).setDepth(0);
    const {w,h}=spec;
    const rect=(x:number,y:number,width:number,height:number,color:number)=>g.fillStyle(color).fillRect(x,y,width,height);
    rect(2,4,w-2,h-4,0x33363c); rect(0,0,w-2,h-4,0x594534);
    rect(2,2,w-6,h-9,0xb5834f); rect(3,3,w-8,3,0xdeb67b);
    if(spec.kind==='chair') {
      g.clear(); rect(5,4,23,25,0x3b4954); rect(7,5,19,7,0x8ca5b5);
      rect(7,13,19,12,0x65879c); rect(8,14,16,2,0xb0c5cd);
      rect(6,27,4,4,0x4a4945); rect(23,27,4,4,0x4a4945);
    } else if(spec.kind==='bed') {
      rect(6,8,50,76,0xebe8d6); rect(11,12,40,18,0xfff9e7);
      rect(6,36,50,48,0x537994); rect(8,38,46,4,0x90b2c4);
      rect(49,43,7,41,0x3a566d); rect(2,84,58,7,0x986239);
    } else if(spec.kind==='shelf') {
      for(let row=0;row<2;row++) {
        rect(5,10+row*25,50,20,0x423b35);
        for(let col=0;col<6;col++) {
          rect(7+col*8,13+row*25,5,16,[0x827051,0x749075,0xad725a][col%3]);
          rect(8+col*8,15+row*25,3,1,0xe8d6a0);
        }
        rect(3,30+row*25,55,3,0xd4a86c);
      }
    } else if(spec.kind==='tv') {
      rect(2,0,58,42,0x303941); rect(6,4,49,31,0x67777b);
      rect(9,7,43,24,0x46545a); rect(26,42,11,5,0x33383c);
      rect(6,50,46,2,0x654b34); rect(47,47,4,3,0xe4cb91);
    } else if(spec.kind==='sink') {
      rect(0,0,62,32,0x566369); rect(3,3,56,25,0xd6dbd4);
      rect(8,7,29,17,0x6e8b91); rect(11,10,23,11,0xb2c9c5);
      rect(21,0,4,12,0x4d6268); rect(25,1,8,3,0xe5e9da);
      rect(31,35,2,22,0x654a33); rect(24,41,3,3,0xe8d3a1); rect(38,41,3,3,0xe8d3a1);
    } else if(spec.kind==='table') {
      rect(5,6,82,43,0xc6cab5); rect(9,10,74,34,0x80a7ad);
      rect(12,12,68,2,0xd4e5dd); rect(19,19,16,2,0xc0d8d1);
      rect(9,50,7,12,0x4d4140); rect(77,50,7,12,0x4d4140);
      rect(14,27,9,8,0xede8d5); rect(70,20,9,8,0xede8d5);
    } else if(spec.kind==='chest') {
      rect(4,8,52,25,0x6e8d8c); rect(4,35,52,3,0x3d5557);
      rect(26,30,9,12,0xdac38c); rect(28,33,4,3,0x725840);
    } else {
      g.clear(); rect(9,18,16,12,0x57494d); rect(10,18,13,8,0xb38690);
      rect(13,9,6,13,0x486043); rect(4,7,13,9,0x527b53);
      rect(13,2,12,14,0x699461); rect(14,3,5,3,0xa3b886);
    }
    wall(spec.x+w/2,spec.y+h/2,w,h);
  }
  const exit=scene.add.graphics().setDepth(-5);
  exit.fillStyle(0x473e3a).fillRect(384,480,32,32);
  exit.fillStyle(0xbb8362).fillRect(387,484,26,26);
  exit.fillStyle(0xe0aa7e).fillTriangle(392,497,408,497,400,505);
  wall(400,160,480,64);
  return HOME_OBJECTS.map(spec=>({x:spec.x+spec.w/2,y:spec.y+spec.h+16,label:`CHECK ${spec.kind.toUpperCase()}`,heading:'HOME',lines:[spec.line]}));
}
