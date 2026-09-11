import type * as Phaser from 'phaser';

export type DoorStyle='cottage'|'inn'|'archive'|'wayfarer'|'bedroom';
const doors={
  cottage:{width:28,height:46,color:0x805c3d,light:0xbf9866,dark:0x5c4232},
  inn:{width:32,height:52,color:0x876345,light:0xc2a078,dark:0x594433},
  archive:{width:46,height:85,color:0x806044,light:0xb18c5c,dark:0x493e36},
  wayfarer:{width:32,height:52,color:0x526761,light:0x9aa58b,dark:0x293a40},
  bedroom:{width:20,height:50,color:0x96704c,light:0xc5a275,dark:0x604632},
} as const;

/** Static and animated entrances share their actual leaves, not a generic overlay. */
export function drawDoorLeaves(scene:Phaser.Scene,x:number,bottom:number,style:DoorStyle,depth=2.5){
  const d=doors[style],paired=style==='archive',leaves:Phaser.GameObjects.Graphics[]=[];
  for(let i=0;i<(paired?2:1);i++){
    const width=d.width/(paired?2:1),right=paired&&i===1;
    const g=scene.add.graphics().setPosition(right?x+d.width/2:x-d.width/2,bottom).setDepth(depth);
    const r=(px:number,py:number,w:number,h:number,c:number)=>g.fillStyle(c).fillRect(right?-px-w:px,py,w,h);
    r(0,-d.height,width,d.height,d.color);
    for(let px=2;px<width;px+=6){r(px,-d.height+2,2,d.height-2,d.light);r(px+3,-d.height+2,1,d.height-2,d.dark);}
    r(0,-d.height,width,2,d.light);
    if(style==='archive'){
      g.clear();
      r(0,-73,width,73,d.color);r(5,-81,width-5,81,d.color);r(12,-85,width-12,85,d.color);
      for(let px=3;px<width;px+=7){r(px,-71,1,71,d.light);r(px+4,-71,1,71,d.dark);}
      for(const y of [-49,-21])r(0,y,width-3,3,0x303d3e);
      r(width-9,-33,5,6,0x2b3435);r(width-8,-33,3,1,0xc8b577);
      r(width-9,-32,1,4,0xb6a473);r(width-1,-81,1,81,0x302f30);
    }else if(style==='wayfarer'){
      for(const y of [-44,-16]){r(0,y,width,4,0x293a40);for(const px of [3,width-5])r(px,y,2,2,0xb4b49a);}
      r(width-10,-29,6,8,0x233838);r(width-9,-28,4,2,0xb9b296);
    }else{
      if(style!=='inn')r(0,-14,width,3,d.dark);
      r(width-8,-28,3,5,0xe5cc8f);
    }
    leaves.push(g);
  }
  return leaves;
}

export function openDoorAnimation(scene:Phaser.Scene,x:number,bottom:number,done:()=>void,style:DoorStyle){
  const d=doors[style];
  const opening=scene.add.graphics().setPosition(x-d.width/2,bottom).setDepth(6);
  opening.fillStyle(0x152528);
  if(style==='archive')opening.fillRect(0,-73,46,73).fillRect(5,-81,36,81).fillRect(12,-85,22,85);
  else opening.fillRect(0,-d.height,d.width,d.height);
  const leaves=drawDoorLeaves(scene,x,bottom,style,6.1);
  const cleanup=()=>{opening.destroy();leaves.forEach(leaf=>leaf.destroy());scene.events.off('resume',cleanup);scene.events.off('shutdown',cleanup);};
  scene.events.once('resume',cleanup);
  scene.events.once('shutdown',cleanup);
  scene.tweens.add({targets:leaves,scaleX:.08,duration:style==='archive'?420:style==='wayfarer'?360:280,ease:'Sine.easeInOut',onComplete:done});
}
