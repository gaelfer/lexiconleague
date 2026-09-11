import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {getStoryProgress,getStoryInventory,saveStoryProgress} from '../src/lib/story/progress';
import {grantStoryItem,consumeStoryItem,inventoryEntries,useHerbalReserve} from '../src/lib/story/inventory';
import {questWaypoint,questWaypoints} from '../src/lib/story/waypoints';
import {acceptSidequest,toggleQuestTracking} from '../src/lib/story/adventure';
beforeEach(()=>{const data=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)});});
afterEach(()=>vi.unstubAllGlobals());
it('caps supplies at 32 types and 99 per stack without blocking quest keys',()=>{for(let i=0;i<32;i++)expect(grantStoryItem(`supply-${i}`,'item')).toBe(true);expect(grantStoryItem('overflow','item')).toBe(false);expect(grantStoryItem('supply-0','item',98)).toBe(true);expect(grantStoryItem('supply-0','item')).toBe(false);expect(grantStoryItem('quest-key','key')).toBe(true);consumeStoryItem('supply-1');expect(grantStoryItem('new-supply','item')).toBe(true);});
it('hides depleted supplies and used keys but keeps the inn booking and Tablet',()=>{
 saveStoryProgress({innRoomBooked:true,wordwoodExpedition:{store:true,herbsUsed:3,gardenGateKey:true,gardenGateOpened:true,key:true,repositoryKeyUsed:true,tablet:true}});
 grantStoryItem('garden-key','key');grantStoryItem('repository-key','key');grantStoryItem('empty-supply','item');consumeStoryItem('empty-supply');
 const ids=inventoryEntries(getStoryProgress(),getStoryInventory()).map(item=>item.id);
 expect(ids).not.toContain('herbal-reserve');expect(ids).not.toContain('empty-supply');expect(ids).not.toContain('garden-key');expect(ids).not.toContain('repository-key');expect(ids).toContain('room-202');expect(ids).toContain('wordwood-tablet');
 expect(getStoryProgress().wordwoodExpedition?.key).toBe(true);
});
it('keeps unused keys and recognizes previously completed legacy locks',()=>{
 saveStoryProgress({wordwoodExpedition:{gardenGateKey:true,key:true}});
 expect(inventoryEntries(getStoryProgress(),getStoryInventory()).filter(i=>i.icon==='key')).toHaveLength(2);
 saveStoryProgress({wordwoodExpedition:{gardenGateKey:true,gardenGateOpened:true,key:true,seal:true}});
 expect(inventoryEntries(getStoryProgress(),getStoryInventory()).filter(i=>i.icon==='key')).toHaveLength(0);
});
it('reads legacy expedition rewards without granting tools outside their quest',()=>{saveStoryProgress({wordwoodExpedition:{store:true,herbsUsed:1,gallery:true,gardenGateKey:true,key:true,tablet:true}});grantStoryItem('wordwood-tablet','key');const entries=inventoryEntries(getStoryProgress(),getStoryInventory());expect(entries.filter(i=>i.id==='wordwood-tablet')).toHaveLength(1);expect(entries.find(i=>i.id==='herbal-reserve')?.quantity).toBe(2);expect(entries.find(i=>i.id==='bow')).toBeUndefined();});
it('supports persistent pickups, stacked supplies, and no negative quantities',()=>{expect(grantStoryItem('test','item',-1)).toBe(false);expect(grantStoryItem('test','item',2)).toBe(true);expect(consumeStoryItem('test')).toBe(true);expect(getStoryInventory().consumables.test).toBe(1);consumeStoryItem('test');expect(consumeStoryItem('test')).toBe(false);grantStoryItem('key','key');grantStoryItem('key','key');expect(getStoryInventory().keyItems).toEqual(['key']);});
it('shares herbal charges with the existing automatic healing system',()=>{expect(useHerbalReserve()).toBe(false);saveStoryProgress({wordwoodExpedition:{store:true,herbsUsed:2}});expect(useHerbalReserve()).toBe(true);expect(getStoryProgress().wordwoodExpedition?.herbsUsed).toBe(3);expect(useHerbalReserve()).toBe(false);});
it('updates waypoints from the tracked quest and progress',()=>{saveStoryProgress({opening:'wordwood',completedChapters:[1],trackedQuest:'wordwood-tablet'});expect(questWaypoint(getStoryProgress())?.label).toContain('inscriptions');saveStoryProgress({chapterCheckpoints:{2:'{"solved":true}'}});expect(questWaypoint(getStoryProgress())?.y).toBe(112);saveStoryProgress({wordwoodExpedition:{tablet:true}});expect(questWaypoint(getStoryProgress())?.area).toBe('village');acceptSidequest('a-place-to-rest');toggleQuestTracking('a-place-to-rest');expect(questWaypoints(getStoryProgress()).some(p=>p.label.includes('Wren'))).toBe(true);});
