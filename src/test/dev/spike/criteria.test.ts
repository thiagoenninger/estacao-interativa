import { describe, expect, it } from 'vitest';
import { CRITERIA, judge, VERDICT_LABEL } from '@/dev/spike/criteria';
import type { FrameSummary } from '@/dev/spike/frame-stats';

function summary(overrides: Partial<FrameSummary>): FrameSummary {
  return {
    frames: 600,
    durationMs: 10000,
    averageFps: 60,
    medianFrameMs: 16.7,
    p95FrameMs: 16.8,
    worstFrameMs: 17,
    missedFrames: 0,
    missedPercent: 0,
    ...overrides,
  };
}

describe('judge', () => {
  it('a steady 60 fps is good', () => {
    expect(judge(summary({}))).toBe('good');
  });

  it('is good right at the limits', () => {
    expect(
      judge(
        summary({
          averageFps: CRITERIA.good.minAverageFps,
          p95FrameMs: CRITERIA.good.maxP95Ms,
          missedPercent: CRITERIA.good.maxMissedPercent,
        }),
      ),
    ).toBe('good');
  });

  it('one bad frame in twenty puts a good average under attention', () => {
    expect(judge(summary({ averageFps: 59, p95FrameMs: 25, missedPercent: 1 }))).toBe('attention');
  });

  it('an average between 45 and 57 fps is attention', () => {
    expect(judge(summary({ averageFps: 50, p95FrameMs: 17, missedPercent: 4 }))).toBe('attention');
  });

  it('below 45 fps is bad', () => {
    expect(judge(summary({ averageFps: 44 }))).toBe('bad');
  });

  it('losing more than 10% of the frames is bad, even with a fine average', () => {
    expect(judge(summary({ averageFps: 58, missedPercent: 11 }))).toBe('bad');
  });

  it('has a label for each verdict', () => {
    expect(VERDICT_LABEL).toEqual({ good: 'bom', attention: 'atenção', bad: 'ruim' });
  });
});
