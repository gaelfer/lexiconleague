const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}),page=await browser.newPage();
 const ready=()=>page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='WordwoodScene');
 try{
  await page.goto('http://localhost:3001/story');await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({opening:'wordwood',completedChapters:[1],chapterCheckpoints:{2:JSON.stringify({found:[0]})}})));
  await page.goto('http://localhost:3001/story/2?arrival=gatehouse&storyTest');await ready();assert.equal((await page.evaluate(()=>window.__storyTest.combatState())).enemies.length,3);
  await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('lexiconleague:story:progress'));p.wordwoodExpedition={...p.wordwoodExpedition,tablet:true,logGuardianFreed:true};localStorage.setItem('lexiconleague:story:progress',JSON.stringify(p));});
  await page.reload();await ready();assert.equal((await page.evaluate(()=>window.__storyTest.combatState())).enemies.length,0);
  await page.goto('http://localhost:3001/story/village?storyTest');await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='DungeonScene');
  await page.goto('http://localhost:3001/story/2?arrival=gatehouse&storyTest');await ready();assert.equal((await page.evaluate(()=>window.__storyTest.combatState())).enemies.length,0);
  console.log('PASS: three path enemies before boss, none after saved victory, reload or return visit.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
