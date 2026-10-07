import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RideGame } from '../src/game.ts';
import { BOOKS, chapterWords, parseBook } from '../src/data.ts';

function playing(words = [{ text: 'breeze', hint: '微风' }], endless = false, lang: 'en' | 'zh' = 'en') {
  const game = new RideGame(words, endless, lang, () => 0.5); game.start();
  for (let i = 0; i < 40; i++) game.tick(0.1);
  assert.equal(game.phase, 'playing'); return game;
}
test('321 GO countdown blocks input and can be paused', () => {
  const game = new RideGame([{ text: 'ride', hint: '骑行' }], false, 'en'); game.start(); game.input('ride'); assert.equal(game.correct, 0);
  game.tick(0.1); const countdown = game.countdown; game.pause(); game.tick(0.1); assert.equal(game.countdown, countdown);
  game.resume(); assert.equal(game.phase, 'countdown');
});
test('English completion updates the visible word before feedback callbacks', () => {
  const game = playing([{ text: 'a', hint: 'a' }, { text: 'b', hint: 'b' }]); let visibleWord = '';
  game.onChar = () => visibleWord = game.word.text;
  game.input('a'); assert.equal(game.completed, 1); assert.equal(visibleWord, 'b'); assert.equal(game.charIndex, 0);
  game.input('b'); assert.equal(game.phase, 'finished'); assert.equal(game.won, true);
});
test('Chinese committed words count each Unicode character and win', () => {
  const game = playing([{ text: '春风', hint: '春日的风' }], false, 'zh'); game.input('春'); assert.equal(game.charIndex, 1);
  game.input('风'); assert.equal(game.correct, 2); assert.equal(game.completed, 1); assert.equal(game.accuracy, 100); assert.equal(game.won, true);
});
test('NFC normalized text and spaces remain valid typing content', () => {
  const game = playing([{ text: 'café au lait', hint: '牛奶咖啡' }]); game.input('cafe\u0301 au lait'); assert.equal(game.won, true); assert.equal(game.errors, 0);
});
test('wrong characters do not advance the target and continuous errors cause a fall', () => {
  const game = playing(); game.input('#'); assert.equal(game.charIndex, 0); assert.equal(game.errors, 1); assert.ok(game.instability > 0);
  game.input('####'); assert.equal(game.phase, 'falling');
  for (let i = 0; i < 13; i++) game.tick(0.1);
  assert.equal(game.phase, 'finished'); assert.equal(game.won, false); assert.equal(game.lastError, 'breeze');
});
test('instability keeps increasing until corrected or a fall occurs', () => {
  const game = playing(); game.input('#'); const before = game.instability;
  for (let i = 0; i < 50; i++) game.tick(0.1);
  assert.ok(game.instability > before);
  game.input('bree'); assert.ok(game.instability < before);
});
test('correct input restores balance and resets the consecutive error combo', () => {
  const game = playing(); game.input('br'); assert.equal(game.combo, 2); game.input('#'); assert.equal(game.combo, 0);
  const instability = game.instability; game.input('ee'); assert.equal(game.combo, 2); assert.ok(game.instability < instability);
  assert.equal(game.maxCombo, 2);
});
test('typing speed creates actual cycling speed and distance', () => {
  const game = playing([{ text: 'breeze', hint: '微风' }], true); game.input('breeze');
  for (let i = 0; i < 20; i++) game.tick(0.1);
  assert.ok(game.speed > 0); assert.ok(game.distance > 0); assert.ok(game.wpm > 0);
});
test('rolling speed decays when typing stops', () => {
  const game = playing([{ text: 'breeze', hint: '微风' }], true); game.input('breeze');
  for (let i = 0; i < 20; i++) game.tick(0.1); const before = game.speed;
  for (let i = 0; i < 70; i++) game.tick(0.1);
  assert.ok(game.speed < before * 0.02);
});
test('pause freezes distance, game time, balance and typed input', () => {
  const game = playing([{ text: 'breeze', hint: '微风' }], true); game.input('breeze'); game.tick(0.1); game.pause();
  const before = [game.distance, game.elapsed, game.instability, game.correct]; game.tick(0.1); game.input('breeze');
  assert.deepEqual([game.distance, game.elapsed, game.instability, game.correct], before); game.resume(); assert.equal(game.phase, 'playing');
});
test('endless mode cycles words without ever winning', () => {
  const game = playing([{ text: 'hi', hint: '你好' }, { text: 'go', hint: '出发' }], true);
  for (let i = 0; i < 30; i++) game.input(game.word.text);
  assert.equal(game.completed, 30); assert.equal(game.phase, 'playing'); assert.equal(game.won, false);
});
test('idle riders eventually lose balance', () => {
  const game = playing(); for (let i = 0; i < 400; i++) game.tick(0.1); assert.equal(game.phase, 'finished');
});
test('finish callback runs once even after repeated end requests', () => {
  const game = playing(); let calls = 0; game.onFinish = () => calls++; game.finish(); game.finish(); assert.equal(calls, 1);
});
test('last chapter returns only the remaining words and clamps invalid selection', () => {
  const book = BOOKS.find(b => b.id === 'academic')!; assert.equal(chapterWords(book, 3).length, 4); assert.equal(chapterWords(book, 100).length, 4);
});
test('custom dictionary accepts bilingual hints, limits size and rejects empty books', () => {
  const book = parseBook('hello world | 你好世界\n\n咖啡\t饮品\n' + 'x'.repeat(49), '我的词本', 'zh');
  assert.equal(book.words.length, 2); assert.equal(book.words[0].text, 'hello world'); assert.equal(book.words[1].hint, '饮品');
  assert.throws(() => parseBook('\n\n', '', 'en'));
  assert.equal(parseBook(Array.from({length: 1005}, (_, i) => 'word' + i).join('\n'), '', 'en').words.length, 1000);
});

