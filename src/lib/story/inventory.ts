import {getStoryInventory,getStoryProgress,saveStoryInventory,saveStoryProgress,type StoryInventory,type StoryProgress} from './progress';
export type ItemIcon='sword'|'bow'|'shield'|'herbs'|'key'|'tablet'|'scroll'|'sketchbook'|'dictionary'|'coin'|'spin'|'pack';
export const INVENTORY_PAGE_SIZE=16;
export const INVENTORY_CAPACITY=32;
export const ITEM_STACK_LIMIT=99;
export type InventoryEntry={id:string;name:string;icon:ItemIcon;kind:'gear'|'item'|'key';quantity:number;description:string;binding?:string};
/** The journal reads the existing gameplay flags, so older pickups remain owned. */
export function inventoryEntries(p:StoryProgress,bag:StoryInventory):InventoryEntry[]{
 const w=p.wordwoodExpedition??{};
 const result:InventoryEntry[]=[
  {id:'sword',name:'Traveller’s sword',icon:'sword',kind:'gear',quantity:1,description:'Press its assigned key for a quick directional slash. Inkwhirl is a separate Art, not a held sword attack.'},
  {id:'bow',name:'Traveller’s bow',icon:'bow',kind:'gear',quantity:1,description:'Mira’s travelling bow. Hold its assigned key to aim; release to fire a normal arrow. Holding longer does not power it up. Drawing keeps you planted. Arrows are unlimited.'},
  {id:'shield',name:'Lexica shield',icon:'shield',kind:'gear',quantity:1,description:'Hold to block one frontal hit. A well-timed press counters the attacker and grants Ink. Side and rear hits bypass the shield.'},
 ];
 if(p.quests?.['lumas-sketchbook']?.steps.includes('found')&&!p.quests['lumas-sketchbook'].steps.includes('returned'))result.push({id:'luma-sketchbook',name:'Luma’s sketchbook',icon:'sketchbook',kind:'key',quantity:1,description:'A muddy corner, a green ribbon, and a careful drawing of Mira. Return it to Luma.'});
 if(w.store)result.push({id:'herbal-reserve',name:'Herbal reserve',icon:'herbs',kind:'item',quantity:Math.max(0,3-(w.herbsUsed??0)),description:'Three healing bundles from the storehouse. They restore health automatically at one heart in Wordwood combat, or you can use one here.'});
 if(w.gardenGateKey)result.push({id:'garden-key',name:'Gardener’s gate key',icon:'key',kind:'key',quantity:1,description:'Recovered from the drained bridgekeeper’s chest. Opens the northern gate once the other conditions are met.'});
 if(w.key)result.push({id:'repository-key',name:'Repository key',icon:'key',kind:'key',quantity:1,description:'A brass chamber key from the record room. Used automatically at its matching door.'});
 if(w.tablet||bag.keyItems.includes('wordwood-tablet'))result.push({id:'wordwood-tablet',name:'Wordwood Tablet',icon:'tablet',kind:'key',quantity:1,description:w.studied?'Bellum has recorded the interference in its ancient lettering.':'An ancient inscription crossed with violet ink. Bring your findings to Scholar Bellum.'});
 if(p.innRoomBooked)result.push({id:'room-202',name:'Room 202 booking',icon:'scroll',kind:'key',quantity:1,description:'Your room at the Lantern Inn. Return there for a rest.'});
 if(p.northernStory?.dictionary)result.push({id:'first-dictionary',name:'The First Dictionary',icon:'dictionary',kind:'key',quantity:1,description:p.northernStory.cured?'The missing dictionary from Bellum’s Archive. Its living words helped Mallow remember himself.':'The missing dictionary. Its pages turn toward the frightened Blotling in the camp.'});
 const known=new Set(result.map(item=>item.id));
 for(const [id,quantity] of Object.entries(bag.consumables))if(quantity>0&&!known.has(id))result.push({id,name:id.replaceAll('-',' '),icon:'pack',kind:'item',quantity,description:'A supply carried in your pack.'});
 for(const id of bag.keyItems)if(!known.has(id))result.push({id,name:id.replaceAll('-',' '),icon:'scroll',kind:'key',quantity:1,description:'An important keepsake from your adventure.'});
 return result.filter(item=>item.quantity>0
  &&(item.kind!=='gear'||bag.unlockedWeapons.includes(item.id))
  &&!(item.id==='garden-key'&&w.gardenGateOpened)
  &&!(item.id==='repository-key'&&(w.repositoryKeyUsed||w.seal||w.tablet)));
}
/** Pickup hooks for future authored items; keys never stack. */
export function grantStoryItem(id:string,kind:'item'|'key',quantity=1){
 if(!id||!Number.isInteger(quantity)||quantity<1)return false;
 if(kind==='item'){
  const bag=getStoryInventory(),entries=inventoryEntries(getStoryProgress(),bag).filter(entry=>entry.kind==='item'),current=entries.find(entry=>entry.id===id)?.quantity??0;
  if(current+quantity>ITEM_STACK_LIMIT||(!current&&entries.length>=INVENTORY_CAPACITY))return false;
 }
 const bag=getStoryInventory();return kind==='key'?saveStoryInventory({keyItems:[...new Set([...bag.keyItems,id])]}):saveStoryInventory({consumables:{...bag.consumables,[id]:(bag.consumables[id]??0)+quantity}});
}
export function consumeStoryItem(id:string){
 const bag=getStoryInventory();if((bag.consumables[id]??0)<1)return false;
 return saveStoryInventory({consumables:{...bag.consumables,[id]:bag.consumables[id]-1}});
}
export function useHerbalReserve(){const p=getStoryProgress(),w=p.wordwoodExpedition;if(!w?.store||(w.herbsUsed??0)>=3)return false;return saveStoryProgress({wordwoodExpedition:{...w,herbsUsed:(w.herbsUsed??0)+1}});}
