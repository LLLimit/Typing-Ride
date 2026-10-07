import './style.css';
import { BOOKS, MAPS, RIDERS, ACHIEVEMENTS, loadSave, persist, chapterWords, parseBook, type Settings, type Book } from './data';
import { RideGame } from './game';
import { RideScene } from './scene';
import { RideAudio } from './audio';

const icons: Record<string, string> = {
  bike: '<circle cx="5.5" cy="16.5" r="4.5"/><circle cx="18.5" cy="16.5" r="4.5"/><path d="m5.5 16.5 5-10 5 10h-10l8-8 5 8-4-12h-3M8 6.5H5"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  book: '<path d="M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v14c-4-1-6 0-9 2-3-2-5-3-9-2Z"/>',
  flag: '<path d="M5 22V3m0 1c5-4 9 4 14 0v10c-5 4-9-4-14 0"/>',
  trophy: '<path d="M8 3h8v7a4 4 0 0 1-8 0Zm0 2H4v3a5 5 0 0 0 5 5m7-8h4v3a5 5 0 0 1-5 5m-3 1v6m-5 2h10"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  sunset: '<path d="M2 17h20M5 17a7 7 0 0 1 14 0M12 2v4M4 8l2 2m12 0 2-2M4 21h16"/>',
  moon: '<path d="M20 15.5A9 9 0 0 1 8.5 4 9 9 0 1 0 20 15.5Z"/>',
  rain: '<path d="M6 14a5 5 0 1 1 2-9 6 6 0 1 1 10 9M7 17l-2 4m8-4-2 4m8-4-2 4"/>',
  snow: '<path d="M12 2v20M3.5 7l17 10m-17 0 17-10M9 4l3 3 3-3M9 20l3-3 3 3M3 10l4-1-1-4m12 14-1-4 4-1M3 14l4 1-1 4m12-14-1 4 4 1"/>',
  music: '<path d="M9 18V5l12-2v13M9 8l12-2"/><ellipse cx="5.5" cy="18" rx="3.5" ry="3"/><ellipse cx="17.5" cy="16" rx="3.5" ry="3"/>',
  muted: '<path d="M9 18V5l12-2v8M9 8l12-2M16 16l6 6m0-6-6 6"/><ellipse cx="5.5" cy="18" rx="3.5" ry="3"/>',
  headphones: '<path d="M3 14v-3a9 9 0 0 1 18 0v3"/><rect x="2" y="12" width="5" height="9" rx="2"/><rect x="17" y="12" width="5" height="9" rx="2"/>',
  volume: '<path d="M4 9h4l5-4v14l-5-4H4Zm12-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  pause: '<path d="M8 5v14m8-14v14"/>',
  play: '<path d="m8 4 12 8-12 8Z"/>',
  settings: '<path d="M5 3v18M12 3v18M19 3v18"/><path d="M2 8h6m1 8h6m1-10h6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  check: '<path d="m5 12 4 4L20 5"/>',
  wind: '<path d="M2 8h14a3 3 0 1 0-3-3M2 12h18a3 3 0 1 1-3 3M2 16h8a3 3 0 1 1-3 3"/>',
  spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16"/>',
  tree: '<path d="m12 2-7 9h3l-5 7h18l-5-7h3Zm0 16v4"/>',
  wave: '<path d="M2 10c3-5 6 5 10 0s7 5 10 0M2 16c3-5 6 5 10 0s7 5 10 0"/>',
  town: '<path d="M3 21V6l7-3v18M10 8h11v13M6 8v2m0 3v2m0 3v2m8-8h3m-3 4h3M1 21h22"/>',
  flower: '<path d="M12 12c-7 2-9-4-5-5-2-7 5-8 5-3 5-5 9 0 5 3 7 1 5 7 0 5 4 6-3 9-5 4-5 4-8-2-4-4Z"/><circle cx="12" cy="10" r="2"/><path d="M12 17v5"/>',
  infinity: '<path d="M12 12C8 4 2 6 2 12s6 8 10 0c4-8 10-6 10 0s-6 8-10 0Z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 8a3 3 0 1 1 4 3c-1 1-1 2-1 3m0 3v.1"/>',
  keyboard: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M6 9h1m3 0h1m3 0h1m3 0h1M6 12h1m3 0h1m3 0h1m3 0h1M7 16h10"/>',
  heart: '<path d="M12 21S2 15 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 7-10 13-10 13Z"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  redo: '<path d="M4 11a8 8 0 1 1 1 7M4 4v7h7"/>'
};
function icon(name: string, cls = '') { return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.spark}</svg>`; }
function esc(value: string) { return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]!); }
const app = document.querySelector<HTMLDivElement>('#app')!;
const save = loadSave(); const settings = save.settings; const audio = new RideAudio();
let scene: RideScene | undefined; let game: RideGame | undefined; let screen: 'menu' | 'game' | 'result' = 'menu';
let modal = ''; let composing = false; let lastWord = ''; let lastCountdown = ''; let lastUi = 0; let hideWord = false;
let hasSavedResult = false; let shouldResume = false; let speechTimer = 0; let toastTimer = 0;
let menuIndex = 0;
let renderedWord = '';
function books() { return [...BOOKS, ...save.customBooks]; }
function book() { return books().find(b => b.id === settings.book) || BOOKS[0]; }
function store() { if (!persist(save)) toast('浏览器未允许保存，记录暂时保留在本次页面中。'); }

app.innerHTML = `
<header class="topbar"><button class="brand" data-action="home" aria-label="返回首页"><span class="brand-mark">${icon('bike')}</span><span>逐字骑行<small>TYPE & RIDE</small></span></button>
  <div class="top-actions"><span class="live-tag"><i></i> GOOD DAY TO RIDE</span><button class="icon-button" data-action="music" aria-label="切换音乐" title="切换音乐"></button><button class="icon-button" data-action="help" aria-label="玩法说明" title="玩法说明">${icon('help')}</button></div>
