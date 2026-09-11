import * as Phaser from 'phaser';
import {EventBus} from '../EventBus';
import {getStoryProgress,saveStoryProgress} from '../../lib/story/progress';
import {advanceClock,clockPhase,normalizeClock} from '../../lib/story/worldClock';
/** One clock per game, never one per scene. No offline advancement. */
export function installGlobalClock(game:Phaser.Game){
 let clock=normalizeClock(getStoryProgress().worldClock),pending=0,unlocked=!!getStoryProgress().worldClock;
 let disk=JSON.stringify(getStoryProgress().worldClock);
 const publish=()=>{game.registry.set('world-clock',clock);EventBus.emit('world-clock',{...clock,phase:clockPhase(clock),unlocked});};
 const save=()=>{if(unlocked&&pending){pending=0;saveStoryProgress({worldClock:clock});}};
 const reload=()=>{const p=getStoryProgress(),next=JSON.stringify(p.worldClock);unlocked=!!p.worldClock;if(next!==disk){disk=next;clock=normalizeClock(p.worldClock);pending=0;}publish();};
 const step=(_time:number,delta:number)=>{
  if(!unlocked||!game.input.enabled||document.hidden)return;
  const scenes=game.scene.getScenes(true) as (Phaser.Scene&{player?:unknown;locked?:boolean;dialogue?:unknown;activeDialogue?:unknown;panel?:unknown;question?:unknown;transitioning?:boolean})[];
  if(!scenes.some(s=>s.player)||scenes.some(s=>s.locked||s.dialogue||s.activeDialogue||s.panel||s.question||s.transitioning))return;
  clock=advanceClock(clock,Math.min(delta,100));pending+=delta;publish();if(pending>=5000)save();
 };
 game.events.on(Phaser.Core.Events.STEP,step);window.addEventListener('story-save',reload);window.addEventListener('pagehide',save);EventBus.on('combat-cancel',save);
 game.events.once(Phaser.Core.Events.DESTROY,()=>{save();game.events.off(Phaser.Core.Events.STEP,step);window.removeEventListener('story-save',reload);window.removeEventListener('pagehide',save);EventBus.off('combat-cancel',save);});
 publish();
}
