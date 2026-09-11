import type * as Phaser from 'phaser';
import { INTERIOR_PLANS, ROOM_GRID, propAsset, type InteriorId, type InteriorPlan } from '../story/interiorPlans';

/** Native-size sprites are independent floor, rug, furniture and wall layers. */
export function buildTileInterior(scene:Phaser.Scene,id:InteriorId,wall:(x:number,y:number,w:number,h:number)=>void,customPlan?:InteriorPlan){
  const plan=customPlan??INTERIOR_PLANS[id], {x,y,cols,floorY,rows}=ROOM_GRID;
  scene.physics.world.setBounds(x,floorY,cols*32,rows*32);
  scene.add.rectangle(x-4,y-4,cols*32+8,64+rows*32+8,0x272832).setOrigin(0).setDepth(-30);
  const tile=(asset:string,col:number,row:number,depth:number,top=floorY)=>scene.add.image(x+col*32,top+row*32,`interior-${asset}`).setDisplaySize(32,32).setOrigin(0).setDepth(depth);
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)tile(plan.stone?'stone':'floor',col,row,-20);
  for(let row=0;row<2;row++)for(let col=0;col<cols;col++)tile(col%5===0?'beam':row===1?'skirting':'wall',col,row,-15,y);
  for(const col of [2,7])tile('window',col,0,-14,y+16);
  // Baseboard contact shadow gives a strong wall/floor break without muddying furniture.
  scene.add.rectangle(x,floorY,cols*32,4,0x302c39,0.35).setOrigin(0).setDepth(-12);
  const [rx,ry,rw,rh]=plan.rug;
  for(let row=ry;row<ry+rh;row++)for(let col=rx;col<rx+rw;col++){
    const part=(row===ry?'t':row===ry+rh-1?'b':'m')+(col===rx?'l':col===rx+rw-1?'r':'c');
    tile(`rug-${part}-${plan.palette}`,col,row,-10);
  }
  tile('threshold',5,rows-1,-9);
  return plan.props.map(spec=>{
    tile(propAsset(spec,plan.palette),spec.col,spec.row,0);
    const px=x+spec.col*32,py=floorY+spec.row*32;
    wall(px+16,py+16,32,32);
    // Interaction sites are the furniture tile itself; nearest cardinal neighbours can inspect.
    return {x:px+16,y:py+16,label:spec.label,heading:id.toUpperCase(),lines:[spec.line]};
  });
}
