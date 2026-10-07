import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const stats=()=>page.evaluate(()=>window.__ride.stats);
const state=()=>page.evaluate(()=>{const g=window.__ride.game;return{fingerSpeed:g.fingerSpeed,sprinting:g.sprinting,speed:g.speed,word:g.word.text,correct:g.correct,phase:g.phase};});
const report={checks:[],samples:[]};
try{
  await page.goto(process.env.RIDE_URL||'http://127.0.0.1:5173/',{waitUntil:'networkidle'});
  await page.locator('[data-action="mode"][data-value="endless"]').click();
  const menuScale=(await stats()).riderScale;
  await page.locator('#menu [data-action="start"]').click();await page.waitForFunction(()=>window.__ride.game.phase==='playing');
  const seated=await stats();assert.equal(seated.riderScale,menuScale);assert.equal(seated.riderScale,.65);
  // Drive the transition with real keyboard events, rather than changing game state.
  for(let i=0;i<2;i++){const s=await state();await page.locator('#typing-input').pressSequentially(s.word,{delay:25});}
  await page.waitForTimeout(450);await page.screenshot({path:'previews/14-seated-riding.png'});
  while((await state()).fingerSpeed<40){const s=await state();await page.locator('#typing-input').pressSequentially(s.word,{delay:25});}
  await page.waitForTimeout(950);const standing=await stats(),boosted=await state();
  assert.equal(boosted.sprinting,true);assert.ok(standing.sprint>.98);assert.ok(standing.hips[1]>1.95);
  assert.ok(standing.cameraFov>45.5);assert.ok(boosted.speed>boosted.fingerSpeed*.09*1.25);
  assert.equal(await page.locator('#sprint-badge').isVisible(),true);
  const checkAxes=s=>{for(const axis of s.bicycleAxes)assert.ok(Math.abs(axis[0]-1)<1e-9&&Math.abs(axis[1])<1e-9&&Math.abs(axis[2])<1e-9);for(const car of s.carAxes)for(const axis of car)assert.ok(Math.abs(axis[0]+1)<1e-9&&Math.abs(axis[1])<1e-9&&Math.abs(axis[2])<1e-9);};
  checkAxes(seated);checkAxes(standing);assert.ok(standing.bicycleWheelAngle-seated.bicycleWheelAngle>Math.PI*2);
  await page.screenshot({path:'previews/13-standing-sprint.png'});
  report.samples.push({label:'seated',...seated},{label:'standing',...standing,...boosted});report.checks.push('Stable wheel planes, consistent proportions, keyboard-triggered standing pose, acceleration and widening camera');
  await page.keyboard.press('Escape');await page.waitForTimeout(250);const frozen=await stats();await page.waitForTimeout(450);const after=await stats();
  for(const key of ['sprint','cameraFov','hips','pedalAngle','bicycleWheelAngle','carAxes'])assert.deepEqual(after[key],frozen[key],`${key} must freeze while paused`);
  report.checks.push('Pause freezes both the rider animation and the boost camera');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>window.__ride.game.fingerSpeed===0,undefined,{timeout:8500});await page.waitForTimeout(1000);
  const cooled=await stats();assert.ok(cooled.sprint<.01);assert.ok(cooled.cameraFov<38.1);assert.ok(cooled.hips[1]<1.77);assert.equal(await page.locator('#sprint-badge').isVisible(),false);checkAxes(cooled);
  report.checks.push('After typing slows, the seated pose, normal camera and ordinary speed return');
  report.samples.push({label:'cooled',...cooled});assert.deepEqual(errors,[]);report.errors=errors;
  await fs.writeFile('test-results/motion-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks,sprintFingerSpeed:boosted.fingerSpeed,boostSpeed:boosted.speed,cameraFov:standing.cameraFov,riderScale:standing.riderScale,errors},null,2));
}finally{await browser.close();}
