/** Shared world-space geography. Charts must not invent alternate river courses. */
export const ROAD_RIVER={x:512,y:32,width:128,height:536} as const;
export const ROAD_BRIDGE={x:480,y:256,width:192,height:96} as const;
export const ROAD_HOME={x:208,y:240} as const;
/** Readable centreline through the authored road's crossing, camp and orchard bends. */
export const ROAD_ROUTE=[[32,304],[1008,304],[1008,208],[1360,208],[1360,304],[1808,304],[1808,464],[2160,464],[2160,304],[2704,304],[2704,240],[2928,240],[2928,336],[3104,336]] as const;
export const WORDWOOD_RIVER=[[0,384],[96,400],[176,448],[288,464],[416,496],[528,464],[624,416],[656,320],[624,224],[656,112],[624,-64]] as const;
export const WORDWOOD_PATHS=[[256,320,64,576],[256,256,1088,64],[1280,320,64,576],[256,896,1088,64],[768,256,64,768],[256,576,1088,64]] as const;
export const WORDWOOD_BRIDGES=[{x:288,y:464,vertical:true},{x:656,y:288,vertical:false}] as const;
