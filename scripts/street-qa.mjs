import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const url=process.env.RIDE_URL||'http://127.0.0.1:5173/';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));const report={riders:[],resources:[],street:[],errors};
try{
await page.goto(url,{waitUntil:'networkidle'});await page.waitForTimeout(1000);
await page.locator('[data-action="riders"]').click();await page.waitForTimeout(400);await page.screenshot({path:'previews/31-character-selection.png'});
assert.equal(await page.locator('.rider-card').count(),3);assert.equal(await page.locator('.rider-card img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)),true);
assert.equal(await page.locator('.rider-list').innerText().then(t=>/许晴|阿栗/.test(t)),false);
for(let pass=0;pass<5;pass++){
  for(const index of [1,2,0]){await page.locator(`[data-action="rider"][data-value="${index}"]`).click();await page.waitForTimeout(250);}
  report.resources.push(await page.evaluate(()=>window.__ride.stats));
}
const before=report.resources[1],after=report.resources.at(-1);assert.ok(after.geometries<=before.geometries+2,'Character geometry must plateau');assert.ok(after.textures<=before.textures+2,'Shared gradients must not grow per switch');
for(const [id,name]of ['lin','mango','pudding'].entries()){
  await page.locator(`[data-action="rider"][data-value="${id}"]`).click();await page.locator('[data-action="close"]').last().click();await page.waitForTimeout(700);await page.screenshot({path:`previews/32-${name}-street-menu.png`});
  assert.equal(await page.evaluate(()=>window.__ride.stats.riderId),name);
  await page.locator('#menu [data-action="start"]').click();await page.waitForFunction(()=>window.__ride.game?.phase==='playing');
  for(let i=0;i<5;i++){const text=await page.evaluate(()=>window.__ride.game.word.text);await page.locator('#typing-input').pressSequentially(text,{delay:14});}
  await page.waitForTimeout(650);const stats=await page.evaluate(()=>window.__ride.stats);assert.ok(stats.sprint>.9);assert.ok(stats.cameraFov>44);report.riders.push({name,...stats});
  await page.screenshot({path:`previews/33-${name}-standing-ride.png`});
  await page.keyboard.press('Escape');await page.waitForTimeout(200);const paused=await page.evaluate(()=>window.__ride.stats.pedalAngle);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.__ride.stats.pedalAngle),paused);
  await page.locator('[data-action="home"]').last().click();await page.waitForTimeout(150);
  if(id<2)await page.locator('#menu [data-action="riders"]').click();
}
await page.locator('#menu [data-action="riders"]').click();await page.locator('[data-action="rider"][data-value="0"]').click();await page.locator('[data-action="close"]').last().click();
// Observe two complete shop cycles in the animated menu, without altering game state through diagnostics.
for(let i=0;i<4;i++){await page.waitForTimeout(2500);report.street.push(await page.evaluate(()=>window.__ride.stats));await page.screenshot({path:`previews/34-street-detail-${i}.png`});}
assert.ok(report.street[0].town.types.length>=8);assert.equal(report.street[0].town.shops,16);assert.ok(report.street[0].town.openInteriors);assert.equal(new Set(report.street[0].traffic.map(c=>c.model)).size,4);
await page.locator('[data-action="environment"]').click();await page.locator('[data-action="time"][data-value="night"]').click();await page.locator('[data-action="weather"][data-value="rain"]').click();await page.locator('[data-action="close"]').last().click();await page.waitForTimeout(1500);await page.screenshot({path:'previews/35-japanese-street-rainy-night.png'});
await page.reload({waitUntil:'networkidle'});assert.equal(await page.evaluate(()=>window.__ride.settings.rider),0);assert.deepEqual(errors,[]);await fs.writeFile('test-results/street-polish.json',JSON.stringify(report,null,2));console.log({riders:report.riders.map(s=>({name:s.name,fps:s.fps,sprint:s.sprint,drawCalls:s.drawCalls})),resourceGeometry:report.resources.map(s=>s.geometries),resourceTextures:report.resources.map(s=>s.textures),errors});}finally{await browser.close();}
