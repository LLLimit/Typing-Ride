import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const url = process.env.RIDE_URL || 'http://127.0.0.1:5173/';
const executablePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ executablePath, headless: true });
await fs.mkdir('test-results', { recursive: true });
await fs.mkdir('previews', { recursive: true });
const errors = [], results = [];
async function makePage(viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('Speech')) errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#world canvas').count(), 1, 'WebGL scene must render');
  return { context, page };
}
async function snapshot(page) { return page.evaluate(() => { const g = window.__ride.game; return g && { phase: g.phase, word: g.word.text, completed: g.completed, correct: g.correct, errors: g.errors, elapsed: g.elapsed, instability: g.instability, distance: g.distance, won: g.won }; }); }
async function begin(page) { await page.locator('#menu [data-action="start"]').click(); await page.waitForFunction(() => window.__ride.game?.phase === 'playing'); }
async function chooseBook(page, id) { await page.locator('#menu [data-action="library"]').first().click(); await page.locator(`[data-action="book"][data-value="${id}"]`).click(); await page.locator('[data-action="use-book"]').click(); }
async function typeWord(page, delay = 12) { const word = (await snapshot(page)).word; await page.locator('#typing-input').pressSequentially(word, { delay }); }
async function check(name, work) { const start = Date.now(); await work(); results.push({ name, passed: true, ms: Date.now() - start }); console.log(`PASS ${name}`); }
try {
  await check('Reversed cycling, autonomous traffic and pedestrians, rain pools and frozen pause', async () => {
    const { context, page } = await makePage();
    const a = await page.evaluate(() => window.__ride.stats); await page.waitForTimeout(500);
    const b = await page.evaluate(() => window.__ride.stats);
    assert.equal(b.direction, '-Z'); assert.equal(b.riderYaw, Math.PI);
    assert.equal(b.traffic.length, 4); assert.equal(b.pedestrians.length, 6);
    assert.ok(b.traffic.every(car=>car.z>=10&&car.z<=74),'Menu traffic stays behind the rider preview');
    assert.ok(b.traffic.every((car, i) => Math.abs(car.z-a.traffic[i].z) > .1), 'Cars move independently of typing');
    assert.ok(b.pedestrians.every((walker, i) => walker.step !== a.pedestrians[i].step), 'Pedestrians animate their walk');
    await page.locator('[data-action="environment"]').click(); await page.locator('[data-action="weather"][data-value="rain"]').click(); await page.locator('[data-action="time"][data-value="night"]').click(); await page.locator('[data-action="close"]').last().click();
    await begin(page); assert.equal(await page.evaluate(() => window.__ride.stats.rainStreaks), 960);
    await typeWord(page, 50); await page.waitForTimeout(180);
    await page.screenshot({ path: 'previews/11-rainy-night-ride.png' });
    await page.keyboard.press('Escape'); await page.waitForTimeout(450);
    const frozen = await page.evaluate(() => window.__ride.stats); await page.waitForTimeout(350);
    const frozenAfter = await page.evaluate(() => window.__ride.stats);
    assert.deepEqual(frozenAfter.traffic, frozen.traffic); assert.deepEqual(frozenAfter.pedestrians, frozen.pedestrians);
    await page.keyboard.press('Escape'); await page.locator('#typing-input').pressSequentially('#');
    assert.equal(await page.locator('#hit-callout strong').textContent(), 'MISS!'); assert.ok(await page.locator('.typing-dock').evaluate(e => e.classList.contains('shake')));
    await context.close();
  });
  await check('Three maps, environment, riders and bounded GPU memory', async () => {
    const { context, page } = await makePage();
    await page.waitForTimeout(900);
    await page.screenshot({ path: 'previews/01-sunny-neighborhood.png' });
    const initial = await page.evaluate(() => window.__ride.stats);
    for (const map of ['coast', 'forest']) { await page.locator(`.scene-map-buttons [data-value="${map}"]`).click(); await page.waitForTimeout(400); await page.screenshot({ path: `previews/${map === 'coast' ? '02-coastal-letters' : '03-into-the-woods'}.png` }); }
    for (let i = 0; i < 3; i++) for (const map of ['town', 'coast', 'forest']) await page.locator(`.scene-map-buttons [data-value="${map}"]`).click();
    await page.locator('.scene-map-buttons [data-value="town"]').click(); await page.waitForTimeout(500);
    const final = await page.evaluate(() => window.__ride.stats);
    assert.ok(final.geometries <= initial.geometries + 2, `Geometry leak: ${initial.geometries} -> ${final.geometries}`);
    assert.ok(final.textures <= initial.textures + 2, `Texture leak: ${initial.textures} -> ${final.textures}`);
    await page.locator('[data-action="riders"]').click();
    for (const rider of ['1', '2', '0']) { await page.locator(`[data-action="rider"][data-value="${rider}"]`).click(); assert.equal(await page.evaluate(() => window.__ride.settings.rider), Number(rider)); }
    await page.locator('[data-action="close"]').last().click();
    await page.locator('[data-action="environment"]').click();
    for (const time of ['sunset', 'night']) await page.locator(`[data-action="time"][data-value="${time}"]`).click();
    for (const weather of ['rain', 'snow', 'clear']) await page.locator(`[data-action="weather"][data-value="${weather}"]`).click();
    await page.locator('[data-action="close"]').last().click(); await page.waitForTimeout(400); await page.screenshot({ path: 'previews/05-night-neighborhood.png' });
    assert.equal(await page.evaluate(() => window.__ride.settings.time), 'night');
    await context.close();
  });
  await check('English chapter: countdown pause, next-word feedback, balance recovery, win and saved record', async () => {
    const { context, page } = await makePage();
    await page.locator('[data-action="mode"][data-value="book"]').click();
    await page.locator('#menu [data-action="start"]').click();
    await page.keyboard.press('Escape'); assert.equal((await snapshot(page)).phase, 'paused');
    const count = await page.evaluate(() => window.__ride.game.countdown); await page.waitForTimeout(300); assert.equal(await page.evaluate(() => window.__ride.game.countdown), count);
    await page.keyboard.press('Escape'); await page.waitForFunction(() => window.__ride.game.phase === 'playing');
    assert.equal((await snapshot(page)).word, 'breeze');
    await typeWord(page, 30); assert.equal((await snapshot(page)).word, 'coffee'); assert.equal(await page.locator('#word-hint').textContent(), '咖啡'); assert.equal(await page.locator('.letter.current').textContent(), 'c');
    await page.locator('#typing-input').pressSequentially('#'); const before = await snapshot(page); assert.equal(before.errors, 1);
    await typeWord(page); assert.ok((await snapshot(page)).instability < before.instability);
    await page.keyboard.press('Escape'); const paused = await snapshot(page); await page.waitForTimeout(300); assert.equal((await snapshot(page)).elapsed, paused.elapsed);
    await page.keyboard.press('Escape');
    await page.screenshot({ path: 'previews/04-riding.png' });
    for (let i = 0; i < 10; i++) await typeWord(page, 20);
    await page.waitForFunction(() => window.__ride.screen === 'result');
    assert.equal((await snapshot(page)).won, true); assert.equal((await snapshot(page)).completed, 12);
    const data = await page.evaluate(() => window.__ride.save); assert.equal(data.records.length, 1); assert.equal(data.totals.rides, 1); assert.ok(data.unlocked.includes('翻过一章'));
    await page.waitForTimeout(1100); await page.screenshot({ path: 'previews/06-chapter-complete.png' });
    await page.reload({ waitUntil: 'networkidle' }); assert.equal(await page.evaluate(() => window.__ride.save.records.length), 1);
    await page.locator('[data-action="records"]').click(); assert.equal(await page.locator('.achievement.unlocked').count(), data.unlocked.length);
    await context.close();
  });
  await check('Five mistakes trigger animated fall, settlement, mistake book and one saved record', async () => {
    const { context, page } = await makePage(); await begin(page);
    await page.locator('#typing-input').pressSequentially('#####', { delay: 50 });
    assert.equal((await snapshot(page)).phase, 'falling'); await page.waitForFunction(() => window.__ride.screen === 'result');
    assert.equal((await snapshot(page)).won, false); assert.equal((await snapshot(page)).errors, 5);
    await page.waitForTimeout(1100); await page.screenshot({ path: 'previews/07-ride-settlement.png' });
    await page.keyboard.press('Escape'); await chooseBook(page, 'daily');
    await page.locator('#menu [data-action="library"]').first().click(); await page.locator('[data-action="mistakes"]').click();
    assert.equal(await page.evaluate(() => window.__ride.settings.book), 'mistakes-en');
    assert.equal(await page.evaluate(() => window.__ride.save.records.length), 1);
    await context.close();
  });
  await check('Chinese IME: pre-edit ignored, committed word counted once, CPM HUD and chapter victory', async () => {
    const { context, page } = await makePage(); await chooseBook(page, 'chinese');
    await page.locator('[data-action="mode"][data-value="book"]').click(); await begin(page);
    await page.locator('#typing-input').evaluate(input => {
      input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' })); input.value = 'chunfeng';
      input.dispatchEvent(new InputEvent('input', { bubbles: true, data: 'chunfeng', isComposing: true, inputType: 'insertCompositionText' }));
    });
    assert.equal((await snapshot(page)).correct, 0); assert.equal((await snapshot(page)).errors, 0);
    await page.locator('#typing-input').evaluate(input => {
      input.value = '春风'; input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '春风' }));
      input.dispatchEvent(new InputEvent('input', { bubbles: true, data: '春风', inputType: 'insertText' }));
    });
    assert.equal((await snapshot(page)).correct, 2); assert.equal((await snapshot(page)).completed, 1); assert.equal((await snapshot(page)).word, '微光');
    assert.equal(await page.locator('#speed-label').textContent(), '字 / 分');
    await page.screenshot({ path: 'previews/08-chinese-typing.png' });
    for (let i = 0; i < 11; i++) {
      const word = (await snapshot(page)).word;
      await page.locator('#typing-input').evaluate((input, value) => { input.value = value; input.dispatchEvent(new InputEvent('input', { bubbles: true, data: value, inputType: 'insertText' })); }, word);
    }
    assert.equal((await snapshot(page)).won, true); assert.equal((await snapshot(page)).errors, 0);
    await context.close();
  });
  await check('Listening conceals answers, supports hint/replay, settings pause and manual settlement', async () => {
    const { context, page } = await makePage(); await page.locator('[data-action="practice"]').click(); await begin(page);
    assert.ok((await page.locator('#word-chars').textContent()).includes('·'));
    await page.locator('[data-action="reveal"]').click(); assert.ok((await page.locator('#word-chars').textContent()).includes((await snapshot(page)).word[0]));
    await page.keyboard.press('Tab');
    await page.locator('[data-action="settings"]').click(); assert.equal((await snapshot(page)).phase, 'paused');
    await page.locator('[data-action="quality"][data-value="low"]').click(); await page.locator('[data-action="effects"]').click();
    await page.locator('[data-action="set-practice"][data-value="read"]').click(); await page.locator('[data-action="close"]').last().click();
    assert.equal((await snapshot(page)).phase, 'playing'); assert.equal(await page.evaluate(() => window.__ride.settings.quality), 'low');
    await typeWord(page); await page.keyboard.press('Escape'); await page.locator('[data-action="end-ride"]').click();
    assert.equal((await snapshot(page)).phase, 'finished'); assert.equal(await page.evaluate(() => window.__ride.save.records.length), 1);
    await context.close();
  });
  await check('Custom dictionary with spaces and literal HTML is safe and playable', async () => {
    const { context, page } = await makePage(); await page.locator('#menu [data-action="library"]').first().click(); await page.locator('[data-action="import"]').click();
    await page.locator('input[name="name"]').fill('<b>我的词本</b>'); await page.locator('textarea[name="words"]').fill('hello world | <img src=x onerror=alert(1)>\ncafé | 咖啡');
    await page.locator('#import-form button[type="submit"]').click();
    assert.equal(await page.locator('.book-preview img').count(), 0); assert.equal(await page.locator('.book-preview h3').textContent(), '<b>我的词本</b>');
    await page.locator('[data-action="use-book"]').click(); await page.locator('[data-action="mode"][data-value="book"]').click(); await begin(page);
    await typeWord(page, 25); assert.equal((await snapshot(page)).phase, 'playing'); assert.equal((await snapshot(page)).word, 'café');
    await typeWord(page); assert.equal((await snapshot(page)).won, true);
    await context.close();
  });
  await check('Mobile viewport fits menu, gameplay and library', async () => {
    const { context, page } = await makePage({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: 'previews/09-mobile-menu.png' });
    await page.locator('#menu [data-action="library"]').first().click();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.keyboard.press('Escape');
    await begin(page); await typeWord(page);
    await page.screenshot({ path: 'previews/10-mobile-riding.png' });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await context.close();
  });
  assert.deepEqual(errors, [], 'No browser or WebGL errors');
} catch (error) {
  console.error(error); results.push({ passed: false, error: error.message }); process.exitCode = 1;
} finally {
  await fs.writeFile('test-results/browser-report.json', JSON.stringify({ url, results, errors }, null, 2)); await browser.close();
}
