import type { MapId, Settings } from './data';
export class RideAudio {
  private ctx?: AudioContext; private master?: GainNode; private musicBus?: GainNode;
  private timer?: number; private step = 0; private nextNote = 0;
  private settings?: Settings; private active = false; private playing = false;
  private rain?: AudioBufferSourceNode; private rainGain?: GainNode;
  private noise?: AudioBuffer;
  private visibility = () => { if (document.hidden) { void this.ctx?.suspend(); this.stopMusic(); } else if (this.active) { void this.ctx?.resume().catch(() => {}); this.scheduleMusic(); } };
  constructor() { document.addEventListener('visibilitychange', this.visibility); }
  async unlock(settings: Settings) {
    this.settings = settings; this.active = true;
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext(); this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
        this.musicBus = this.ctx.createGain(); this.musicBus.connect(this.master);
        this.noise = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * .2), this.ctx.sampleRate);
        const samples = this.noise.getChannelData(0); for(let i=0;i<samples.length;i++) samples[i]=Math.random()*2-1;
      }
      await this.ctx.resume(); this.configure(settings); this.scheduleMusic();
    } catch { /* The visual game remains available if audio is unavailable. */ }
  }
  configure(settings: Settings) {
    this.settings = settings;
    if (!this.ctx || !this.master || !this.musicBus) return;
    this.master.gain.setTargetAtTime(settings.volume * 0.55, this.ctx.currentTime, 0.1);
    this.musicBus.gain.setTargetAtTime(settings.music ? 0.62 : 0, this.ctx.currentTime, 0.2);
    this.ambience();
  }
  setPlaying(playing: boolean) { this.playing = playing; }
  private note(freq: number, at: number, length: number, gain: number, type: OscillatorType = 'sine', bus = this.musicBus) {
    if (!this.ctx || !bus) return;
    const osc = this.ctx.createOscillator(), env = this.ctx.createGain(); osc.type = type; osc.frequency.value = freq;
    env.gain.setValueAtTime(0.001, at); env.gain.exponentialRampToValueAtTime(Math.max(0.002, gain), at + 0.018); env.gain.exponentialRampToValueAtTime(0.001, at + length);
    osc.connect(env); env.connect(bus); osc.start(at); osc.stop(at + length + 0.03);
    osc.onended = () => { osc.disconnect(); env.disconnect(); };
  }
  private scheduleMusic() {
    if (!this.ctx || this.timer || !this.active) return;
    this.nextNote = this.ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => {
      if (!this.ctx || document.hidden) return;
      if (this.settings?.map === 'coast' && this.settings.weather !== 'rain') this.rainGain?.gain.setTargetAtTime(.13 + (.5 + .5*Math.sin(this.ctx.currentTime*.62))*.08,this.ctx.currentTime,.35);
      if (this.nextNote < this.ctx.currentTime) this.nextNote = this.ctx.currentTime + 0.03;
      while (this.nextNote < this.ctx.currentTime + 0.15) {
        if (this.settings?.music) {
          const map: MapId = this.settings.map, base = map === 'coast' ? 174.61 : map === 'forest' ? 164.81 : 196;
          if (map === 'forest' && this.settings.weather === 'clear' && this.settings.time !== 'night' && this.settings.practice === 'read' && this.step % 32 === 0) this.bird(this.nextNote);
          const melody = [0, 4, 7, 12, 7, 4, 2, 7, 9, 7, 4, 2, 0, 4, 7, 2];
          const n = melody[this.step % melody.length];
          if (this.step % 2 === 0 || this.playing) this.note(base * 2 ** (n / 12), this.nextNote, 0.8, this.playing ? 0.065 : 0.05, 'sine');
          if (this.step % 8 === 0) {
            const chord = [0, 4, 7]; for (const c of chord) this.note(base * 0.5 * 2 ** (c / 12), this.nextNote, 2.5, 0.035, 'triangle');
          }
          if (this.playing) {
            if(this.step%4===0)this.note(55,this.nextNote,.12,.19,'sine');
            if(this.step%4===2)this.percussion(this.nextNote,.085,.026,1400,this.musicBus);
            this.percussion(this.nextNote,.035,.012,7000,this.musicBus);
            if(this.step%2===0)this.note(base*.25*2**([0,0,5,7][Math.floor(this.step/4)%4]/12),this.nextNote,.24,.075,'triangle');
          }
        }
        this.step++; this.nextNote += this.playing ? 0.23 : 0.32;
      }
    }, 70);
  }
  private stopMusic() { if (this.timer) { clearInterval(this.timer); this.timer = undefined; } }
  private bird(at:number) {
    if(!this.ctx || !this.musicBus)return;
    for(let i=0;i<2;i++){
      const osc=this.ctx.createOscillator(),env=this.ctx.createGain(),t=at+i*.20;osc.type='sine';
      osc.frequency.setValueAtTime(1800+i*250,t);osc.frequency.exponentialRampToValueAtTime(2900+i*120,t+.075);osc.frequency.exponentialRampToValueAtTime(1700,t+.16);
      env.gain.setValueAtTime(.001,t);env.gain.exponentialRampToValueAtTime(.017,t+.03);env.gain.exponentialRampToValueAtTime(.001,t+.17);
      osc.connect(env);env.connect(this.musicBus);osc.start(t);osc.stop(t+.19);osc.onended=()=>{osc.disconnect();env.disconnect();};
    }
  }
  private percussion(at:number,length:number,gain:number,cutoff:number,bus=this.master) {
    if(!this.ctx || !this.noise || !bus)return;
    const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),env=this.ctx.createGain();source.buffer=this.noise;filter.type='highpass';filter.frequency.value=cutoff;
    env.gain.setValueAtTime(gain,at);env.gain.exponentialRampToValueAtTime(.001,at+length);source.connect(filter);filter.connect(env);env.connect(bus);source.start(at);source.stop(at+length+.01);source.onended=()=>{source.disconnect();filter.disconnect();env.disconnect();};
  }
  private ambience() {
    if (!this.ctx || !this.musicBus || !this.settings) return;
    if (!this.rain) {
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate), data = buffer.getChannelData(0);
      let last = 0; for (let i = 0; i < data.length; i++) { last = (last + (Math.random() * 2 - 1) * 0.02) / 1.02; data[i] = last * 3.5; }
      const filter = this.ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1800;
      this.rain = this.ctx.createBufferSource(); this.rain.buffer = buffer; this.rain.loop = true; this.rainGain = this.ctx.createGain();
      this.rain.connect(filter); filter.connect(this.rainGain); this.rainGain.connect(this.musicBus); this.rain.start();
    }
    this.rainGain?.gain.setTargetAtTime(this.settings.weather === 'rain' ? 0.45 : this.settings.map === 'coast' ? 0.17 : 0, this.ctx.currentTime, 0.5);
  }
  effect(kind: 'hit' | 'error' | 'word' | 'count' | 'go' | 'win' | 'lose' | 'click', combo = 0) {
    if (!this.ctx || !this.master || !this.settings?.effects || document.hidden) return;
    const t = this.ctx.currentTime;
    if (kind === 'hit') { this.note(660 * 2 ** ([0,2,4,7,9][combo%5] / 12), t, .08, .16, 'triangle', this.master);this.percussion(t,.025,.05,3600); }
    else if (kind === 'error') { this.note(155, t, .18, .17, 'sawtooth', this.master); this.note(117, t + .035, .13, .12, 'triangle', this.master);this.percussion(t,.09,.035,500); }
    else if (kind === 'count') this.note(392, t, 0.15, 0.14, 'sine', this.master);
    else if (kind === 'lose') for (let i = 0; i < 3; i++) this.note(392 * 2 ** (-i * 4 / 12), t + i * 0.13, 0.35, 0.12, 'triangle', this.master);
    else if (kind === 'click') this.note(660, t, 0.055, 0.035, 'sine', this.master);
    else for (let i = 0; i < (kind === 'win' ? 5 : 3); i++) this.note(392 * 2 ** ([0, 4, 7, 12, 16][i] / 12), t + i * 0.075, 0.32, 0.09, 'sine', this.master);
  }
  get canSpeak() { return 'speechSynthesis' in window; }
  speak(text: string, language: 'en' | 'zh', onUnavailable?: () => void) {
    if (!this.canSpeak) { onUnavailable?.(); return; }
    const utterance = new SpeechSynthesisUtterance(text); utterance.lang = language === 'zh' ? 'zh-CN' : 'en-US';
    const voice = speechSynthesis.getVoices().find(v => language === 'zh' ? v.lang.startsWith('zh') : v.lang.startsWith('en'));
    if (voice) utterance.voice = voice; utterance.rate = language === 'zh' ? 0.85 : 0.8; utterance.volume = Math.max(0.4, this.settings?.volume ?? 0.7);
    utterance.onerror = (e) => { if (!['interrupted', 'canceled'].includes(e.error)) onUnavailable?.(); };
    speechSynthesis.cancel(); speechSynthesis.speak(utterance);
  }
  stopSpeech() { if (this.canSpeak) speechSynthesis.cancel(); }
}
