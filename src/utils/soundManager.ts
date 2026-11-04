/**
 * صداهای سایت — همه با Web Audio API ساخته می‌شوند (بدون فایل صوتی)
 * باید بعد از اولین کلیک کاربر فعال شود (سیاست مرورگرها)
 */
class SoundManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private ambientNodes: AudioNode[] = [];
  private ambientOn = false;
  enabled = false;

  private ensure(): boolean {
    if (typeof window === 'undefined') return false;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);

      // یک ثانیه نویز سفید برای افکت اسکوپ
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return true;
  }

  setEnabled(v: boolean) {
    if (v) {
      try {
        if (!this.ensure()) return;
        this.enabled = true;
        this.chime(880, 0.18);
      } catch {
        this.enabled = false;
      }
    } else {
      this.enabled = false;
      this.stopAmbient();
    }
  }

  private tone(
    freq: number,
    {
      to,
      type = 'sine',
      dur = 0.2,
      gain = 0.06,
      delay = 0,
    }: { to?: number; type?: OscillatorType; dur?: number; gain?: number; delay?: number } = {}
  ) {
    if (!this.enabled || !this.ctx || !this.master) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  private noiseBurst(from: number, to: number, dur: number, gain: number, delay = 0) {
    if (!this.enabled || !this.ctx || !this.master || !this.noise) return;
    const t0 = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.4;
    filter.frequency.setValueAtTime(from, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, to), t0 + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + dur * 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  /** صدای کلیک کوچک روی دکمه‌ها */
  click() {
    this.tone(620, { to: 900, dur: 0.07, gain: 0.04, type: 'triangle' });
  }

  /** صدای جمع کردن بستنی با قاشق — هنگام تعویض طعم */
  scoop() {
    this.noiseBurst(1800, 260, 0.55, 0.11);
    this.tone(240, { to: 95, dur: 0.4, gain: 0.07, type: 'triangle' });
    this.tone(1200, { to: 500, dur: 0.12, gain: 0.03, delay: 0.05 });
  }

  /** وقتی طعم جدید ظاهر می‌شود */
  sparkle() {
    [1560, 2080, 2600].forEach((f, i) =>
      this.tone(f, { dur: 0.16, gain: 0.025, delay: 0.08 * i, type: 'sine' })
    );
  }

  /** دینگ افزودن به سفارش */
  chime(base = 880, dur = 0.32) {
    this.tone(base, { dur, gain: 0.05 });
    this.tone(base * 1.5, { dur: dur * 1.2, gain: 0.035, delay: 0.07 });
  }

  /** هوم ملایم و سرد برای فضای بستنی‌فروشی */
  toggleAmbient(): boolean {
    if (!this.ensure() || !this.ctx || !this.master) return false;
    if (this.ambientOn) {
      this.stopAmbient();
      return false;
    }
    const now = this.ctx.currentTime;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.014, now + 2.5);

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 480;

    [110, 164.8, 220].forEach((f, i) => {
      const o = this.ctx!.createOscillator();
      o.type = i === 2 ? 'triangle' : 'sine';
      o.frequency.value = f;
      o.detune.value = i * 4;
      o.connect(lp);
      o.start();
      this.ambientNodes.push(o);
    });

    // نفس کشیدن آرام
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 0.006;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    lfo.start();
    this.ambientNodes.push(lfo);

    lp.connect(g);
    g.connect(this.master);
    this.ambientNodes.push(lp, g);
    this.ambientOn = true;
    return true;
  }

  stopAmbient() {
    if (!this.ambientOn || !this.ctx) return;
    const g = this.ambientNodes.find((n) => n instanceof GainNode) as GainNode | undefined;
    if (g) g.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.6);
    const nodes = this.ambientNodes;
    this.ambientNodes = [];
    this.ambientOn = false;
    window.setTimeout(() => {
      nodes.forEach((n) => {
        const o = n as OscillatorNode;
        try {
          if (typeof o.stop === 'function') o.stop();
        } catch {
          /* ignore */
        }
        n.disconnect();
      });
    }, 700);
  }

  get isAmbientOn() {
    return this.ambientOn;
  }
}

export const sound = new SoundManager();
