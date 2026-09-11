import {describe,it,expect,vi} from 'vitest';
import {readFile} from 'node:fs/promises';
import {CHARACTER_FRAME,FACE_FRAME} from '../src/game/pixelScale';
import {convertAvatarTexture} from '../src/game/world/pixelAvatarTextures';
vi.mock('phaser',()=>({Textures:{FilterMode:{NEAREST:0}}}));
describe('hand-drawn story faces',()=>{
  it('provides eight distinct SVG faces on the shared clustered avatar frame',async()=>{
    expect(CHARACTER_FRAME).toEqual({width:32,height:64});
    expect(FACE_FRAME).toEqual({width:32,height:64});
    const signatures=new Set<string>();
    for(let id=1;id<=8;id++){
      const name=`eyes_${String(id).padStart(2,'0')}`;
      const svg=await readFile(`public/ink/eyes/${name}.svg`,'utf8');
      expect(svg).toContain('viewBox="0 0 100 100"');
      signatures.add(svg);
    }
    expect(signatures.size).toBe(8);
  });
  it('keeps face and body on one consistent frame',()=>{
    expect(FACE_FRAME).toBe(CHARACTER_FRAME);
  });
  it('preserves isolated facial pixels without expanding them into accessory blocks',()=>{
    const source=new Uint8ClampedArray(32*64*4);
    source.set([240,240,240,90],(20*32+10)*4);
    source.set([24,24,24,255],(20*32+11)*4);
    const context={drawImage:vi.fn(),getImageData:()=>({data:source.slice()}),putImageData:vi.fn()};
    const canvas={width:0,height:0,getContext:()=>context};
    vi.stubGlobal('document',{createElement:()=>canvas});
    const scene={textures:{exists:()=>true,get:()=>({getSourceImage:()=>({width:64,height:64})}),
      remove:vi.fn(),addCanvas:()=>({setFilter:vi.fn()})}};
    try{
      convertAvatarTexture(scene as never,'player-eyes');
      const face=context.putImageData.mock.calls[0][0].data;
      expect(face[(20*32+10)*4+3]).toBe(255);
      expect(face[(21*32+10)*4+3]).toBe(0);
      expect(face[(20*32+11)*4]).toBe(24);
      convertAvatarTexture(scene as never,'player-hat');
      const accessory=context.putImageData.mock.calls[1][0].data;
      expect(accessory[(21*32+10)*4+3]).toBe(255);
    }finally{vi.unstubAllGlobals();}
  });
});
