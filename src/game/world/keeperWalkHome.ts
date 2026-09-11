import type * as Phaser from 'phaser';

/** Plan on the same 32-unit walking grid as doors; avoid walls and tree trunks. */
export function keeperWalkHome(scene:Phaser.Scene,actor:Phaser.GameObjects.Container,walls:Phaser.Physics.Arcade.StaticGroup,destination:{x:number;y:number},arrived?:()=>void){
  const snap=(v:number)=>Math.round((v-16)/32)*32+16;
  const bounds=scene.physics.world.bounds;
  const free=(x:number,y:number)=>x>=bounds.left+16&&x<=bounds.right-16&&y>=bounds.top+16&&y<=bounds.bottom-16&&!walls.getChildren().some(object=>{
    const b=(object as Phaser.Physics.Arcade.Image).body;
    return b?.enable&&x+10>b.x&&x-10<b.right&&y+8>b.y&&y-8<b.bottom;
  });
  let sx=snap(actor.x),sy=snap(actor.y+16);
  // Rescue can finish beside a wall; use the closest unoccupied foot tile.
  if(!free(sx,sy)){
    const nearby=[];for(let dy=-96;dy<=96;dy+=32)for(let dx=-96;dx<=96;dx+=32)if(free(sx+dx,sy+dy))nearby.push({x:sx+dx,y:sy+dy,d:dx*dx+dy*dy});
    nearby.sort((a,b)=>a.d-b.d);if(!nearby.length)return;sx=nearby[0].x;sy=nearby[0].y;
  }
  const key=(x:number,y:number)=>`${x},${y}`;
  const queue=[{x:sx,y:sy}],parents=new Map<string,{x:number;y:number}|null>([[key(sx,sy),null]]);
  let found=false;
  for(let i=0;i<queue.length;i++){
    const p=queue[i];if(p.x===destination.x&&p.y===destination.y){found=true;break;}
    for(const [dx,dy] of [[32,0],[-32,0],[0,32],[0,-32]]){
      const x=p.x+dx,y=p.y+dy,k=key(x,y);if(parents.has(k)||!free(x,y))continue;
      parents.set(k,p);queue.push({x,y});
    }
  }
  if(!found)return;
  const route:{x:number;y:number}[]=[];let cursor:{x:number;y:number}|null=destination;
  while(cursor){route.unshift(cursor);cursor=parents.get(key(cursor.x,cursor.y))??null;}
  let index=0;
  const step=()=>{
    if(!actor.active)return;
    const p=route[index++];if(!p){scene.tweens.add({targets:actor,y:actor.y-24,alpha:0,duration:450,onComplete:()=>{actor.destroy();arrived?.();}});return;}
    scene.tweens.add({targets:actor,x:p.x,y:p.y-16,duration:Math.max(120,Math.hypot(p.x-actor.x,p.y-16-actor.y)/.1),onComplete:step});
  };step();
  return route.length*320+450;
}
