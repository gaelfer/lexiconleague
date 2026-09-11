import {OUTPOST_MAP} from '@/game/story/northernTrail';
import s from './AdventureUI.module.css';
export default function NorthernChart({position}:{position?:{x:number;y:number}}){
 const point=(x:number,y:number)=>({x:78+x*.17,y:8+y*.125});const tower=point(OUTPOST_MAP.x,OUTPOST_MAP.y);
 return <><div className={s.chart}><svg viewBox="0 0 320 216" role="img" aria-label="Northmeadow grassland and four-floor watchtower map" style={{width:'100%'}} shapeRendering="crispEdges">
 <rect width="320" height="216" fill="#dbc794"/><path d="M94 12H220V22H239V58H246V164H233V189H211V202H116V194H90V166H80V52H88Z" fill="#867e54" transform="translate(3 4)"/><path d="M94 12H220V22H239V58H246V164H233V189H211V202H116V194H90V166H80V52H88Z" fill="#aab276"/><path d="M105 35H219V66H229V166H211V184H119V173H99V67H105Z" fill="#bec28a"/>
 {Array.from({length:60},(_,i)=>{const x=104+i*37%118,y=65+i*53%116;return <path key={i} d={`M${x} ${y}h3v-2h2v4h-5Z`} fill={i%4?'#9ea971':'#e4d5a1'}/>;})}
 {Array.from({length:23},(_,i)=>{const x=i<11?89:233,y=25+(i%11)*15;return <path key={i} d={`M${x-4} ${y+6}v-7h3v-5h5v5h3v7Z`} fill={i%2?'#546f48':'#6e8654'}/>;})}
 <g transform={`translate(${tower.x} ${tower.y})`}><rect x="-8" y="-21" width="16" height="27" fill="#795c40"/>{[0,1,2,3].map(i=><g key={i}><rect x="-11" y={-22+i*7} width="22" height="2" fill="#493e32"/><rect x="-3" y={-19+i*7} width="4" height="4" fill="#d8bb81"/></g>)}<path d="M-14-23v-3h5v-3H9v3h5v3Z" fill="#3b5750"/></g>
 <text x="159" y="69" textAnchor="middle" fontSize="9" fill="#3b4f3b">Watchtower · four floors</text><text x="160" y="132" textAnchor="middle" fontSize="14" fill="#4d6744">NORTHMEADOW</text><text x="160" y="144" textAnchor="middle" fontSize="8" fill="#64734c">Open grassland</text><path d="M155 202v7h10v-7" fill="#e8d6a6"/><text x="160" y="214" textAnchor="middle" fontSize="8" fill="#445840">Inkwell Road ↓</text>
 {position&&<path d={`M${point(position.x,position.y).x} ${point(position.x,position.y).y-4}l-4 8h8Z`} fill="#315e6c" stroke="#f4e7bd"/>}
 </svg></div><p className={s.paperNote}>Northmeadow · no marked trail. The tower is the northern landmark. ▲ Your location</p></>;
}
