import * as Phaser from 'phaser';
import { WORLD_CAMERA_ZOOM, sceneZoom } from '../pixelScale';
import { readableText } from './readableText';

export const WORLD_ZOOM = WORLD_CAMERA_ZOOM;
export const ROOM_SCALE = 0.8;
export const roomX = (x: number) => 400 + (x - 400) * ROOM_SCALE;
export const roomY = (y: number) => 300 + (y - 300) * ROOM_SCALE;

/** Compact the authored room, including physics, before adding the player/UI. */
export function compactRoom(scene: Phaser.Scene) {
  for (const object of scene.children.list) {
    if (object instanceof Phaser.GameObjects.Graphics || object instanceof Phaser.GameObjects.Image
      || object instanceof Phaser.GameObjects.Shape || object instanceof Phaser.GameObjects.Container) {
      object.setPosition(roomX(object.x), roomY(object.y));
      // NPC rigs already have the correct character scale.
      if (!(object instanceof Phaser.GameObjects.Container)) object.setScale(object.scaleX * ROOM_SCALE, object.scaleY * ROOM_SCALE);
      if ('body' in object && object.body instanceof Phaser.Physics.Arcade.StaticBody) object.body.updateFromGameObject();
    }
  }
  scene.physics.world.setBounds(roomX(0), roomY(0), 800 * ROOM_SCALE, 600 * ROOM_SCALE);
}

/** Native-resolution world and a separately framed dialogue camera. */
export function frameWorld(scene: Phaser.Scene, town = false) {
  const world = scene.cameras.main.setZoom(sceneZoom(town)).setRoundPixels(true);
  world.centerOn(400, 300);
  const ui = scene.cameras.add(0, 0, scene.scale.width, scene.scale.height, false, 'story-ui');
  const resize = () => {
    ui.setSize(scene.scale.width, scene.scale.height);
    ui.setZoom(Math.min(WORLD_ZOOM, scene.scale.width / 800, scene.scale.height / 600));
    ui.centerOn(400, 300);
  };
  resize();
  scene.scale.on(Phaser.Scale.Events.RESIZE, resize);
  const overlays = new WeakSet<Phaser.GameObjects.GameObject>();
  const routeLayers = () => {
    for (const object of scene.children.list) {
      const overlay = overlays.has(object) || ('scrollFactorX' in object && object.scrollFactorX === 0)
        || ('depth' in object && typeof object.depth === 'number' && object.depth >= 100);
      if (overlay) {
        overlays.add(object);
        // This camera never follows the player. Let its fixed framing transform
        // screen-space objects too, rather than cancelling its centering scroll.
        if ('setScrollFactor' in object && typeof object.setScrollFactor === 'function') object.setScrollFactor(1);
      }
      // Preserve any other camera filters owned by the scene.
      object.cameraFilter = (object.cameraFilter & ~(world.id | ui.id)) | (overlay ? world.id : ui.id);
    }
  };
  scene.events.on(Phaser.Scenes.Events.PRE_RENDER, routeLayers);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.events.off(Phaser.Scenes.Events.PRE_RENDER, routeLayers);
    scene.scale.off(Phaser.Scale.Events.RESIZE, resize);
    scene.cameras.remove(ui);
  });
  routeLayers();
  readableText(scene,world,ui);
}
