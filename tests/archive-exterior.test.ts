import { expect,it,vi } from 'vitest';
import type * as Phaser from 'phaser';
import { ARCHIVE_FOOTPRINT,buildArchiveExterior } from '../src/game/world/archiveExterior';
import { TOWN,townDoor } from '../src/game/story/townPlan';
vi.mock('../src/game/world/foreground',()=>({foreground:(scene:Phaser.Scene,_x:number,_y:number,_w:number,_h:number,draw:(g:Phaser.GameObjects.Graphics)=>void)=>draw(scene.add.graphics())}));

it('keeps the new Archive on the grid and its existing doorstep unblocked',()=>{
  const house=TOWN.buildings.find(b=>b.id==='archive')!;
  const f=ARCHIVE_FOOTPRINT;
  for(const n of [house.x+f.dx,house.y+f.dy,f.width,f.height])expect(n%32).toBe(0);
  expect(house.y+f.dy+f.height).toBe(384);
  expect(townDoor('archive')).toEqual({x:1040,y:406});
  expect(400-15.9).toBeGreaterThan(house.y+f.dy+f.height);
  const g={translateCanvas:vi.fn().mockReturnThis(),clear:vi.fn().mockReturnThis(),setPosition:vi.fn().mockReturnThis(),setDepth:vi.fn().mockReturnThis(),fillStyle:vi.fn().mockReturnThis(),fillRect:vi.fn().mockReturnThis()};
  const scene={add:{graphics:()=>g}} as unknown as Phaser.Scene;
  const obstacle=vi.fn();
  buildArchiveExterior(scene,house.x,house.y,obstacle);
  expect(obstacle).toHaveBeenCalledExactlyOnceWith(1040,272,288,224);
  expect(g.fillRect.mock.calls.every(args=>args.slice(0,4).every(Number.isInteger))).toBe(true);
});
