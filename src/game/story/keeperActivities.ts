export function rollKeeperActivities(random:()=>number=Math.random){
  const gardenRoll=random();
  const gardener=gardenRoll<.25?'garden':gardenRoll<.5?'home':'cooking';
  const roll=random();
  return {gardener,bridgekeeper:roll<.25?'bridge':roll<.5?'tree':'home'};
}
