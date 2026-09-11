import {TOWN,townDoor} from './townPlan';
import {VILLAGE_BUILDINGS} from './buildings';
import {tileCenter} from '../gridMovement';

export interface BuildingSign {id:string;x:number;y:number;mountY:number;name:string}
export function buildingSigns(chapter:number):BuildingSign[]{
  if(chapter===1)return [
    {id:'home',x:240,y:240,mountY:204,name:'YOUR HOME'},
    {id:'wayfarer',x:3088,y:304,mountY:276,name:'WAYFARER GATEHOUSE'},
  ];
  if(chapter!==0)return [];
  return [...TOWN.buildings.map(building=>{
    const door=townDoor(building.id)!;
    const y=tileCenter(door.y);
    return {id:building.id,x:door.x+(building.id==='archive'?64:32),y,mountY:y-(building.id==='archive'?56:36),name:
      building.id==='archive'?'INKWELL ARCHIVE':building.id==='inn'?'THE LANTERN INN':
      VILLAGE_BUILDINGS.find(spec=>spec.id===building.id)!.name};
  }),{id:'wayfarer',x:TOWN.gatehouse.x+32,y:TOWN.gatehouse.y,mountY:TOWN.gatehouse.y-28,name:'WAYFARER GATEHOUSE'}];
}
export function canReadSign(player:{x:number;y:number},sign:BuildingSign){
  return Math.abs(player.x-sign.x)<1&&Math.abs(player.y-sign.y)<1;
}
