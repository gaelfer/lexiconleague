import {getStoryInventory,saveStoryInventory,type StoryInventory} from './progress';
export const GEAR_IDS=['sword','bow'] as const;
export type GearId=typeof GEAR_IDS[number];
export const TOOL_KEYS=['Q','R','F'] as const;
export type ToolKey=typeof TOOL_KEYS[number];
export function toolSlots(bag:Pick<StoryInventory,'equippedGear'|'toolSlots'>):Record<ToolKey,GearId|null>{
 if(bag.toolSlots){const seen=new Set<string>();return Object.fromEntries(TOOL_KEYS.map(key=>{const id=bag.toolSlots?.[key];if(!id||!GEAR_IDS.includes(id)||seen.has(id))return [key,null];seen.add(id);return [key,id];})) as Record<ToolKey,GearId|null>;}
 const legacy=Array.isArray(bag.equippedGear)?bag.equippedGear:GEAR_IDS;
 return {Q:legacy.includes('sword')?'sword':null,R:legacy.includes('bow')?'bow':null,F:null};
}
export function equippedGear(bag:Pick<StoryInventory,'equippedGear'|'toolSlots'>):GearId[]{
 const slots=toolSlots(bag);return GEAR_IDS.filter(id=>Object.values(slots).includes(id));
}
export function assignTool(key:ToolKey,id:GearId|null){
 if(!TOOL_KEYS.includes(key)||(id!==null&&!GEAR_IDS.includes(id)))return false;
 const slots=toolSlots(getStoryInventory());
 for(const slot of TOOL_KEYS)if(id&&slots[slot]===id)slots[slot]=null;
 slots[key]=id;
 return saveStoryInventory({toolSlots:slots,equippedGear:GEAR_IDS.filter(gear=>Object.values(slots).includes(gear))});
}
/** The sword and bow are existing starter tools; unequipping never removes ownership. */
export function setGearEquipped(id:string,equipped:boolean){
 if(!GEAR_IDS.includes(id as GearId))return false;
 const slots=toolSlots(getStoryInventory()),existing=TOOL_KEYS.find(key=>slots[key]===id);
 if(!equipped)return existing?assignTool(existing,null):true;
 if(existing)return true;
 const preferred=id==='sword'?'Q':'R',slot=!slots[preferred]?preferred:TOOL_KEYS.find(key=>!slots[key]);
 return slot?assignTool(slot,id as GearId):false;
}
