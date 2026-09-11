import * as Phaser from 'phaser';
import Player from '../entities/Player';
import Blotling from '../entities/Blotling';
import {EventBus} from '../EventBus';
import {facingVector,isInSwordArc} from '../combat';
import type {Facing} from '../movement';
import {expeditionArrowDamage,consumeHerbalReserve} from '../story/repository';
import {spinProfile} from '../../lib/story/skills';
import {getStoryProgress} from '../../lib/story/progress';

/** Scoped combat listeners so paused outdoor scenes never receive dungeon attacks. */
export function expeditionCombat(scene:Phaser.Scene,player:Player,walls:Phaser.Physics.Arcade.StaticGroup,
  enemies:(Pick<Blotling,'sprite'|'defeated'|'update'|'takeHit'>&{hurtbox?:Phaser.Physics.Arcade.Image;meleeRadius?:number})[],blocked:()=>boolean,onDeath:()=>void,onArrow?:(arrow:Phaser.Physics.Arcade.Image)=>void){
  const arrows=new Set<Phaser.Physics.Arcade.Image>();
  const attack=({x,y,type,facing}:{x:number;y:number;type:string;facing?:Facing})=>{
    if(!scene.sys.isActive()||blocked())return;
    const spin=spinProfile(getStoryProgress());
    for(const enemy of enemies)if(!enemy.defeated&&(type==='spin'?Math.hypot(x-enemy.sprite.x,y-enemy.sprite.y)<spin.radius+(enemy.meleeRadius??0):isInSwordArc({x,y},enemy.sprite,facing??player.facing,64+(enemy.meleeRadius??0))))enemy.takeHit(x,y,type==='spin'?spin.damage:1);
  };
  const bow=({x,y,facing}:{x:number;y:number;facing:Facing})=>{
    if(!scene.sys.isActive()||blocked())return;
    const d=facingVector(facing),arrow=scene.physics.add.image(x,y,'story-arrow').setDepth(15).setScale(.78);
    arrow.setRotation(Math.atan2(d.y,d.x)).setVelocity(d.x*430,d.y*430);arrow.body.setSize(10,10);arrows.add(arrow);
    const colliders:Phaser.Physics.Arcade.Collider[]=[];
    arrow.once(Phaser.GameObjects.Events.DESTROY,()=>{colliders.forEach(c=>{if(c.world)c.destroy();});arrows.delete(arrow);});
    const remove=()=>{if(arrow.active)arrow.destroy();};
    colliders.push(scene.physics.add.collider(arrow,walls,remove));
    for(const e of enemies)if(!e.defeated)colliders.push(scene.physics.add.overlap(arrow,e.hurtbox??e.sprite,()=>{if(!arrow.active||e.defeated)return;e.takeHit(arrow.x,arrow.y,expeditionArrowDamage());remove();}));
    scene.time.delayedCall(1400,remove);
  };
  const died=()=>{if(scene.sys.isActive())onDeath();};
  EventBus.on('player-attack',attack);EventBus.on('player-bow',bow);EventBus.on('player-died',died);
  for(const e of enemies)scene.physics.add.collider(e.sprite,walls);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
    EventBus.off('player-attack',attack);EventBus.off('player-bow',bow);EventBus.off('player-died',died);
  });
  return (delta:number)=>{
    if(blocked()||player.isDying){enemies.forEach(e=>{if(!e.defeated)e.sprite.setVelocity(0,0);});return;}
    for(const arrow of arrows)if(arrow.active)onArrow?.(arrow);
    for(const e of enemies)if(!e.defeated&&e.update(delta,player)){
      if(player.takeDamage(1,e.sprite)&&player.hearts===1&&!player.isDying&&consumeHerbalReserve()){
        player.healFully();
        const notice=scene.add.text(player.x,player.y-64,'HERBAL RESERVE · HEALTH RESTORED',{fontSize:'12px',color:'#e6e5ba',backgroundColor:'#254a39',padding:{x:8,y:5}}).setOrigin(.5).setDepth(90);
        scene.time.delayedCall(2000,()=>notice.destroy());
      }
    }
  };
}
