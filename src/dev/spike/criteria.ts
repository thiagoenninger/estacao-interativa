import type { FrameSummary } from './frame-stats';

/**
 * How a measurement is judged. The numbers come from the goal in the Roadmap (60 fps) with a
 * margin for the sampling: "good" is a scene the visitor will not notice, "bad" is a scene that
 * has to change before it reaches the stations.
 */
export const CRITERIA = {
  good: { minAverageFps: 57, maxP95Ms: 18, maxMissedPercent: 2 },
  bad: { minAverageFps: 45, maxMissedPercent: 10 },
} as const;

export type Verdict = 'good' | 'attention' | 'bad';

export const VERDICT_LABEL: Record<Verdict, string> = {
  good: 'bom',
  attention: 'atenção',
  bad: 'ruim',
};

export function judge(summary: FrameSummary): Verdict {
  const { good, bad } = CRITERIA;
  if (summary.averageFps < bad.minAverageFps || summary.missedPercent > bad.maxMissedPercent) {
    return 'bad';
  }
  const isGood =
    summary.averageFps >= good.minAverageFps &&
    summary.p95FrameMs <= good.maxP95Ms &&
    summary.missedPercent <= good.maxMissedPercent;
  return isGood ? 'good' : 'attention';
}
