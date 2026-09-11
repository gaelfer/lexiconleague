const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage();
 const base=process.env.STORY_TEST_URL||'http://localhost:3000';
 const state=()=>page.evaluate(()=>window.__storyTest.puzzleState());
 const ready=()=>page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='WordwoodScene');
 const pos=async(x,y)=>{await page.evaluate(([x,y])=>window.__storyTest.reviewPosition(x,y),[x,y]);await page.waitForTimeout(550);};
 try{
  await page.goto(`${base}/story`);
  await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({completedChapters:[1]})));
  await page.goto(`${base}/story/2?arrival=gatehouse&storyTest`);await ready();
  assert.ok((await state()).panel,'Gatehouse arrival shows the introduction');
  for(let i=0;i<20&&(await state()).panel;i++){await page.waitForTimeout(300);await page.keyboard.press('e');await page.waitForTimeout(30);}
  assert.equal(!!(await state()).panel,false);
  for(let i=0;i<2;i++){
   await pos(432,272);await page.keyboard.press('w');
   await page.waitForFunction(()=>window.__storyTest.state()[0].room==='maintenance');
   await pos(400,432);await page.keyboard.press('s');await ready();
   assert.equal(!!(await state()).panel,false,'Building exits must not replay the introduction, even with the gatehouse URL');
  }
  await page.goto(`${base}/story/2?storyTest`);await ready();assert.equal(!!(await state()).panel,false,'A direct non-gatehouse load does not show the introduction');
  console.log('PASS gatehouse introduction, repeated building exits and direct arrival');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
