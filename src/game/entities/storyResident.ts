import type * as Phaser from 'phaser';
import {createInkHand,createInkFoot} from './inkHand';
import {AVATAR_LAYER_WIDTH as W,AVATAR_LAYER_HEIGHT as H,AVATAR_FACE_LAYER_WIDTH as FW,AVATAR_FACE_LAYER_HEIGHT as FH} from '../pixelAvatar';
import {registerSpeaker} from './inklingSpeech';
export function storyResident(scene:Phaser.Scene,x:number,y:number,index:number,name:string,color:number,copper=false){
 const rig=scene.add.container(x,y-16).setScale(.78).setDepth(10).setName(`resident-${name}`);
 const feet=[createInkFoot(scene,-10,21,color),createInkFoot(scene,10,21,color)];
 const eyes=scene.add.image(0,0,`npc-${index}-eyes`).setDisplaySize(FW,FH);
 const body=scene.add.image(0,0,copper?'road-knight-base':`npc-${index}-base`).setDisplaySize(W,H);
 rig.add([scene.add.ellipse(0,23,32,10,0x10242b,.3),...feet,body,eyes,scene.add.image(0,0,`npc-${index}-accessory`).setDisplaySize(W,H),createInkHand(scene,-15,7,color),createInkHand(scene,15,7,color)]);
 registerSpeaker(scene,name,rig);
 return {rig,body,eyes,feet,pose:(time:number,moving:boolean,dy=0)=>{eyes.setVisible(dy<=0);feet[0].setY(21+(moving?Math.round(Math.sin(time/100)*3):0));feet[1].setY(21-(moving?Math.round(Math.sin(time/100)*3):0));}};
}
