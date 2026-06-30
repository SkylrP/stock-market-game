type OscType = OscillatorType;

class SoundManager {
  private static instance: SoundManager;
  private ctx: AudioContext | null = null;

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  get muted(): boolean {
    return localStorage.getItem('smg-muted') === '1';
  }

  set muted(v: boolean) {
    localStorage.setItem('smg-muted', v ? '1' : '0');
  }

  private ctx_(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscType = 'sine',
    volume = 0.15,
    delay = 0,
  ) {
    if (this.muted) return;
    const ctx = this.ctx_();
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + Math.max(duration, 0.01));
  }

  private sweep(from: number, to: number, duration: number, type: OscType = 'sine', volume = 0.12, delay = 0) {
    if (this.muted) return;
    const ctx = this.ctx_();
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.linearRampToValueAtTime(to, t + duration);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.1);
  }

  private noise(duration: number, volume = 0.1, delay = 0) {
    if (this.muted) return;
    const ctx = this.ctx_();
    const t = ctx.currentTime + delay;
    const size = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / size, 1.5);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(t);
  }

  private chord(notes: number[], duration: number, type: OscType = 'sine', volume = 0.1, delay = 0) {
    if (this.muted) return;
    const ctx = this.ctx_();
    const t = ctx.currentTime + delay;
    for (const freq of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration);
    }
  }

  diceRoll() {
    const intervals = [60, 70, 80, 90, 100, 110, 120, 130, 150, 170, 200, 230];
    let t = 0;
    for (const interval of intervals) {
      this.tone(130 + Math.random() * 30, 0.04, 'triangle', 0.08, t / 1000);
      t += interval;
    }
  }

  diceResult() {
    this.tone(90, 0.2, 'sine', 0.2);
    this.tone(65, 0.14, 'sine', 0.1, 0.05);
  }

  pieceHop() {
    this.tone(500, 0.05, 'triangle', 0.08);
  }

  pieceLand() {
    this.tone(300, 0.08, 'sine', 0.06);
  }

  qbiChange(up: boolean) {
    this.sweep(up ? 150 : 500, up ? 500 : 150, 0.3, 'sine', 0.12);
  }

  slotSpin() {
    this.noise(0.12, 0.05);
    this.sweep(300, 600, 0.5, 'sine', 0.04);
  }

  slotReelStop(index: number) {
    const freq = [500, 650, 800][index] || 500;
    this.tone(freq, 0.08, 'triangle', 0.12);
    this.noise(0.05, 0.04);
  }

  slotResult(multiplier: number, isTriple?: boolean) {
    if (isTriple) {
      this.tone(523, 0.15, 'sine', 0.2);
      this.tone(659, 0.15, 'sine', 0.2, 0.12);
      this.tone(784, 0.15, 'sine', 0.2, 0.24);
      this.tone(1047, 0.4, 'sine', 0.25, 0.36);
      this.chord([523, 659, 784, 1047], 0.8, 'sine', 0.12, 0.5);
    } else if (multiplier > 1) {
      this.tone(440, 0.1, 'sine', 0.15);
      this.tone(660, 0.2, 'sine', 0.15, 0.08);
    } else {
      this.tone(300, 0.15, 'sawtooth', 0.08);
      this.tone(200, 0.25, 'sawtooth', 0.06, 0.1);
    }
  }

  buyStock() {
    this.tone(523, 0.1, 'sine', 0.15);
    this.tone(659, 0.1, 'sine', 0.15, 0.06);
    this.tone(784, 0.1, 'sine', 0.15, 0.12);
    this.tone(1047, 0.25, 'sine', 0.2, 0.18);
  }

  sellStock() {
    this.tone(440, 0.08, 'sine', 0.12);
    this.tone(350, 0.14, 'sine', 0.12, 0.06);
  }

  tradeComplete() {
    this.tone(659, 0.08, 'sine', 0.12);
    this.tone(784, 0.08, 'sine', 0.12, 0.05);
    this.tone(1047, 0.2, 'sine', 0.15, 0.1);
  }

  winFanfare() {
    this.tone(523, 0.3, 'sine', 0.2);
    this.tone(659, 0.3, 'sine', 0.2, 0.15);
    this.tone(784, 0.3, 'sine', 0.2, 0.3);
    this.tone(1047, 0.6, 'sine', 0.25, 0.45);
    this.chord([523, 659, 784, 1047], 1.0, 'sine', 0.15, 0.6);
  }

  meetingSpin() {
    this.tone(350, 0.1, 'triangle', 0.1);
    this.tone(450, 0.1, 'triangle', 0.1, 0.07);
    this.tone(550, 0.1, 'triangle', 0.1, 0.14);
  }

  feePaid() {
    this.sweep(350, 200, 0.3, 'sawtooth', 0.08);
    this.sweep(300, 150, 0.35, 'sawtooth', 0.06, 0.35);
  }
}

export const soundManager = SoundManager.getInstance();
