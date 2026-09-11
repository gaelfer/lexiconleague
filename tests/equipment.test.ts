import {describe,it,expect,beforeEach} from 'vitest';
import {equippedGear,setGearEquipped,assignTool,toolSlots} from '../src/lib/story/equipment';
import {getStoryInventory,saveStoryInventory,resetStoryProgress} from '../src/lib/story/progress';
describe('equipment loadout',()=>{
 beforeEach(()=>{const data=new Map<string,string>();Object.assign(globalThis,{localStorage:{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v),removeItem:(k:string)=>data.delete(k)}});});
 it('preserves both starter tools in legacy saves',()=>{expect(equippedGear({})).toEqual(['sword','bow']);});
 it('moves tools to F without duplicating their old binding',()=>{assignTool('F','bow');expect(toolSlots(getStoryInventory())).toEqual({Q:'sword',R:null,F:'bow'});assignTool('F','sword');expect(toolSlots(getStoryInventory())).toEqual({Q:null,R:null,F:'sword'});expect(equippedGear(getStoryInventory())).toEqual(['sword']);});
 it('supports an empty loadout without losing inventory',()=>{
  saveStoryInventory({lexicoins:27,keyItems:['wordwood-tablet']});setGearEquipped('sword',false);setGearEquipped('bow',false);
  expect(equippedGear(getStoryInventory())).toEqual([]);expect(getStoryInventory().keyItems).toEqual(['wordwood-tablet']);expect(getStoryInventory().lexicoins).toBe(27);
  setGearEquipped('bow',true);expect(equippedGear(getStoryInventory())).toEqual(['bow']);setGearEquipped('sword',true);expect(equippedGear(getStoryInventory())).toEqual(['sword','bow']);
 });
 it('rejects unsupported gear and normalizes duplicate IDs',()=>{expect(setGearEquipped('imaginary-shield',true)).toBe(false);expect(equippedGear({equippedGear:['bow','bow']})).toEqual(['bow']);});
 it('resets loadout with new game',()=>{setGearEquipped('sword',false);resetStoryProgress();expect(equippedGear(getStoryInventory())).toEqual(['sword','bow']);});
});
