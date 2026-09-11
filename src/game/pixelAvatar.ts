/** Shared SVG-to-pixel conversion, independent of Phaser for deterministic tests. */
import { CHARACTER_FRAME } from './pixelScale';
export const AVATAR_FRAME = CHARACTER_FRAME;
/** Crop empty side margins, not the body. The source and destination aspect
 * ratios match, so the padded canvas never stretches a teardrop into a needle. */
export function avatarRasterPlacement(sourceWidth:number,sourceHeight:number,cropFraction=0.68){
  const cropWidth=sourceWidth*cropFraction;
  const scale=AVATAR_FRAME.width/cropWidth;
  return {sx:(sourceWidth-cropWidth)/2,sy:0,sw:cropWidth,sh:sourceHeight,
    dx:0,dy:AVATAR_FRAME.height/16,dw:AVATAR_FRAME.width,dh:sourceHeight*scale};
}
// Compensates the existing articulated hand/weapon rig's shared scale.
export const AVATAR_LAYER_WIDTH = 32 / 0.78;
export const AVATAR_LAYER_HEIGHT = 64 / 0.78;
export const AVATAR_FACE_LAYER_WIDTH = AVATAR_LAYER_WIDTH;
export const AVATAR_FACE_LAYER_HEIGHT = AVATAR_LAYER_HEIGHT;
const rgb=(color:number)=>[(color>>16)&255,(color>>8)&255,color&255];
const mix=(a:number[],b:number[],t:number)=>a.map((v,i)=>Math.round(v*(1-t)+b[i]*t));
export function inkPalette(color:number){
  const base=rgb(color);
  return [mix(base,[30,33,45],0.82),mix(base,[40,45,62],0.45),base,
    mix(base,[218,199,155],0.22),mix(base,[241,224,184],0.38)];
}

export function pixelizeAvatar(source:Uint8ClampedArray,width:number,height:number,bodyColor?:number,alphaThreshold=112,clusterPixels=false){
  const output=new Uint8ClampedArray(source.length);
  const opaque=(x:number,y:number)=>x>=0&&y>=0&&x<width&&y<height&&source[(y*width+x)*4+3]>=alphaThreshold;
  const palette=bodyColor===undefined?null:inkPalette(bodyColor);
  let minX=width,minY=height,maxX=0,maxY=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(opaque(x,y)){
    minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
  }
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    if(!opaque(x,y))continue;
    const i=(y*width+x)*4;
    let color:number[];
    if(palette){
      const u=(x-minX)/Math.max(1,maxX-minX),v=(y-minY)/Math.max(1,maxY-minY);
      const edge=!opaque(x-1,y)||!opaque(x+1,y)||!opaque(x,y-1)||!opaque(x,y+1);
      const rightRim=!opaque(x+3,y)||!opaque(x,y+3);
      // Five deliberate shade clusters, not an airbrushed gradient.
      const shade=edge?0:rightRim&&v>0.4?1:u+v>1.3?1:u<0.36&&v>0.22&&v<0.58?4:u+v<0.92?3:2;
      color=palette[shade];
    }else{
      // Keep cosmetic hues, with a restrained ramp and warm off-white highlights.
      color=[source[i],source[i+1],source[i+2]].map(v=>Math.min(255,Math.round(v/24)*24));
      if(color.every(v=>v>=240))color=[246,235,207];
    }
    output.set([...color,255],i);
  }
  // Story avatar layers share a 2x2 pixel grid within the 32x64 frame.
  if(!clusterPixels||width<4||height<4)return output;
  const clustered=new Uint8ClampedArray(output.length);
  for(let y=0;y<height;y+=2)for(let x=0;x<width;x+=2){
    let chosen=-1,bestAlpha=-1;
    for(let by=0;by<2;by++)for(let bx=0;bx<2;bx++){
      const px=x+bx,py=y+by;if(px>=width||py>=height)continue;
      const i=(py*width+px)*4;
      if(output[i+3]>bestAlpha){bestAlpha=output[i+3];chosen=i;}
    }
    if(chosen<0)continue;
    for(let by=0;by<2;by++)for(let bx=0;bx<2;bx++){
      const px=x+bx,py=y+by;if(px>=width||py>=height)continue;
      clustered.set(output.subarray(chosen,chosen+4),(py*width+px)*4);
    }
  }
  if(palette){
    // Rebuild the outline on the final block grid. Choosing a block's first
    // opaque pixel can otherwise replace a lower/right edge with interior shade.
    const filled=(x:number,y:number)=>x>=0&&y>=0&&x<width&&y<height&&clustered[(y*width+x)*4+3]!==0;
    for(let y=0;y<height;y+=2)for(let x=0;x<width;x+=2){
      if(!filled(x,y)||[[-2,0],[2,0],[0,-2],[0,2]].every(([dx,dy])=>filled(x+dx,y+dy)))continue;
      for(let by=0;by<2&&y+by<height;by++)for(let bx=0;bx<2&&x+bx<width;bx++)
        clustered.set([...palette[0],255],((y+by)*width+x+bx)*4);
    }
  }
  return clustered;
}
