const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:850}});
 try{
  await page.goto('http://localhost:3001/story');await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({opening:'wordwood',completedChapters:[1],chapterCheckpoints:{2:JSON.stringify({found:[0]})}})));
  await page.goto('http://localhost:3001/story/2?storyTest');await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='WordwoodScene');
  await page.evaluate(()=>window.__storyTest.reviewPosition(688,1808));await page.waitForTimeout(700);await page.keyboard.press('m');await page.screenshot({path:'/tmp/wordwood-full-bridge-paused.png'});await page.keyboard.press('Escape');await page.screenshot({path:'/tmp/wordwood-full-bridge.png'});
  await page.keyboard.press('m');await page.getByRole('button',{name:'Map',exact:true}).click();await page.getByRole('combobox').selectOption('wordwood-trail');await page.screenshot({path:'/tmp/wordwood-trail-chart.png',animations:'disabled'});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/wordwood-trail-mobile.png',animations:'disabled'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.keyboard.press('Escape');
  await page.evaluate(()=>window.__storyTest.reviewPosition(560,1744));await page.keyboard.down('w');await page.waitForTimeout(500);await page.keyboard.up('w');assert.equal((await page.evaluate(()=>window.__storyTest.state()[0])).y,1744);
  console.log('PASS: full bridge visual, approach chart, mobile map and impassable river bank.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
