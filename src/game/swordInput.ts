/** A brief tap window separates slashes from deliberate charging. */
export const SWORD_HOLD_THRESHOLD_MS=300;
/** The tap-detection window never contributes any spin charge. */
export function swordChargeMs(heldMs:number){return Math.max(0,heldMs-SWORD_HOLD_THRESHOLD_MS);}
export function swordReleaseAction(heldMs:number,spinLearned:boolean,chargeMs:number):'swing'|'spin'|'cancel'{
  if(!spinLearned||heldMs<SWORD_HOLD_THRESHOLD_MS)return 'swing';
  return swordChargeMs(heldMs)>=chargeMs?'spin':'cancel';
}
