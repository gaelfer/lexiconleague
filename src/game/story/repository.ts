import {getStoryProgress,saveStoryProgress,getStoryInventory,saveStoryInventory,markChapterComplete} from '../../lib/story/progress';
export type RepositoryRoom='hall'|'drain'|'records'|'seal'|'vault'|'maintenance'|'gallery'|'store';
export type RoomExit='north'|'south'|'west'|'east';
export const ROOM_NAMES:Record<RepositoryRoom,string>={hall:'Sunken Repository',drain:'The Sluice Room',records:'The Record Room',seal:'The Seal Chamber',vault:'The Tablet Vault',maintenance:'Bridgekeeper’s Workshop',gallery:'The Rain Gallery',store:'The Gardener’s Storehouse'};
/** The single source of truth for both visible openings and room travel. */
export const ROOM_EXITS:Record<RepositoryRoom,readonly RoomExit[]>={
  hall:['north','south','west','east'],drain:['east'],records:['west'],seal:['north','south'],vault:['south'],
  maintenance:['south'],gallery:['south'],store:['south'],
};
export const TABLET_ID='wordwood-tablet';
export const expedition=()=>getStoryProgress().wordwoodExpedition??{};
export const LANDMARK_ROOMS=['maintenance','gallery','store'] as const;
export function landmarkRestored(index:number){const room=LANDMARK_ROOMS[index];const p=expedition();return !!(room&&p[room]&&p.cleared?.includes(room));}
export function woodlandReady(){return LANDMARK_ROOMS.every((_,i)=>landmarkRestored(i));}
export function canOpenGardenGate(){const p=expedition();return !!(p.maintenance&&p.gardenGateKey&&['gallery','store'].every(room=>p.cleared?.includes(room)));}
export function saveExpedition(patch:ReturnType<typeof expedition>){saveStoryProgress({wordwoodExpedition:{...expedition(),...patch}});}
export function repositoryDrained(){const p=expedition();return !!(p.drained||p.maintenance);}
export function expeditionArrowDamage(){return expedition().gallery?2:1;}
export function consumeHerbalReserve(){const p=expedition();if(!p.store||(p.herbsUsed??0)>=3)return false;saveExpedition({herbsUsed:(p.herbsUsed??0)+1});return true;}
export function canEnterVault(){const p=expedition();return !!(repositoryDrained()&&p.key&&p.seal);}
export function collectTablet(){
  if(!canEnterVault()||!expedition().cleared?.includes('vault'))return false;
  const inventory=getStoryInventory();
  saveStoryInventory({keyItems:[...new Set([...inventory.keyItems,TABLET_ID])]});
  saveExpedition({tablet:true});markChapterComplete(2);return true;
}
export const TABLET_RESEARCH=[
  'You lay the Wordwood Tablet on a clear patch of Bellum’s desk. He clears a second patch for his magnifier.',
  'There are two inscriptions here. No—one inscription, and something making it behave like another.',
  'The violet ink crosses the old lettering. Where they meet, the words stop working properly. But the original marks are still underneath. Look! Sorry. You can’t look. I’m holding the magnifier.',
  'Interference, not erasure. That is something we can test. Something smaller than “everything is going terribly wrong.” I like smaller questions.',
  'We know it interferes with written ink. That does not tell us what it does to living ink. Different question. New page.',
  'I’ll compare this with the road residue and keep a record of each change. Come back after you’ve had a rest. A discovery deserves supper. So do you.',
] as const;
