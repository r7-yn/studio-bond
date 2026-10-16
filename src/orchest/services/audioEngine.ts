/**
 * Audio Engine for Orchest Studio
 * Provides real Web Audio API sound synthesis (Arabic oud & dufoof rhythm tones)
 * and audio playback with waveform frequency analysis.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentTrackId: string | null = null;
  private currentTime: number = 0;
  private duration: number = 272;
  private volume: number = 0.8;
  private isMuted: boolean = false;
  private timer: number | null = null;
  private baseFreq: number = 261.63; // C4

  // Audio nodes
  private masterGain: GainNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private rhythmGain: GainNode | null = null;
  private rhythmOsc: OscillatorNode | null = null;
  private rhythmInterval: number | null = null;

  // Listeners
  private listeners: Set<(state: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    trackId: string | null;
  }) => void> = new Set();

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public subscribe(cb: (state: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    trackId: string | null;
  }) => void) {
    this.listeners.add(cb);
    this.notify();
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    const state = {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      volume: this.volume,
      isMuted: this.isMuted,
      trackId: this.currentTrackId,
    };
    this.listeners.forEach((cb) => cb(state));
  }

  public play(trackId: string, durationSec: number = 272, freq: number = 261.63) {
    this.initContext();

    if (this.currentTrackId !== trackId) {
      this.stop();
      this.currentTrackId = trackId;
      this.duration = durationSec;
      this.currentTime = 0;
      this.baseFreq = freq;
    }

    if (this.isPlaying) return;

    this.isPlaying = true;
    this.startSynth();
    this.startTimer();
    this.notify();
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.stopSynth();
    this.stopTimer();
    this.notify();
  }

  public toggle(trackId: string, durationSec: number = 272, freq: number = 261.63) {
    if (this.isPlaying && this.currentTrackId === trackId) {
      this.pause();
    } else {
      this.play(trackId, durationSec, freq);
    }
  }

  public stop() {
    this.isPlaying = false;
    this.stopSynth();
    this.stopTimer();
    this.currentTime = 0;
    this.notify();
  }

  public seek(seconds: number) {
    this.currentTime = Math.max(0, Math.min(seconds, this.duration));
    this.notify();
  }

  public skip(seconds: number) {
    this.seek(this.currentTime + seconds);
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(vol, 1));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  private startTimer() {
    this.stopTimer();
    this.timer = window.setInterval(() => {
      this.currentTime += 0.5;
      if (this.currentTime >= this.duration) {
        this.currentTime = 0;
        this.pause();
      } else {
        this.notify();
      }
    }, 500);
  }

  private stopTimer() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Generates warm authentic oriental oud & dufoof pulses via Web Audio API
   */
  private startSynth() {
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;

      // Primary Oud/Chords harmonic oscillator
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'triangle';
      this.osc1.frequency.setValueAtTime(this.baseFreq, now);

      // Secondary warmth harmonic
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'sine';
      this.osc2.frequency.setValueAtTime(this.baseFreq * 1.5, now); // Fifth

      // Subtle vibrato/tremolo LFO for acoustic string warmth
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(5, now);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(3, now);
      lfo.connect(this.osc1.frequency);
      lfo.start();

      const synthGain = this.ctx.createGain();
      synthGain.gain.setValueAtTime(0.15, now);

      this.osc1.connect(synthGain);
      this.osc2.connect(synthGain);
      synthGain.connect(this.masterGain);

      this.osc1.start();
      this.osc2.start();

      // Dufoof rhythmic pulse (frame drum beat) every 600ms
      this.rhythmInterval = window.setInterval(() => {
        if (!this.ctx || !this.masterGain || !this.isPlaying) return;
        try {
          const drumTime = this.ctx.currentTime;
          const drumOsc = this.ctx.createOscillator();
          const drumGain = this.ctx.createGain();

          drumOsc.type = 'triangle';
          drumOsc.frequency.setValueAtTime(95, drumTime);
          drumOsc.frequency.exponentialRampToValueAtTime(35, drumTime + 0.18);

          drumGain.gain.setValueAtTime(0.35, drumTime);
          drumGain.gain.exponentialRampToValueAtTime(0.001, drumTime + 0.25);

          drumOsc.connect(drumGain);
          drumGain.connect(this.masterGain);

          drumOsc.start(drumTime);
          drumOsc.stop(drumTime + 0.26);
        } catch {
          // ignore transient audio scheduling issues
        }
      }, 650);
    } catch {
      // Audio fallback handling
    }
  }

  private stopSynth() {
    if (this.rhythmInterval !== null) {
      clearInterval(this.rhythmInterval);
      this.rhythmInterval = null;
    }
    try {
      if (this.osc1) {
        this.osc1.stop();
        this.osc1.disconnect();
        this.osc1 = null;
      }
      if (this.osc2) {
        this.osc2.stop();
        this.osc2.disconnect();
        this.osc2 = null;
      }
    } catch {
      // ignore
    }
  }

  public getState() {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      volume: this.volume,
      isMuted: this.isMuted,
      trackId: this.currentTrackId,
    };
  }
}

export const audioEngine = new AudioEngine();
