import type { Track } from "../types/index";

export interface AudioEngineState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  trackId: string | null;
  error: string | null;
}

type MediaEventName = keyof HTMLMediaElementEventMap;

/** Plays the audio file attached to a catalog track and mirrors native media state. */
export class AudioEngine {
  private player: HTMLAudioElement | null = null;
  private currentTrackId: string | null = null;
  private currentAudioUrl: string | null = null;
  private currentTime = 0;
  private duration = 0;
  private fallbackDuration = 0;
  private volume = 0.8;
  private isMuted = false;
  private isPlaying = false;
  private error: string | null = null;
  private pendingSeek: number | null = null;
  private mediaListeners: Array<{ type: MediaEventName; listener: EventListener }> = [];
  private listeners = new Set<(state: AudioEngineState) => void>();

  constructor(
    private readonly createAudio: (src: string) => HTMLAudioElement = (src) => new Audio(src),
  ) {}

  public subscribe(callback: (state: AudioEngineState) => void) {
    this.listeners.add(callback);
    callback(this.getState());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((callback) => callback(state));
  }

  public getState(): AudioEngineState {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      volume: this.volume,
      isMuted: this.isMuted,
      trackId: this.currentTrackId,
      error: this.error,
    };
  }

  public play(track: Pick<Track, "id" | "audioUrl" | "duration">) {
    const audioUrl = track.audioUrl?.trim();
    if (!audioUrl) {
      this.disposePlayer();
      this.currentTrackId = track.id;
      this.currentAudioUrl = null;
      this.currentTime = 0;
      this.duration = Math.max(0, track.duration || 0);
      this.fallbackDuration = this.duration;
      this.pendingSeek = null;
      this.isPlaying = false;
      this.error = "التسجيل غير متاح لهذا العمل حالياً.";
      this.notify();
      return;
    }

    if (this.currentTrackId !== track.id || this.currentAudioUrl !== audioUrl || !this.player) {
      this.disposePlayer();
      this.currentTrackId = track.id;
      this.currentAudioUrl = audioUrl;
      this.currentTime = 0;
      this.fallbackDuration = Math.max(0, track.duration || 0);
      this.duration = this.fallbackDuration;
      this.pendingSeek = null;
      this.error = null;

      try {
        const player = this.createAudio(audioUrl);
        this.player = player;
        player.preload = "metadata";
        player.volume = this.volume;
        player.muted = this.isMuted;
        this.attachListeners(player);
      } catch {
        this.isPlaying = false;
        this.error = "تعذر تحميل ملف التسجيل. تحقق من الرابط وحاول مجدداً.";
        this.notify();
        return;
      }
    }

    const player = this.player;
    if (!player || this.isPlaying) return;

    this.error = null;
    try {
      void player.play().then(
        () => {
          if (this.player !== player) return;
          this.isPlaying = true;
          this.error = null;
          this.syncMediaState(player);
          this.notify();
        },
        () => {
          if (this.player !== player) return;
          this.isPlaying = false;
          this.error = "تعذر تشغيل هذا التسجيل. تحقق من الاتصال أو جرّب لاحقاً.";
          this.notify();
        },
      );
    } catch {
      this.isPlaying = false;
      this.error = "تعذر بدء تشغيل التسجيل في هذا المتصفح.";
      this.notify();
    }
    this.notify();
  }

  private attachListeners(player: HTMLAudioElement) {
    const add = (type: MediaEventName, callback: () => void) => {
      const listener: EventListener = () => {
        if (this.player === player) callback();
      };
      player.addEventListener(type, listener);
      this.mediaListeners.push({ type, listener });
    };

    const sync = () => {
      this.syncMediaState(player);
      this.notify();
    };
    add("loadedmetadata", () => {
      this.syncMediaState(player);
      if (this.pendingSeek !== null) {
        const target = this.pendingSeek;
        this.pendingSeek = null;
        this.seek(target);
      } else {
        this.notify();
      }
    });
    add("durationchange", sync);
    add("timeupdate", sync);
    add("play", () => {
      this.isPlaying = true;
      this.error = null;
      this.notify();
    });
    add("pause", () => {
      this.isPlaying = false;
      this.syncMediaState(player);
      this.notify();
    });
    add("ended", () => {
      this.isPlaying = false;
      this.syncMediaState(player);
      this.currentTime = this.duration;
      this.notify();
    });
    add("error", () => {
      this.isPlaying = false;
      this.error = "تعذر تشغيل هذا التسجيل. قد يكون الملف غير متاح أو بصيغة غير مدعومة.";
      this.notify();
    });
  }

  private syncMediaState(player: HTMLAudioElement) {
    if (Number.isFinite(player.currentTime) && player.currentTime >= 0) {
      this.currentTime = player.currentTime;
    }
    if (Number.isFinite(player.duration) && player.duration > 0) {
      this.duration = player.duration;
    } else {
      this.duration = this.fallbackDuration;
    }
  }

  public pause() {
    if (!this.player) return;
    this.player.pause();
    this.isPlaying = false;
    this.syncMediaState(this.player);
    this.notify();
  }

  public toggle(track: Pick<Track, "id" | "audioUrl" | "duration">) {
    if (this.isPlaying && this.currentTrackId === track.id) this.pause();
    else this.play(track);
  }

  public stop() {
    this.disposePlayer();
    this.currentTime = 0;
    this.isPlaying = false;
    this.error = null;
    this.pendingSeek = null;
    this.notify();
  }

  private disposePlayer() {
    const player = this.player;
    if (!player) return;
    this.mediaListeners.forEach(({ type, listener }) => player.removeEventListener(type, listener));
    this.mediaListeners = [];
    this.player = null;
    player.pause();
    player.removeAttribute("src");
    try {
      player.load();
    } catch {
      // Some embedded browsers do not implement load() for detached media elements.
    }
    this.isPlaying = false;
  }

  public seek(seconds: number) {
    const upperBound =
      this.player && Number.isFinite(this.player.duration) && this.player.duration > 0
        ? this.player.duration
        : this.duration;
    const target = Math.max(0, Math.min(Number.isFinite(seconds) ? seconds : 0, upperBound));
    if (this.player) {
      try {
        this.player.currentTime = target;
        this.pendingSeek = null;
      } catch {
        this.pendingSeek = target;
      }
    }
    this.currentTime = target;
    this.notify();
  }

  public skip(seconds: number) {
    this.seek(this.currentTime + seconds);
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(Number.isFinite(volume) ? volume : this.volume, 1));
    if (this.player) this.player.volume = this.volume;
    this.notify();
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.player) this.player.muted = this.isMuted;
    this.notify();
  }
}

export const audioEngine = new AudioEngine();
