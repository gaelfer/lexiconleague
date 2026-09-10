import * as Phaser from 'phaser';

type Rig = { container:Phaser.GameObjects.Container; parts:{object:Phaser.GameObjects.Image;y:number}[] };
const sessions = new WeakMap<Phaser.Scene,{rigs:Map<string,Rig>;active?:Rig;until:number;started:number}>();
/** Short, whole-pixel nods preserve the selected expression and planted feet. */
export function registerSpeaker(scene:Phaser.Scene,name:string,container:Phaser.GameObjects.Container) {
  let session=sessions.get(scene);
  if(!session){
    session={rigs:new Map(),until:0,started:0};sessions.set(scene,session);
    const update=()=>{
      const active=session!.active;
      if(!active)return;
      const elapsed=scene.time.now-session!.started;
      const lift=scene.time.now<session!.until && Math.floor(elapsed/140)%3===1 ? -2 : 0;
      for(const {object,y} of active.parts)if(object.active)object.y=y+lift;
    };
    scene.events.on(Phaser.Scenes.Events.UPDATE,update);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
      scene.events.off(Phaser.Scenes.Events.UPDATE,update);sessions.delete(scene);
    });
  }
  session.rigs.set(name.toLowerCase(),{container,parts:container.list
    .filter((object):object is Phaser.GameObjects.Image=>object instanceof Phaser.GameObjects.Image && !object.texture.key.startsWith('story-'))
    .map(object=>({object,y:object.y}))});
}
export function speak(scene:Phaser.Scene,label:string,line='') {
  const session=sessions.get(scene);if(!session)return;
  if(session.active)for(const {object,y} of session.active.parts)if(object.active)object.y=y;
  const name=line.startsWith('You ') ? '' : line.match(/^([^:]+): /)?.[1]??label;
  session.active=session.rigs.get(name.toLowerCase());
  session.started=scene.time.now;session.until=scene.time.now+Math.min(6500,Math.max(1000,line.length*32));
}

export function speechState(scene:Phaser.Scene) {
  const session=sessions.get(scene),active=session?.active;
  return {speaker:active?[...session!.rigs].find(([,rig])=>rig===active)?.[0]:undefined,
    nod:active?.parts[0]?active.parts[0].object.y-active.parts[0].y:0};
}
