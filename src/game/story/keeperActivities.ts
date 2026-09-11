export function rollKeeperActivities(random:()=>number=Math.random){
  const gardenRoll=random();
  const gardener=gardenRoll<.25?'garden':gardenRoll<.5?'home':'cooking';
  const roll=random();
  return {gardener,bridgekeeper:roll<.25?'bridge':roll<.5?'tree':'home'};
}
import {clockPhase,type WorldClock} from '../../lib/story/worldClock';
export function keeperPeriod(clock?:WorldClock){
 if(!clock)return 'day';
 if(clock.elapsed>=10*60000&&clock.elapsed<11*60000)return 'leaving';
 if(clockPhase(clock)==='Dusk')return 'tavern';
 if(clockPhase(clock)==='Night')return clock.elapsed<17*60000?'returning':'home';
 return 'day';
}
