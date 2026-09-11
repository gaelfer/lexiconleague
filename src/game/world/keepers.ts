import * as Phaser from 'phaser';
import {createInkHand,createInkFoot} from '../entities/inkHand';
import {compactDialogue} from './compactDialogue';

/** One reusable rig for rescue, home life and outdoor work. Feet articulate, never the body. */
export function createKeeper(scene:Phaser.Scene,kind:'gardener'|'bridgekeeper',x:number,y:number,activity='home'){
  const gardener=kind==='gardener',color=gardener?0x65a765:0xb95248;
  const feet=[createInkFoot(scene,-8,21,color),createInkFoot(scene,8,21,color)];
  const hands=[createInkHand(scene,-14,7,color),createInkHand(scene,14,7,color)];
  const face=scene.add.image(0,0,gardener?'gardener-eyes':'npc-1-eyes').setDisplaySize(32/.78,64/.78);
  const tools=scene.add.graphics();
  const actor=scene.add.container(x,y,[scene.add.ellipse(0,22,32,10,0x10252b,.4),...feet,
    scene.add.image(0,0,`${kind}-base`).setDisplaySize(32/.78,64/.78),face,...hands,tools])
    .setScale(.78).setDepth(10).setName(`keeper-${kind}`).setData('activity',activity);
  let elapsed=0,px=x,py=y;
  const animate=(_time:number,delta:number)=>{
    if(!actor.active)return;
    if(actor.getData('speaking'))return;
    elapsed+=delta;
    const dx=actor.x-px,dy=actor.y-py,moving=Math.abs(dx)+Math.abs(dy)>.1;
    const stride=moving?(Math.floor(elapsed/130)%2?3:-3):0;
    feet[0].setPosition(-8,21+stride);feet[1].setPosition(8,21-stride);
    hands[0].setY(7-stride);hands[1].setY(7+stride);
    if(moving)face.setVisible(dy>=0||Math.abs(dx)>Math.abs(dy));
    px=actor.x;py=actor.y;tools.clear().setPosition(0,0).setRotation(0);
    if(moving||actor.getData('activity')==='walking')return;
    if(activity==='garden'){
      const pouring=elapsed%2400>500;
      hands[1].setPosition(17,pouring?3:8);
      tools.fillStyle(0x243e3d).fillRect(15,0,14,15).fillRect(28,3,5,4).fillRect(32,5,5,3);
      tools.fillStyle(0x789e91).fillRect(17,2,10,10).fillRect(15,-3,3,5).fillRect(18,-5,7,2).fillRect(25,-3,3,5);
      tools.fillStyle(0xc2d5b7).fillRect(18,2,3,9);
      if(pouring)for(let i=0;i<5;i++){
        const fall=(elapsed/65+i*4)%19;
        tools.fillStyle(0x98c5cc,.85).fillRect(35+Math.floor(fall/3)+i%2,8+fall,2,3);
      }
    }else if(activity==='tree'){
      const swing=elapsed%1800;
      // Slow lift, accelerating rotational chop, small rebound, then recovery.
      const angle=swing<700?-.6-swing/700*.65:swing<920?-1.25+Math.pow((swing-700)/220,2)*2.8:
        swing<1100?1.55-(swing-920)/180*.25:1.3-(swing-1100)/700*1.9;
      hands[1].setPosition(19,7);hands[0].setPosition(13,12);
      tools.setPosition(19,7).setRotation(angle);
      tools.fillStyle(0x342e2b).fillRect(-3,-25,6,39);
      tools.fillStyle(0x9c7149).fillRect(-2,-24,4,37);
      tools.fillStyle(0xd1aa70).fillRect(-2,-22,1,32);
      tools.fillStyle(0x293d44).fillPoints([{x:-5,y:-27},{x:4,y:-29},{x:13,y:-32},{x:16,y:-28},{x:16,y:-14},{x:10,y:-12},{x:4,y:-20},{x:-5,y:-20}],true);
      tools.fillStyle(0x809c9e).fillPoints([{x:-3,y:-26},{x:5,y:-27},{x:12,y:-30},{x:13,y:-16},{x:10,y:-15},{x:5,y:-22},{x:-3,y:-22}],true);
      tools.fillStyle(0xd7dfcb).fillRect(13,-28,2,12);
      tools.fillStyle(0x40565a).fillRect(-2,-25,4,3);
    }else if(activity==='bridge'){
      feet[0].setPosition(-8,25);feet[1].setPosition(8,25);
      hands[0].setPosition(-10,15);hands[1].setPosition(10,15);
    }
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE,animate);
  actor.once(Phaser.GameObjects.Events.DESTROY,()=>scene.events.off(Phaser.Scenes.Events.UPDATE,animate));
  return actor;
}

/** Caretakers use the same fixed-size frame as village residents. */
export function keeperSpeech(scene:Phaser.Scene,actor:Phaser.GameObjects.Container,text:string){
  if(actor.getData('speaking'))return;
  actor.setData('speaking',true);
  scene.data.set('keeper-speaking',true);
  compactDialogue(scene,actor.name.includes('gardener')?'Gardener':'Bridgekeeper',text,()=>{
    scene.data.set('keeper-speaking',false);if(actor.active)actor.setData('speaking',false);
  });
}
