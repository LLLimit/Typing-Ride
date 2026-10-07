import type { Word } from './data';
export type GamePhase = 'ready' | 'countdown' | 'playing' | 'paused' | 'falling' | 'finished';
export class RideGame {
  phase: GamePhase = 'ready';
  words: Word[]; endless: boolean; language: 'en' | 'zh';
  wordIndex = 0; charIndex = 0; correct = 0; errors = 0; combo = 0; maxCombo = 0;
  elapsed = 0; distance = 0; speed = 0; instability = 0; countdown = 3.8;
  completed = 0; won = false; lastError = ''; private fallTime = 0; private idle = 0;
  private hits: number[] = []; private shuffled: Word[]; private rng: () => number;
  private resumePhase: 'countdown' | 'playing' = 'playing';
  onChar?: (correct: boolean) => void;
  onWord?: () => void;
  onFinish?: () => void;
  onPhase?: (phase: GamePhase) => void;
  constructor(words: Word[], endless: boolean, language: 'en' | 'zh', rng = Math.random) {
    if (!words.length) throw new Error('词库不能为空');
    this.words = words; this.endless = endless; this.language = language; this.rng = rng;
    this.shuffled = [...words]; if (endless) this.shuffle();
  }
  private shuffle() { for (let i = this.shuffled.length - 1; i > 0; i--) { const j = Math.floor(this.rng() * (i + 1)); [this.shuffled[i], this.shuffled[j]] = [this.shuffled[j], this.shuffled[i]]; } }
  get word(): Word { return this.shuffled[Math.min(this.wordIndex, this.shuffled.length - 1)]; }
  get chars(): string[] { return Array.from(this.word.text.normalize('NFC')); }
  get accuracy() { return this.correct + this.errors ? Math.round(this.correct / (this.correct + this.errors) * 100) : 100; }
  get wpm() { return this.elapsed > 0 ? Math.round(this.correct / 5 / (this.elapsed / 60)) : 0; }
  get cpm() { return this.elapsed > 0 ? Math.round(this.correct / (this.elapsed / 60)) : 0; }
  get liveWpm() { return this.hits.length * 2; }
  get liveCpm() { return this.hits.length * 10; }
  get fingerSpeed() { return this.language === 'zh' ? this.liveCpm : this.liveWpm; }
  get sprinting() { return (this.phase === 'playing' || this.phase === 'paused') && this.fingerSpeed >= 40 && this.instability < 0.58; }
  setPhase(phase: GamePhase) { this.phase = phase; this.onPhase?.(phase); }
  start() { this.setPhase('countdown'); }
  pause() { if (this.phase === 'playing' || this.phase === 'countdown') { this.resumePhase = this.phase; this.setPhase('paused'); } }
  resume() { if (this.phase === 'paused') { this.setPhase(this.resumePhase); this.idle = 0; } }
  input(text: string) {
    if (this.phase !== 'playing') return;
    for (const char of Array.from(text.normalize('NFC'))) {
      if (this.phase !== 'playing') break;
      if (char === this.chars[this.charIndex]) {
        this.correct++; this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.charIndex++; this.hits.push(this.elapsed); this.idle = 0;
        this.instability = Math.max(0, this.instability - 0.13);
        let wordComplete = false, shouldFinish = false;
        if (this.charIndex >= this.chars.length) {
          this.completed++; this.charIndex = 0; this.wordIndex++; wordComplete = true;
          if (this.wordIndex >= this.shuffled.length) {
            if (this.endless) { const previous = this.shuffled.at(-1)?.text; this.shuffle(); if (this.shuffled.length > 1 && this.shuffled[0].text === previous) [this.shuffled[0], this.shuffled[1]] = [this.shuffled[1], this.shuffled[0]]; this.wordIndex = 0; }
            else { this.won = true; shouldFinish = true; }
          }
        }
        this.onChar?.(true);
        if (wordComplete) this.onWord?.();
        if (shouldFinish) this.finish();
      } else {
        this.errors++; this.combo = 0; this.lastError = this.word.text;
        this.instability = Math.min(1, this.instability + 0.22); this.onChar?.(false);
        if (this.instability >= 1) { this.fallTime = 0; this.setPhase('falling'); }
      }
    }
  }
  tick(dt: number) {
    dt = Math.min(dt, 0.1);
    if (this.phase === 'countdown') { this.countdown -= dt; if (this.countdown <= 0) this.setPhase('playing'); }
    else if (this.phase === 'playing') {
      this.elapsed += dt; this.idle += dt;
      while (this.hits.length && this.hits[0] < this.elapsed - 6) this.hits.shift();
      const normalSpeed = this.liveWpm * (this.language === 'zh' ? 0.17 : 0.09);
      const target = Math.min(18, normalSpeed) * (this.sprinting ? 1.35 : 1);
      this.speed += (target - this.speed) * Math.min(1, dt * 2.6);
      this.distance += this.speed * dt;
      if (this.instability > 0.015) this.instability += dt * 0.06;
      if (this.idle > 12) this.instability += dt * 0.055;
      if (this.instability >= 1) { this.instability = 1; this.fallTime = 0; this.setPhase('falling'); }
    } else if (this.phase === 'falling') { this.fallTime += dt; this.speed *= Math.exp(-dt * 3); if (this.fallTime > 1.15) this.finish(); }
  }
  finish() { if (this.phase === 'finished') return; this.setPhase('finished'); this.onFinish?.(); }
}
