import * as Phaser from 'phaser';
import {clockPhase} from '../../lib/story/worldClock';
/** Small personal activities for residents who work in one room across the day. */
export function dailyWork(scene:Phaser.Scene,actor:Phaser.GameObjects.Container,kind:'scholar'|'child'|'concierge'){
 const prop=scene.add.graphics();actor.add(prop);let phase='';
 const update=()=>{const clock=scene.registry.get('world-clock');if(!clock)return;const next=clockPhase(clock);if(next===phase)return;phase=next;prop.clear();
  const names={scholar:['reading the morning records','annotating research','taking tea','dozing over a book'],child:['drawing maps','folding paper boats','having supper','sleeping'],concierge:['preparing breakfast','checking the guest ledger','serving evening tea','keeping the night desk']};
  actor.setData('activity',names[kind][['Morning','Afternoon','Dusk','Night'].indexOf(phase)]);
  if(phase==='Afternoon'&&kind==='child'){prop.fillStyle(0xddcca1).fillTriangle(-10,6,12,6,5,15).fillTriangle(-2,6,4,-4,4,6).fillStyle(0xa28d65).fillRect(-6,8,15,2);}
  else if(phase==='Dusk'){prop.fillStyle(0xf0d9a3).fillRect(9,4,8,7).lineStyle(2,0xf0d9a3).strokeRect(17,5,3,4);}
  else if(phase==='Night'&&kind==='child')return;
  else{prop.fillStyle(0x35463e).fillRect(-12,3,24,13).fillStyle(0xddcca1).fillRect(-11,4,10,10).fillRect(1,4,10,10).fillStyle(0x877353).fillRect(-7,7,5,1).fillRect(3,10,5,1);if(phase==='Afternoon')prop.lineStyle(2,0xc7af79).lineBetween(12,-3,6,10);}
 };
 update();scene.events.on(Phaser.Scenes.Events.UPDATE,update);scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.events.off(Phaser.Scenes.Events.UPDATE,update));
}
