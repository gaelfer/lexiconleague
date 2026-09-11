'use client';
import {useState} from 'react';
import type {StoryInventory,StoryProgress} from '@/lib/story/progress';
import {inventoryEntries,INVENTORY_CAPACITY,INVENTORY_PAGE_SIZE,ITEM_STACK_LIMIT} from '@/lib/story/inventory';
import {TOOL_KEYS,toolSlots,assignTool,setGearEquipped,type GearId} from '@/lib/story/equipment';
import ItemGlyph from './ItemGlyph';
import {maxCombatHearts} from '@/lib/story/combatLoadout';
import s from './AdventureUI.module.css';
export default function InventoryScreen({progress,bag,hearts,selectedId,onSelect,onHeal,onError}:{progress:StoryProgress;bag:StoryInventory;hearts:number;selectedId:string;onSelect:(id:string)=>void;onHeal:()=>void;onError:()=>void}){
 const [page,setPage]=useState(0),entries=inventoryEntries(progress,bag),gear=entries.filter(e=>e.kind==='gear'),slots=toolSlots(bag),items=entries.filter(e=>e.kind!=='gear'||!Object.values(slots).includes(e.id as GearId));
 const pages=Math.max(2,Math.ceil(items.length/INVENTORY_PAGE_SIZE)),current=Math.min(page,pages-1),visible=items.slice(current*16,current*16+16),selected=entries.find(e=>e.id===selectedId)??gear[0];
 const assigned=TOOL_KEYS.find(key=>slots[key]===selected?.id),supplies=items.filter(e=>e.kind==='item').length;
 const changePage=(next:number)=>{setPage(next);onSelect(items[next*16]?.id??'');};
 return <>
  <div className={s.pageHeading}><span>I</span><h2>Inventory</h2></div>
  <section aria-label="Gear equip section"><h3 className={s.inventoryHeading}>Equipped tools</h3><div className={s.equipRow}>{TOOL_KEYS.map(key=>{const entry=gear.find(e=>e.id===slots[key]);return <div className={s.equipCard} key={key}><kbd>{key}</kbd><button aria-label={`Inspect ${key} tool slot`} onClick={()=>onSelect(entry?.id??'sword')}><ItemGlyph icon={entry?.icon??'pack'} size={34}/><span>{entry?.name??'Empty tool slot'}</span></button><select aria-label={`Assign ${key} tool`} value={slots[key]??''} onChange={e=>{if(!assignTool(key,(e.target.value||null) as GearId|null))onError();}}><option value="">Unequipped</option>{gear.map(e=><option value={e.id} key={e.id}>{e.name}</option>)}</select></div>;})}</div>
  </section>
  <div className={s.packLayout}><section aria-label="Items section"><div className={s.inventoryBar}><h3 className={s.inventoryHeading}>In your pack</h3><span>{supplies} / {INVENTORY_CAPACITY} supplies</span></div>
   <div className={s.inventoryGrid} aria-label={`Inventory page ${current+1}`}>{Array.from({length:16},(_,i)=>{const entry=visible[i];return entry?<button key={entry.id} className={s.inventoryCell} aria-label={`${entry.name}, ${entry.quantity}`} aria-pressed={selected?.id===entry.id} title={entry.name} onClick={()=>onSelect(entry.id)}><ItemGlyph icon={entry.icon} size={36}/><span>{entry.name}</span>{entry.kind!=='key'&&<b>×{entry.quantity}</b>}</button>:<div key={`empty-${i}`} className={`${s.inventoryCell} ${s.inventoryEmpty}`} aria-label={`Empty slot ${current*16+i+1}`}>·</div>;})}</div>
   <nav className={s.inventoryBar} aria-label="Inventory pages"><button className={s.stoneButton} disabled={current===0} onClick={()=>changePage(current-1)}>Previous</button><span>Page {current+1} / {pages} · 16 slots</span><button className={s.stoneButton} disabled={current===pages-1} onClick={()=>changePage(current+1)}>Next</button></nav>
   <p className={s.paperNote}>Supplies stack to {ITEM_STACK_LIMIT}. Gear and quest items don’t use supply capacity.{supplies>32?' Your existing overflow is safe; use supplies before picking up new types.':''}</p>
  </section>
  {selected&&<article className={s.itemDetails}><ItemGlyph icon={selected.icon} size={40}/><div><h3>{selected.name}</h3><p>{selected.description}</p>{selected.kind==='gear'&&<><p>{assigned?`Equipped to ${assigned}`:'In your pack'}</p><button className={s.stoneButton} onClick={()=>{if(!setGearEquipped(selected.id,!assigned))onError();}}>{assigned?'Unequip':'Equip'} {selected.id}</button></>}{selected.id==='herbal-reserve'&&<button className={s.stoneButton} disabled={hearts>=maxCombatHearts(progress)||hearts<=0} onClick={onHeal}>{hearts>=maxCombatHearts(progress)?'Health is full':'Use one bundle'}</button>}</div></article>}
 </div></>;
}
