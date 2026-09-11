import type * as Phaser from 'phaser';

/** Ground < props/actors < overhead foliage/roofs < UI.
 * Collision remains the trunk/building footprint, not its projected canopy.
 * The character compositor uses these same alpha silhouettes as occlusion masks. */
export function foreground(scene:Phaser.Scene,x:number,y:number,width:number,height:number,draw:(g:Phaser.GameObjects.Graphics)=>void){
  const g=scene.add.graphics();
  draw(g);
  const serial=(scene.data.get('foreground-serial')??0)+1;scene.data.set('foreground-serial',serial);
  const key=`foreground-${scene.scene.key}-${serial}`;
  g.generateTexture(key,width,height);g.destroy();
  const image=scene.add.image(x,y,key).setOrigin(0).setDepth(30).setData('story-foreground',true);
  image.once('destroy',()=>scene.textures.remove(key));
  return image;
}
