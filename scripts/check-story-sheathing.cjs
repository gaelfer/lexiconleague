const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://localhost:3000/story');
  await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({opening:'wordwood',completedChapters:[1],visitedInkwell:true})));
  await page.goto('http://localhost:3000/story/village?storyTest');
  await page.waitForFunction(()=>window.__storyTest?.state()[0]?.hearts===3);
  await page.keyboard.press('q');
  await page.waitForTimeout(14500);
  assert.equal(await page.evaluate(()=>window.__storyTest.combatState().swordStowed),false);
  await page.waitForTimeout(850);
  await page.screenshot({path:'/tmp/sword-sheathing.png'});
  await page.waitForFunction(()=>window.__storyTest.combatState().swordStowed);
  await page.screenshot({path:'/tmp/sword-stowed.png'});
  await page.evaluate(()=>window.__storyTest.reviewInnRoom(1,undefined));
  await page.waitForFunction(()=>window.__storyTest.state()[0]?.scene==='InnScene');
  assert.equal(await page.evaluate(()=>window.__storyTest.combatState().swordStowed),true,'Entering the inn preserves sheathing');
  await page.evaluate(()=>window.__storyTest.reviewInnRoom(1,1));
  await page.waitForFunction(()=>window.__storyTest.state()[0]?.room===1);
  assert.equal(await page.evaluate(()=>window.__storyTest.combatState().swordStowed),true,'Entering a bedroom preserves sheathing');
  await page.waitForTimeout(400);
  await page.keyboard.down('q');
  await page.waitForFunction(()=>!window.__storyTest.combatState().swordStowed);
  await page.keyboard.up('q');
  await page.screenshot({path:'/tmp/sword-redrawn.png'});
  await page.evaluate(()=>window.__storyTest.reviewInnRoom(1,undefined));
  await page.waitForFunction(()=>window.__storyTest.state()[0]?.room===undefined);
  await page.waitForTimeout(500);await page.keyboard.press('s');
  await page.waitForFunction(()=>window.__storyTest.state()[0]?.scene==='DungeonScene');
  assert.equal(await page.evaluate(()=>window.__storyTest.combatState().swordStowed),false,'Outdoor player restores the sword state changed indoors');
  assert.deepEqual(errors,[]);
  console.log('PASS: sheathing, inn entry, bedroom entry, redraw, outdoor resume');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
