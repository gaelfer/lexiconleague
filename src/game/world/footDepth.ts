import * as Phaser from 'phaser';
/** Match the alpha mask and rendered layer to the object's real ground contact. */
export function footDepth(scene:Phaser.Scene,image:Phaser.GameObjects.Image,foot:number){
 image.setData('story-occlusion-foot',foot);
 const update=()=>{const player=(scene as Phaser.Scene&{player?:{y:number}}).player;const front=!!player&&player.y<foot;image.setDepth(front?30:7).setData('story-foreground',front);};
 update();scene.events.on(Phaser.Scenes.Events.POST_UPDATE,update);image.once(Phaser.GameObjects.Events.DESTROY,()=>scene.events.off(Phaser.Scenes.Events.POST_UPDATE,update));return image;
}
