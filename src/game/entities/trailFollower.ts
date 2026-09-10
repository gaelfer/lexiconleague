export interface TrailPoint {x:number;y:number}
/** Follow committed breadcrumb positions, retaining one tile of personal space. */
export class TrailFollower {
  private trail:TrailPoint[]=[];
  private last:TrailPoint;
  constructor(public position:TrailPoint,leader:TrailPoint){this.last={...leader};this.trail.push({...leader});}
  update(leader:TrailPoint,delta:number):TrailPoint {
    const tile={x:Math.floor(leader.x/32)*32+16,y:Math.floor(leader.y/32)*32+16};
    if(tile.x!==this.last.x||tile.y!==this.last.y){this.trail.push(tile);this.last=tile;}
    let budget=Math.max(0,delta)*0.18;
    while(this.trail.length>1&&budget>0){
      const target=this.trail[0],dx=target.x-this.position.x,dy=target.y-this.position.y,distance=Math.hypot(dx,dy);
      if(distance<=budget){this.position={...target};this.trail.shift();budget-=distance;}
      else{this.position={x:this.position.x+dx/distance*budget,y:this.position.y+dy/distance*budget};budget=0;}
    }
    return this.position;
  }
}
