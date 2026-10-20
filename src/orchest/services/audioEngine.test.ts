import { describe, expect, it, vi } from "vitest";
import { AudioEngine } from "./audioEngine";

class FakeAudio extends EventTarget {
  src: string;
  preload = "";
  volume = 1;
  muted = false;
  currentTime = 0;
  duration = Number.NaN;
  paused = true;
  play = vi.fn(() => {
    this.paused = false;
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  });
  pause = vi.fn(() => {
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  });
  load = vi.fn();
  removeAttribute = vi.fn((name: string) => {
    if (name === "src") this.src = "";
  });

  constructor(src: string) {
    super();
    this.src = src;
  }
}

const sampleTrack = {
  id: "track-1",
  audioUrl: "https://media.example.test/track.mp3",
  duration: 90,
};

function makeEngine() {
  const players: FakeAudio[] = [];
  const engine = new AudioEngine((src) => {
    const player = new FakeAudio(src);
    players.push(player);
    return player as unknown as HTMLAudioElement;
  });
  return { engine, players };
}

describe("AudioEngine", () => {
  it("plays the track's saved file and mirrors real duration and playback time", async () => {
    const { engine, players } = makeEngine();
    engine.play(sampleTrack);
    await Promise.resolve();

    const player = players[0];
    expect(player?.src).toBe(sampleTrack.audioUrl);
    expect(player?.preload).toBe("metadata");
    expect(engine.getState().isPlaying).toBe(true);

    if (!player) throw new Error("Expected an audio element");
    player.duration = 123.5;
    player.dispatchEvent(new Event("loadedmetadata"));
    player.currentTime = 27.25;
    player.dispatchEvent(new Event("timeupdate"));

    expect(engine.getState().duration).toBe(123.5);
    expect(engine.getState().currentTime).toBe(27.25);
  });

  it("seeks and skips against the actual media duration", async () => {
    const { engine, players } = makeEngine();
    engine.play(sampleTrack);
    await Promise.resolve();

    const player = players[0];
    if (!player) throw new Error("Expected an audio element");
    player.duration = 120;
    player.dispatchEvent(new Event("loadedmetadata"));

    engine.seek(34.5);
    expect(player.currentTime).toBe(34.5);
    engine.skip(10);
    expect(player.currentTime).toBe(44.5);
    engine.seek(500);
    expect(player.currentTime).toBe(120);
  });

  it("shows a clear message and never synthesizes audio when a track has no file", () => {
    const { engine, players } = makeEngine();
    const { audioUrl: _audioUrl, ...trackWithoutAudio } = sampleTrack;
    engine.play(trackWithoutAudio);

    expect(players).toHaveLength(0);
    expect(engine.getState().isPlaying).toBe(false);
    expect(engine.getState().error).toMatch(/التسجيل غير متاح/);
  });

  it("shows a clear playback error when the media element cannot load its file", async () => {
    const { engine, players } = makeEngine();
    engine.play(sampleTrack);
    const player = players[0];
    if (!player) throw new Error("Expected an audio element");

    player.dispatchEvent(new Event("error"));

    expect(engine.getState().isPlaying).toBe(false);
    expect(engine.getState().error).toMatch(/تعذر تشغيل هذا التسجيل/);
  });

  it("shows a message when the browser rejects playback", async () => {
    const { engine, players } = makeEngine();
    engine.play(sampleTrack);
    await Promise.resolve();
    const player = players[0];
    if (!player) throw new Error("Expected an audio element");
    engine.pause();
    player.play.mockImplementationOnce(() => Promise.reject(new Error("blocked")));

    engine.play(sampleTrack);
    await Promise.resolve();

    expect(engine.getState().isPlaying).toBe(false);
    expect(engine.getState().error).toMatch(/تعذر تشغيل هذا التسجيل/);
  });
});
