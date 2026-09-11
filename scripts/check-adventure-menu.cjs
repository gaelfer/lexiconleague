const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:850}});page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
 const base=process.env.STORY_URL||'http://localhost:3001';
 try{
  await page.goto(base+'/story');await page.getByRole('button',{name:'New game',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Continue game',exact:true}).isDisabled(),true);
  await page.screenshot({path:'/tmp/adventure-title.png'});
  await page.getByRole('button',{name:'New game',exact:true}).click();await page.waitForURL('**/story/1');await page.locator('canvas').first().waitFor();
  await page.goto(base+'/story');await page.getByRole('button',{name:'Continue game',exact:true}).click({trial:true});assert.equal(await page.getByRole('button',{name:'Continue game',exact:true}).isEnabled(),true);
  await page.getByRole('button',{name:'New game',exact:true}).click();await page.getByRole('button',{name:'Keep my adventure'}).click();assert.equal(await page.getByRole('alertdialog').count(),0);
  await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({opening:'wordwood',completedChapters:[1],resumeArea:'wordwood',quests:{'a-place-to-rest':{status:'active',steps:[]}},chapterCheckpoints:{2:JSON.stringify({solved:true,found:[0]})},wordwoodExpedition:{tablet:true,logGuardianFreed:true,store:true,herbsUsed:1,gardenGateKey:true,key:true}})));
  await page.reload();await page.getByRole('button',{name:'Continue game',exact:true}).click();await page.waitForURL('**/story/2');
  await page.goto(base+'/story/2?storyTest');await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='WordwoodScene');
  await page.keyboard.press('m');await page.getByRole('dialog',{name:'Adventure menu'}).waitFor();
  const before=await page.evaluate(()=>window.__storyTest.state());await page.keyboard.down('d');await page.waitForTimeout(500);await page.keyboard.up('d');assert.deepEqual(await page.evaluate(()=>window.__storyTest.state()),before);
  await page.getByRole('button',{name:'Gear',exact:true}).click();await page.screenshot({path:'/tmp/adventure-equipment.png'});
  await page.getByRole('button',{name:'Quests',exact:true}).click();await page.getByRole('button',{name:/Side quests/}).click();await page.getByRole('button',{name:/A place to rest/}).click();await page.getByRole('button',{name:'Track this quest'}).click();
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('lexiconleague:story:progress')).trackedSideQuests),['a-place-to-rest']);await page.screenshot({path:'/tmp/adventure-quests.png'});
  await page.getByRole('button',{name:'Map',exact:true}).click();await page.screenshot({path:'/tmp/adventure-map.png'});const nav=await page.getByRole('navigation',{name:'Adventure pages'}).boundingBox();assert.ok(nav.y+nav.height<=850,'Bottom navigation fits without scrolling');
  await page.getByRole('combobox').selectOption('wordwood');await page.screenshot({path:'/tmp/adventure-map-local.png'});
  await page.getByRole('button',{name:'Items',exact:true}).click();await page.getByRole('button',{name:'Herbal reserve, 2',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Health is full'}).isDisabled(),true);await page.screenshot({path:'/tmp/adventure-inventory.png'});
  await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);assert.equal((await page.evaluate(()=>window.__storyTest.state()[0])).scene,'WordwoodScene');
  await page.evaluate(()=>window.__storyTest.takeTestHit(1));await page.keyboard.press('m');await page.getByRole('button',{name:'Use one bundle'}).click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lexiconleague:story:progress')).wordwoodExpedition.herbsUsed),2);assert.equal((await page.evaluate(()=>window.__storyTest.state()[0])).hearts,3);
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Map',exact:true}).click();await page.screenshot({path:'/tmp/adventure-map-mobile.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.setViewportSize({width:1280,height:850});await page.keyboard.press('Escape');
  await page.evaluate(()=>window.__storyTest.reviewPosition(432,272));await page.waitForTimeout(500);await page.keyboard.press('w');await page.waitForFunction(()=>window.__storyTest.state()[0]?.room==='maintenance',null,{timeout:15000}).catch(async e=>{console.log(await page.evaluate(()=>window.__storyTest.state()));throw e;});
  await page.keyboard.press('m');await page.getByRole('dialog').waitFor();const room=await page.evaluate(()=>window.__storyTest.state()[0].room);await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.__storyTest.state()[0].room),room,'Closing the menu must not trigger a travel resume');
  await page.keyboard.press('m');await page.getByRole('button',{name:'System',exact:true}).click();await page.getByRole('button',{name:'Save game',exact:true}).click();await page.getByText('Saved on this device').last().waitFor();
  await page.evaluate(()=>{window.__originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('test storage full');};});await page.getByRole('button',{name:'Save game',exact:true}).click();await page.getByText('Could not save. Check browser storage.').last().waitFor();await page.evaluate(()=>{Storage.prototype.setItem=window.__originalSetItem;delete window.__originalSetItem;});
  await page.getByRole('button',{name:'Save & title screen'}).click();await page.waitForURL('**/story');
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/adventure-title-mobile.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Reset game progress'}).click();await page.getByRole('button',{name:'Keep my adventure'}).click();assert.equal(await page.getByRole('button',{name:'Continue game',exact:true}).isEnabled(),true);
  await page.getByRole('button',{name:'Reset game progress'}).click();await page.getByRole('button',{name:'Erase story progress'}).click();assert.equal(await page.getByRole('button',{name:'Continue game',exact:true}).isDisabled(),true);
  assert.deepEqual(errors,[]);console.log('PASS: new/continue, confirmations, menu pause, tabs, quest tracking, pixel map, saved inventory and healing, saving, title return, reset and mobile layout.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
