import * as Phaser from 'phaser';
import {clockPhase} from '../../lib/story/worldClock';
import {foreground} from './foreground';
import {footDepth} from './footDepth';
import {TOWN} from '../story/townPlan';
export const VILLAGE_BELL=TOWN.bell;
export function villageBell(scene:Phaser.Scene,wall:(x:number,y:number,w:number,h:number)=>void){
 const {x,y}=VILLAGE_BELL,g=scene.add.graphics().setDepth(7);
 g.fillStyle(0x102a2c,.3).fillEllipse(x+14,y+6,112,34);
 g.fillStyle(0x66796d).fillRect(x-48,y-16,96,24).fillStyle(0xb7b39a).fillRect(x-48,y-16,96,6);
 const frame=foreground(scene,x-58,y-152,116,144,c=>{c.translateCanvas(58-x,152-y);
 c.fillStyle(0x34443e).fillRect(x-40,y-120,16,104).fillRect(x+24,y-120,16,104);
 c.fillStyle(0x8b7351).fillRect(x-38,y-118,6,100).fillRect(x+26,y-118,6,100);
 c.fillStyle(0x344c52).fillTriangle(x-58,y-118,x,y-152,x+58,y-118).fillRect(x-58,y-120,116,8);
 c.fillStyle(0x96a394).fillRect(x-44,y-121,88,3);
 });
 const bell=foreground(scene,x-36,y-114,72,72,bell=>{bell.translateCanvas(36,12);
 bell.fillStyle(0x453f31).fillRect(-6,-12,12,12).fillStyle(0xc0a05f).fillRect(-14,0,28,12).fillRect(-20,12,40,24).fillRect(-28,36,56,8);
 bell.fillStyle(0xe2ca88).fillRect(-13,2,5,31).fillRect(-26,36,52,3).fillStyle(0x78613b).fillRect(12,6,6,29).fillRect(-4,44,8,8);
 });
 bell.setOrigin(.5,0).setPosition(x,y-114);
 footDepth(scene,frame,y);footDepth(scene,bell,y);
 wall(x,y-8,80,32);
 let phase='';const update=()=>{const clock=scene.game.registry.get('world-clock');if(!clock)return;const next=clockPhase(clock);if(next===phase)return;const previous=phase;phase=next;if(!previous)return;
  scene.tweens.add({targets:bell,angle:{from:-9,to:9},duration:480,yoyo:true,repeat:next==='Dusk'?3:1,onComplete:()=>bell.setAngle(0)});
  if(scene.sound instanceof Phaser.Sound.WebAudioSoundManager&&!scene.sound.mute){const c=scene.sound.context;for(let i=0;i<(next==='Dusk'?4:1);i++){const o=c.createOscillator(),a=c.createGain(),t=c.currentTime+i*.9;o.type='sine';o.frequency.value=440;a.gain.setValueAtTime(.07*scene.sound.volume,t);a.gain.exponentialRampToValueAtTime(.001,t+1.4);o.connect(a);a.connect(c.destination);o.start(t);o.stop(t+1.5);o.onended=()=>{o.disconnect();a.disconnect();};}}
 };scene.events.on(Phaser.Scenes.Events.UPDATE,update);
}
