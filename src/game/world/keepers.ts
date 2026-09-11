import * as Phaser from 'phaser';
import {createInkHand,createInkFoot} from '../entities/inkHand';
import {compactDialogue} from './compactDialogue';

/** One reusable rig for rescue, home life and outdoor work. Feet articulate, never the body. */
export function createKeeper(scene:Phaser.Scene,kind:'gardener'|'bridgekeeper',x:number,y:number,activity='home'){
  const gardener=kind==='gardener',color=gardener?0x65a765:0xb95248;
  const feet=[createInkFoot(scene,-8,21,color),createInkFoot(scene,8,21,color)];
  const hands=[createInkHand(scene,-14,7,color),createInkHand(scene,14,7,color)];
  const face=scene.add.image(0,0,gardener?'gardener-eyes':'npc-1-eyes').setDisplaySize(32/.78,64/.78);
  if(activity==='cooking'||activity==='sitting')face.setVisible(false);
  const tools=scene.add.graphics();
  const actor=scene.add.container(x,y,[scene.add.ellipse(0,22,32,10,0x10252b,.4),...feet,
    scene.add.image(0,0,`${kind}-base`).setDisplaySize(32/.78,64/.78),face,...hands,tools])
    .setScale(.78).setDepth(10).setName(`keeper-${kind}`).setData('activity',activity);
  let elapsed=0,px=x,py=y;
  let activityTween:Phaser.Tweens.Tween|undefined;
  // Match the inn's little domestic routines: work, walk to a chair, rest, return.
  if(activity==='cooking'){
    const kitchen={x,y};
    // Use the clear eastern aisle, then approach the seat from below. The
    // old x=528 route crossed the candle table at (512,352).
    const route=[{x:560,y:224},{x:560,y:320},{x:560,y:448},{x:496,y:448},{x:496,y:416}];
    const travel=(points:{x:number;y:number}[],destination:string)=>{
      if(!actor.active)return;
      if(actor.getData('speaking')){scene.time.delayedCall(250,()=>travel(points,destination));return;}
      const point=points.shift();
      if(!point){
        actor.setData('activity',destination);
        scene.time.delayedCall(destination==='sitting'?11000:14000,()=>travel(destination==='sitting'?[...route.slice(0,-1).reverse(),kitchen]:[...route],destination==='sitting'?'cooking':'sitting'));
        return;
      }
      actor.setData('activity','walking');
      activityTween=scene.tweens.add({targets:actor,x:point.x,y:point.y,duration:Math.hypot(point.x-actor.x,point.y-actor.y)/.065,onComplete:()=>travel(points,destination)});
    };
    scene.time.delayedCall(14000,()=>travel([...route],'sitting'));
  }
  const animate=(_time:number,delta:number)=>{
    if(!actor.active)return;
    if(actor.getData('speaking')){activityTween?.pause();return;}
    activityTween?.resume();
    activity=actor.getData('activity')??activity;
    elapsed+=delta;
    const dx=actor.x-px,dy=actor.y-py,moving=Math.abs(dx)+Math.abs(dy)>.1;
    const stride=moving?(Math.floor(elapsed/130)%2?3:-3):0;
    feet.forEach(foot=>foot.setVisible(activity!=='sitting'));
    feet[0].setPosition(-8,21+stride);feet[1].setPosition(8,21-stride);
    hands[0].setY(7-stride);hands[1].setY(7+stride);
    if(moving)face.setVisible(dy>=0||Math.abs(dx)>Math.abs(dy));
    else if(activity!=='walking')face.setVisible(activity!=='cooking'&&activity!=='sitting');
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
    }else if(activity==='cooking'){
      const stir=Math.round(Math.sin(elapsed/220)*4);
      tools.setPosition(-12,-30);
      hands[1].setPosition(1+stir,-24);hands[0].setPosition(-9,-21);
      tools.fillStyle(0x233638).fillRect(4,-10,23,13).fillRect(1,-10,4,4).fillRect(27,-10,4,4);
      tools.fillStyle(0x5c7874).fillRect(6,-8,19,9);
      tools.fillStyle(0xbf985e).fillRect(7,-10,17,3);
      tools.lineStyle(2,0xd6b782).lineBetween(13+stir,-18,16+stir,-8);
      for(let i=0;i<3;i++){
        const rise=(elapsed/100+i*7)%22;
        tools.fillStyle(0xe0dcc3,(1-rise/22)*.65).fillRect(8+i*6+Math.round(Math.sin(rise/4)*2),-14-rise,3,4);
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
    }else if(activity==='bridge'||activity==='sitting'){
      feet[0].setPosition(-8,25);feet[1].setPosition(8,25);
      hands[0].setPosition(-10,15);hands[1].setPosition(10,15);
      if(activity==='sitting'){
        feet.forEach(foot=>foot.setVisible(false));
        hands[0].setPosition(-10,-8);hands[1].setPosition(10,-8);
      }
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
