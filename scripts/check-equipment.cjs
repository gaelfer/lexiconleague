const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:850}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const state=()=>page.evaluate(()=>window.__storyTest.equipmentState());
 const ready=()=>page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='WordwoodScene');
 try{
  await page.goto('http://localhost:3001/story');await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({opening:'wordwood',completedChapters:[1],chapterCheckpoints:{2:JSON.stringify({found:[0]})}})));
  await page.goto('http://localhost:3001/story/2?storyTest');await ready();await page.keyboard.press('m');await page.getByRole('button',{name:'Gear',exact:true}).click();
  await page.getByRole('button',{name:'Unequip sword',exact:true}).click();await page.getByRole('button',{name:'Equip sword',exact:true}).waitFor();
  await page.getByRole('button',{name:'Traveller’s bow, equipped',exact:true}).click();await page.getByRole('button',{name:'Unequip bow',exact:true}).click();
  await page.screenshot({path:'/tmp/gear-empty-loadout.png',animations:'disabled'});await page.keyboard.press('Escape');
  assert.deepEqual((await state()).gear,[]);assert.equal((await state()).swordVisible,false);
  await page.keyboard.down('q');await page.waitForTimeout(800);await page.keyboard.up('q');await page.keyboard.press('r');await page.waitForTimeout(100);assert.equal((await state()).attackMs,0);assert.equal((await state()).bowMs,0);
  await page.screenshot({path:'/tmp/gear-unarmed.png'});
  await page.reload();await ready();assert.deepEqual((await state()).gear,[]);
  await page.keyboard.press('m');await page.getByRole('button',{name:'Gear',exact:true}).click();await page.getByRole('button',{name:'Equip sword',exact:true}).click();await page.getByRole('button',{name:'Traveller’s bow, in pack',exact:true}).click();await page.getByRole('button',{name:'Equip bow',exact:true}).click();
  await page.screenshot({path:'/tmp/gear-equipped.png',animations:'disabled'});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/gear-mobile.png',animations:'disabled'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.keyboard.press('Escape');
  await page.keyboard.down('q');await page.waitForFunction(()=>window.__storyTest.equipmentState().attackMs>0);await page.keyboard.up('q');await page.waitForTimeout(600);await page.keyboard.press('r');await page.waitForFunction(()=>window.__storyTest.equipmentState().bowMs>0);
  assert.deepEqual(errors,[]);console.log('PASS: equip/unequip, sword visibility, disabled and restored attacks, saved empty loadout, desktop/mobile gear.');
 }catch(e){await page.screenshot({path:'/tmp/gear-failure.png'});throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
