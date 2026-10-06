import { describe, expect, it } from 'vitest';
import {
  defaultSize,
  fitSize,
  groupState,
  isGroupVisible,
  isLevelVisible,
  levelOf,
  type DrawingView,
} from '@/object/drawing-state.ts';

describe('levelOf', () => {
  it.each([
    ['level-0-universe', 0],
    ['level-1-structure', 1],
    ['level-2-internal', 2],
    ['level-3-other', null],
    ['frame', null],
    [undefined, null],
  ])('%s is level %s', (id, level) => {
    expect(levelOf(id)).toBe(level);
  });
});

describe('levels on and off', () => {
  it('shows level 0 in every view', () => {
    for (const view of ['universe', 'selected', 'thumbnail'] as const) {
      expect(isLevelVisible(0, view, null)).toBe(true);
      expect(isLevelVisible(0, view, 'steel')).toBe(true);
    }
  });

  it('shows level 1 only for the selected object', () => {
    expect(isLevelVisible(1, 'selected', null)).toBe(true);
    expect(isLevelVisible(1, 'universe', null)).toBe(false);
    expect(isLevelVisible(1, 'thumbnail', null)).toBe(false);
  });

  it('shows level 2 only for the selected object with a material', () => {
    expect(isLevelVisible(2, 'selected', 'steel')).toBe(true);
    expect(isLevelVisible(2, 'selected', null)).toBe(false);
    expect(isLevelVisible(2, 'universe', 'steel')).toBe(false);
  });
});

describe('groups on and off', () => {
  it('shows an internal group only when it is made of the selected material', () => {
    expect(isGroupVisible(2, 'selected', 'copper', 'copper')).toBe(true);
    expect(isGroupVisible(2, 'selected', 'copper', 'steel')).toBe(false);
    expect(isGroupVisible(2, 'selected', 'copper', null)).toBe(false);
    expect(isGroupVisible(2, 'selected', null, 'copper')).toBe(false);
  });

  it('shows every group of a level that is on, whatever the material', () => {
    expect(isGroupVisible(0, 'universe', null, 'steel')).toBe(true);
    expect(isGroupVisible(1, 'selected', 'copper', 'steel')).toBe(true);
    expect(isGroupVisible(1, 'universe', null, 'steel')).toBe(false);
  });
});

describe('highlight and recede', () => {
  it('highlights the material and recedes the others, in the selected view', () => {
    expect(groupState('selected', 'steel', 'steel')).toBe('highlight');
    expect(groupState('selected', 'steel', 'aluminium')).toBe('recede');
    expect(groupState('selected', 'steel', null)).toBe('recede');
  });

  it('does nothing without a material', () => {
    expect(groupState('selected', null, 'steel')).toBe('normal');
  });

  it.each<DrawingView>(['universe', 'thumbnail'])('does nothing in the %s view', (view) => {
    expect(groupState(view, 'steel', 'steel')).toBe('normal');
    expect(groupState(view, 'steel', 'aluminium')).toBe('normal');
  });
});

describe('size', () => {
  const viewBox = { width: 700, height: 460 };

  it('uses a number as the longest side', () => {
    const size = fitSize(viewBox, 340);
    expect(size.width).toBeCloseTo(340);
    expect(size.height).toBeCloseTo((340 * 460) / 700);
    const tall = fitSize({ width: 210, height: 320 }, 200);
    expect(tall.height).toBeCloseTo(200);
    expect(tall.width).toBeCloseTo((200 * 210) / 320);
  });

  it('fits a box, keeping the proportion', () => {
    const size = fitSize(viewBox, { width: 640, height: 480 });
    expect(size.width).toBeCloseTo(640);
    expect(size.height).toBeCloseTo((640 * 460) / 700);
    const tall = fitSize({ width: 210, height: 320 }, { width: 640, height: 480 });
    expect(tall.height).toBeCloseTo(480);
    expect(tall.width).toBeCloseTo((480 * 210) / 320);
  });

  it('has a default size for each view', () => {
    expect(defaultSize('selected')).toEqual({ width: 640, height: 480 });
    expect(defaultSize('thumbnail')).toBe(120);
    expect(defaultSize('universe')).toBe(260);
  });
});
