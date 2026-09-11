const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const state=()=>page.evaluate(()=>window.__storyTest.state()[0]);
 const pos=async(x,y)=>page.evaluate(([x,y])=>window.__storyTest.reviewPosition(x,y),[x,y]);
 const ready=()=>page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='WordwoodScene',null,{timeout:15000});
 try{
  await page.goto('http://localhost:3000/story');
  await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({completedChapters:[1],chapterCheckpoints:{2:JSON.stringify({words:['sturdy','hollow','winding'],solved:true,echoOpen:true,found:[0]})}})));
  await page.goto('http://localhost:3000/story/2?storyTest');await ready();assert.equal((await state()).guardian,null);
  await page.evaluate(()=>{const k='lexiconleague:story:progress',p=JSON.parse(localStorage.getItem(k));p.wordwoodExpedition={tablet:true,store:true};localStorage.setItem(k,JSON.stringify(p));});
  await page.reload();await ready();assert.equal((await state()).guardian.hp,10);
  await pos(1168,624);await page.waitForTimeout(1600);await page.screenshot({path:'/tmp/log-guardian-emerged.png'});
  await page.waitForFunction(()=>window.__storyTest.state()[0].guardian.strikes.length>0,null,{timeout:8000});
  const before=await state();await page.waitForTimeout(250);await page.screenshot({path:'/tmp/log-guardian-warning.png'});
  await pos(before.x+128,before.y);await page.waitForTimeout(1250);
  assert.equal((await state()).hearts,before.hearts,'Dodge avoids the marked landing zone');
  for(let i=0;i<24&&!(await state()).guardian.defeated;i++){
   const b=(await state()).guardian,side=b.x<1100?1:-1;await pos(b.x+side*112,b.y);
   await page.keyboard.press(side===1?'a':'d');await page.waitForTimeout(200);await page.keyboard.press('r');await page.waitForTimeout(600);
  }
  await page.screenshot({path:'/tmp/guardian-combat-debug.png'});
  assert.equal((await state()).guardian.defeated,true);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lexiconleague:story:progress')).wordwoodExpedition.logGuardianFreed),true);
  assert.equal((await state()).raining,false,'Rain stops on victory');
  await page.waitForTimeout(800);await page.screenshot({path:'/tmp/log-guardian-rescue-dialogue.png'});
  const initialKeepers=(await state()).keepers;
  await page.waitForTimeout(6500);await page.screenshot({path:'/tmp/log-guardian-rescued.png'});
  assert.notDeepEqual((await state()).keepers,initialKeepers,'Keepers walk away after short thanks');
  await page.waitForFunction(()=>window.__storyTest.state()[0].keepers.length===0,null,{timeout:60000});
  await page.reload();await ready();assert.equal((await state()).guardian,null,'Rescue stays complete on reload');
  assert.equal((await state()).raining,false,'Rain remains stopped after reload');
  await pos(1232,608);await page.waitForTimeout(800);await page.screenshot({path:'/tmp/log-guardian-return.png'});
  console.log('PASS no pre-Tablet spawn, ten HP, warning/dodge, combat victory, rescue persistence');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
