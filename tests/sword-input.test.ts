import {it,expect} from 'vitest';
import {swordChargeMs,swordReleaseAction} from '../src/game/swordInput';
it('treats repeated quick releases as independent slashes',()=>{for(let i=0;i<20;i++)expect(swordReleaseAction(70,true,700)).toBe('swing');});
it('does not charge during the tap window',()=>{expect(swordChargeMs(250)).toBe(0);expect(swordReleaseAction(250,true,700)).toBe('swing');expect(swordChargeMs(300)).toBe(0);expect(swordChargeMs(400)).toBe(100);});
it('cancels an incomplete deliberate charge without slashing',()=>{expect(swordReleaseAction(350,true,700)).toBe('cancel');expect(swordReleaseAction(999,true,700)).toBe('cancel');});
it('requires the full charge after detecting a hold and honors speed upgrades',()=>{expect(swordReleaseAction(700,true,700)).toBe('cancel');expect(swordReleaseAction(1000,true,700)).toBe('spin');expect(swordReleaseAction(800,true,500)).toBe('spin');});
it('keeps basic slashes available before learning spin',()=>expect(swordReleaseAction(900,false,700)).toBe('swing'));
