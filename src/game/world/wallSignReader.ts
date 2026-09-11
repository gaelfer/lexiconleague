import type * as Phaser from 'phaser';
import type Player from '../entities/Player';
import type {BuildingSign} from '../story/buildingSigns';
import {canReadSign} from '../story/buildingSigns';

/** Non-modal signage. Never consumes E, locks input, or interrupts a grid step. */
export function wallSignReader(scene:Phaser.Scene,player:Player,signs:BuildingSign[]){
  const panel=scene.add.text(400,536,'',{fontFamily:'Georgia',fontSize:'16px',color:'#ead9b0',backgroundColor:'#172a29',padding:{x:18,y:12},align:'center',wordWrap:{width:580}})
    .setOrigin(.5).setScrollFactor(0).setDepth(100).setName('building-sign-label').setVisible(false);
  let reading:BuildingSign|undefined;
  const hide=()=>{reading=undefined;panel.setVisible(false);};
  const update=()=>{
    if(reading){if(!canReadSign(player,reading)||player.facing!=='up')hide();return;}
    const sign=signs.find(sign=>player.isPushingSignAt(sign.x,sign.y));
    if(sign){reading=sign;panel.setText(sign.name).setVisible(true);}
  };
  scene.events.on('postupdate',update);scene.events.on('pause',hide);
  scene.events.once('shutdown',()=>{scene.events.off('postupdate',update);scene.events.off('pause',hide);});
}
