import * as Phaser from 'phaser';
import {keeperPeriod} from '../story/keeperActivities';
import {createKeeper} from './keepers';
import {keeperWalkHome} from './keeperWalkHome';
import {WORDWOOD_WAYFARER} from '../story/wordwoodApproach';
import {getStoryProgress} from '../../lib/story/progress';
type Trip={x:number;y:number;arriveAt:number;day:number;arrived:boolean};
export function keepersAtHome(scene:Phaser.Scene){
 const clock=scene.registry.get('world-clock')??getStoryProgress().worldClock,period=keeperPeriod(clock);
 if(period==='home')return true;if(period!=='returning'||!clock)return false;
 const now=clock.day*1500000+clock.elapsed;
 return ['gardener','bridgekeeper'].every(kind=>{const trip=scene.registry.get(`keeper-trip-${kind}`) as Trip|undefined;return !!trip&&trip.day===clock.day&&(trip.arrived||now>=trip.arriveAt);});
}

/** Clock-driven commutes are visible in Wordwood, not an instant indoor swap. */
export function keeperSchedule(scene:Phaser.Scene,walls:Phaser.Physics.Arcade.StaticGroup){
 let previous='';
 const update=()=>{
  const clock=scene.registry.get('world-clock')??getStoryProgress().worldClock,period=keeperPeriod(clock);
  if(period===previous)return;previous=period;
  if(period!=='leaving'&&period!=='returning')return;
  const home=period==='returning';
  for(const [i,kind]of (['gardener','bridgekeeper'] as const).entries()){
   const saved=scene.registry.get(`keeper-trip-${kind}`) as Trip|undefined,now=clock?clock.day*1500000+clock.elapsed:0;
   if(home&&saved&&saved.day===clock?.day&&(saved.arrived||now>=saved.arriveAt))continue;
   const existing=scene.children.getByName(`keeper-${kind}`) as Phaser.GameObjects.Container|null;
   const resume=home&&saved?.day===clock?.day?saved:undefined;
   const actor=existing??createKeeper(scene,kind,resume?.x??(home?WORDWOOD_WAYFARER.x+i*32:432),resume?.y??(home?WORDWOOD_WAYFARER.y+16:256),'walking');
   actor.setData('activity','walking');
   if(home)scene.registry.set(`keeper-${kind}-arriving`,true);
   const trip:Trip={x:actor.x,y:actor.y,arriveAt:Infinity,day:clock?.day??1,arrived:false};
   const duration=keeperWalkHome(scene,actor,walls,home?{x:432,y:272}:{x:WORDWOOD_WAYFARER.x,y:WORDWOOD_WAYFARER.y+32},()=>{if(home){trip.arrived=true;scene.registry.set(`keeper-${kind}-arriving`,false);}});
   if(home){trip.arriveAt=now+(duration??120000);scene.registry.set(`keeper-trip-${kind}`,trip);const remember=()=>{if(actor.active){trip.x=actor.x;trip.y=actor.y;}};scene.events.on(Phaser.Scenes.Events.UPDATE,remember);actor.once(Phaser.GameObjects.Events.DESTROY,()=>scene.events.off(Phaser.Scenes.Events.UPDATE,remember));}
  }
 };
 update();scene.events.on(Phaser.Scenes.Events.UPDATE,update);scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.events.off(Phaser.Scenes.Events.UPDATE,update));
}
