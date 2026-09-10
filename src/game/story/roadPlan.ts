/** Four connected outdoor compositions; seal positions remain save-compatible. */
export const ROAD_PATHS = [
  [32,256,832,96], [96,224,352,160],
  [864,256,160,96],[960,160,96,192],[960,160,416,96],
  [1312,160,96,192],[1312,256,352,96],
  [1664,256,192,96],[1760,288,96,192],[1760,416,448,96],
  [2112,288,96,192],[2112,256,416,96],
  [2464,224,256,128],[2656,192,96,160],[2656,192,288,96],
  [2880,192,96,160],[2880,288,224,160],
] as const;
export const ROAD_CLEARINGS = [[64,192,416,224],[1056,96,224,256],[1824,320,288,192],[2592,128,512,352]] as const;
export function roadWalkableTile(x:number,y:number){
  return [...ROAD_PATHS,...ROAD_CLEARINGS].some(([px,py,w,h])=>x>=px&&x<px+w&&y>=py&&y<py+h);
}
