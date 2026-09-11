const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:850}});page.setDefaultTimeout(15000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const base=process.env.STORY_URL||'http://localhost:3001';
 const progress=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('lexiconleague:story:progress')));
 const shot=name=>page.screenshot({path:`/tmp/quests-${name}.png`,animations:'disabled'});
 const ready=scene=>page.waitForFunction(scene=>window.__storyTest?.state()[0]?.scene===scene,scene);
 try{
  await page.goto(base+'/story');await page.evaluate(()=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({opening:'wordwood',completedChapters:[1],chapterCheckpoints:{1:JSON.stringify({gates:[1,2,3],roadCleared:true})}})));
  await page.goto(base+'/story/1?storyTest');await ready('DungeonScene');await page.keyboard.press('m');await page.getByRole('dialog',{name:'Adventure menu'}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Quests',exact:true}).count(),1);
  await page.getByRole('button',{name:'Quests',exact:true}).click();await page.getByRole('button',{name:/Side quests/}).click();await page.getByText(/No side quests discovered yet/).waitFor();
  await page.getByRole('button',{name:'Map',exact:true}).click();await page.getByText('Your house',{exact:true}).waitFor();await page.keyboard.press('Escape');
  await page.evaluate(()=>window.__storyTest.reviewPosition(208,304));await page.keyboard.press('m');const first=Number(await page.getByLabel('Your location',{exact:true}).getAttribute('data-map-x'));await page.keyboard.press('Escape');
  await page.evaluate(()=>window.__storyTest.reviewPosition(1808,432));await page.keyboard.press('m');const second=Number(await page.getByLabel('Your location',{exact:true}).getAttribute('data-map-x'));assert.ok(second>first+50,'Regional marker follows actual road position');await shot('region-road');
  await page.getByRole('combobox').selectOption('road');assert.equal(Number(await page.getByLabel('Your location',{exact:true}).getAttribute('data-map-x')),22+1808/3200*276);await shot('road-river');await page.keyboard.press('Escape');
  // Wayfarer landmarks appear on the regional survey and all three local charts.
  await page.goto(base+'/story/village?storyTest');await ready('DungeonScene');await page.keyboard.press('m');await page.getByRole('button',{name:'Map',exact:true}).click();
  await page.getByText('Wayfarer Gate',{exact:true}).waitFor();await page.getByRole('combobox').selectOption('village');await page.getByText('Wayfarer Gate',{exact:true}).waitFor();await shot('village-wayfarer');await page.keyboard.press('Escape');
  // Talking to Wren discovers her requests; entering the inn alone does not.
  await page.goto(base+'/story/village?storyTest');await ready('DungeonScene');await page.evaluate(()=>window.__storyTest.reviewInnRoom(1,0));await ready('InnScene');assert.equal((await progress()).quests,undefined);
  await page.evaluate(()=>window.__storyTest.reviewPosition(304,400));await page.waitForTimeout(350);await page.keyboard.press('e');await page.waitForFunction(()=>!!JSON.parse(localStorage.getItem('lexiconleague:story:progress')).quests?.['lost-keepers']);assert.ok((await progress()).quests['a-place-to-rest']);
  // Bellum's request activates only after the conversation, not on entering the Archive.
  await page.goto(base+'/story/1?storyTest&interiorReview=archive');await ready('ArchiveScene');assert.equal((await progress()).quests['field-notes'],undefined);await page.evaluate(()=>window.__storyTest.reviewPosition(464,336));await page.waitForTimeout(350);await page.keyboard.press('e');await page.waitForFunction(()=>window.__storyTest.state()[0]?.dialogue?.includes('One small favour'));await page.waitForTimeout(350);await page.keyboard.press('e');await page.waitForFunction(()=>!!JSON.parse(localStorage.getItem('lexiconleague:story:progress')).quests?.['field-notes']);
  await page.goto(base+'/story/2?storyTest');await ready('WordwoodScene');await page.keyboard.press('m');await page.getByRole('button',{name:'Quests',exact:true}).click();await page.getByRole('button',{name:/Main quests/}).click();await shot('main-log');
  await page.getByRole('button',{name:/Side quests/}).click();for(const title of ['Notes from the woods','A place to rest']){await page.getByRole('button',{name:new RegExp(title)}).click();await page.getByRole('button',{name:'Track this quest',exact:true}).click();}
  await page.getByRole('button',{name:/The lost caretakers/}).click();assert.equal(await page.getByRole('button',{name:'2 side quests already tracked'}).isDisabled(),true);await shot('side-log');
  assert.equal((await progress()).trackedSideQuests.length,2);
  // Keyboard Tab still traverses the open journal; it only toggles the gameplay overlay outside it.
  await page.keyboard.press('Tab');assert.equal(await page.getByRole('dialog').count(),1);await page.keyboard.press('Escape');assert.equal(await page.getByRole('complementary',{name:'Tracked quests'}).locator('article').count(),3);await shot('overlay');
  await page.keyboard.press('Tab');await page.getByRole('button',{name:'Tab · Show quests',exact:true}).waitFor();assert.equal(await page.getByRole('complementary',{name:'Tracked quests'}).locator('article').count(),0);await page.keyboard.press('Tab');await page.getByRole('button',{name:'Tab · Hide quests',exact:true}).waitFor();assert.equal(await page.getByRole('complementary',{name:'Tracked quests'}).locator('article').count(),3);
  await page.keyboard.press('m');await page.getByRole('button',{name:'Map',exact:true}).click();await shot('three-waypoints');await page.getByRole('combobox').selectOption('wordwood');await shot('wordwood-river');
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Quests',exact:true}).click();await page.getByRole('button',{name:/Side quests/}).click();await shot('mobile-log');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.keyboard.press('Escape');await shot('mobile-overlay');
  assert.deepEqual(errors,[]);console.log('PASS: NPC-only discovery, category buttons, one main/two side limit, Tab overlay, modal Tab navigation, road live map position, river charts and mobile layout.');
 }catch(error){await shot('failure');console.error(await page.evaluate(()=>window.__storyTest?.state()));throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
