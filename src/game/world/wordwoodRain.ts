import * as Phaser from 'phaser';
import {expedition} from '../story/repository';
import {EventBus} from '../EventBus';
/** World-space rain: never crosses the dialogue camera; no flashing lightning. */
export function wordwoodRain(scene:Phaser.Scene,regions?:{x:number;y:number;w:number;h:number}[]){
  scene.data.set('wordwood-raining',false);
  if(expedition().logGuardianFreed)return;
  scene.data.set('wordwood-raining',true);
  const g=scene.add.graphics().setDepth(40);
  const tick=()=>{
    g.clear();const t=scene.time.now*.23;
    const view=scene.cameras.main.worldView;
    const areas=regions??[{x:view.x-32,y:view.y-32,w:view.width+64,h:view.height+64}];
    for(const a of areas){
      const count=Math.ceil(a.w*a.h/3100);
      for(let i=0;i<count;i++){
        const y=a.y+((i*79+t)%a.h),x=a.x+((i*113+t*.22)%a.w);
        g.lineStyle(1,0xb3c9cb,.28).lineBetween(Math.round(x),Math.round(y),Math.round(x-3),Math.round(y+9));
        if(i%7===0){const phase=((scene.time.now+i*93)%1100)/1100;
          g.lineStyle(1,0x93b5b6,(1-phase)*.25).strokeEllipse(a.x+(i*157)%a.w,a.y+(i*43)%a.h,3+phase*9,2+phase*3);}
      }
    }
  };
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE,tick);
  const stop=()=>{scene.data.set('wordwood-raining',false);scene.events.off(Phaser.Scenes.Events.POST_UPDATE,tick);g.destroy();};
  EventBus.on('wordwood-rain-stop',stop);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{scene.events.off(Phaser.Scenes.Events.POST_UPDATE,tick);EventBus.off('wordwood-rain-stop',stop);});
}
