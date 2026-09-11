export function rollKeeperActivities(random:()=>number=Math.random){
  const gardener=random()<.5?'garden':'home';
  const roll=random();
  return {gardener,bridgekeeper:roll<.25?'bridge':roll<.5?'tree':'home'};
}
