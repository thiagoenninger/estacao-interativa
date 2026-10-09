import { describe, expect, it, vi } from 'vitest';
import { startRunner, type RunnerOptions, type SceneResult } from '@/dev/spike/runner';
import type { SceneId } from '@/dev/spike/scenes';

/** A screen that only draws when the test says so. */
function fakeFrames() {
  let callback: ((time: number) => void) | null = null;
  return {
    requestFrame: (next: (time: number) => void) => {
      callback = next;
      return 1;
    },
    cancelFrame: vi.fn(),
    /** Runs frames from `from` to `to` ms, one every `gap` ms. Stops if the runner stops. */
    play(from: number, to: number, gap = 1000 / 60) {
      for (let time = from; time <= to; time += gap) {
        const run = callback;
        callback = null;
        if (!run) return time;
        run(time);
      }
      return to;
    },
    pending: () => callback !== null,
  };
}

function setup(scenes: SceneId[], warmupMs = 100, measureMs = 1000) {
  const frames = fakeFrames();
  const onScene = vi.fn();
  const onFps = vi.fn();
  const onDone = vi.fn<(results: SceneResult[], completed: boolean) => void>();
  const options: RunnerOptions = {
    scenes,
    warmupMs,
    measureMs,
    requestFrame: frames.requestFrame,
    cancelFrame: frames.cancelFrame,
    onScene,
    onFps,
    onDone,
  };
  return { frames, onScene, onFps, onDone, runner: startRunner(options) };
}

describe('startRunner', () => {
  it('shows the first scene right away and asks for a frame', () => {
    const { onScene, frames } = setup(['idle', 'm02']);
    expect(onScene).toHaveBeenCalledWith('idle', 0);
    expect(frames.pending()).toBe(true);
  });

  it('throws the warm-up away and measures the rest of the scene', () => {
    const { frames, onDone } = setup(['idle'], 100, 1000);
    frames.play(0, 1200);
    expect(onDone).toHaveBeenCalledTimes(1);
    const [results, completed] = onDone.mock.calls[0] ?? [];
    expect(completed).toBe(true);
    const summary = results?.[0]?.summary;
    expect(results?.[0]?.id).toBe('idle');
    expect(summary?.durationMs).toBeGreaterThanOrEqual(900);
    // The measured part is 1000 ms and the last frame can land up to one frame past it.
    expect(summary?.durationMs).toBeLessThanOrEqual(1000 + 1000 / 60 + 0.001);
    expect(summary?.averageFps).toBeCloseTo(60, 0);
  });

  it('plays the scenes in order, each one with its own warm-up', () => {
    const { frames, onScene, onDone } = setup(['idle', 'selected', 'm02'], 100, 500);
    frames.play(0, 5000);
    expect(onScene.mock.calls.map((call) => call[0])).toEqual(['idle', 'selected', 'm02']);
    const results = onDone.mock.calls[0]?.[0] ?? [];
    expect(results.map((result) => result.id)).toEqual(['idle', 'selected', 'm02']);
    expect(results.every((result) => result.summary !== null)).toBe(true);
  });

  it('a long pause between scenes (the page being built) is not measured', () => {
    const { frames, onScene, onDone } = setup(['idle', 'selected'], 100, 500);
    // Frame by frame until the second scene is asked for, then a 2 s hole before its first frame.
    let time = 0;
    while (onScene.mock.calls.length < 2) {
      frames.play(time, time);
      time += 1000 / 60;
    }
    time += 2000;
    frames.play(time, time + 3000);
    const results = onDone.mock.calls[0]?.[0] ?? [];
    expect(results[1]?.summary?.worstFrameMs).toBeLessThan(20);
  });

  it('reports the fps every half second', () => {
    const { frames, onFps } = setup(['idle'], 100, 2000);
    frames.play(0, 2000);
    expect(onFps.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(onFps.mock.calls[0]?.[0]).toBeCloseTo(60, 0);
  });

  it('cancel stops the frames and hands back what was measured, as not completed', () => {
    const { frames, onDone, runner } = setup(['idle', 'm02'], 100, 500);
    frames.play(0, 800);
    runner.cancel();
    expect(onDone).toHaveBeenCalledTimes(1);
    const [results, completed] = onDone.mock.calls[0] ?? [];
    expect(completed).toBe(false);
    expect(results?.map((result) => result.id)).toEqual(['idle']);
    expect(frames.cancelFrame).toHaveBeenCalled();
  });

  it('cancelling twice, or after the end, does nothing more', () => {
    const { frames, onDone, runner } = setup(['idle'], 100, 300);
    frames.play(0, 600);
    runner.cancel();
    runner.cancel();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('no scenes ends at once', () => {
    const { onDone } = setup([]);
    expect(onDone).toHaveBeenCalledWith([], true);
  });

  it('a scene with too few frames has no summary', () => {
    const { frames, onDone } = setup(['idle'], 0, 1000);
    // Two frames only: one at the start and one at the end.
    frames.play(0, 0);
    frames.play(1000, 1000);
    expect(onDone.mock.calls[0]?.[0]?.[0]?.summary).toBeNull();
  });
});
