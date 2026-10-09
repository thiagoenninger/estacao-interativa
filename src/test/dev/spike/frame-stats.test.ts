import { describe, expect, it } from 'vitest';
import { summarizeFrames } from '@/dev/spike/frame-stats';

/** Timestamps of `count` frames, each `gap` ms after the other. */
function steady(count: number, gap: number): number[] {
  return Array.from({ length: count }, (_, i) => 1000 + i * gap);
}

describe('summarizeFrames', () => {
  it('needs at least 3 frames', () => {
    expect(summarizeFrames([])).toBeNull();
    expect(summarizeFrames([0, 16])).toBeNull();
  });

  it('a steady 60 fps loses nothing', () => {
    const summary = summarizeFrames(steady(601, 1000 / 60));
    expect(summary?.frames).toBe(600);
    expect(summary?.averageFps).toBeCloseTo(60, 5);
    expect(summary?.medianFrameMs).toBeCloseTo(16.667, 2);
    expect(summary?.worstFrameMs).toBeCloseTo(16.667, 2);
    expect(summary?.missedFrames).toBe(0);
    expect(summary?.missedPercent).toBe(0);
  });

  it('a steady 30 fps loses one frame in two', () => {
    const summary = summarizeFrames(steady(301, 1000 / 30));
    expect(summary?.averageFps).toBeCloseTo(30, 5);
    expect(summary?.missedFrames).toBe(300);
    expect(summary?.missedPercent).toBeCloseTo(50, 5);
  });

  it('counts each skipped refresh inside a long frame', () => {
    // 10 frames at 16.7 ms, then one of 50 ms (3 refreshes: 2 lost), then 10 more.
    const times = steady(11, 1000 / 60);
    const last = times[times.length - 1] ?? 0;
    times.push(last + 50);
    for (let i = 1; i <= 10; i++) times.push(last + 50 + (i * 1000) / 60);
    const summary = summarizeFrames(times);
    expect(summary?.frames).toBe(21);
    expect(summary?.worstFrameMs).toBeCloseTo(50, 5);
    expect(summary?.missedFrames).toBe(2);
    expect(summary?.missedPercent).toBeCloseTo((2 / 23) * 100, 5);
  });

  it('the 95th percentile shows the bad frames the median hides', () => {
    // 90 frames of 16.7 ms and 10 of 40 ms.
    const times = [0];
    for (let i = 0; i < 100; i++) times.push((times[i] ?? 0) + (i % 10 === 9 ? 40 : 1000 / 60));
    const summary = summarizeFrames(times);
    expect(summary?.medianFrameMs).toBeCloseTo(16.667, 2);
    expect(summary?.p95FrameMs).toBeCloseTo(40, 5);
  });

  it('measures against another refresh rate', () => {
    const summary = summarizeFrames(steady(121, 1000 / 120), 120);
    expect(summary?.missedFrames).toBe(0);
    expect(summary?.averageFps).toBeCloseTo(120, 5);
  });

  it('returns null when the time does not advance', () => {
    expect(summarizeFrames([5, 5, 5])).toBeNull();
  });
});
