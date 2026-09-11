import {describe,it,expect} from 'vitest';
import {rollKeeperActivities} from '../src/game/story/keeperActivities';
describe('caretaker visits',()=>{
  it('uses exact half and quarter boundaries',()=>{
    for(const [g,b,gardener,bridgekeeper] of [[0,0,'garden','bridge'],[.49,.249,'garden','bridge'],[.5,.25,'home','tree'],[.99,.499,'home','tree'],[.5,.5,'home','home'],[.99,.99,'home','home']] as const){
      const values=[g,b];expect(rollKeeperActivities(()=>values.shift()!)).toEqual({gardener,bridgekeeper});
    }
  });
});
