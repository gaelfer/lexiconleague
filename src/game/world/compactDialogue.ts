import * as Phaser from 'phaser';

/** Village-sized speech frame. Only two wrapped lines render; overflow scrolls inside it. */
export function compactDialogue(scene:Phaser.Scene,speaker:string,message:string,onClose:()=>void){
  const bg=scene.add.rectangle(400,517,700,132,0x071820,.96).setStrokeStyle(2,0x58e0b0,.65);
  const name=scene.add.text(72,469,speaker.toUpperCase(),{fontFamily:'Georgia, serif',fontSize:'13px',fontStyle:'bold',color:'#f4c96b',letterSpacing:2});
  const copy=scene.add.text(72,497,'',{fontFamily:'Arial, sans-serif',fontSize:'16px',color:'#f8fafc',lineSpacing:7,wordWrap:{width:630}});
  const lines=copy.getWrappedText(message);let offset=0;
  const hint=scene.add.text(730,563,'',{fontFamily:'Arial, sans-serif',fontSize:'10px',fontStyle:'bold',color:'#8fcfb7'}).setOrigin(1,.5);
  const panel=scene.add.container(0,0,[bg,name,copy,hint]).setDepth(100).setScrollFactor(0);
  const render=()=>{copy.setText(lines.slice(offset,offset+2).join('\n'));hint.setText(offset+2<lines.length?'SCROLL ↓ · E NEXT':lines.length>2?'SCROLL ↑ · E CLOSE':'E CLOSE');};
  render();let ready=scene.time.now+250;
  const advance=()=>{
    if(scene.time.now<ready)return;ready=scene.time.now+180;
    if(offset+2<lines.length){offset=Math.min(offset+2,lines.length-2);render();}
    else{scene.data.set('dialogue-closed-until',scene.time.now+200);panel.destroy();onClose();}
  };
  const scroll=(_p:unknown,_o:unknown,_x:number,dy:number)=>{offset=Phaser.Math.Clamp(offset+Math.sign(dy),0,Math.max(0,lines.length-2));render();};
  scene.input.keyboard?.on('keydown-E',advance);scene.input.on('wheel',scroll);
  panel.once(Phaser.GameObjects.Events.DESTROY,()=>{scene.input.keyboard?.off('keydown-E',advance);scene.input.off('wheel',scroll);});
  return panel;
}
