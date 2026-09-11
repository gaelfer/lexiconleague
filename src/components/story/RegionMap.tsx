'use client';
import {useEffect,useRef,useState} from 'react';
import {AREA_NAMES,type AdventureArea} from '@/lib/story/adventure';
import {gateWaypoint,type QuestWaypoint} from '@/lib/story/waypoints';
import {TOWN} from '@/game/story/townPlan';
import {ROAD_HOME,ROAD_RIVER,ROAD_BRIDGE,ROAD_ROUTE,WORDWOOD_RIVER,WORDWOOD_PATHS,WORDWOOD_BRIDGES} from '@/game/story/mapGeography';
import {worldPoint,regionPoint,trailPoint} from '@/lib/story/mapProjection';
import {WORDWOOD_APPROACH} from '@/game/story/wordwoodApproach';
import {drawLocalChart} from './localCharts';
import s from './AdventureUI.module.css';

type Mark={x:number;y:number;label:string};
const anchors:Record<AdventureArea,Mark>={road:{x:105,y:164,label:'Inkwell Road'},village:{x:176,y:184,label:'Inkwell'},wordwood:{x:246,y:76,label:'Wordwood'}};
function drawChart(canvas:HTMLCanvasElement,view:'region'|AdventureArea){
 const c=canvas.getContext('2d');if(!c)return;c.imageSmoothingEnabled=false;c.fillStyle='#d5bf87';c.fillRect(0,0,320,216);
 const rect=(x:number,y:number,w:number,h:number,color:string)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 // Deterministic paper grain uses sparse fibres, not tiled noise.
 for(let i=0;i<180;i++){const x=(i*137)%320,y=(i*79)%216;rect(x,y,2+i%6,1,i%2?'#cfb87e':'#dfcb97');}
 const land=view==='region'?[[24,131],[57,88],[90,69],[113,36],[168,20],[196,37],[243,26],[278,47],[294,84],[276,111],[247,134],[220,129],[193,156],[151,184],[103,187],[56,185],[24,171]]:view==='road'?[[18,52],[32,35],[80,41],[114,25],[161,41],[200,30],[244,44],[287,38],[304,72],[300,145],[280,166],[236,175],[193,169],[152,184],[108,176],[64,180],[30,160],[15,114]]:[[22,24],[278,15],[298,45],[298,180],[274,200],[39,200],[19,173],[17,55]];
 const inside=(x:number,y:number)=>{let hit=false;for(let i=0,j=land.length-1;i<land.length;j=i++){const [xi,yi]=land[i],[xj,yj]=land[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)hit=!hit;}return hit;};
 for(let y=10;y<206;y+=2)for(let x=12;x<308;x+=2){if(inside(x-4,y-5))rect(x,y,2,2,'#927b4f');if(inside(x,y)){const edge=!inside(x-3,y-3)||!inside(x+3,y+3);rect(x,y,2,2,edge?'#b1a06a':x>206&&y<110?'#a7ad72':'#b7b47c');}}
 function line(points:number[][],width:number,color:string){for(let n=1;n<points.length;n++){const [ax,ay]=points[n-1],[bx,by]=points[n],steps=Math.max(Math.abs(bx-ax),Math.abs(by-ay));for(let i=0;i<=steps;i++)rect(ax+(bx-ax)*i/steps-width/2,ay+(by-ay)*i/steps-width/2,width,width,color);}}
 const project=(area:AdventureArea,x:number,y:number)=>view==='region'?regionPoint(area,x,y):worldPoint(area,x,y);
 const water:{course:number[][];width:number}[]=[];
 const river=(area:AdventureArea,points:readonly (readonly number[])[],width:number)=>{
  const course=points.map(([x,y])=>{const p=project(area,x,y);return [p.x,p.y];});
  water.push({course,width});
  line(course,width+3,'#747e68');line(course,width,'#719b95');line(course,Math.max(1,width/3),'#afc4a7');
 };
 if(view==='region'){
  // Regional rivers continue beyond the small playable areas; only local charts show exact courses.
  for(const course of [[[128,42],[108,58],[100,78],[77,96],[63,121],[58,145],[58,163],[66,185]],[[246,27],[259,43],[259,61],[245,72],[224,76],[207,89],[190,110],[198,122],[213,138],[226,150]]]){
   water.push({course,width:5});line(course,8,'#747e68');line(course,5,'#719b95');line(course,2,'#afc4a7');
  }
 }
 if(view==='road'){
  river('road',[[ROAD_RIVER.x+ROAD_RIVER.width/2,ROAD_RIVER.y],[ROAD_RIVER.x+ROAD_RIVER.width/2,ROAD_RIVER.y+ROAD_RIVER.height]],ROAD_RIVER.width/3200*276);
  const bank=worldPoint('road',ROAD_RIVER.x+ROAD_RIVER.width/2,ROAD_RIVER.y);
  for(let y=bank.y+5;y<worldPoint('road',576,568).y;y+=8){rect(bank.x-3,y,5,1,'#bed1b7');rect(bank.x+7,y+3,2,4,'#81936a');rect(bank.x-9,y,2,3,'#b2b384');}
 }
 if(view==='wordwood')river('wordwood',WORDWOOD_RIVER,68/1600*272);
 let seed=27;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const nearWater=(x:number,y:number)=>water.some(({course,width})=>course.slice(1).some((b,i)=>{const a=course[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)<width/2+7;}));
 for(let i=0;i<110;i++){const x=30+Math.floor(random()*255),y=28+Math.floor(random()*160);if(!inside(x,y)||!inside(x+9,y+11)||nearWater(x+6,y+6))continue;if(view==='village'&&x>75&&x<250)continue;if(view==='region'&&x>125&&x<196&&y>68&&y<158)continue;rect(x+5,y+9,3,4,'#76764e');rect(x+2,y+4,9,6,'#526d50');rect(x+4,y,5,4,'#6e8758');rect(x+2,y+4,4,3,'#8f9c63');rect(x+8,y+8,3,3,'#405e4c');}
 if(view==='region'){
  // The shared gatehouse is the junction, not the village: west road,
  // south village, east forest. Keep the regional survey deliberately broad.
  for(const road of [[[36,154],[154,154]],[[154,154],[154,176],[176,176]],[[154,154],[186,154],[198,136],[198,106],[218,92],[246,69]]]){line(road,6,'#8a8358');line(road,3,'#e1ce96');}
  for(let i=0;i<4;i++){const x=120+i*13,y=45-i%2*6;rect(x,y+8,17,3,'#808361');for(let n=0;n<8;n++)rect(x+8-n,y+n,n*2+1,1,n<4?'#c8c295':'#929875');rect(x+6,y+2,3,3,'#e5d7ad');}
 }else if(view==='wordwood'){
  for(const [x,y,w,h] of [...WORDWOOD_PATHS,[768,928,96,240]]){const p=worldPoint(view,x,y);rect(p.x,p.y,w/1600*272,h/2400*180,'#e1cf9b');}
  const trail=WORDWOOD_APPROACH.map(([x,y])=>{const p=worldPoint('wordwood',x,y);return [p.x,p.y];});line(trail,6,'#8a8358');line(trail,4,'#e1cf9b');
 }else if(view==='village'){
  for(const [x,y,w,h] of TOWN.streets){const p=worldPoint(view,x,y);rect(p.x,p.y,w/1280*200,h/1536*192,'#e1cf9b');}
 }else{
  const course=ROAD_ROUTE.map(([x,y])=>{const p=worldPoint('road',x,y);return [p.x,p.y];});
  line(course,9,'#929063');line(course,7,'#ceb987');line(course,4,'#ebdbad');
  const home=worldPoint('road',ROAD_HOME.x,ROAD_HOME.y),door=worldPoint('road',ROAD_HOME.x,304);
  line([[home.x,home.y],[door.x,door.y]],4,'#e2d09d');
 }
 function building(x:number,y:number,grand=false){rect(x-5,y-2,12,10,'#777555');rect(x-6,y-5,12,10,'#d3c49a');rect(x-3,y,3,5,'#495649');rect(x-8,y-7,16,3,'#5d6d69');rect(x-6,y-10,12,3,'#76837a');if(grand){rect(x-6,y-4,2,8,'#eee0b1');rect(x+3,y-4,2,8,'#eee0b1');}}
 if(view==='region'){
  building(176,176,true);const home=regionPoint('road',ROAD_HOME.x,ROAD_HOME.y);building(home.x,home.y);
  // One memorable tree stamp represents all of Wordwood on the broad regional chart.
  rect(242,62,7,13,'#66523c');rect(243,62,2,11,'#af925e');rect(233,47,26,15,'#415f43');rect(236,41,20,8,'#597549');rect(240,37,12,5,'#81965b');rect(231,54,30,7,'#4a6b48');rect(235,45,8,8,'#91a363');rect(250,52,8,11,'#34563e');
 }else if(view==='wordwood'){for(const [x,y] of [[432,272],[1136,592],[1008,912],[816,112]]){const p=worldPoint(view,x,y);building(p.x,p.y,x===816);}}else if(view==='village'){for(const b of TOWN.buildings){const p=worldPoint(view,b.x,b.y);building(p.x,p.y,b.id==='archive');}}else{
  const home=worldPoint('road',ROAD_HOME.x,ROAD_HOME.y);building(home.x,home.y);
  const camp=worldPoint('road',1184,272);for(let y=0;y<8;y++)rect(camp.x-8+y,camp.y-9+y,16-y*2,1,y<3?'#ede0b9':'#c2b086');rect(camp.x-8,camp.y,17,2,'#867454');
  const orchard=worldPoint('road',1936,320);for(const dx of [-6,0,6]){rect(orchard.x+dx,orchard.y-6,5,5,'#738c55');rect(orchard.x+dx+2,orchard.y-4,2,2,'#b78a57');}
 }
 if(view==='region'||view==='road'){const a=project('road',ROAD_BRIDGE.x,ROAD_BRIDGE.y+48),b=project('road',ROAD_BRIDGE.x+ROAD_BRIDGE.width,ROAD_BRIDGE.y+48);line([[a.x,a.y],[b.x,b.y]],view==='region'?3:9,'#977949');line([[a.x,a.y],[b.x,b.y]],1,'#d3b97a');}
 if(view==='wordwood')for(const bridge of WORDWOOD_BRIDGES){const p=project('wordwood',bridge.x,bridge.y),length=16;rect(p.x-(bridge.vertical?2:length/2),p.y-(bridge.vertical?length/2:2),bridge.vertical?4:length,bridge.vertical?length:4,'#987a50');}
 // The same twin stone towers identify the Wayfarer entrances on every chart.
 const gate=view==='region'?{x:154,y:154}:worldPoint(view,gateWaypoint[view].x,gateWaypoint[view].y);
 rect(gate.x-9,gate.y-10,19,14,'#696d59');rect(gate.x-8,gate.y-12,5,14,'#dbcea5');rect(gate.x+4,gate.y-12,5,14,'#b3b695');rect(gate.x-3,gate.y-9,7,4,'#ddd1a7');rect(gate.x-2,gate.y-5,5,7,'#384f4b');rect(gate.x-9,gate.y-14,7,3,'#657c73');rect(gate.x+3,gate.y-14,7,3,'#657c73');rect(gate.x-7,gate.y-11,1,10,'#f1e2b7');
 // Hand-inked compass and corner registration marks.
 line([[30,182],[30,201]],1,'#8c784e');line([[21,192],[39,192]],1,'#8c784e');line([[30,182],[27,191],[30,189],[33,191],[30,182]],1,'#786849');
 for(const [x,y] of [[8,8],[304,8],[8,200],[304,200]]){rect(x,y,8,1,'#a38b58');rect(x,y,1,8,'#a38b58');}
}
export default function RegionMap({area,waypoints,position}:{area:AdventureArea;waypoints:QuestWaypoint[];position?:{x:number;y:number}}){
 const [view,setView]=useState<'region'|AdventureArea|'wordwood-trail'>('region'),canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{if(canvas.current){if(view==='wordwood'||view==='village'||view==='wordwood-trail')drawLocalChart(canvas.current,view);else drawChart(canvas.current,view);}},[view]);
 const localPoint=(x:number,y:number)=>view==='wordwood-trail'?trailPoint(x,y):worldPoint(view==='region'?area:view,x,y);
 const offChart=area==='wordwood'&&position&&((view==='wordwood'&&position.y>1200)||(view==='wordwood-trail'&&position.y<1200));
 const player=position&&!offChart?(view==='region'?regionPoint(area,position.x,position.y):localPoint(position.x,position.y)):undefined;
 const labels:Mark[]=view==='region'?[...Object.values(anchors),{...regionPoint('road',ROAD_HOME.x,ROAD_HOME.y),label:'Your house'}]:view==='wordwood'?[{...worldPoint(view,816,112),label:'Repository'},{...worldPoint(view,432,272),label:'Workshop'},{...worldPoint(view,1136,592),label:'Rain Gallery'},{...worldPoint(view,1008,912),label:'Storehouse'}]:view==='village'?[{...worldPoint(view,1040,320),label:'Archive'},{...worldPoint(view,848,1200),label:'Lantern Inn'}]:[{...worldPoint('road',ROAD_HOME.x,ROAD_HOME.y),label:'Your house'},{...worldPoint('road',3056,336),label:'Wayfarer Gate'},{...worldPoint('road',1184,282),label:'Survey camp'},{...worldPoint('road',1936,340),label:'Old orchard'},{x:170,y:180,label:'Inkwell Road'}];
 if(view==='wordwood-trail')labels.splice(0,labels.length,{...trailPoint(gateWaypoint.wordwood.x,gateWaypoint.wordwood.y),label:'Wayfarer Gate'},{...trailPoint(816,1232),label:'To Wordwood Clearing'},{...trailPoint(864,1808),label:'River crossing'});
 if(view==='region')labels.push({x:154,y:124,label:'Wayfarer Gate'});
 else if(view==='village')labels.push({...worldPoint(view,gateWaypoint[view].x,gateWaypoint[view].y),label:'Wayfarer Gate'},{...worldPoint(view,208,176),label:'Bakery'},{...worldPoint(view,432,176),label:'Scriptorium'});
 else if(view==='wordwood')labels.push({...worldPoint(view,800,1120),label:'To Wayfarer approach'});
 return <section>
  <div className={s.chartControls}><label>Chart <select value={view} onChange={e=>setView(e.target.value as typeof view)}><option value="region">Inkwell region</option><option value={area}>{AREA_NAMES[area]} · {area==='wordwood'?'Clearing':'Local chart'}</option>{area==='wordwood'&&<option value="wordwood-trail">Wordwood · Wayfarer approach</option>}</select></label><span>North ↑</span></div>
  <div className={s.chart}><canvas ref={canvas} width="320" height="216" aria-label={`${view==='region'?'Inkwell region':view==='wordwood-trail'?'Wayfarer approach':AREA_NAMES[view]} pixel-art map`} role="img"/>
   {labels.map(mark=><span key={mark.label} className={s.chartLabel} style={{left:`${mark.x/320*100}%`,top:`${(mark.y+8)/216*100}%`}}>{mark.label}</span>)}
   {player&&<span className={s.playerPin} title="Your location" aria-label="Your location" data-map-x={player.x} data-map-y={player.y} style={{left:`${player.x/320*100}%`,top:`${player.y/216*100}%`}}>▲</span>}
   {waypoints.map((waypoint,index)=>{const target=view==='region'?regionPoint(waypoint.area,waypoint.x,waypoint.y):view==='wordwood-trail'?waypoint.area==='wordwood'?trailPoint(816,1216):trailPoint(gateWaypoint.wordwood.x,gateWaypoint.wordwood.y):view===waypoint.area?worldPoint(view,waypoint.x,waypoint.y):view==='wordwood'?worldPoint('wordwood',816,1184):worldPoint(view,gateWaypoint[view].x,gateWaypoint[view].y);const same=waypoints.slice(0,index).filter(other=>view==='region'?other.area===waypoint.area:other.area!==view&&waypoint.area!==view).length;return <span key={waypoint.questId} className={`${s.questPin} ${s.coloredPin}`} data-kind={waypoint.kind} title={waypoint.label} aria-label={`${waypoint.kind==='main'?'Main':'Side'} quest waypoint: ${waypoint.label}`} style={{left:`${(target.x+same*7)/320*100}%`,top:`${(target.y-9)/216*100}%`}}>◆</span>;})}
  </div>
  {offChart&&<p className={s.muted}>You are in {position!.y>1200?'the Wayfarer approach':'Wordwood Clearing'}. Select that chart above to see your position.</p>}
  <div className={s.chartLegend}><span>▲ You are here</span>{waypoints.map(point=><span key={point.questId} className={s.mapQuestLegend} data-kind={point.kind}>◆ {point.kind==='main'?'Main':'Side'} · {point.label}</span>)}</div><p className={s.muted}>An ink-and-parchment survey. Blue marks your main quest; yellow marks your tracked side quests.</p>
 </section>;
}
