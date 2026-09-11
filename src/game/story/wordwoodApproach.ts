/** Grid-aligned counterpart of the regional east / north / northeast trail. */
export const WORDWOOD_WAYFARER={x:144,y:2192};
export const WORDWOOD_APPROACH=[
 [144,2224],[496,2224],[496,2128],[592,2128],[592,2032],
 [688,2032],[688,1552],[752,1552],[752,1456],[816,1456],[816,1104],
] as const;
export const APPROACH_BLOTLINGS=[[432,2224],[656,1904],[784,1488]] as const;
export function approachEnemySpawns(bossDefeated:boolean|undefined){return bossDefeated?[]:APPROACH_BLOTLINGS;}
export const APPROACH_RIVER=[[0,1456],[336,1488],[464,1584],[592,1712],[688,1808],[848,1872],[1136,1968],[1648,2096]] as const;
export const APPROACH_BRIDGE={x:624,y:1648,width:128,height:320};
export function approachRiverDistance(x:number,y:number){
 return Math.min(...APPROACH_RIVER.slice(1).map((b,i)=>{const a=APPROACH_RIVER[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);}));
}
export function nearApproach(x:number,y:number,margin=80){
 return WORDWOOD_APPROACH.slice(1).some((b,i)=>{
  const a=WORDWOOD_APPROACH[i];
  return x>=Math.min(a[0],b[0])-margin&&x<=Math.max(a[0],b[0])+margin&&y>=Math.min(a[1],b[1])-margin&&y<=Math.max(a[1],b[1])+margin;
 });
}
