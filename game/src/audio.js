// audio.js — every sound in Wajan Senja is synthesised with WebAudio: no audio
// files, no network. A chop thock, wok sizzle (looped filtered noise while the
// wok cooks), a serve ding, a coin arpeggio and an error buzz.

export function makeAudio() {
  return {
    ctx: null,
    muted: false,
    sizzleGain: null,
    sizzleSource: null,
    ensure() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return true;
      }
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return false;
        this.ctx = new Ctx();
        return true;
      } catch {
        return false;
      }
    },
    setMuted(muted) {
      this.muted = muted;
      if (this.sizzleGain) this.sizzleGain.gain.value = 0;
    },
    tone(freq, seconds, type, volume, when = 0) {
      if (!this.ctx || this.muted) return;
      const t0 = this.ctx.currentTime + when;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + seconds + 0.05);
    },
    chop() {
      if (!this.ctx || this.muted) return;
      const t0 = this.ctx.currentTime;
      const len = Math.floor(this.ctx.sampleRate * 0.07);
      const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.5;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 900;
      src.connect(filter).connect(gain).connect(this.ctx.destination);
      src.start(t0);
      this.tone(140, 0.08, 'sine', 0.35);
    },
    pickup() { this.tone(520, 0.07, 'triangle', 0.2); },
    drop() { this.tone(300, 0.09, 'triangle', 0.22); this.tone(210, 0.1, 'sine', 0.18, 0.03); },
    ding() {
      this.tone(880, 0.25, 'sine', 0.25);
      this.tone(1318, 0.35, 'sine', 0.2, 0.09);
    },
    coin() {
      this.tone(988, 0.09, 'square', 0.12);
      this.tone(1319, 0.09, 'square', 0.12, 0.07);
      this.tone(1568, 0.16, 'square', 0.12, 0.14);
    },
    error() { this.tone(160, 0.22, 'square', 0.18); this.tone(110, 0.25, 'square', 0.15, 0.08); },
    startSizzle() {
      if (!this.ctx || this.muted || this.sizzleSource) return;
      const len = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 4200;
      filter.Q.value = 0.6;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.05;
      src.connect(filter).connect(gain).connect(this.ctx.destination);
      src.start();
      this.sizzleSource = src;
      this.sizzleGain = gain;
    },
    stopSizzle() {
      if (this.sizzleSource) {
        try { this.sizzleSource.stop(); } catch { /* already stopped */ }
        this.sizzleSource = null;
        this.sizzleGain = null;
      }
    },
    setSizzleLevel(level) {
      if (this.sizzleGain && !this.muted) {
        this.sizzleGain.gain.setTargetAtTime(0.02 + level * 0.06, this.ctx.currentTime, 0.1);
      }
    },
  };
}