</header>
<main id="menu" class="menu-screen">
  <section class="menu-content">
    <div class="eyebrow"><span class="tiny-line"></span> FIND YOUR RHYTHM / 01</div>
    <h1 class="game-title" aria-label="逐字骑行"><span>逐</span><span>字</span><span>骑</span><span>行</span></h1>
    <div class="title-subline">TYPE THE WORDS. RIDE THE WORLD.</div>
    <p class="hero-description">用指尖点燃速度，让词语成为前进的动力。</p>
    <div id="ride-config" class="ride-config"></div>
    <button class="start-button menu-item active" data-action="start"><span><i class="menu-number">01</i> 开始骑行</span><span class="start-tail">START ${icon('arrow')}</span></button>
    <nav class="menu-links" aria-label="主菜单">
      <button class="menu-item" data-action="library"><span class="menu-number">02</span><span>字库<small>选择词集 / 中英文</small></span><em>WORDS</em>${icon('chevron')}</button>
      <button class="menu-item" data-action="records"><span class="menu-number">03</span><span>记录与成就<small>你的每一次突破</small></span><em>RECORDS</em>${icon('chevron')}</button>
      <button class="menu-item" data-action="riders"><span class="menu-number">04</span><span>角色选择<small>今天，由你领骑</small></span><em>RIDERS</em>${icon('chevron')}</button>
    </nav>
    <div class="menu-footnote"><kbd>↑ ↓</kbd> 选择 <span>·</span> <kbd>ENTER</kbd> 确认 <span>·</span> 中文 / ENGLISH</div>
  </section>
  <section class="scene-caption" aria-label="当前地图"><span class="scene-index">01 / 03</span><h2></h2><p></p><div class="scene-map-buttons"></div></section>
  <div class="rider-badge"><span class="rider-badge-label">YOUR RIDER</span><b id="rider-name"></b>${icon('arrow')}</div>
  <div class="floating-note"><span>PRESS START</span><strong>CHASE<br>THE FLOW.</strong></div>
</main>
<section id="game-ui" class="game-screen" hidden>
  <div class="speed-trails" aria-hidden="true">${Array.from({length:8},(_,i)=>`<i style="--y:${13+i%4*20}%;--delay:${-i*.13}s;--side:${i<4?-1:1}"></i>`).join('')}</div>
  <div class="hud"><div class="distance-card"><div class="eyebrow">骑行里程 <span>DISTANCE</span></div><div><strong id="distance">0</strong><span>m</span></div><div class="distance-foot"><span id="chapter-label"></span><span id="best-distance"></span></div></div>
  <div class="stat-cards"><div class="stat-card"><label id="speed-label">WPM</label><strong id="wpm">0</strong><small>指尖速度</small></div><div class="stat-card"><label>ACCURACY</label><strong id="accuracy">100<span>%</span></strong><small>准确率</small></div><div id="sprint-badge" class="sprint-badge" hidden><b>站姿冲刺</b><span>BOOST +35%</span></div></div></div>
  <div class="balance-card"><span>${icon('bike')}<b id="balance-text">骑行平稳</b></span><div class="balance-track"><i></i></div><small>保持节奏，正确输入可恢复平衡</small></div>
  <div id="combo-card" class="combo-card"><strong>0</strong><span>COMBO</span></div>
  <div id="hit-callout" class="hit-callout" aria-hidden="true"><strong>NICE!</strong><span>KEEP THE RHYTHM</span></div><div id="feedback-layer" class="feedback-layer" aria-hidden="true"></div>
  <div class="typing-dock"><div class="word-meta"><span id="practice-tag"></span><span id="word-counter"></span></div>
    <div class="word-heading"><h2 id="word-hint"></h2><button class="listen-button" data-action="speak" aria-label="朗读当前词条">${icon('volume')} <kbd>Tab</kbd></button></div>
    <div id="word-chars" class="word-chars" aria-live="off"></div>
    <div class="type-input-wrap">${icon('keyboard')}<input id="typing-input" type="text" aria-label="在此输入当前词条" placeholder="点击这里，开始输入…" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="next"/><span id="ime-status">随敲随骑</span></div>
    <p class="typing-tip"><span id="feedback-tip">每一个正确的字，都是向前的动力。</span><span><kbd>Esc</kbd> 暂停</span></p>
    <div class="chapter-progress"><i></i></div>
  </div>
  <button class="pause-button control-pill" data-action="pause">${icon('pause')} 暂停 <kbd>Esc</kbd></button>
