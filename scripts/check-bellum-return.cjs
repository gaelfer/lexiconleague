const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 try{
  await page.goto('http://localhost:3000/story');
  for(const rescued of [false,true]){
   await page.evaluate(rescued=>localStorage.setItem('lexiconleague:story:progress',JSON.stringify({completedChapters:[1],wordwoodExpedition:{tablet:true,studied:true,logGuardianFreed:rescued}})),rescued);
   await page.goto('http://localhost:3000/story/1?interiorReview=archive&storyTest');
   await page.waitForFunction(()=>window.__storyTest?.state()[0]?.scene==='ArchiveScene');
   await page.evaluate(()=>window.__storyTest.reviewPosition(464,336));await page.waitForTimeout(500);await page.keyboard.press('e');
   const lines=[];
   for(let i=0;i<8;i++){
    await page.waitForTimeout(350);const line=await page.evaluate(()=>window.__storyTest.state()[0].dialogue);
    if(!line)break;lines.push(line);
    if(line.includes('corrupted Inklings'))await page.screenshot({path:'/tmp/bellum-caretaker-report.png'});
    await page.keyboard.press('e');
   }
   assert.equal(lines.join(' ').includes('corrupted Inklings'),rescued,'Bellum learns the rescue result only after it happens');
  }
  console.log('PASS Bellum rescue dialogue is gated on caretaker rescue, including already-studied Tablet saves');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
