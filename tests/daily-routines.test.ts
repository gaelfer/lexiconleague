import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {residentLocation,residentActivity,copperLocation,TEA_REGULARS} from '../src/game/story/villageRoutine';
import {keeperPeriod,rollKeeperActivities} from '../src/game/story/keeperActivities';
import {saveStoryProgress} from '../src/lib/story/progress';
import {innPlan,innRoutine} from '../src/game/story/inn';
beforeEach(()=>{const values=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v)});});afterEach(()=>vi.unstubAllGlobals());
it('gives each village resident distinct morning, afternoon, dusk and night work',()=>{
 for(const name of [...TEA_REGULARS,'Bramble','Rowan']){
  const morning={day:3,elapsed:120000},afternoon={day:3,elapsed:400000},dusk={day:3,elapsed:700000},night={day:3,elapsed:1100000};
  expect(residentLocation(name,morning)).not.toBe(residentLocation(name,afternoon));expect(residentActivity(name,morning)).not.toBe(residentActivity(name,afternoon));expect(residentActivity(name,night)).toBe('sleeping');expect(residentLocation(name,night)).not.toBe('outside');if(TEA_REGULARS.includes(name))expect(residentLocation(name,dusk)).toBe('tea-room');
 }
});
it('keeps quarter/quarter/half daytime activities, with evening commutes',()=>{
 expect(rollKeeperActivities(()=>.1)).toEqual({gardener:'garden',bridgekeeper:'bridge'});expect(rollKeeperActivities(()=>.3)).toEqual({gardener:'home',bridgekeeper:'tree'});expect(rollKeeperActivities(()=>.8)).toEqual({gardener:'cooking',bridgekeeper:'home'});
 expect([0,599999,600000,660000,900000,1020000].map(elapsed=>keeperPeriod({day:3,elapsed}))).toEqual(['day','day','leaving','tavern','returning','home']);
});
it('gives Copper a real inn bunk and a short coffee stop without abandoning an escort',()=>{
 expect(innPlan(2,1).props.filter(p=>p.label==='COPPER’S BUNK')).toHaveLength(2);expect(copperLocation({day:3,elapsed:1100000})).toBe('inn-bed');expect(copperLocation({day:3,elapsed:59999})).toBe('inn-coffee');expect(copperLocation({day:3,elapsed:60000})).toBe('post');saveStoryProgress({northernStory:{escort:true}});expect(copperLocation({day:3,elapsed:1100000})).toBe('post');saveStoryProgress({northernStory:{escort:true,returnedToPost:true}});expect(copperLocation({day:3,elapsed:1100000})).toBe('inn-bed');
});
it('keeps scheduled inn work and tea on accessible furniture neighbours',()=>{
 for(const floor of [1,2] as const)for(const room of [1,2,3])for(const elapsed of [120000,400000,700000])for(const stop of innRoutine(floor,room,{day:3,elapsed}))expect(innPlan(floor,room).props.some(p=>p.col===stop.col&&p.row===stop.row&&p.asset!=='chair')).toBe(false);
});
it('puts Copper on quest duty immediately on the appointed morning, then restores her routine',()=>{
 saveStoryProgress({northernStory:{rumour:true,escortDay:2}});
 expect(copperLocation({day:1,elapsed:1100000})).toBe('inn-bed');
 expect(copperLocation({day:2,elapsed:0})).toBe('post');
 expect(copperLocation({day:2,elapsed:59999})).toBe('post');
 expect(copperLocation({day:4,elapsed:0})).toBe('post');
 saveStoryProgress({northernStory:{rumour:true,escortDay:2,returnedToPost:true}});
 expect(copperLocation({day:4,elapsed:0})).toBe('inn-coffee');
 saveStoryProgress({northernStory:{rumour:true,reported:true}});
 expect(copperLocation({day:4,elapsed:0})).toBe('inn-coffee');
});
