import * as Phaser from 'phaser';

/** A continuous spring-fed stream; rain changes the weather, not its existence. */
export function wordwoodStream(scene:Phaser.Scene,terrain:Phaser.GameObjects.Graphics){
  const points=[[0,384],[96,400],[176,448],[288,464],[416,496],[528,464],[624,416],[656,320],[624,224],[656,112],[624,-64]];
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
  const total=lengths.reduce((a,b)=>a+b,0);
  const at=(distance:number)=>{
    let d=Phaser.Math.Wrap(distance,0,total);
    for(let i=0;i<lengths.length;i++){
      if(d<=lengths[i]){const a=points[i],b=points[i+1],t=d/lengths[i];return {x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,dx:(b[0]-a[0])/lengths[i],dy:(b[1]-a[1])/lengths[i]};}
      d-=lengths[i];
    }
    return {x:0,y:384,dx:1,dy:0};
  };
  // Broad stepped banks, shallow green margins and a darker central current.
  for(const [width,color] of [[88,0x3d5945],[76,0x71816a],[68,0x537d79],[52,0x345f6a],[26,0x2c5363]]){
    terrain.fillStyle(color);
    for(let d=0;d<total;d+=4){const p=at(d);terrain.fillRect(Math.round((p.x-width/2)/2)*2,Math.round((p.y-width/2)/2)*2,width,width);}
  }
  const flow=scene.add.graphics().setDepth(-19).setName('wordwood-stream-current');
  let elapsed=0;
  const covered=(x:number,y:number)=>
    (x>=248&&x<=328&&y>=320&&y<=896)||(x>=256&&x<=1344&&y>=256&&y<=320);
  const animate=(_time:number,delta:number)=>{
    elapsed+=delta;flow.clear();
    for(let i=0;i<45;i++){
      // Travel from the northern spring toward the western edge.
      const p=at(i*total/45-elapsed*.025),lane=(i%5-2)*8;
      const x=Math.round((p.x-p.dy*lane)/2)*2,y=Math.round((p.y+p.dx*lane)/2)*2;
      if(covered(x,y))continue;
      flow.fillStyle(i%3?0x8cbbb3:0xb3cdc0,i%3?.45:.65);
      for(let j=0;j<4;j++)flow.fillRect(x+Math.round(p.dx*j*3/2)*2,y+Math.round(p.dy*j*3/2)*2,4,2);
    }
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE,animate);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>scene.events.off(Phaser.Scenes.Events.UPDATE,animate));
}
