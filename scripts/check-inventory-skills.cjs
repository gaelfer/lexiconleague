const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:850}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const ready=()=>page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='WordwoodScene');
 try{
 await page.goto('http://localhost:3001/story');await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({opening:'wordwood',completedChapters:[1],chapterCheckpoints:{2:JSON.stringify({found:[0]})}})));
 await page.goto('http://localhost:3001/story/2?storyTest');await ready();
 await page.keyboard.press('q');await page.waitForFunction(()=>window.__storyTest.equipmentState().attackMs>0);await page.waitForFunction(()=>window.__storyTest.equipmentState().attackMs===0);await page.waitForTimeout(120);
 await page.keyboard.down('q');await page.waitForTimeout(200);await page.keyboard.up('q');await page.waitForFunction(()=>window.__storyTest.equipmentState().attackMs>0);await page.waitForTimeout(350);
 await page.keyboard.down('q');await page.waitForTimeout(450);assert.equal(await page.evaluate(()=>window.__storyTest.equipmentState().attackMs),0);await page.keyboard.up('q');await page.waitForTimeout(50);assert.equal(await page.evaluate(()=>window.__storyTest.equipmentState().attackMs),0);
 await page.keyboard.down('q');await page.waitForFunction(()=>window.__storyTest.equipmentState().holdMs>=1020);assert.equal(await page.evaluate(()=>window.__storyTest.equipmentState().attackMs),0);await page.keyboard.up('q');await page.waitForFunction(()=>window.__storyTest.equipmentState().attackType==='spin'&&window.__storyTest.equipmentState().attackMs>0);await page.waitForTimeout(650);
 await page.keyboard.press('m');await page.getByRole('button',{name:'Inventory',exact:true}).click();
 assert.equal(await page.locator('[aria-label="Inventory page 1"] > *').count(),16);
 await page.getByLabel('Assign Q tool').selectOption('');await page.getByRole('button',{name:'Traveller’s sword, 1',exact:true}).click();await page.getByRole('button',{name:'Equip sword',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Traveller’s sword, 1',exact:true}).count(),0);await page.getByLabel('Assign Q tool').selectOption('');await page.getByRole('button',{name:'Traveller’s sword, 1',exact:true}).waitFor();
 await page.getByLabel('Assign F tool').selectOption('bow');await page.screenshot({path:'/tmp/inventory-tools.png'});
 await page.getByRole('button',{name:'Next',exact:true}).click();assert.equal(await page.locator('[aria-label="Inventory page 2"] > *').count(),16);
 await page.keyboard.press('Escape');await page.keyboard.press('f');await page.waitForFunction(()=>window.__storyTest.equipmentState().bowMs>0);
 await page.waitForTimeout(650);await page.keyboard.press('r');assert.equal(await page.evaluate(()=>window.__storyTest.equipmentState().bowMs),0);
 await page.keyboard.press('m');await page.getByRole('button',{name:'Skills',exact:true}).click();await page.getByRole('button',{name:/UPGRADE Steady focus/}).click();await page.getByRole('button',{name:'Learn · 1 point',exact:true}).click();await page.screenshot({path:'/tmp/inventory-skills.png'});
 await page.getByRole('button',{name:'Inventory',exact:true}).click();await page.getByLabel('Assign F tool').selectOption('sword');await page.keyboard.press('Escape');await page.keyboard.down('f');await page.waitForFunction(()=>window.__storyTest.equipmentState().holdMs>=820);await page.screenshot({path:'/tmp/spin-ready.png'});await page.keyboard.up('f');await page.waitForFunction(()=>window.__storyTest.equipmentState().attackType==='spin'&&window.__storyTest.equipmentState().attackMs>0);
 await page.reload();await ready();assert.equal(await page.evaluate(()=>window.__storyTest.equipmentState().slots.F),'sword');
 await page.keyboard.press('m');await page.getByRole('button',{name:'Inventory',exact:true}).click();await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/inventory-mobile.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);console.log('PASS: 16-slot pages, F bow/sword, old binding disabled, skill learning, spin release, saved slots, mobile width.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
