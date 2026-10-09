export const REFRESH_RATE = 60;

export interface FrameSummary {
  frames: number;
  durationMs: number;
  averageFps: number;
  medianFrameMs: number;
  p95FrameMs: number;
  worstFrameMs: number;
  missedFrames: number;
  missedPercent: number;
}

function quantile(sorted: readonly number[], fraction: number): number {
  const index = Math.min(sorted.length - 1, Math.ceil(fraction * sorted.length) - 1);
  return sorted[Math.max(0, index)] ?? 0;
}

export function summarizeFrames(
  timestamps: readonly number[],
  refreshRate: number = REFRESH_RATE,
): FrameSummary | null {
  if (timestamps.length < 3) return null;
  const budget = 1000 / refreshRate;
  const gaps: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    gaps.push((timestamps[i] ?? 0) - (timestamps[i - 1] ?? 0));
  }
  const durationMs = (timestamps[timestamps.length - 1] ?? 0) - (timestamps[0] ?? 0);
  if (!(durationMs > 0)) return null;

  const sorted = [...gaps].sort((a, b) => a - b);
  const missedFrames = gaps.reduce(
    (sum, gap) => sum + Math.max(0, Math.round(gap / budget) - 1),
    0,
  );

  return {
    frames: gaps.length,
    durationMs,
    averageFps: (gaps.length / durationMs) * 1000,
    medianFrameMs: quantile(sorted, 0.5),
    p95FrameMs: quantile(sorted, 0.95),
    worstFrameMs: sorted[sorted.length - 1] ?? 0,
    missedFrames,
    missedPercent: (missedFrames / (gaps.length + missedFrames)) * 100,
  };
}
