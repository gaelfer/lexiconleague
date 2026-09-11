import * as Phaser from 'phaser';

/** Northern shortcut: its missing middle is solidly blocked until the rescue. */
export function secondaryBridge(scene:Phaser.Scene,walls:Phaser.Physics.Arcade.StaticGroup,repaired:boolean){
  const art=scene.add.graphics().setDepth(-18).setName('secondary-bridge');
  const gap=scene.physics.add.staticImage(656,288,'__DEFAULT').setVisible(false).setDisplaySize(64,64).refreshBody();
  walls.add(gap);
  const draw=(fixed:boolean)=>{
    art.clear();scene.data.set('secondary-bridge-repaired',fixed);
    art.fillStyle(0x71816a).fillRect(592,252,120,72);
    art.fillStyle(0x345f6a).fillRect(600,256,104,64);
    art.fillStyle(0x2c5363).fillRect(624,256,48,64);
    for(let x=592;x<720;x+=8){
      if(!fixed&&x>=624&&x<688)continue;
      art.fillStyle(0x584b36).fillRect(x,254,8,68);
      art.fillStyle(0xa7895e).fillRect(x+1,258,6,60);
      art.fillStyle(0xd4bb85).fillRect(x+1,258,2,57);
    }
    for(const y of [252,320]){
      art.fillStyle(0x554832).fillRect(588,y,fixed?136:36,5);
      if(!fixed)art.fillRect(688,y,36,5);
      for(const x of [592,616,696,720]){
        art.fillStyle(0x6e593b).fillRect(x,y-5,6,12);
        art.fillStyle(0xd0b381).fillRect(x,y-5,6,3);
      }
    }
    if(!fixed){
      art.fillStyle(0xb69a68).fillRect(623,264,8,5).fillRect(623,294,5,8).fillRect(681,305,8,4);
      art.fillStyle(0x86aaa5).fillRect(642,275,18,2).fillRect(662,302,12,2);
    }
    if(gap.body)gap.body.enable=!fixed;
  };
  draw(repaired);
  return ()=>draw(true);
}
