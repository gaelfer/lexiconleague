import { describe,it,expect } from 'vitest';
import { inkPalette,pixelizeAvatar,avatarRasterPlacement,AVATAR_FRAME } from '../src/game/pixelAvatar';

describe('pixel avatar conversion',()=>{
  it('retains fine source expression strokes without inventing opaque pixels',()=>{
    const data=new Uint8ClampedArray([255,255,255,60,0,0,0,0]);
    const result=pixelizeAvatar(data,2,1,undefined,40);
    expect(result[3]).toBe(255);expect(result[7]).toBe(0);
  });
  it('preserves teardrop proportions inside a padded 28×56 frame',()=>{
    const p=avatarRasterPlacement(64,64);
    expect(AVATAR_FRAME).toEqual({width:28,height:56});
    expect(p.dw/p.sw).toBeCloseTo(p.dh/p.sh,10);
    expect(p.dy+p.dh).toBeLessThanOrEqual(56);
  });
  const source=()=>{
    const data=new Uint8ClampedArray(12*12*4);
    for(let y=1;y<11;y++)for(let x=2;x<10;x++)data.set([0,0,0,255],(y*12+x)*4);
    return data;
  };
  it('keeps the body mask and produces only hard alpha edges',()=>{
    const data=source();data.set([255,255,255,40],0);
    const result=pixelizeAvatar(data,12,12,0x628f79);
    for(let i=3;i<result.length;i+=4)expect([0,255]).toContain(result[i]);
    expect(result[3]).toBe(0);
    expect(result[(5*12+5)*4+3]).toBe(255);
  });
  it('retains chosen ink hue while adding a limited shading palette',()=>{
    const result=pixelizeAvatar(source(),12,12,0x628f79),colors=new Set<string>();
    for(let i=0;i<result.length;i+=4)if(result[i+3])colors.add([...result.slice(i,i+3)].join(','));
    expect(colors.size).toBeGreaterThan(2);expect(colors.size).toBeLessThanOrEqual(5);
    for(const color of colors)expect(inkPalette(0x628f79).map(c=>c.join(','))).toContain(color);
  });
  it('gives black ink visible shading and preserves accessory colors',()=>{
    expect(inkPalette(0)[4][0]).toBeGreaterThan(50);
    const result=pixelizeAvatar(new Uint8ClampedArray([190,45,52,255,255,255,255,255]),2,1);
    expect(result[0]).toBeGreaterThan(result[1]);
    expect([...result.slice(4)]).toEqual([246,235,207,255]);
  });
});
