import * as Phaser from 'phaser';
import { AVATAR_FRAME, AVATAR_LAYER_HEIGHT, AVATAR_FACE_LAYER_HEIGHT, avatarRasterPlacement, pixelizeAvatar } from '../pixelAvatar';

/** Called once in Boot, before any sprite references the texture being replaced. */
export function convertAvatarTexture(scene:Phaser.Scene,key:string,bodyColor?:number,outputKey=key,cropFraction=0.68,bodyCrop=cropFraction){
  if(!scene.textures.exists(key))return;
  const canvas=document.createElement('canvas');
  canvas.width=AVATAR_FRAME.width;canvas.height=AVATAR_FRAME.height;
  const context=canvas.getContext('2d',{willReadFrequently:true});
  if(!context)throw new Error('Avatar pixel conversion requires a 2D canvas.');
  // Area sampling happens once; alpha quantization removes the resulting soft edge.
  const source=scene.textures.get(key).getSourceImage() as HTMLImageElement;
  const p=avatarRasterPlacement(source.width,source.height,cropFraction);
  if(key.endsWith('-eyes')){
    // Anchor the expression at its authored eye/mouth center (50%, 58%).
    // A tighter crop grows around this point, not down from the SVG's top.
    // Compensate for the face's 48px display height versus the body's 64px.
    const body=avatarRasterPlacement(source.width,source.height,bodyCrop);
    const center=AVATAR_FRAME.height/2;
    const target=center+(body.dy+body.dh*0.58-center)*(AVATAR_LAYER_HEIGHT/AVATAR_FACE_LAYER_HEIGHT);
    p.dy=target-p.dh*0.58;
  }
  context.drawImage(source,p.sx,p.sy,p.sw,p.sh,p.dx,p.dy,p.dw,p.dh);
  const image=context.getImageData(0,0,canvas.width,canvas.height);
  // Face SVGs use translucent mouth, eyelid, and highlight strokes. A lower
  // alpha cutoff keeps those authored details—especially Pip's sleepy face—
  // while body silhouettes retain their firmer edge threshold.
  const alphaThreshold=key.endsWith('-eyes')?48:112;
  image.data.set(pixelizeAvatar(image.data,canvas.width,canvas.height,bodyColor,alphaThreshold,key.endsWith('-base')));
  context.putImageData(image,0,0);
  if(scene.textures.exists(outputKey))scene.textures.remove(outputKey);
  scene.textures.addCanvas(outputKey,canvas)?.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

/** Fit the whole cosmetic stack together. Wide star bodies or wings must not
 * be clipped, nor may individual layers choose different alignment scales. */
export function convertAvatarGroup(scene:Phaser.Scene,layers:{key:string;color?:number}[]){
  const sample=document.createElement('canvas');sample.width=sample.height=64;
  const ctx=sample.getContext('2d',{willReadFrequently:true})!;
  let extent=0.34;
  for(const {key} of layers){
    if(!scene.textures.exists(key))continue;
    ctx.clearRect(0,0,64,64);
    ctx.drawImage(scene.textures.get(key).getSourceImage() as CanvasImageSource,0,0,64,64);
    const data=ctx.getImageData(0,0,64,64).data;
    for(let y=0;y<64;y++)for(let x=0;x<64;x++)if(data[(y*64+x)*4+3]>=112)
      extent=Math.max(extent,Math.abs(x-32)/64,Math.abs(x+1-32)/64);
  }
  const groupCrop=Math.min(1,extent*2);
  for(const {key,color} of layers){
    // The face occupies more of its smaller 24x48 display layer, keeping eyes
    // and mouths legible without enlarging the layer over the body.
    const crop=key.endsWith('-eyes')?Math.max(0.5,groupCrop*0.84):groupCrop;
    convertAvatarTexture(scene,key,color,key,crop,groupCrop);
  }
}
