import {expect,it,vi} from 'vitest';
import type * as Phaser from 'phaser';
import {foreground} from '../src/game/world/foreground';

it('shares a foreground silhouette with the character pass and releases its texture',()=>{
  const data=new Map<string,number>();
  const graphics={generateTexture:vi.fn(),destroy:vi.fn()};
  const image={setOrigin:vi.fn().mockReturnThis(),setDepth:vi.fn().mockReturnThis(),setData:vi.fn().mockReturnThis(),once:vi.fn()};
  const scene={scene:{key:'Test'},data:{get:(key:string)=>data.get(key),set:(key:string,value:number)=>data.set(key,value)},
    textures:{remove:vi.fn()},add:{graphics:()=>graphics,image:vi.fn(()=>image)}};
  const draw=vi.fn();
  foreground(scene as unknown as Phaser.Scene,32,64,96,128,draw);
  expect(draw).toHaveBeenCalledWith(graphics);
  expect(graphics.generateTexture).toHaveBeenCalledWith('foreground-Test-1',96,128);
  expect(scene.add.image).toHaveBeenCalledWith(32,64,'foreground-Test-1');
  expect(image.setDepth).toHaveBeenCalledWith(30);
  expect(image.setData).toHaveBeenCalledWith('story-foreground',true);
  image.once.mock.calls[0][1]();
  expect(scene.textures.remove).toHaveBeenCalledWith('foreground-Test-1');
  foreground(scene as unknown as Phaser.Scene,32,64,96,128,draw);
  expect(graphics.generateTexture).toHaveBeenLastCalledWith('foreground-Test-2',96,128);
});
