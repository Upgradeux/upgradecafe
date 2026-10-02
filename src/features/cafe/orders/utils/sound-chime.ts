/**
 * Synthetic Web Audio API Chime for New Orders & Table Service Requests.
 * Generates a clean, subtle, luxury 2-tone bell chime without any external audio asset dependencies.
 */

class SoundAlertManager {
  private isMuted: boolean = false;
  private audioCtx: AudioContext | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("upgradecafe_sound_muted");
      this.isMuted = saved === "true";
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("upgradecafe_sound_muted", muted ? "true" : "false");
    }
  }

  public toggleMuted(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Play a clean, gentle two-tone chime (e.g., E5 -> B5)
   */
  public playNewOrderChime(): void {
    if (this.isMuted) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Note 2: B5 (987.77 Hz) - 150ms delay
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(987.77, now + 0.15);
      gain2.gain.setValueAtTime(0.25, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.7);
    } catch {
      // Ignore audio autoplay restrictions gracefully
    }
  }

  /**
   * Play a distinct service alert chime for Table Calls (Waiter / Water / Bill)
   */
  public playServiceAlertChime(): void {
    if (this.isMuted) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Triple ping: G5 -> C6 -> E6
      const freqs = [783.99, 1046.5, 1318.51];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.12;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.4);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Play an uplifting, warm café chime when a waiting customer's table is ready
   */
  public playTableReadyChime(): void {
    if (this.isMuted) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Soft harmonic chime: F5 (698.46 Hz) -> A5 (880 Hz) -> C6 (1046.5 Hz)
      const notes = [
        { freq: 698.46, delay: 0, dur: 0.6, gain: 0.22 },
        { freq: 880.00, delay: 0.14, dur: 0.7, gain: 0.26 },
        { freq: 1046.50, delay: 0.28, dur: 0.85, gain: 0.30 },
      ];

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(note.freq, now + note.delay);

        gain.gain.setValueAtTime(note.gain, now + note.delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.delay + note.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + note.delay);
        osc.stop(now + note.delay + note.dur);
      });
    } catch {
      // Ignore audio restrictions
    }
  }

  /**
   * Play table ready chime exactly 2 times with a pause, then stop.
   */
  public playTableReadyDoubleChime(): void {
    if (this.isMuted) return;
    this.playTableReadyChime();
    setTimeout(() => {
      this.playTableReadyChime();
    }, 700);
  }

  /**
   * Play an uplifting success tone when order is placed or table QR is verified
   */
  public playOrderPlacedSuccess(): void {
    if (this.isMuted) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Sparkling ascending chord: C5 -> E5 -> G5 -> C6
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.08;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.45);
      });
    } catch {
      // Ignore
    }
  }
}

export const soundAlert = new SoundAlertManager();
