import * as Phaser from 'phaser';
import { CHARACTER_FRAME, DISPLAY_SCALE } from '../pixelScale';

/** Keep text out of the half-resolution world framebuffer. Its existing Phaser
 * canvas already contains full-size glyphs and wrapping; composite that at display
 * resolution instead of deleting alternate rows/columns with nearest sampling. */
export function readableText(scene:Phaser.Scene,world:Phaser.Cameras.Scene2D.Camera,ui:Phaser.Cameras.Scene2D.Camera){
  const detailed=(o:Phaser.GameObjects.GameObject):o is Phaser.GameObjects.Image=>o instanceof Phaser.GameObjects.Image
    && ((o.frame.realWidth===CHARACTER_FRAME.width&&o.frame.realHeight===CHARACTER_FRAME.height)||o.texture.key==='story-sword'||o.texture.key.startsWith('story-bow-pose-'));
  const layer=document.createElement('canvas');
  layer.setAttribute('aria-hidden','true');
  Object.assign(layer.style,{position:'absolute',pointerEvents:'none',zIndex:'2'});
  scene.game.canvas.parentElement!.appendChild(layer);
  const ctx=layer.getContext('2d')!;
  const resize=()=>{
    const canvas=scene.game.canvas;
    layer.width=canvas.width*DISPLAY_SCALE;layer.height=canvas.height*DISPLAY_SCALE;
    layer.style.width=`${layer.width}px`;layer.style.height=`${layer.height}px`;
    layer.style.left=`${canvas.offsetLeft}px`;layer.style.top=`${canvas.offsetTop}px`;
  };
  resize();scene.scale.on(Phaser.Scale.Events.RESIZE,resize);
  const render=()=>{
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,layer.width,layer.height);
    if(!scene.scene.isActive())return;
    // World labels must not float over a dialogue panel just because text has
    // its own compositor. A modal intentionally hides the underlying labels.
    const modal=scene.children.list.some(o=>{
      if(!(o.cameraFilter&world.id)||o instanceof Phaser.GameObjects.Text)return false;
      if(o instanceof Phaser.GameObjects.Container)return o.visible&&o.alpha>0&&o.list.some(c=>c instanceof Phaser.GameObjects.Rectangle&&c.width>300&&c.height>90);
      return o instanceof Phaser.GameObjects.Rectangle&&o.visible&&o.alpha>0&&o.width>300&&o.height>90;
    });
    const covers:Phaser.GameObjects.Rectangle[]=[];
    for(const root of scene.children.list){
      if(!(root.cameraFilter&world.id))continue;
      const candidates=root instanceof Phaser.GameObjects.Container&&root.visible?root.list:[root];
      for(const item of candidates)if(item instanceof Phaser.GameObjects.Rectangle&&item.visible&&item.alpha>0&&item.width>300&&item.height>90)covers.push(item);
    }
    const visit=(object:Phaser.GameObjects.GameObject,camera:Phaser.Cameras.Scene2D.Camera,visible:boolean,alpha:number)=>{
      if('visible' in object)visible=visible&&!!object.visible;
      if('alpha' in object)alpha*=Number(object.alpha);
      if(object instanceof Phaser.GameObjects.Text||detailed(object)){
        // Exclude from both Phaser cameras, but preserve visible/alpha for this pass.
        object.cameraFilter|=world.id|ui.id;
        const text=object instanceof Phaser.GameObjects.Text;
        if(!visible||alpha<=0||(text&&modal&&camera===world))return;
        ctx.save();
        if(!text){
          ctx.setTransform(1,0,0,1,0,0);
          for(const cover of covers){
            const matrix=Phaser.GameObjects.GetCalcMatrix(cover,ui,cover.parentContainer?.getWorldTransformMatrix()).calc;
            const p=matrix.transformPoint(-cover.displayOriginX,-cover.displayOriginY);
            ctx.beginPath();ctx.rect(0,0,layer.width,layer.height);
            ctx.rect(p.x*DISPLAY_SCALE,p.y*DISPLAY_SCALE,cover.width*ui.zoom*DISPLAY_SCALE,cover.height*ui.zoom*DISPLAY_SCALE);ctx.clip('evenodd');
          }
        }
        const parent=object.parentContainer?.getWorldTransformMatrix();
        const m=Phaser.GameObjects.GetCalcMatrix(object,camera,parent).calc;
        ctx.setTransform(m.a*DISPLAY_SCALE,m.b*DISPLAY_SCALE,m.c*DISPLAY_SCALE,m.d*DISPLAY_SCALE,
          text?m.e*DISPLAY_SCALE:Math.round(m.e*DISPLAY_SCALE),text?m.f*DISPLAY_SCALE:Math.round(m.f*DISPLAY_SCALE));
        ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=text;
        if(text)ctx.drawImage(object.canvas,-object.displayOriginX,-object.displayOriginY,object.width,object.height);
        else{
          if(object.flipX||object.flipY){ctx.translate(object.flipX?object.width-2*object.displayOriginX:0,object.flipY?object.height-2*object.displayOriginY:0);ctx.scale(object.flipX?-1:1,object.flipY?-1:1);}
          ctx.drawImage(object.frame.source.image as CanvasImageSource,object.frame.cutX,object.frame.cutY,object.frame.cutWidth,object.frame.cutHeight,-object.displayOriginX,-object.displayOriginY,object.width,object.height);
        }
        ctx.restore();
      }else if(object instanceof Phaser.GameObjects.Container){
        for(const child of object.list)visit(child,camera,visible,alpha);
      }
    };
    for(const object of scene.children.list){
      // frameWorld has already routed each root object to its intended camera.
      visit(object,(object.cameraFilter&world.id)?ui:world,true,1);
    }
  };
  // Camera matrices are current after Phaser renders; text is suppressed before it.
  const suppress=()=>{
    const visit=(o:Phaser.GameObjects.GameObject)=>{
      if(o instanceof Phaser.GameObjects.Text||detailed(o))o.cameraFilter|=world.id|ui.id;
      if(o instanceof Phaser.GameObjects.Container)o.list.forEach(visit);
    };
    // Root text routing must be remembered before suppressing both camera bits.
    for(const root of scene.children.list){
      if(root instanceof Phaser.GameObjects.Text)root.setData('readable-camera',(root.cameraFilter&world.id)?'ui':'world');
      visit(root);
    }
  };
  // Read saved routing for root Text objects while containers keep their own bits.
  const restoreRouting=()=>{
    for(const root of scene.children.list)if(root instanceof Phaser.GameObjects.Text)
      root.cameraFilter=root.getData('readable-camera')==='ui'?world.id:ui.id;
    render();
  };
  scene.events.on(Phaser.Scenes.Events.PRE_RENDER,suppress);
  scene.events.on(Phaser.Scenes.Events.RENDER,restoreRouting);
  scene.events.on(Phaser.Scenes.Events.PAUSE,()=>{ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,layer.width,layer.height);});
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{
    scene.scale.off(Phaser.Scale.Events.RESIZE,resize);
    scene.events.off(Phaser.Scenes.Events.PRE_RENDER,suppress);
    scene.events.off(Phaser.Scenes.Events.RENDER,restoreRouting);
    layer.remove();
  });
}
