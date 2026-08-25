/* Lightweight Web-Audio synth SFX — no external audio assets. */

class SFX {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private ambient: { src: AudioBufferSourceNode; gain: GainNode } | null =
    null;
  muted = false;

  ensure() {
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.55;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx)
      this.master.gain.setTargetAtTime(m ? 0 : 0.55, this.ctx.currentTime, 0.05);
  }

  private env(peak: number, a: number, dur: number): GainNode | null {
    if (!this.ctx || !this.master) return null;
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(this.master);
    return g;
  }

  private tone(
    type: OscillatorType,
    f0: number,
    f1: number,
    dur: number,
    peak: number,
    delay = 0
  ) {
    if (!this.ctx) return;
    const g = this.env(peak, 0.008, dur);
    if (!g) return;
    const o = this.ctx.createOscillator();
    o.type = type;
    const t = this.ctx.currentTime + delay;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    o.connect(g);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private noise(
    dur: number,
    peak: number,
    filterType: BiquadFilterType,
    freq: number,
    q = 1,
    delay = 0
  ) {
    if (!this.ctx || !this.noiseBuf) return;
    const g = this.env(peak, 0.01, dur);
    if (!g) return;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = filterType;
    f.frequency.value = freq;
    f.Q.value = q;
    s.connect(f);
    f.connect(g);
    const t = this.ctx.currentTime + delay;
    s.start(t, Math.random());
    s.stop(t + dur + 0.05);
  }

  click() {
    this.ensure();
    this.tone('triangle', 660, 990, 0.07, 0.16);
  }
  kick(power: number) {
    this.ensure();
    this.tone('sine', 150 + power * 60, 42, 0.16 + power * 0.08, 0.5);
    this.noise(0.06, 0.22 + power * 0.2, 'highpass', 900, 0.8);
  }
  pass() {
    this.ensure();
    this.noise(0.14, 0.2, 'bandpass', 1500, 1.4);
    this.tone('sine', 130, 50, 0.1, 0.3);
  }
  dash() {
    this.ensure();
    this.noise(0.2, 0.18, 'bandpass', 700, 0.7);
    this.tone('sawtooth', 220, 480, 0.16, 0.06);
  }
  bounce(impact: number) {
    this.ensure();
    this.tone('sine', 190, 70, 0.07, Math.min(0.2, 0.06 + impact * 0.0004));
  }
  post() {
    this.ensure();
    this.tone('triangle', 1150, 720, 0.4, 0.3);
    this.tone('square', 2300, 1500, 0.12, 0.08);
  }
  save() {
    this.ensure();
    this.tone('sine', 120, 55, 0.18, 0.4);
    this.noise(0.12, 0.2, 'lowpass', 500);
  }
  whistle(long = false) {
    this.ensure();
    if (!this.ctx) return;
    const bursts = long ? 3 : 1;
    for (let i = 0; i < bursts; i++) {
      const d = long ? 0.28 : 0.22;
      const g = this.env(0.22, 0.02, d);
      if (!g) return;
      const o = this.ctx.createOscillator();
      o.type = 'square';
      const t = this.ctx.currentTime + i * 0.36;
      o.frequency.setValueAtTime(2350, t);
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 38;
      const lg = this.ctx.createGain();
      lg.gain.value = 120;
      lfo.connect(lg);
      lg.connect(o.frequency);
      o.connect(g);
      o.start(t);
      lfo.start(t);
      o.stop(t + d + 0.02);
      lfo.stop(t + d + 0.02);
    }
  }
  goalRoar() {
    this.ensure();
    if (!this.ctx || !this.noiseBuf) return;
    const g = this.env(0.0001, 0.01, 2.2);
    if (!g) return;
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.25);
    g.gain.linearRampToValueAtTime(0.32, t + 1.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(600, t);
    f.frequency.linearRampToValueAtTime(1100, t + 0.3);
    f.Q.value = 0.6;
    s.connect(f);
    f.connect(g);
    s.start(t, Math.random());
    s.stop(t + 2.3);
    // stadium horn
    this.tone('sawtooth', 392, 392, 0.6, 0.1, 0.1);
    this.tone('sawtooth', 523, 523, 0.7, 0.08, 0.5);
  }
  ambientStart() {
    this.ensure();
    if (!this.ctx || !this.noiseBuf || this.ambient) return;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 420;
    const g = this.ctx.createGain();
    g.gain.value = 0.035;
    s.connect(f);
    f.connect(g);
    g.connect(this.master!);
    s.start(undefined, Math.random());
    this.ambient = { src: s, gain: g };
  }
  ambientStop() {
    if (this.ambient && this.ctx) {
      const t = this.ctx.currentTime;
      this.ambient.gain.gain.setTargetAtTime(0.0001, t, 0.3);
      const src = this.ambient.src;
      setTimeout(() => {
        try {
          src.stop();
        } catch {
          /* noop */
        }
      }, 1200);
      this.ambient = null;
    }
  }
}

export const sfx = new SFX();
