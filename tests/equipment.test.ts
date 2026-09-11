import {describe,it,expect,beforeEach} from 'vitest';
import {equippedGear,setGearEquipped,assignTool,toolSlots} from '../src/lib/story/equipment';
import {getStoryInventory,saveStoryInventory,resetStoryProgress} from '../src/lib/story/progress';
describe('equipment loadout',()=>{
 beforeEach(()=>{const data=new Map<string,string>();Object.assign(globalThis,{localStorage:{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v),removeItem:(k:string)=>data.delete(k)}});});
 it('starts with only the sword and rejects unowned tools',()=>{expect(equippedGear({})).toEqual(['sword']);expect(assignTool('F','bow')).toBe(false);expect(assignTool('F','shield')).toBe(false);});
 it('moves owned tools to F without duplicating their old binding',()=>{saveStoryInventory({unlockedWeapons:['sword','bow']});assignTool('F','bow');expect(toolSlots(getStoryInventory())).toEqual({Q:'sword',R:null,F:'bow'});assignTool('F','sword');expect(toolSlots(getStoryInventory())).toEqual({Q:null,R:null,F:'sword'});expect(equippedGear(getStoryInventory())).toEqual(['sword']);});
 it('supports an empty loadout without losing inventory',()=>{
  saveStoryInventory({lexicoins:27,keyItems:['wordwood-tablet'],unlockedWeapons:['sword','bow']});setGearEquipped('sword',false);setGearEquipped('bow',false);
  expect(equippedGear(getStoryInventory())).toEqual([]);expect(getStoryInventory().keyItems).toEqual(['wordwood-tablet']);expect(getStoryInventory().lexicoins).toBe(27);
  setGearEquipped('bow',true);expect(equippedGear(getStoryInventory())).toEqual(['bow']);setGearEquipped('sword',true);expect(equippedGear(getStoryInventory())).toEqual(['sword','bow']);
 });
 it('rejects unsupported gear and normalizes duplicate IDs',()=>{expect(setGearEquipped('imaginary-shield',true)).toBe(false);expect(equippedGear({unlockedWeapons:['sword','bow'],equippedGear:['bow','bow']})).toEqual(['bow']);});
 it('resets loadout with new game',()=>{setGearEquipped('sword',false);resetStoryProgress();expect(equippedGear(getStoryInventory())).toEqual(['sword']);});
});
