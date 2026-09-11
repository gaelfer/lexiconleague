import {worldPoint,trailPoint} from '@/lib/story/mapProjection';
import {TOWN} from '@/game/story/townPlan';
import {WORDWOOD_PATHS,WORDWOOD_RIVER,WORDWOOD_BRIDGES} from '@/game/story/mapGeography';
import {WORDWOOD_APPROACH,WORDWOOD_WAYFARER,APPROACH_RIVER,APPROACH_BRIDGE} from '@/game/story/wordwoodApproach';

/** Original pixel cartography: geography beneath small architectural illustrations. */
export function drawLocalChart(canvas:HTMLCanvasElement,view:'wordwood'|'village'|'wordwood-trail'){
 const c=canvas.getContext('2d');if(!c)return;c.imageSmoothingEnabled=false;
 const r=(x:number,y:number,w:number,h:number,color:string)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const point=(x:number,y:number)=>view==='wordwood-trail'?trailPoint(x,y):worldPoint(view,x,y);
 const line=(points:readonly (readonly number[])[],width:number,color:string)=>{for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],steps=Math.max(1,Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));for(let t=0;t<=steps;t++)r(a[0]+(b[0]-a[0])*t/steps-width/2,a[1]+(b[1]-a[1])*t/steps-width/2,width,width,color);}};
 const project=(points:readonly (readonly number[])[])=>points.map(([x,y])=>{const p=point(x,y);return [p.x,p.y];});
 r(0,0,320,216,'#d8c491');
 for(let i=0;i<180;i++)r(i*137%320,i*73%216,2+i%4,1,i%2?'#ddcc9f':'#d0bd89');
 // Soft irregular survey boundary, not a rectangular grass tile.
 for(let y=18;y<199;y+=2){const inset=15+Math.round(Math.abs(y-108)/17)+(Math.floor(y/18)%3)*2;r(inset+3,y+4,320-inset*2,2,'#9f9267');r(inset,y,320-inset*2,2,view==='village'?'#bcb887':'#a5ad79');}
 const paths:number[][]=[];
 if(view==='wordwood-trail')paths.push(...project(WORDWOOD_APPROACH));
 const rectPath=(x:number,y:number,w:number,h:number)=>{const p=point(x,y),end=point(x+w,y+h);r(p.x-1,p.y-1,end.x-p.x+2,end.y-p.y+2,'#8f9267');r(p.x,p.y,end.x-p.x,end.y-p.y,'#dbca98');r(p.x+1,p.y+1,Math.max(1,end.x-p.x-2),Math.max(1,end.y-p.y-2),'#e6d7aa');};
 const streets=view==='village'?TOWN.streets:view==='wordwood'?WORDWOOD_PATHS:[];
 for(const [x,y,w,h] of streets)rectPath(x,y,w,h);
 if(paths.length){line(paths,8,'#899166');line(paths,6,'#d6c28c');line(paths,3,'#ead8a6');}
 if(view==='wordwood')rectPath(768,928,64,272);
 // Tree groves are placed around paths and buildings, never over their marks.
 const buildings=view==='village'?TOWN.buildings.map(b=>({...b,p:point(b.x,b.y)})):view==='wordwood'?[
  {id:'workshop',x:432,y:240},{id:'gallery',x:1136,y:560},{id:'store',x:1008,y:880},{id:'repository',x:816,y:80},
 ].map(b=>({...b,p:point(b.x,b.y)})):[];
 const rivers=view==='village'?[]:project(view==='wordwood'?WORDWOOD_RIVER:APPROACH_RIVER);
 const nearLine=(x:number,y:number,points:number[][],range:number)=>points.slice(1).some((b,i)=>{const a=points[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t)<range;});
 for(let i=0;i<150;i++){
  const x=28+(i*71%265),y=28+(i*47%150);
  if(view==='village'&&x>79&&x<245)continue;
  if(buildings.some(b=>Math.hypot(x-b.p.x,y-b.p.y)<20)||nearLine(x,y,rivers,14)||nearLine(x,y,paths,14))continue;
  if(streets.some(([sx,sy,w,h])=>{const a=point(sx,sy),b=point(sx+w,sy+h);return x>a.x-9&&x<b.x+9&&y>a.y-9&&y<b.y+9;}))continue;
  r(x+3,y+8,10,3,'#7d895e');r(x+6,y+5,2,7,'#756144');r(x+1,y+2,11,6,'#49694d');r(x+3,y-2,7,5,'#668252');r(x+4,y-3,4,2,'#96a568');r(x+2,y+2,4,2,'#81985e');r(x+9,y+5,3,3,'#365642');
 }
 if(rivers.length){line(rivers,13,'#7d8e6d');line(rivers,10,'#b4b796');line(rivers,8,'#67938e');line(rivers,4,'#8eafa2');for(let i=1;i<rivers.length;i++){const a=rivers[i-1],b=rivers[i];for(let t=.2;t<1;t+=.3)r(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,4,1,'#d1d8b6');}}
 const bridge=(x:number,y:number,vertical:boolean)=>{const p=point(x,y);r(p.x-(vertical?4:10),p.y-(vertical?10:4),vertical?8:20,vertical?20:8,'#725e40');for(let i=-8;i<9;i+=3)r(p.x+(vertical?-3:i),p.y+(vertical?i:-3),vertical?6:2,vertical?2:6,'#c5aa72');};
 if(view==='wordwood')WORDWOOD_BRIDGES.forEach(b=>bridge(b.x,b.y,b.vertical));
 if(view==='wordwood-trail')bridge(APPROACH_BRIDGE.x+APPROACH_BRIDGE.width/2,APPROACH_BRIDGE.y+APPROACH_BRIDGE.height/2,true);
 const house=(x:number,y:number,id:string)=>{
  const grand=['archive','inn','repository','gallery','store'].includes(id),w=grand?22:15;
  r(x-w/2+3,y-5,w,14,'#7b7d5e');r(x-w/2,y-12,w,16,'#d5c79e');r(x-w/2,y-12,2,15,'#f0deb1');r(x+w/2-3,y-11,3,15,'#a6a98a');
  const roof=['workshop','nell','gardener','mapmaker','tea-room'].includes(id)?'#8c6950':'#526e6e';
  for(let row=0;row<6;row++){r(x-w/2-2+row,y-15-row,w+4-row*2,1,roof);if(row===2)r(x-w/2+row,y-15-row,w-row*2,1,'#a3ada0');}
  r(x-2,y-3,4,7,'#3d514a');for(const dx of [-w/2+4,w/2-6]){r(x+dx,y-10,3,4,'#55665c');r(x+dx,y-10,2,3,'#ebd495');}
  if(grand){r(x-w/2+2,y-6,w-4,1,'#eee0b8');r(x-w/2-2,y+3,w+4,2,'#a2a88a');}
  if(id==='archive'||id==='repository'){r(x-5,y-14,10,5,'#d8d0ad');r(x-3,y-13,6,2,'#7a897a');}
  if(id==='inn'){r(x+6,y-28,4,9,'#9a997c');r(x-10,y-10,20,2,'#8c6950');}
 };
 for(const b of buildings){
  if(view==='village'){const door=point(b.x,b.y+86);line([[b.p.x,b.p.y+3],[door.x,door.y+4]],4,'#ded0a4');}
  house(b.p.x,b.p.y,b.id);
 }
 if(view==='village'){
  // The planted central court and the southern promenade distinguish town from forest.
  const court=point(496,864);r(court.x-16,court.y-10,30,21,'#8f9b6a');r(court.x-13,court.y-7,24,15,'#b1b982');r(court.x-2,court.y-7,2,15,'#d8c898');r(court.x-13,court.y,24,2,'#d8c898');
 }
 if(view!=='wordwood'){
  const gate=view==='village'?point(TOWN.gatehouse.x,TOWN.gatehouse.y):point(WORDWOOD_WAYFARER.x,WORDWOOD_WAYFARER.y);
  house(gate.x,gate.y,'gate');for(const dx of [-9,5]){r(gate.x+dx,gate.y-17,5,19,'#dad0ac');r(gate.x+dx-1,gate.y-19,7,3,'#59746d');}r(gate.x-3,gate.y-9,7,11,'#36534a');
 }
 // Inked compass, scale ticks and restrained border rule.
 line([[12,10],[308,10]],1,'#aa9565');line([[12,206],[308,206]],1,'#aa9565');
 line([[28,184],[28,198]],1,'#796b48');line([[22,191],[34,191]],1,'#796b48');line([[28,182],[25,188],[31,188],[28,182]],1,'#796b48');
 for(let x=252;x<=292;x+=10)r(x,194,1,4,'#89774f');r(252,196,40,1,'#89774f');
}
