import {beforeEach,describe,it,expect,vi} from 'vitest';
import {canEnterVault,collectTablet,expedition,saveExpedition,repositoryDrained,woodlandReady,landmarkRestored,expeditionArrowDamage,consumeHerbalReserve,ROOM_EXITS,TABLET_ID,TABLET_RESEARCH} from '../src/game/story/repository';
import {getStoryProgress,getStoryInventory,resetStoryProgress,saveStoryProgress} from '../src/lib/story/progress';
import {canOpenGardenGate} from '../src/game/story/repository';
describe('Wordwood expedition',()=>{
  beforeEach(()=>{const data=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v),removeItem:(k:string)=>data.delete(k)});});
  it('requires drainage, key and word seal before the vault',()=>{
    expect(canEnterVault()).toBe(false);saveExpedition({drained:true});expect(canEnterVault()).toBe(false);
    saveExpedition({key:true});expect(canEnterVault()).toBe(false);saveExpedition({seal:true});expect(canEnterVault()).toBe(true);
  });
  it('requires the workshop drainage, its separate chest key, and both dungeon encounters for the garden gate',()=>{
    saveExpedition({key:true,maintenance:true,cleared:['gallery','store']});
    expect(canOpenGardenGate()).toBe(false);
    saveExpedition({gardenGateKey:true});expect(canOpenGardenGate()).toBe(true);
    saveExpedition({cleared:['gallery']});expect(canOpenGardenGate()).toBe(false);
    saveExpedition({cleared:['store']});expect(canOpenGardenGate()).toBe(false);
    saveExpedition({cleared:['gallery','store'],maintenance:false});expect(canOpenGardenGate()).toBe(false);
  });
  it('turns mini-dungeon completions into lasting expedition benefits',()=>{
    expect(repositoryDrained()).toBe(false);expect(expeditionArrowDamage()).toBe(1);expect(consumeHerbalReserve()).toBe(false);
    saveExpedition({maintenance:true,gallery:true,store:true,key:true,seal:true});
    expect(repositoryDrained()).toBe(true);expect(canEnterVault()).toBe(true);expect(expeditionArrowDamage()).toBe(2);
    expect(consumeHerbalReserve()).toBe(true);expect(consumeHerbalReserve()).toBe(true);expect(consumeHerbalReserve()).toBe(true);
    expect(consumeHerbalReserve()).toBe(false);expect(expedition().herbsUsed).toBe(3);
    saveExpedition({store:true});expect(consumeHerbalReserve()).toBe(false);
  });
  it('requires every room mechanism and encounter before restoring the woodland',()=>{
    saveExpedition({maintenance:true,gallery:true,store:true});expect(woodlandReady()).toBe(false);
    saveExpedition({cleared:['maintenance','gallery']});expect(woodlandReady()).toBe(false);expect(landmarkRestored(0)).toBe(true);
    saveExpedition({cleared:['maintenance','gallery','store']});expect(woodlandReady()).toBe(true);
    saveExpedition({gallery:false});expect(woodlandReady()).toBe(false);
  });
  it('keeps gate opening separate from collecting the Tablet',()=>{
    saveStoryProgress({chapterCheckpoints:{2:JSON.stringify({echoOpen:true})}});
    expect(collectTablet()).toBe(false);expect(getStoryProgress().completedChapters).not.toContain(2);
    saveExpedition({drained:true,key:true,seal:true});expect(collectTablet()).toBe(false);
    saveExpedition({cleared:['vault']});expect(collectTablet()).toBe(true);expect(getStoryProgress().completedChapters).toContain(2);
    collectTablet();expect(getStoryInventory().keyItems).toEqual([TABLET_ID]);
  });
  it('preserves independent room changes and resets them with story progress',()=>{
    saveExpedition({gallery:true});saveExpedition({drained:true});expect(expedition()).toMatchObject({gallery:true,drained:true});
    resetStoryProgress();expect(expedition()).toEqual({});
  });
  it('shows and permits only authored room connections',()=>{
    expect(ROOM_EXITS).toEqual({
      hall:['north','south','west','east'],drain:['east'],records:['west'],seal:['north','south'],vault:['south'],
      maintenance:['south'],gallery:['south'],store:['south'],
    });
    expect(ROOM_EXITS.drain).not.toContain('south');expect(ROOM_EXITS.records).not.toContain('south');
    expect(ROOM_EXITS.vault).not.toContain('north');
  });
  it('does not give legacy completion a Tablet or reveal the later mystery',()=>{
    saveStoryProgress({completedChapters:[1,2]});expect(expedition().tablet).toBeUndefined();
    expect(TABLET_RESEARCH.join(' ')).toContain('Interference, not erasure');
    expect(TABLET_RESEARCH.join(' ')).not.toMatch(/Blotlings are|corrupted Inklings|counter-ink/);
  });
});