test('English standing sprint starts at 40 WPM and provides 35 percent extra cycling speed', () => {
  const game=playing([{text:'a',hint:'a'}],true);game.input('a'.repeat(19));
  assert.equal(game.fingerSpeed,38);assert.equal(game.sprinting,false);
  game.input('a');assert.equal(game.fingerSpeed,40);assert.equal(game.sprinting,true);
  game.input('a');assert.equal(game.fingerSpeed,42);
  for(let i=0;i<30;i++)game.tick(.1);
  assert.ok(game.speed>42*.09*1.34 && game.speed<42*.09*1.36,'The actual speed must settle at the boosted target');
  game.pause();const before=[game.elapsed,game.speed,game.distance,game.fingerSpeed];
  for(let i=0;i<80;i++)game.tick(.1);
  assert.equal(game.sprinting,true);assert.deepEqual([game.elapsed,game.speed,game.distance,game.fingerSpeed],before);
  game.resume();for(let i=0;i<65;i++)game.tick(.1);
  assert.equal(game.sprinting,false);assert.equal(game.fingerSpeed,0);assert.ok(game.speed<.02);
});

test('Chinese sprint uses the displayed characters per minute rather than English WPM', () => {
  const game=playing([{text:'风',hint:'风'}],true,'zh');game.input('风'.repeat(3));
  assert.equal(game.liveWpm,6);assert.equal(game.fingerSpeed,30);assert.equal(game.sprinting,false);
  game.input('风');assert.equal(game.fingerSpeed,40);assert.equal(game.sprinting,true);
});

test('severe imbalance cancels standing sprint and corrected input can restore it', () => {
  const game=playing([{text:'a',hint:'a'}],true);game.input('a'.repeat(21));assert.equal(game.sprinting,true);
  game.input('###');assert.equal(game.phase,'playing');assert.equal(game.sprinting,false);
  game.input('a');assert.equal(game.sprinting,true);
  game.input('#####');assert.equal(game.phase,'falling');assert.equal(game.sprinting,false);
});
