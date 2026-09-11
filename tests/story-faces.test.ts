import {describe,it,expect} from 'vitest';
import {readFile} from 'node:fs/promises';
import {CHARACTER_FRAME,FACE_FRAME} from '../src/game/pixelScale';
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
});
