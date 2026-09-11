const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://localhost:3000/story');
  await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({opening:'chase'})));
  await page.goto('http://localhost:3000/story/1?storyTest');
  await page.waitForFunction(()=>window.__storyTest?.state()[0]?.hearts===3);
  await page.waitForTimeout(800);
  const before=await page.evaluate(()=>window.__storyTest.state()[0]);
  await page.evaluate(s=>window.__storyTest.takeTestHit(1,{x:s.x-32,y:s.y}),before);
  await page.screenshot({path:'/tmp/combat-hurt.png'});
  await page.waitForTimeout(400);
  const after=await page.evaluate(()=>window.__storyTest.state()[0]);
  assert.equal(after.hearts,2);
  assert.equal(after.x,before.x+32,'Open path knockback moves one tile');
  await page.waitForTimeout(1000);
  await page.evaluate(()=>window.__storyTest.takeTestHit(3));
  assert.equal(await page.evaluate(()=>window.__storyTest.combatState().dying),true);
  await page.waitForTimeout(350);
  await page.screenshot({path:'/tmp/combat-death.png'});
  await page.waitForFunction(()=>window.__storyTest.state()[0]?.hearts===3&&!window.__storyTest.combatState().dying);
  await page.waitForFunction(()=>window.__storyTest.combatState().enemies.some(e=>e.phase==='windup'),null,{timeout:15000});
  assert.equal((await page.evaluate(()=>window.__storyTest.state()[0])).hearts,3,'Windup cannot damage the player');
  await page.screenshot({path:'/tmp/combat-blob-windup.png'});
  await page.waitForFunction(()=>window.__storyTest.state()[0]?.hearts===2);
  await page.screenshot({path:'/tmp/combat-blob-hit.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS: hurt, tile knockback, death and respawn');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
