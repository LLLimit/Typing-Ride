import { chromium } from '@playwright/test';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const p=await b.newPage({viewport:{width:1440,height:900}});
p.on('pageerror',e=>console.log('ERROR',e.message));p.on('console',m=>{if(m.type()==='error')console.log(m.text())});
await p.goto('http://127.0.0.1:5175/',{waitUntil:'networkidle'});await p.waitForTimeout(1200);await p.screenshot({path:'previews/rework-menu.png'});console.log(await p.evaluate(()=>window.__ride.stats));
await p.locator('[data-action="environment"]').click();await p.locator('[data-action="time"][data-value="night"]').click();await p.locator('[data-action="weather"][data-value="rain"]').click();await p.locator('[data-action="close"]').last().click();await p.waitForTimeout(400);await p.screenshot({path:'previews/rework-night-menu.png'});
await p.locator('#menu [data-action="start"]').click();await p.waitForFunction(()=>window.__ride.game.phase==='playing');await p.waitForTimeout(500);await p.screenshot({path:'previews/rework-night-game.png'});console.log(await p.evaluate(()=>window.__ride.stats));await b.close();
