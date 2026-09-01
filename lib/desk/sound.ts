/**
 * 효과음 레이어.
 * - 기본은 Web Audio로 합성한 소리다. 외부 파일 없이 동작한다.
 * - `public/sounds/<이름>.mp3` 파일이 있으면 그 파일을 대신 재생한다. 파일이 없으면(404) 합성음으로 돌아간다.
 * - 브라우저 정책상 첫 사용자 제스처 전에는 소리를 낼 수 없다. `unlock()`은 pointerdown/keydown에서 호출한다.
 * - 파일은 페이지 로드 직후 미리 받아두고(prefetch) 제스처 시점에 디코딩한다. 첫 클릭부터 파일 소리가 나게 하기 위함이다.
 */

export type SfxName =
  | 'chime' | 'whoosh' | 'click' | 'tap' | 'lightFlicker'
  | 'mouseClick' | 'keys' | 'purr' | 'squeak' | 'shutdown' | 'drink';

const STORAGE_KEY = 'seoleem-sound';

// 파일을 교체하면 이 값을 올린다. 브라우저 캐시에 남은 옛 파일을 계속 쓰는 것을 막는다.
const SFX_VERSION = '2';

const SFX_NAMES: SfxName[] = [
  'chime', 'whoosh', 'click', 'tap', 'lightFlicker',
  'mouseClick', 'keys', 'purr', 'squeak', 'shutdown', 'drink',
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private fileBuffers = new Map<SfxName, AudioBuffer | null>(); // null = 파일 없음(확인 완료)
  private encoded = new Map<SfxName, ArrayBuffer | null>(); // 디코딩 전 원본. null = 파일 없음
  private prefetched = false;
  private queued: SfxName[] = []; // 오디오가 잠긴 동안 요청된 소리. unlock 직후 재생한다

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.enabled = window.localStorage.getItem(STORAGE_KEY) !== 'off';
      } catch {
        this.enabled = true;
      }
    }
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    try {
      window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
    } catch {
      // 저장소를 못 써도 동작에는 영향 없다
    }
  }

  /**
   * 효과음 파일을 미리 받아둔다. AudioContext가 없어도 되므로 페이지 로드 직후 호출할 수 있다.
   * 디코딩은 제스처 이후 unlock()에서 한다.
   */
  prefetch(): void {
    if (this.prefetched || typeof window === 'undefined') return;
    this.prefetched = true;
    for (const name of SFX_NAMES) {
      fetch(`/sounds/${name}.mp3?v=${SFX_VERSION}`)
        .then(async (res) => {
          if (!res.ok) return null;
          const type = res.headers.get('content-type') ?? '';
          if (!type.startsWith('audio/')) return null;
          return res.arrayBuffer();
        })
        .catch(() => null)
        .then((data) => {
          this.encoded.set(name, data);
          const ctx = this.ctx;
          if (ctx && data) void this.decodeInto(ctx, name, data);
          else if (!data) this.fileBuffers.set(name, null);
        });
    }
  }

  private decodeInto(ctx: AudioContext, name: SfxName, data: ArrayBuffer): Promise<void> {
    // decodeAudioData가 ArrayBuffer를 소비하므로 복사본을 넘긴다
    return ctx
      .decodeAudioData(data.slice(0))
      .then((buf) => {
        this.fileBuffers.set(name, buf);
      })
      .catch(() => {
        this.fileBuffers.set(name, null);
      });
  }

  private decodeAllPending(ctx: AudioContext): void {
    for (const [name, data] of this.encoded) {
      if (this.fileBuffers.has(name)) continue;
      if (data) void this.decodeInto(ctx, name, data);
      else this.fileBuffers.set(name, null);
    }
  }

  /** 사용자 제스처 안에서 호출해야 한다. */
  unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    this.prefetch();
    this.decodeAllPending(this.ctx);
    if (this.queued.length) {
      const pending = this.queued;
      this.queued = [];
      // 컨텍스트가 실제로 돌기 시작한 뒤에 재생한다
      window.setTimeout(() => pending.forEach((n) => this.play(n)), 60);
    }
  }

  private ready(): AudioContext | null {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return null;
    return this.ctx;
  }

  play(name: SfxName): void {
    const ctx = this.ready();
    if (!ctx) {
      // 첫 제스처 전이라 소리를 낼 수 없다. 인트로 차임처럼 놓치면 아쉬운 소리를 위해 잠깐 보관한다
      if (this.enabled && this.queued.length < 2) this.queued.push(name);
      return;
    }
    const cached = this.fileBuffers.get(name);
    if (cached) {
      this.playBuffer(ctx, cached);
      return;
    }
    if (cached === null) {
      this.synth(ctx, name);
      return;
    }
    // 아직 디코딩 전이다. 받아둔 원본이 있으면 디코딩해서 바로 재생하고, 없으면 합성음으로 대체한다
    const data = this.encoded.get(name);
    if (data) {
      void this.decodeInto(ctx, name, data).then(() => {
        const buf = this.fileBuffers.get(name);
        if (buf && this.ready()) this.playBuffer(ctx, buf);
      });
      return;
    }
    if (data === null) {
      this.fileBuffers.set(name, null);
      this.synth(ctx, name);
      return;
    }
    // 아직 다운로드 중이면 이번 한 번만 합성음
    this.synth(ctx, name);
  }

  private playBuffer(ctx: AudioContext, buffer: AudioBuffer): void {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start();
  }

  // ---------- 합성음 ----------

  private tone(ctx: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, gain: number): void {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(ctx.destination);
    o.start(start);
    o.stop(start + dur + 0.05);
  }

  private crackle(ctx: AudioContext, at: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const t = at + i * (0.06 + Math.random() * 0.09);
      const len = 0.02 + Math.random() * 0.03;
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let j = 0; j < d.length; j++) d[j] = (Math.random() * 2 - 1) * (1 - j / d.length);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 1800;
      const g = ctx.createGain();
      g.gain.value = 0.05 + Math.random() * 0.05;
      src.connect(f).connect(g).connect(ctx.destination);
      src.start(t);
    }
  }

  private synth(ctx: AudioContext, name: SfxName): void {
    const t = ctx.currentTime;
    switch (name) {
      case 'chime': {
        const notes: Array<[number, number, number]> = [[622.25, 0, 0.9], [466.16, 0.14, 0.9], [554.37, 0.28, 0.9], [830.61, 0.46, 1.4]];
        for (const [f, d, len] of notes) {
          this.tone(ctx, f, t + 0.02 + d, len, 'sine', 0.11);
          this.tone(ctx, f * 2, t + 0.02 + d, len * 0.6, 'triangle', 0.025);
        }
        break;
      }
      case 'shutdown': {
        const notes: Array<[number, number, number]> = [[830.61, 0, 0.5], [622.25, 0.18, 0.5], [466.16, 0.36, 0.5], [311.13, 0.56, 1.2]];
        for (const [f, d, len] of notes) {
          this.tone(ctx, f, t + 0.02 + d, len, 'sine', 0.1);
          this.tone(ctx, f * 2, t + 0.02 + d, len * 0.5, 'triangle', 0.02);
        }
        break;
      }
      case 'click':
        this.tone(ctx, 1400, t, 0.05, 'square', 0.03);
        this.tone(ctx, 700, t + 0.01, 0.06, 'sine', 0.05);
        break;
      case 'tap':
        this.tone(ctx, 2200, t, 0.03, 'sine', 0.04);
        break;
      case 'lightFlicker':
        this.tone(ctx, 180, t, 0.04, 'square', 0.08);
        this.tone(ctx, 260, t + 0.05, 0.05, 'square', 0.05);
        this.crackle(ctx, t + 0.12, 5);
        this.tone(ctx, 120, t + 0.5, 0.25, 'sine', 0.02);
        break;
      case 'mouseClick':
        this.crackle(ctx, t, 1);
        this.tone(ctx, 900, t, 0.02, 'square', 0.03);
        this.crackle(ctx, t + 0.09, 1);
        this.tone(ctx, 700, t + 0.09, 0.02, 'square', 0.025);
        break;
      case 'keys':
        for (let i = 0; i < 6; i++) {
          const at = t + i * (0.07 + Math.random() * 0.06);
          this.tone(ctx, 1200 + Math.random() * 600, at, 0.03, 'square', 0.02);
          this.tone(ctx, 300 + Math.random() * 100, at, 0.04, 'triangle', 0.03);
        }
        this.crackle(ctx, t, 6);
        break;
      case 'drink':
        this.tone(ctx, 420, t, 0.12, 'sine', 0.05);
        this.tone(ctx, 300, t + 0.14, 0.16, 'sine', 0.04);
        break;
      case 'squeak':
        this.tone(ctx, 2600, t, 0.07, 'sine', 0.05);
        this.tone(ctx, 3200, t + 0.08, 0.09, 'sine', 0.05);
        break;
      case 'whoosh': {
        const len = 0.7;
        const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.Q.value = 0.8;
        f.frequency.setValueAtTime(300, t);
        f.frequency.exponentialRampToValueAtTime(2200, t + len * 0.5);
        f.frequency.exponentialRampToValueAtTime(250, t + len);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.08, t + len * 0.35);
        g.gain.linearRampToValueAtTime(0, t + len);
        src.connect(f).connect(g).connect(ctx.destination);
        src.start(t);
        src.stop(t + len);
        break;
      }
      case 'purr': {
        const len = 2.2;
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = 52;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 220;
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 24;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.5;
        const am = ctx.createGain();
        am.gain.value = 0.5;
        lfo.connect(lfoGain).connect(am.gain);
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.18, t + 0.25);
        env.gain.linearRampToValueAtTime(0.08, t + 1.0);
        env.gain.linearRampToValueAtTime(0.18, t + 1.4);
        env.gain.linearRampToValueAtTime(0, t + len);
        o.connect(lp).connect(am).connect(env).connect(ctx.destination);
        o.start(t);
        lfo.start(t);
        o.stop(t + len);
        lfo.stop(t + len);
        break;
      }
    }
  }
}

let engine: SoundEngine | null = null;

/** 클라이언트에서만 호출한다. 서버에서는 무음 더미를 돌려준다. */
export function getSound(): SoundEngine {
  if (!engine) engine = new SoundEngine();
  return engine;
}
