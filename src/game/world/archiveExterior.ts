import type * as Phaser from 'phaser';

/** Native-pixel masonry hall, authored around its existing south-facing doorstep. */
export const ARCHIVE_FOOTPRINT = { dx:-144, dy:-160, width:288, height:224 };

export function buildArchiveExterior(scene:Phaser.Scene,x:number,y:number,obstacle:(x:number,y:number,w:number,h:number)=>void){
  const g=scene.add.graphics().setPosition(x,y).setDepth(2);
  const rect=(px:number,py:number,w:number,h:number,c:number)=>g.fillStyle(c).fillRect(px,py,w,h);
  const ink=0x29383f, stone=0xb6b29a, light=0xe0d0a4, mortar=0x7a8279;
  // Foundation and a short, walkable stone stair: no sign or doorway icon.
  g.fillStyle(0x152d2d,0.35).fillRect(-138,-52,296,128);
  rect(-152,48,304,16,ink);rect(-148,48,296,5,light);rect(-148,53,296,9,0x7e897f);
  for(let sy=64;sy<96;sy+=8){rect(-32,sy,64,8,0x778277);rect(-32,sy,64,2,0xd1c8a5);}

  const masonry=(left:number,top:number,width:number,height:number)=>{
    rect(left,top,width,height,mortar);
    for(let row=0;row<height;row+=12){
      for(let col=-16;col<width;col+=32){
        const start=Math.max(0,col+(row%24?16:0)),end=Math.min(width,col+(row%24?16:0)+31);
        if(end<=start)continue;
        rect(left+start,top+row,end-start,11,(row+col)%48?stone:0xaaa993);
        rect(left+start+1,top+row,end-start-1,1,0xd0c5a3);
        if(end-start>12)rect(left+start+5,top+row+8,6,1,0x999d8a);
      }
    }
  };
  rect(-144,-64,288,114,ink);masonry(-140,-64,280,112);
  rect(128,-60,12,108,0x7e8a81);

  // Slate courses follow the slope; offset joints describe real roofing tiles.
  const roof=(cx:number,peak:number,half:number,height:number)=>{
    for(let row=0;row<height;row++){
      const extent=Math.floor(half*(row+1)/height);
      rect(cx-extent,peak+row,extent*2,1,ink);
      if(extent<4)continue;
      const edge=extent-3,course=Math.floor(row/8);
      rect(cx-edge,peak+row,edge*2,1,row%8===0?0x899c9e:row%8===7?0x354d59:course%3===0?0x597380:0x526b78);
      for(let joint=-half+(course%2)*12;joint<half;joint+=24)
        if(joint>-edge&&joint<edge)rect(cx+joint,peak+row,1,1,0x3c5360);
      rect(cx-edge,peak+row,2,1,0xa0aaa0);
    }
    rect(cx-half,peak+height,half*2,5,ink);
    rect(cx-half+4,peak+height,half*2-8,2,0x8b9d99);
    for(let offset=-half+8;offset<half-4;offset+=16){rect(cx+offset,peak+height+5,5,5,0x5d5042);rect(cx+offset,peak+height+5,2,4,0xaa936b);}
  };
  roof(0,-144,156,76);

  const window=(wx:number,wy:number)=>{
    // Stepped arch, dark reveal, amber glass and lead mullions.
    rect(wx-16,wy+8,32,49,ink);rect(wx-12,wy+3,24,54,ink);rect(wx-7,wy,14,57,ink);
    rect(wx-13,wy+10,26,43,0x7d8e85);rect(wx-10,wy+6,20,47,light);rect(wx-5,wy+3,10,50,light);
    rect(wx-9,wy+13,18,36,0x657c79);rect(wx-6,wy+8,12,41,0xd6c188);
    rect(wx-5,wy+11,4,33,0xf0dfab);rect(wx+4,wy+13,3,35,0xad9f75);
    rect(wx-1,wy+8,2,42,0x43585a);rect(wx-9,wy+27,18,2,0x43585a);
    rect(wx-18,wy+53,36,5,ink);rect(wx-18,wy+53,36,2,light);rect(wx-15,wy+58,30,4,0x758477);
  };
  window(-100,-46);window(100,-46);
  // Heavy corner quoins and projecting buttresses ground the facade.
  for(const bx of [-142,-62,52,132]){
    rect(bx,-59,10,109,ink);
    for(let by=-58;by<48;by+=16){rect(bx+1,by,9,14,0x939d8c);rect(bx+1,by,3,13,light);rect(bx+1,by,9,2,0xc9c5a4);}
    rect(bx-3,44,16,7,0x69796e);rect(bx-3,44,16,2,light);
  }

  // Raised central gable: sandstone surround with an inset carved open-book crest.
  rect(-48,-102,96,153,ink);masonry(-44,-100,88,150);
  rect(35,-97,9,145,0x949c8b);
  roof(0,-160,62,62);
  rect(-20,-82,40,33,0x647870);rect(-18,-81,36,29,0xd0c6a1);
  rect(-14,-76,13,19,0x7a8b7c);rect(1,-76,13,19,0x7a8b7c);
  rect(-13,-75,11,15,0xe5d8b0);rect(2,-75,11,15,0xc0bd99);
  for(const by of [-71,-67,-63]){rect(-11,by,7,1,0x9a9e83);rect(4,by,7,1,0x8c987f);}
  rect(-1,-75,2,20,0x52675f);

  // Recessed oak double doors; stepped arch blocks and iron hardware.
  rect(-29,-27,58,77,ink);rect(-24,-34,48,84,ink);rect(-17,-40,34,90,ink);
  rect(-23,-23,46,73,0x644b3d);rect(-18,-31,36,81,0x806044);rect(-11,-35,22,85,0x806044);
  for(let dx=-19;dx<22;dx+=7){rect(dx,-22,1,71,0xb18c5c);rect(dx+4,-22,1,71,0x493e36);}
  rect(-2,-31,3,81,0x302f30);
  for(const sy of [1,29]){rect(-22,sy,19,3,0x303d3e);rect(3,sy,19,3,0x303d3e);rect(-20,sy,2,1,0x919a80);rect(5,sy,2,1,0x919a80);}
  for(const dx of [-7,6]){rect(dx-2,17,5,6,0x2b3435);rect(dx-1,17,3,1,0xc8b577);rect(dx-2,18,1,4,0xb6a473);}
  for(let sy=-20;sy<48;sy+=14)for(const dx of [-35,28]){rect(dx,sy,7,12,0xd2c6a0);rect(dx+5,sy+1,2,11,0x8b9585);}
  for(const [ax,ay] of [[-29,-31],[-22,-39],[-12,-45],[2,-45],[15,-39],[24,-31]]){rect(ax,ay,10,9,0xc9c29f);rect(ax,ay,9,2,light);}
  rect(-28,48,56,4,light);

  // Small wall-mounted lanterns, not standalone props or entrance markers.
  for(const lx of [-43,42]){
    rect(lx-2,-8,4,24,ink);rect(lx-5,-3,10,14,ink);rect(lx-3,-1,6,9,0xddba73);rect(lx-2,0,2,6,0xf6dfaa);rect(lx-6,-5,12,2,0x58645c);
  }
  // Moss lives in damp joints, leaving the silhouette and windows readable.
  for(const [mx,my] of [[-138,31],[-130,43],[119,37],[109,45],[-58,37]]){
    rect(mx,my,9,3,0x536e53);rect(mx+2,my-3,4,5,0x72835b);rect(mx+2,my-3,2,1,0x9b9e70);
  }
  const f=ARCHIVE_FOOTPRINT;
  obstacle(x+f.dx+f.width/2,y+f.dy+f.height/2,f.width,f.height);
}
