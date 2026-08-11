// 引擎：Web Audio 分层音效（视听规范 v2.1 升级 · L1 交互增强）
// 分层通道：星云坍缩 / 引力拉扯 / 涟漪·撕裂 / 跨时空共振，可独立开关
const KEY = 'xingyan_sound_mute';

class SoundEngine {
  constructor() {
    this.muted = false;
    try { this.muted = localStorage.getItem(KEY) === 'off'; } catch (e) {}
    this.ctx = null;
    // 四个可独立控制的音效通道（规格「三.2 分层音效」）
    this.channels = { nebula: true, gravity: true, ripple: true, resonance: true };
  }
  _ac() {
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
    return this.ctx;
  }
  // 通用发声：freq 频率、dur 时长、type 波形、gain 增益、sweepTo 频率扫频
  tone(freq, dur, type, gain, sweepTo) {
    if (this.muted) return;
    const c = this._ac();
    if (!c) return;
    try {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      if (sweepTo) o.frequency.exponentialRampToValueAtTime(sweepTo, c.currentTime + dur);
      g.gain.value = gain || 0.04;
      o.connect(g); g.connect(c.destination);
      const t = c.currentTime;
      o.start(t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.stop(t + dur);
    } catch (e) {}
  }
  _play(ch, fn) { if (this.channels[ch]) fn(); }

  // —— 各场景音效 ——
  nebula()   { this._play('nebula',   () => this.tone(90, 0.40, 'sine', 0.05)); }            // 星云坍缩：低频氛围音
  gravity()  { this._play('gravity',  () => this.tone(200, 0.14, 'sine', 0.04, 150)); }       // 星体拖拽引力拉扯：渐变嗡鸣
  ripple(d)  { this._play('ripple',   () => this.tone([520, 440, 360][d] || 360, 0.26, 'triangle', 0.045)); } // 涟漪阶梯音阶
  tear()     { this._play('ripple',   () => this.tone(700, 0.34, 'sine', 0.04, 300)); }       // 时空撕裂：空灵回声
  echo()     { this._play('ripple',   () => this.tone(80, 0.13, 'sawtooth', 0.04)); }         // 阻尼反弹冲突：短促警示
  resonance(){ this._play('resonance',() => this.tone(720, 0.12, 'sine', 0.035)); }           // 跨时空共振

  connect() { this.nebula(); }
  isMuted() { return this.muted; }
  setMuted(m) {
    this.muted = !!m;
    try { localStorage.setItem(KEY, this.muted ? 'off' : 'on'); } catch (e) {}
    if (!this.muted) this.connect();
  }
  toggleMuted() { this.setMuted(!this.muted); return this.muted; }
  setChannel(name, on) { if (name in this.channels) this.channels[name] = !!on; }
  getChannels() { return Object.assign({}, this.channels); }
}

export const Sound = new SoundEngine();