</section>
<section id="result" class="result-screen" hidden></section>
<footer class="bottom-controls"><button class="control-pill" data-action="environment" id="environment-button"></button><button class="control-pill settings-pill" data-action="settings">${icon('settings')}<span>偏好设置</span></button><span class="performance-note"><i></i><span id="fps-indicator">轻装上路</span></span></footer>
<div id="countdown" class="countdown" hidden><span>READY TO RIDE</span><strong>3</strong><small>跟上节奏 · 即刻出发</small></div>
<div id="modal-layer" class="modal-layer" hidden></div>
<div id="toast" class="toast" role="status" hidden></div>
<div id="sr-feedback" class="sr-only" aria-live="polite"></div>
`;
const $ = <E extends Element = HTMLElement>(s: string) => document.querySelector<E>(s)!;
app.dataset.screen = 'menu';
const feedbackSparks = Array.from({ length: 12 }, (_, i) => {
  const spark = document.createElement('i'); spark.style.setProperty('--angle', `${i * 30}deg`); $('#feedback-layer').append(spark); return spark;
});
function typingFeedback(correct: boolean, word = false) {
  const dock = $('.typing-dock'); dock.classList.remove('hit', 'shake', 'word-complete');
  void (dock as HTMLElement).offsetWidth; dock.classList.add(correct ? word ? 'word-complete' : 'hit' : 'shake');
  const callout = $('#hit-callout'); callout.classList.remove('show', 'miss', 'perfect');
  callout.querySelector('strong')!.textContent = !correct ? 'MISS!' : word ? 'PERFECT!' : game!.combo >= 20 ? 'ON FIRE!' : 'NICE!';
  callout.querySelector('span')!.textContent = !correct ? '正确输入 · 恢复平衡' : word ? 'WORD CLEARED' : `${game!.combo} CHAIN / KEEP GOING`;
  void callout.offsetWidth; callout.classList.add('show'); callout.classList.toggle('miss', !correct); callout.classList.toggle('perfect', word);
  if (correct) { feedbackSparks.forEach(spark => spark.classList.remove('burst')); void $('#feedback-layer').offsetWidth; feedbackSparks.forEach(spark => spark.classList.add('burst')); }
  const combo = $('#combo-card'); combo.classList.remove('bump'); void combo.offsetWidth; combo.classList.add('bump');
}
try { scene = new RideScene($('#world'), settings); scene.onContextLost = () => { game?.pause(); toast('画面连接暂时中断。恢复显卡连接后会自动重新加载。'); }; }
catch { $('#world').innerHTML = '<div class="webgl-fallback">当前浏览器无法启动 3D 画面。<br>请开启硬件加速，或使用最新版 Chrome / Edge。<br>你仍可以练习打字。</div>'; }
function toast(text: string) { const el = $('#toast'); el.textContent = text; el.hidden = false; clearTimeout(toastTimer); toastTimer = window.setTimeout(() => el.hidden = true, 4200); }
function musicButton() { $('.top-actions [data-action="music"]').innerHTML = icon(settings.music ? 'music' : 'muted'); $('.top-actions [data-action="music"]').setAttribute('aria-pressed', String(settings.music)); }
function updateSettings() { store(); scene?.configure(settings); audio.configure(settings); renderMenu(); musicButton(); }
function renderMenu() {
  const b = book(), m = MAPS.find(m => m.id === settings.map)!;
  $('#ride-config').innerHTML = `<div class="segmented mode-switch"><button data-action="mode" data-value="endless" class="${settings.mode === 'endless' ? 'selected' : ''}" aria-pressed="${settings.mode === 'endless'}">${icon('infinity')} 无尽漫游</button><button data-action="mode" data-value="book" class="${settings.mode === 'book' ? 'selected' : ''}" aria-pressed="${settings.mode === 'book'}">${icon('book')} 词本挑战</button></div><div class="config-summary"><button data-action="library"><span class="language-label">${b.language === 'zh' ? '中' : 'EN'}</span>${esc(b.name)}${icon('chevron')}</button><button data-action="practice" class="practice-choice">${icon(settings.practice === 'read' ? 'book' : 'headphones')}${settings.practice === 'read' ? '看词打字' : '听力打字'}</button></div>`;
  $('.scene-caption h2').textContent = m.name; $('.scene-caption p').textContent = m.description; $('.scene-index').textContent = `0${MAPS.indexOf(m) + 1} / 03`;
  $('.scene-map-buttons').innerHTML = MAPS.map(map => `<button data-action="map" data-value="${map.id}" class="${map.id === settings.map ? 'selected' : ''}" aria-label="切换到${map.name}" aria-pressed="${map.id === settings.map}">${icon(map.icon)}</button>`).join('');
  $('#rider-name').textContent = RIDERS[settings.rider].name;
  app.classList.toggle('night-scene', settings.time === 'night');
  $('#environment-button').innerHTML = `${icon(settings.weather !== 'clear' ? settings.weather : settings.time === 'day' ? 'sun' : settings.time === 'sunset' ? 'sunset' : 'moon')} ${settings.time === 'day' ? '日间' : settings.time === 'sunset' ? '黄昏' : '夜晚'}<span class="control-dot">·</span>${settings.weather === 'clear' ? '晴天' : settings.weather === 'rain' ? '小雨' : '飘雪'}${icon('chevron')}`;
}
renderMenu(); musicButton();
function cancelSpeechTimer() { clearTimeout(speechTimer); audio.stopSpeech(); }
function speak() { if (!game) return; audio.speak(game.word.text, game.language, () => toast('当前系统语音不可用。可在模式中切回「看词打字」，或安装对应语言的系统语音。')); }
function scheduleSpeech() { clearTimeout(speechTimer); if (settings.practice === 'listen') speechTimer = window.setTimeout(() => { if (game?.phase === 'playing') speak(); }, 160); }
function startGame() {
  cancelSpeechTimer(); closeModal(false); const b = book(); screen = 'game'; hasSavedResult = false; lastWord = ''; lastCountdown = ''; hideWord = false;
  $('#menu').hidden = true; $('#result').hidden = true; $('#game-ui').hidden = false; $('.bottom-controls').classList.add('in-game'); scene?.setMenu(false);
  app.dataset.screen = 'game'; $('#hit-callout').classList.remove('show');
  const words = settings.mode === 'book' ? chapterWords(b, settings.chapter) : b.words;
  game = new RideGame(words, settings.mode === 'endless', b.language);
  game.onChar = correct => {
    scene?.pulse(correct); audio.effect(correct ? 'hit' : 'error', game!.combo);
    if (!correct) save.mistakes[game!.lastError] = (save.mistakes[game!.lastError] || 0) + 1;
    $('#feedback-tip').textContent = correct ? (game!.combo >= 10 ? '连击加速 · 保持你的节奏' : '打字驱动骑行 · 连续正确输入可恢复平衡') : '失误！车身失衡 · 正确输入找回平衡';
    renderWord(); updateHud(); typingFeedback(correct, correct && game!.charIndex === 0);
  };
  game.onWord = () => { audio.effect('word'); hideWord = false; $('#sr-feedback').textContent = `已完成 ${game!.completed} 个词`; scheduleSpeech(); };
  game.onPhase = phase => {
    $('#countdown').hidden = phase !== 'countdown';
    if (phase === 'playing') { audio.setPlaying(true); focusTyping(); scheduleSpeech(); }
    else audio.setPlaying(false);
    if (phase === 'falling') { cancelSpeechTimer(); $('#feedback-tip').textContent = '失去平衡了…休息一下再出发。'; }
  };
  game.onFinish = finishGame; game.start(); void audio.unlock(settings); renderWord(); updateHud();
}
function focusTyping() { window.setTimeout(() => { if (game?.phase === 'playing' && !modal) $('#typing-input').focus({ preventScroll: true }); }, 40); }
function renderWord() {
  if (!game) return;
  const listen = settings.practice === 'listen';
  const key = `${game.word.text}:${game.charIndex}:${listen}:${hideWord}`;
  if (key === lastWord) return; lastWord = key;
  $('#practice-tag').innerHTML = `${icon(listen ? 'headphones' : 'book')} ${listen ? 'LISTEN & TYPE' : 'READ & TYPE'}`;
  $('#word-counter').textContent = settings.mode === 'book' ? `${Math.min(game.completed + 1, game.words.length)} / ${game.words.length} 词` : `已完成 ${game.completed} 词`;
  $('#word-hint').textContent = listen ? '听见什么，就写下什么。' : game.word.hint;
  const concealed = listen && !hideWord;
  $('#word-chars').classList.toggle('long-word', game.chars.length > 12);
  const wordStamp = `${game.word.text}:${listen}:${hideWord}`;
  if (wordStamp !== renderedWord) {
    renderedWord = wordStamp;
    $('#word-chars').innerHTML = game.chars.map((char, i) => `<span class="letter ${i < game!.charIndex ? 'done' : i === game!.charIndex ? 'current' : ''}">${i < game!.charIndex || !concealed ? esc(char === ' ' ? '␣' : char) : '·'}</span>`).join('') + (listen ? `<button class="reveal-word" data-action="reveal" aria-label="${hideWord ? '隐藏答案' : '显示答案'}">${hideWord ? '隐藏' : '提示'}</button>` : '');
  } else $('#word-chars').querySelectorAll<HTMLElement>('.letter').forEach((letter, i) => {
    const cls = `letter ${i < game!.charIndex ? 'done' : i === game!.charIndex ? 'current' : ''}`;
    if(letter.className !== cls) letter.className = cls;
    const char = i < game!.charIndex || !concealed ? game!.chars[i] === ' ' ? '␣' : game!.chars[i] : '·'; if(letter.textContent !== char) letter.textContent = char;
  });
  $('#typing-input').setAttribute('placeholder', game.language === 'zh' ? '用中文输入法输入，组词后确认即可…' : '点击这里，输入上方英文词条…');
  if (game.phase === 'playing' && game.charIndex === 0 && game.completed > 0) scheduleSpeech();
}
function updateHud() {
  if (!game) return;
  $('#distance').textContent = String(Math.floor(game.distance));
  $('#wpm').textContent = String(game.fingerSpeed);
  $('#sprint-badge').hidden = !game.sprinting;
  $('#game-ui').classList.toggle('sprinting', game.sprinting);
  $('#game-ui').classList.toggle('is-paused', game.phase === 'paused');
  $('#speed-label').textContent = game.language === 'zh' ? '字 / 分' : 'WPM';
  $('#accuracy').innerHTML = `${game.accuracy}<span>%</span>`;
  const best = save.totals.bestDistance;
  $('#best-distance').textContent = `最佳 ${Math.floor(best)} m`;
  $('#chapter-label').textContent = settings.mode === 'book' ? `第 ${settings.chapter + 1} 章 · ${game.completed}/${game.words.length}` : `无尽漫游 · ${game.completed} 词`;
  $('#combo-card strong').textContent = String(game.combo); $('#combo-card').classList.toggle('hot', game.combo >= 20);
  const instability = Math.min(1, game.instability);
  $('.balance-track i').setAttribute('style', `width:${(1 - instability) * 100}%`);
  $('.balance-card').classList.toggle('danger', instability > 0.58); $('.balance-card').classList.toggle('warning', instability > 0.2);
  $('#balance-text').textContent = instability > 0.78 ? '快失去平衡了！' : instability > 0.2 ? '摇晃中 · 正确输入来恢复' : '骑行平稳';
  $('.chapter-progress i').setAttribute('style', `width:${settings.mode === 'book' ? game.completed / game.words.length * 100 : Math.min(100, game.combo * 2)}%`);
}
function finishGame() {
  if (!game || hasSavedResult) return; hasSavedResult = true; cancelSpeechTimer(); audio.setPlaying(false); audio.effect(game.won ? 'win' : 'lose');
  const b = book(); const prior = save.totals.bestDistance; const oldAchievements = ACHIEVEMENTS.map(a => save.unlocked.includes(a.name) || a.test(save.records));
  save.records.unshift({ id: Date.now(), date: new Date().toISOString(), distance: Math.round(game.distance), wpm: game.wpm, accuracy: game.accuracy, words: game.completed, combo: game.maxCombo, duration: Math.round(game.elapsed), won: game.won, book: b.name, map: settings.map, language: b.language, mode: settings.mode, practice: settings.practice });
  save.totals.rides++; save.totals.distance += Math.round(game.distance); save.totals.bestDistance = Math.max(prior, Math.round(game.distance));
  save.records = save.records.slice(0, 100);
  const newAchievements = ACHIEVEMENTS.filter((a, i) => !oldAchievements[i] && a.test(save.records));
  save.unlocked = [...new Set([...save.unlocked, ...ACHIEVEMENTS.filter((a, i) => oldAchievements[i] || a.test(save.records)).map(a => a.name)])]; store();
  screen = 'result'; $('#game-ui').hidden = true; $('#countdown').hidden = true; $('#result').hidden = false; scene?.setMenu(true);
  app.dataset.screen = 'result';
  const record = game.distance > prior && game.distance > 0;
  $('#result').innerHTML = `<div class="result-content"><div class="eyebrow">${icon(game.won ? 'flag' : 'heart')} ${game.won ? 'CHAPTER COMPLETE / VICTORY' : 'BALANCE LOST / GAME OVER'}</div><h1>${game.won ? '骑行完成<br>挑战成功。' : '失去平衡<br>挑战结束。'}</h1><p>${game.won ? '又一章词语，变成了沿途的风景。' : '偶尔失去平衡，也是学会骑行的一部分。'}</p><div class="result-distance"><span>本次骑行</span><strong>${Math.floor(game.distance)}<small>m</small></strong>${record ? '<b>新的里程记录！</b>' : `<small>历史最佳 ${Math.floor(Math.max(prior, game.distance))} m</small>`}</div><div class="result-stats"><div><strong>${b.language === 'zh' ? game.cpm : game.wpm}</strong><span>${b.language === 'zh' ? '字 / 分' : '平均 WPM'}</span></div><div><strong>${game.accuracy}<small>%</small></strong><span>准确率</span></div><div><strong>${game.completed}</strong><span>完成词条</span></div><div><strong>${game.maxCombo}</strong><span>最高连击</span></div></div>${newAchievements.length ? `<div class="new-achievement">${icon('trophy')} 新成就 · ${newAchievements.map(a => a.name).join(' / ')}</div>` : ''}${game.lastError ? `<div class="last-word"><span>下次，一定能记住</span><b>${esc(game.lastError)}</b><button data-action="last-speak" aria-label="朗读失误词条">${icon('volume')}</button></div>` : ''}<div class="result-actions"><button class="primary-button" data-action="start">${icon('redo')} 再骑一程 <kbd>Enter</kbd></button>${game.won && settings.mode === 'book' && (settings.chapter + 1) * 12 < b.words.length ? '<button class="secondary-button" data-action="next-chapter">下一章 →</button>' : ''}<button class="text-button" data-action="home">返回主菜单 <kbd>Esc</kbd></button></div></div><div class="result-stamp"><span>${game.won ? 'RIDE' : 'TRY'}</span><strong>${game.won ? 'CLEAR!' : 'AGAIN.'}</strong>${icon(game.won ? 'spark' : 'heart')}</div>`;
}
function home() {
  if (game && !['finished', 'ready'].includes(game.phase)) game.finish();
  cancelSpeechTimer(); audio.setPlaying(false); closeModal(false); screen = 'menu'; game = undefined;
  $('#menu').hidden = false; $('#game-ui').hidden = true; $('#result').hidden = true; $('#countdown').hidden = true;
  $('.bottom-controls').classList.remove('in-game'); scene?.setMenu(true); renderMenu();
  app.dataset.screen = 'menu';
}
let previousFocus: HTMLElement | null = null;
function openModal(type: string) {
  previousFocus = document.activeElement as HTMLElement; modal = type; shouldResume = game?.phase === 'playing' || game?.phase === 'countdown';
  if (shouldResume) { game!.pause(); cancelSpeechTimer(); }
  const layer = $('#modal-layer'); layer.hidden = false; layer.innerHTML = renderModal(type);
  const dismiss = layer.querySelector<HTMLElement>('[data-action="close"]'); dismiss?.focus({ preventScroll: true });
}
function refreshModal() { if (modal) $('#modal-layer').innerHTML = renderModal(modal); }
function closeModal(resume = true) {
  $('#modal-layer').hidden = true; $('#modal-layer').innerHTML = ''; modal = '';
  if (resume && shouldResume && game?.phase === 'paused') { game.resume(); focusTyping(); } else if (previousFocus && document.contains(previousFocus)) previousFocus.focus({ preventScroll: true });
  shouldResume = false;
}
function dialog(title: string, subtitle: string, content: string, wide = false) { return `<div class="modal-scrim" data-action="close"></div><section class="modal-panel ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-heading"><div><span class="eyebrow">${subtitle}</span><h2 id="modal-title">${title}</h2></div><button class="icon-button" data-action="close" aria-label="关闭面板">${icon('close')}</button></div>${content}</section>`; }
function renderModal(type: string): string {
  if (type === 'library') {
    const b = book(); const words = chapterWords(b, settings.chapter);
    return dialog('字库选择', 'YOUR POCKET DICTIONARY', `<div class="library-layout"><div class="book-list">${books().map(bk => `<button class="book-card ${settings.book === bk.id ? 'selected' : ''}" data-action="book" data-value="${bk.id}"><span class="book-cover" style="--book-color:${bk.color}">${icon('book')}<small>${bk.language.toUpperCase()}</small></span><span><b>${esc(bk.name)}</b><small>${esc(bk.subtitle)}</small></span>${icon(settings.book === bk.id ? 'check' : 'chevron')}</button>`).join('')}<button class="add-book" data-action="import">＋ 创建我的词本</button><button class="add-book" data-action="mistakes">${icon('redo')} 练习易错词 (${Object.keys(save.mistakes).length})</button></div><div class="book-preview"><span class="eyebrow">${b.language === 'zh' ? 'CHINESE' : 'ENGLISH'} / ${b.words.length} WORDS</span><h3>${esc(b.name)}</h3><p>每章 12 个词。一小段路，一点新收获。</p><label class="field-label">选择章节<select id="chapter-select">${Array.from({ length: Math.ceil(b.words.length / 12) }, (_, i) => `<option value="${i}" ${i === settings.chapter ? 'selected' : ''}>第 ${i + 1} 章 · ${Math.min(12, b.words.length - i * 12)} 词</option>`).join('')}</select></label><div class="preview-words">${words.map(w => `<div><b>${esc(w.text)}</b><span>${esc(w.hint)}</span></div>`).join('')}</div><button class="primary-button" data-action="use-book">${icon('check')} 带上这本词集</button></div></div>`, true);
  }
  if (type === 'import') return dialog('创建词本', 'MAKE IT YOUR OWN', `<form id="import-form"><label class="field-label">词本名称<input name="name" placeholder="例如：我的旅行词集" maxlength="24"/></label><label class="field-label">词条语言<select name="language"><option value="en">英语 English</option><option value="zh">中文 Chinese</option></select></label><label class="field-label">每行一个词，用 | 分隔提示或释义<textarea name="words" rows="8" required placeholder="breeze | 微风&#10;journey | 旅程&#10;&#10;中文示例：&#10;春风 | 春日里轻柔的风"></textarea></label><p class="muted-text">支持中英文、短句和空格。最多 1000 条，每条最多 48 字符。记录保存在本机浏览器。</p><button type="submit" class="primary-button">${icon('book')} 保存词本</button></form>`);
  if (type === 'riders') return dialog('角色选择', 'MEET YOUR RIDING BUDDY', `<div class="rider-list">${RIDERS.map((r, i) => `<button class="rider-card ${settings.rider === i ? 'selected' : ''}" data-action="rider" data-value="${i}"><span class="avatar"><img src="/riders/${r.id}.png" alt="${r.name}角色头像" width="96" height="96" /></span><span><small>${r.en}</small><b>${r.name}</b><p>${r.description}</p></span>${icon(settings.rider === i ? 'check' : 'chevron')}</button>`).join('')}</div><p class="muted-text">角色只改变外观。每个人都能骑出自己的节奏。</p>`);
  if (type === 'environment') return dialog('场景与天气', 'A CHANGE OF SCENERY', `<div class="environment-maps">${MAPS.map(m => `<button class="map-card ${settings.map === m.id ? 'selected' : ''}" data-action="map" data-value="${m.id}" style="--map-color:${m.color}">${icon(m.icon)}<b>${m.name}</b><small>${m.en}</small></button>`).join('')}</div><h3 class="option-heading">一天里的时光</h3><div class="option-grid">${[['day', '日间', 'sun'], ['sunset', '黄昏', 'sunset'], ['night', '夜晚', 'moon']].map(([v, t, i]) => `<button data-action="time" data-value="${v}" class="option-card ${settings.time === v ? 'selected' : ''}">${icon(i)}${t}</button>`).join('')}</div><h3 class="option-heading">窗外的天气</h3><div class="option-grid">${[['clear', '晴天', 'sun'], ['rain', '小雨', 'rain'], ['snow', '飘雪', 'snow']].map(([v, t, i]) => `<button data-action="weather" data-value="${v}" class="option-card ${settings.weather === v ? 'selected' : ''}">${icon(i)}${t}</button>`).join('')}</div><p class="muted-text">换一张地图，里程和打字进度仍会继续。</p>`);
  if (type === 'settings') return dialog('游戏设置', 'YOUR RIDE, YOUR WAY', `<div class="setting-row"><span><b>场景与骑行音乐</b><small>轻柔旋律，随地图和游戏状态变化</small></span><button class="toggle ${settings.music ? 'on' : ''}" data-action="music" aria-label="背景音乐" aria-pressed="${settings.music}"><i></i></button></div><div class="setting-row"><span><b>打字反馈音效</b><small>正确、失误、连击与倒计时</small></span><button class="toggle ${settings.effects ? 'on' : ''}" data-action="effects" aria-label="反馈音效" aria-pressed="${settings.effects}"><i></i></button></div><label class="field-label volume-label">音量 <span>${Math.round(settings.volume * 100)}%</span><input type="range" id="volume-slider" min="0" max="1" step="0.05" value="${settings.volume}"/></label><h3 class="option-heading">画面质量</h3><div class="option-grid">${[['auto', '自动', '自适应分辨率'], ['low', '轻快', '低分辨率，关闭阴影'], ['high', '精细', '高分辨率，柔和阴影']].map(([v, t, d]) => `<button class="quality-card ${settings.quality === v ? 'selected' : ''}" data-action="quality" data-value="${v}"><b>${t}</b><small>${d}</small></button>`).join('')}</div><h3 class="option-heading">练习方式</h3><div class="segmented"><button data-action="set-practice" data-value="read" class="${settings.practice === 'read' ? 'selected' : ''}">${icon('book')} 看词打字</button><button data-action="set-practice" data-value="listen" class="${settings.practice === 'listen' ? 'selected' : ''}">${icon('headphones')} 听力打字</button></div>`);
  if (type === 'records') {
    const rs = save.records, best = save.totals.bestDistance, total = save.totals.distance;
    return dialog('记录与成就', 'YOUR LITTLE MILESTONES', `<div class="record-summary"><div><strong>${Math.floor(best)}<small>m</small></strong><span>最远的一程</span></div><div><strong>${(total / 1000).toFixed(1)}<small>km</small></strong><span>累计里程</span></div><div><strong>${save.totals.rides}</strong><span>骑行次数</span></div></div><h3 class="option-heading">旅途徽章 <small>${ACHIEVEMENTS.filter(a => (save.unlocked.includes(a.name) || a.test(rs))).length} / ${ACHIEVEMENTS.length}</small></h3><div class="achievements">${ACHIEVEMENTS.map(a => `<div class="achievement ${(save.unlocked.includes(a.name) || a.test(rs)) ? 'unlocked' : ''}"><span>${icon(a.icon)}</span><b>${a.name}</b><small>${a.description}</small></div>`).join('')}</div><h3 class="option-heading">最近的骑行 <button class="text-button" data-action="export-records">${icon('download')} 导出记录</button></h3><div class="ride-history">${rs.length ? rs.slice(0, 10).map(r => `<div><span class="history-icon">${icon(MAPS.find(m => m.id === r.map)?.icon || 'bike')}</span><span><b>${esc(r.book)}</b><small>${new Date(r.date).toLocaleString('zh-CN', { timeZone: 'Asia/Hong_Kong', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · ${r.won ? '章节完成' : '骑行结束'}</small></span><strong>${r.distance}<small>m</small></strong><span class="history-stat">${r.wpm} WPM<br>${r.accuracy}%</span></div>`).join('') : '<div class="empty-state">第一段风景，正等着你出发。</div>'}</div>`, true);
  }
  if (type === 'pause') return dialog('暂停骑行', 'TAKE A LITTLE BREATH', `<div class="pause-art">${icon('bike')}<span>没有计时，没有压力。<br>准备好了，就继续向前。</span></div><button class="primary-button full-width" data-action="resume">${icon('play')} 继续骑行 <kbd>Esc</kbd></button><button class="secondary-button full-width" data-action="end-ride">结束本次骑行并结算</button><button class="text-button full-width" data-action="home">返回主菜单</button>`);
  return dialog('操作说明', 'HOW TO RIDE', `<div class="help-steps"><div><span>01</span><p><b>选一个词本和一段风景</b>支持英文与中文。无尽模式随机出词，词本挑战每章 12 个词。</p></div><div><span>02</span><p><b>看词输入，或听声音输入</b>英文区分大小写，逐字输入即可。中文使用输入法组词确认，拼音过程不会计错。听力模式按 Tab 重听，也可以点「提示」。</p></div><div><span>03</span><p><b>打得越快，骑得越快</b>指尖速度达到 40 时站起冲刺，骑行速度提升 35%。错误会让人物持续摇晃；连续正确输入能找回平衡。过度失衡会摔倒，12 秒不输入也会逐渐失衡。</p></div></div><div class="shortcut-list"><span><kbd>Enter</kbd> 开始 / 再来一程</span><span><kbd>Esc</kbd> 暂停 / 继续</span><span><kbd>Tab</kbd> 朗读当前词条</span><span><kbd>Space</kbd> 暂停（输入法组词时除外）</span></div><p class="muted-text">中文速度显示为字 / 分，英文为 WPM。音乐需点击页面后启用，听力依赖浏览器与系统语音。粘贴输入不可用。</p>`);
}

app.addEventListener('click', event => {
  const button = (event.target as Element).closest<HTMLElement>('[data-action]'); if (!button) return;
  const action = button.dataset.action!, value = button.dataset.value!;
  void audio.unlock(settings); audio.effect('click');
  switch (action) {
    case 'start': startGame(); break;
    case 'home': home(); break;
    case 'mode': settings.mode = value as Settings['mode']; updateSettings(); break;
    case 'practice': settings.practice = settings.practice === 'read' ? 'listen' : 'read'; updateSettings(); break;
    case 'map': settings.map = value as Settings['map']; updateSettings(); if (modal) refreshModal(); break;
    case 'time': settings.time = value as Settings['time']; updateSettings(); refreshModal(); break;
    case 'weather': settings.weather = value as Settings['weather']; updateSettings(); refreshModal(); break;
    case 'rider': settings.rider = Number(value); updateSettings(); refreshModal(); break;
    case 'book': settings.book = value; settings.chapter = 0; updateSettings(); refreshModal(); break;
    case 'use-book': closeModal(); toast(`已带上「${book().name}」`); break;
    case 'library': case 'records': case 'riders': case 'environment': case 'settings': case 'help': openModal(action); break;
    case 'import': modal = 'import'; refreshModal(); break;
    case 'close': closeModal(); break;
    case 'music': settings.music = !settings.music; updateSettings(); refreshModal(); break;
    case 'effects': settings.effects = !settings.effects; updateSettings(); refreshModal(); break;
    case 'quality': settings.quality = value as Settings['quality']; updateSettings(); refreshModal(); break;
    case 'set-practice': settings.practice = value as Settings['practice']; hideWord = false; lastWord = ''; updateSettings(); renderWord(); refreshModal(); break;
    case 'speak': speak(); focusTyping(); break;
    case 'last-speak': if (game?.lastError) audio.speak(game.lastError, game.language); break;
    case 'reveal': hideWord = !hideWord; renderWord(); focusTyping(); break;
    case 'pause': if (game?.phase === 'playing' || game?.phase === 'countdown') openModal('pause'); break;
    case 'resume': closeModal(); break;
    case 'end-ride': closeModal(false); game?.finish(); break;
    case 'next-chapter': settings.chapter++; store(); startGame(); break;
    case 'mistakes': {
      const source = books().flatMap(b => b.words), language = book().language;
      const words = Object.keys(save.mistakes).sort((a, b) => save.mistakes[b] - save.mistakes[a]).filter(text => language === 'zh' ? /[\u3400-\u9fff]/.test(text) : !/[\u3400-\u9fff]/.test(text)).map(text => source.find(w => w.text === text) || { text, hint: '曾经绊过你，再试一次。' });
      if (!words.length) { toast('当前语言还没有易错词，继续轻松骑行吧。'); break; }
      const existing = save.customBooks.find(b => b.id === `mistakes-${language}`);
      const custom: Book = { id: `mistakes-${language}`, name: '我的易错词回顾', subtitle: `${language === 'zh' ? '中文' : '英语'} · ${words.length} 词 · 回顾`, color: '#c6a1a0', language, words, custom: true };
      if (existing) Object.assign(existing, custom); else save.customBooks.push(custom);
      settings.book = custom.id; settings.chapter = 0; updateSettings(); refreshModal(); break;
    }
    case 'export-records': {
      const blob = new Blob([JSON.stringify(save.records, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = '逐字骑行-骑行记录.json'; a.click(); URL.revokeObjectURL(url); break;
    }
  }
});
app.addEventListener('change', event => {
  const target = event.target as HTMLInputElement;
  if (target.id === 'chapter-select') { settings.chapter = Number(target.value); updateSettings(); refreshModal(); }
});
app.addEventListener('input', event => {
  const target = event.target as HTMLInputElement;
  if (target.id === 'volume-slider') { settings.volume = Number(target.value); store(); audio.configure(settings); $('.volume-label span').textContent = `${Math.round(settings.volume * 100)}%`; }
});
app.addEventListener('submit', event => {
  event.preventDefault(); const form = event.target as HTMLFormElement; if (form.id !== 'import-form') return;
  try {
    const data = new FormData(form); const b = parseBook(String(data.get('words')), String(data.get('name')), data.get('language') as 'en' | 'zh');
    if (save.customBooks.length >= 20) { toast('最多保存 20 本自定义词本。'); return; }
    save.customBooks.push(b); settings.book = b.id; settings.chapter = 0; updateSettings(); modal = 'library'; refreshModal(); toast('你的词本已保存。');
  } catch (error) { toast((error as Error).message); }
});
const input = $('#typing-input') as HTMLInputElement;
function consumeInput() { if (!input.value) return; const value = input.value; input.value = ''; game?.input(value); }
input.addEventListener('compositionstart', () => { composing = true; $('#ime-status').textContent = '正在组词…'; });
input.addEventListener('compositionend', () => { composing = false; $('#ime-status').textContent = '随敲随骑'; consumeInput(); });
input.addEventListener('input', event => { if (composing || (event as InputEvent).isComposing) return; consumeInput(); });
input.addEventListener('paste', event => { event.preventDefault(); toast('用指尖骑行吧，粘贴不会计入练习。'); });
input.addEventListener('drop', event => event.preventDefault());
input.addEventListener('beforeinput', event => { if ((event as InputEvent).inputType === 'insertFromPaste' || (event as InputEvent).inputType === 'insertFromDrop') event.preventDefault(); });
app.addEventListener('pointerover', event => { const item = (event.target as Element).closest<HTMLElement>('.menu-item'); if (item) { const items = Array.from(document.querySelectorAll<HTMLElement>('.menu-item')); menuIndex = items.indexOf(item); items.forEach((el, i) => el.classList.toggle('active', i === menuIndex)); } });
document.addEventListener('keydown', event => {
  if (event.isComposing || composing || event.keyCode === 229) return;
  if (modal) {
    if (event.key === 'Escape') { event.preventDefault(); closeModal(); }
    if (event.key === 'Tab') {
      const focusable = Array.from($('#modal-layer').querySelectorAll<HTMLElement>('button, input, select, textarea, a[href]')).filter(el => !el.hasAttribute('disabled'));
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    return;
  }
  if (screen === 'menu' && ['ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); const items = Array.from(document.querySelectorAll<HTMLElement>('.menu-item')); menuIndex = (menuIndex + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach((el, i) => el.classList.toggle('active', i === menuIndex)); audio.effect('click'); return; }
  if (event.key === 'Enter' && (screen === 'menu' || screen === 'result')) { event.preventDefault(); if (screen === 'menu') document.querySelectorAll<HTMLElement>('.menu-item')[menuIndex].click(); else startGame(); return; }
  if (event.key === 'Escape' && screen === 'result') { home(); return; }
  if (screen !== 'game') return;
  if (event.key === 'Escape' || (event.key === ' ' && game?.chars[game.charIndex] !== ' ')) { if (game?.phase === 'playing' || game?.phase === 'countdown') { event.preventDefault(); openModal('pause'); } return; }
  if (event.key === 'Tab' && game?.phase === 'playing') { event.preventDefault(); speak(); focusTyping(); return; }
  if (game?.phase === 'playing' && document.activeElement !== input && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    input.focus({ preventScroll: true });
    if (game.language === 'en') { event.preventDefault(); game.input(event.key); }
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && (game?.phase === 'playing' || game?.phase === 'countdown') && !modal) openModal('pause'); });
let previousTime = performance.now();
let nextRenderTime = previousTime;
function frame(now: number) {
  if (now < nextRenderTime) { requestAnimationFrame(frame); return; }
  const actualDt = (now - previousTime) / 1000;
  nextRenderTime += (Math.floor((now - nextRenderTime) / (1000 / 60)) + 1) * (1000 / 60);
  const dt = Math.min(actualDt, 0.1); previousTime = now;
  if (!document.hidden) {
    game?.tick(dt); const active = !!game && ['playing', 'countdown', 'falling', 'paused'].includes(game.phase);
    scene?.update(dt, game?.speed ?? 0, active ? game!.instability : 0, game?.phase === 'falling', active, game?.phase === 'paused', game?.sprinting ?? false);
    if (game?.phase === 'countdown') {
      const count = game.countdown > 0.8 ? String(Math.ceil(game.countdown - 0.8)) : 'GO!';
      if (count !== lastCountdown) { lastCountdown = count; $('#countdown strong').textContent = count; $('#countdown').classList.remove('pop'); void ($('#countdown') as HTMLElement).offsetWidth; $('#countdown').classList.add('pop'); audio.effect(count === 'GO!' ? 'go' : 'count'); }
    }
    if (now - lastUi > 100) { if (screen === 'game') updateHud(); $('#fps-indicator').textContent = scene ? `${scene.stats.fps} FPS` : 'TYPE & RIDE'; lastUi = now; }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Read-only diagnostics for browser QA and performance inspection.
Object.defineProperty(window, '__ride', { value: { get game() { return game; }, get settings() { return { ...settings }; }, get stats() { return scene?.stats; }, get screen() { return screen; }, get save() { return structuredClone(save); } } });
