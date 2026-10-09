import { summarizeFrames, type FrameSummary } from './frame-stats';
import type { SceneId } from './scenes';

export interface SceneResult {
  id: SceneId;
  summary: FrameSummary | null;
}

export interface RunnerOptions {
  scenes: readonly SceneId[];
  warmupMs: number;
  measureMs: number;
  requestFrame: (callback: (time: number) => void) => number;
  cancelFrame: (handle: number) => void;
  onScene: (id: SceneId, index: number) => void;
  onFps?: (fps: number) => void;
  onDone: (results: SceneResult[], completed: boolean) => void;
}

const FPS_WINDOW_MS = 500;

/**
 * Plays the scenes one after the other and records the time of each frame of the measured part.
 * The warm-up of each scene is thrown away: the first frames pay for creating the layers.
 */
export function startRunner(options: RunnerOptions): { cancel: () => void } {
  const { scenes, warmupMs, measureMs } = options;
  const results: SceneResult[] = [];
  let index = 0;
  let sceneStart: number | null = null;
  let times: number[] = [];
  let handle = 0;
  let finished = false;
  let windowStart = 0;
  let windowFrames = 0;

  function finish(completed: boolean) {
    if (finished) return;
    finished = true;
    options.cancelFrame(handle);
    options.onDone(results, completed);
  }

  function frame(time: number) {
    if (finished) return;
    if (sceneStart === null) {
      sceneStart = time;
      windowStart = time;
      windowFrames = 0;
    } else {
      windowFrames += 1;
      if (time - windowStart >= FPS_WINDOW_MS) {
        options.onFps?.((windowFrames / (time - windowStart)) * 1000);
        windowStart = time;
        windowFrames = 0;
      }
    }

    const elapsed = time - sceneStart;
    if (elapsed >= warmupMs) times.push(time);

    if (elapsed >= warmupMs + measureMs) {
      const id = scenes[index];
      if (id !== undefined) results.push({ id, summary: summarizeFrames(times) });
      index += 1;
      if (index >= scenes.length) {
        finish(true);
        return;
      }
      sceneStart = null;
      times = [];
      const next = scenes[index];
      if (next !== undefined) options.onScene(next, index);
    }
    handle = options.requestFrame(frame);
  }

  const first = scenes[0];
  if (first === undefined) {
    finish(true);
  } else {
    options.onScene(first, 0);
    handle = options.requestFrame(frame);
  }
  return { cancel: () => finish(false) };
}
