// Web Audio API synthesizer for classroom interaction
class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public volume: number = 0.7;

  private getAudioContext(): AudioContext | null {
    if (!this.enabled) return null;
    try {
      if (!this.ctx) {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtxClass();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  // Rapid rolling tick sound (pitch can vary from 400Hz to 1200Hz)
  playTick(frequency = 600, duration = 0.04) {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, ctx.currentTime + duration);

      const actualVolume = Math.max(0.01, this.volume * 0.4);
      gain.gain.setValueAtTime(actualVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // ignore
    }
  }

  // Card shuffle / flick sound
  playShuffle() {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const count = 4;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.playTick(450 + i * 80, 0.03);
      }, i * 40);
    }
  }

  // Celebratory victory fanfare when student is chosen
  playFanfare() {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      // Arpeggio notes: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz), with sustained chord
      const notes = [
        { freq: 523.25, time: 0, dur: 0.15 },
        { freq: 659.25, time: 0.12, dur: 0.15 },
        { freq: 783.99, time: 0.24, dur: 0.2 },
        { freq: 1046.50, time: 0.4, dur: 0.7 },
        { freq: 1318.51, time: 0.45, dur: 0.65 }, // E6 harmonic
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

        const v = Math.max(0.01, this.volume * 0.35);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + time);
        gain.gain.linearRampToValueAtTime(v, ctx.currentTime + time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + dur + 0.05);
      });
    } catch {
      // ignore
    }
  }

  // Drumroll / heartbeat build-up
  playDrumBeat(freq = 150) {
    if (!this.enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // ignore
    }
  }
}

export const soundManager = new SoundManager();
