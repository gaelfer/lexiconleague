const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});const page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost:3000/story');await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({opening:'wordwood',completedChapters:[1],visitedInkwell:true})));
 await page.goto('http://localhost:3000/story/village?storyTest');await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='DungeonScene');await page.waitForTimeout(1200);
 await page.evaluate(()=>window.__storyTest.reviewPosition(880,1360));await page.waitForTimeout(500);
 await page.keyboard.press('w');await page.waitForFunction(()=>window.__storyTest.state()[0].y===1328);
 assert.equal(await page.evaluate(()=>window.__storyTest.state()[0].sign),undefined,'Plaque unreadable from an adjacent tile');
 await page.keyboard.press('w');await page.waitForFunction(()=>window.__storyTest.state()[0].sign==='THE LANTERN INN');
 assert.equal(await page.evaluate(()=>window.__storyTest.state()[0].dialogue),undefined,'Signs are not modal dialogue');
 await page.screenshot({path:'/tmp/building-sign-read.png'});
 await page.keyboard.press('d');await page.waitForFunction(()=>window.__storyTest.state()[0].sign===undefined);
 await page.waitForFunction(()=>window.__storyTest.state()[0].x===912);
 for(const [route,scene,key,name] of [['village','DungeonScene','s','village'],['1','DungeonScene','a','road'],['2','WordwoodScene','d','wordwood']]){
  await page.goto(`http://localhost:3000/story/${route}?storyTest&arrival=gatehouse&sceneReview=gate`);
  await page.waitForFunction(s=>window.__storyTest?.state()[0]?.scene===s,scene);await page.waitForTimeout(1400);
  await page.keyboard.press('w');await page.waitForFunction(()=>window.__storyTest.state()[0]?.scene==='GatehouseScene');await page.waitForTimeout(700);
  await page.screenshot({path:`/tmp/wayfarer-${name}-after.png`});
  await page.keyboard.press(key);await page.waitForFunction(s=>window.__storyTest.state()[0]?.scene===s,scene);
  console.log('PASS Wayfarer round trip: '+name);
 }
 assert.deepEqual(errors,[]);console.log('PASS walk-up wall plaques, movement dismisses name, no dialogue lock');
}catch(e){console.log(await page.evaluate(()=>window.__storyTest?.state()));await page.screenshot({path:'/tmp/wayfarer-failure.png'});throw e;}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
