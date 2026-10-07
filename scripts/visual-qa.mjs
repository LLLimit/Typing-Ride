import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const url=process.env.RIDE_URL||'http://127.0.0.1:5173/';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const report={url,renderer:'Chrome / 1440 × 900 / device scale 1',samples:[],resources:[]};
await page.goto(url,{waitUntil:'networkidle'});await page.waitForTimeout(1300);
for(const state of [{map:'town',time:'day',weather:'clear'},{map:'town',time:'night',weather:'rain'},{map:'coast',time:'sunset',weather:'clear'},{map:'forest',time:'day',weather:'snow'}]){
  await page.locator('[data-action="environment"]').click();
  for(const [key,value]of Object.entries(state))await page.locator(`#modal-layer [data-action="${key}"][data-value="${value}"]`).click();
  await page.locator('[data-action="close"]').last().click();await page.waitForTimeout(2300);
  report.samples.push({...state,...await page.evaluate(()=>window.__ride.stats)});
}
await page.locator('.scene-map-buttons [data-value="town"]').click();
await page.locator('[data-action="environment"]').click();await page.locator('[data-action="time"][data-value="day"]').click();await page.locator('[data-action="weather"][data-value="clear"]').click();await page.locator('[data-action="close"]').last().click();
// Warm each reusable material and model before comparing repeated selection cycles.
for(let pass=0;pass<2;pass++){
  await page.locator('[data-action="riders"]').click();
  for(const id of ['1','2','0']){await page.locator(`[data-action="rider"][data-value="${id}"]`).click();await page.waitForTimeout(100);}
  await page.locator('[data-action="close"]').last().click();await page.waitForTimeout(250);report.resources.push(await page.evaluate(()=>window.__ride.stats));
}
const before=report.resources[0],after=report.resources[1];
assert.ok(after.geometries<=before.geometries+2,'Repeated character selection must release geometry');assert.ok(after.textures<=before.textures+2,'Repeated character selection must release face textures');
await page.screenshot({path:'previews/12-visual-overhaul-menu.png'});
for(const size of [{width:1280,height:720},{width:1920,height:1080},{width:862,height:1084},{width:768,height:1024},{width:390,height:844},{width:360,height:740}]){
  await page.setViewportSize(size);await page.waitForTimeout(500);
  assert.ok(await page.locator('#menu [data-action="start"]').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<innerHeight;}),`${size.width} menu start must fit`);
  assert.ok(await page.locator('#menu [data-action="riders"]').evaluate(e=>e.getBoundingClientRect().bottom<innerHeight-45),`${size.width} last menu item must clear bottom controls`);
  const actor=await page.evaluate(()=>window.__ride.stats.riderScreen);
  assert.ok(actor.y>.02&&actor.y<.65,`${size.width} rider head must stay visible vertically`);
  assert.ok(actor.x>(size.width>700?.52:.1)&&actor.x<.99,`${size.width} rider must clear the menu panel`);
  if(size.width===390)await page.screenshot({path:'previews/09-mobile-menu.png'});
}
assert.deepEqual(errors,[]);report.errors=errors;await fs.writeFile('test-results/visual-performance.json',JSON.stringify(report,null,2));console.log(JSON.stringify({samples:report.samples.map(s=>({map:s.map,time:s.time,weather:s.weather,fps:s.fps,drawCalls:s.drawCalls,triangles:s.triangles})),resourceGeometry:[before.geometries,after.geometries],resourceTextures:[before.textures,after.textures]},null,2));await browser.close();
