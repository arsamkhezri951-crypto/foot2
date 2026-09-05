/* Tiny synthesized WebAudio engine — no audio files, no libraries. */

type Ctx = AudioContext;

export interface VolumeSettings {
  master: number; // 0..1
  music: number; // 0..1  (crowd ambience / pads)
  sfx: number; // 0..1  (kicks, whistles, ui)
}

class Sfx {
  private ac: Ctx | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private crowdSrc: AudioBufferSourceNode | null = null;
  private crowdGain: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  muted = false;
  private vols: VolumeSettings = { master: 1, music: 1, sfx: 1 };

  init() {
    if (this.ac) {
      if (this.ac.state === 'suspended') this.ac.resume().catch(() => {});
      return;
    }
    try {
      const AC: typeof AudioContext =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ac = new AC();
      this.master = this.ac.createGain();
      this.master.gain.value = this.muted ? 0 : 0.55 * this.vols.master;
      this.master.connect(this.ac.destination);
      this.musicBus = this.ac.createGain();
      this.musicBus.gain.value = this.vols.music;
      this.musicBus.connect(this.master);
      this.sfxBus = this.ac.createGain();
      this.sfxBus.gain.value = this.vols.sfx;
      this.sfxBus.connect(this.master);
      // shared noise buffer
      const len = this.ac.sampleRate * 2;
      this.noiseBuf = this.ac.createBuffer(1, len, this.ac.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch {
      this.ac = null;
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ac)
      this.master.gain.setTargetAtTime(
        m ? 0 : 0.55 * this.vols.master,
        this.ac.currentTime,
        0.05
      );
  }

  /** Live volume control — every slider is wired to a real gain node. */
  setVolumes(v: VolumeSettings) {
    this.vols = {
      master: Math.min(1, Math.max(0, v.master)),
      music: Math.min(1, Math.max(0, v.music)),
      sfx: Math.min(1, Math.max(0, v.sfx)),
    };
    if (this.ac) {
      const now = this.ac.currentTime;
      if (this.master)
        this.master.gain.setTargetAtTime(
          this.muted ? 0 : 0.55 * this.vols.master,
          now,
          0.04
        );
      if (this.musicBus)
        this.musicBus.gain.setTargetAtTime(this.vols.music, now, 0.04);
      if (this.sfxBus)
        this.sfxBus.gain.setTargetAtTime(this.vols.sfx, now, 0.04);
    }
  }

  getVolumes(): VolumeSettings {
    return { ...this.vols };
  }

  private env(gain: number, dur: number): GainNode | null {
    if (!this.ac || !this.sfxBus) return null;
    const g = this.ac.createGain();
    g.gain.setValueAtTime(gain, this.ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ac.currentTime + dur);
    g.connect(this.sfxBus);
    return g;
  }

  private tone(
    type: OscillatorType,
    f0: number,
    f1: number,
    dur: number,
    gain: number
  ) {
    if (!this.ac) return;
    const g = this.env(gain, dur);
    if (!g) return;
    const o = this.ac.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, this.ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(1, f1),
      this.ac.currentTime + dur
    );
    o.connect(g);
    o.start();
    o.stop(this.ac.currentTime + dur + 0.02);
  }

  private noise(dur: number, gain: number, freq: number, q = 1) {
    if (!this.ac || !this.noiseBuf) return;
    const g = this.env(gain, dur);
    if (!g) return;
    const src = this.ac.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ac.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    src.connect(f);
    f.connect(g);
    src.start();
    src.stop(this.ac.currentTime + dur + 0.02);
  }

  kick(power = 0.5) {
    this.tone('sine', 170 + power * 60, 48, 0.14, 0.55 + power * 0.35);
    this.noise(0.08, 0.25 + power * 0.25, 2600, 0.8);
  }

  pass() {
    this.tone('triangle', 520, 760, 0.09, 0.22);
    this.noise(0.05, 0.12, 3200, 1);
  }

  bounce(v: number) {
    const p = Math.min(1, v / 900);
    this.tone('sine', 130 + p * 40, 55, 0.09, 0.18 + p * 0.2);
  }

  save() {
    this.tone('square', 300, 150, 0.12, 0.2);
    this.noise(0.12, 0.25, 1400, 0.7);
  }

  post() {
    this.tone('triangle', 1180, 900, 0.4, 0.22);
  }

  dash() {
    this.noise(0.16, 0.2, 1900, 0.6);
    this.tone('sawtooth', 240, 520, 0.12, 0.12);
  }

  whistle(long = false) {
    if (!this.ac) return;
    const dur = long ? 0.65 : 0.28;
    const g = this.env(0.16, dur);
    if (!g) return;
    const o = this.ac.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(2150, this.ac.currentTime);
    const lfo = this.ac.createOscillator();
    lfo.frequency.value = long ? 9 : 24;
    const lg = this.ac.createGain();
    lg.gain.value = 90;
    lfo.connect(lg);
    lg.connect(o.frequency);
    o.connect(g);
    o.start();
    lfo.start();
    o.stop(this.ac.currentTime + dur);
    lfo.stop(this.ac.currentTime + dur);
  }

  goalRoar() {
    if (!this.ac || !this.noiseBuf) return;
    const g = this.env(0.5, 1.6);
    if (!g) return;
    const src = this.ac.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = this.ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(500, this.ac.currentTime);
    f.frequency.linearRampToValueAtTime(1400, this.ac.currentTime + 0.35);
    f.frequency.linearRampToValueAtTime(400, this.ac.currentTime + 1.5);
    src.connect(f);
    f.connect(g);
    src.start();
    src.stop(this.ac.currentTime + 1.6);
    // stadium horn stab
    this.tone('sawtooth', 233, 233, 0.5, 0.1);
    this.tone('sawtooth', 311, 311, 0.5, 0.08);
  }

  click() {
    this.tone('triangle', 700, 480, 0.06, 0.16);
  }

  ambientStart() {
    if (!this.ac || !this.noiseBuf || this.crowdSrc) return;
    const src = this.ac.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = this.ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 620;
    const g = this.ac.createGain();
    g.gain.value = 0;
    g.gain.setTargetAtTime(0.055, this.ac.currentTime, 1.2);
    const lfo = this.ac.createOscillator();
    lfo.frequency.value = 0.13;
    const lg = this.ac.createGain();
    lg.gain.value = 0.018;
    lfo.connect(lg);
    lg.connect(g.gain);
    src.connect(f);
    f.connect(g);
    g.connect(this.musicBus ?? this.master!);
    src.start();
    lfo.start();
    this.crowdSrc = src;
    this.crowdGain = g;
  }

  ambientStop() {
    if (this.crowdSrc && this.ac && this.crowdGain) {
      this.crowdGain.gain.setTargetAtTime(0, this.ac.currentTime, 0.4);
      const src = this.crowdSrc;
      setTimeout(() => {
        try {
          src.stop();
        } catch {
          /* already stopped */
        }
      }, 1600);
      this.crowdSrc = null;
      this.crowdGain = null;
    }
  }
}

export const sfx = new Sfx();
