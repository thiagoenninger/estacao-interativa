import { describe, expect, it } from 'vitest';
import {
  columnX,
  EXPLORATION_ZONE,
  GRID,
  NAVIGATION_ZONE,
  SAFE_AREA,
  STAGE,
  TEXT_COLUMN,
  TOUCH,
} from '@/design-system/measures';

describe('Design System measures', () => {
  it('the safe area is 1792 × 952', () => {
    expect(SAFE_AREA.width).toBe(1792);
    expect(SAFE_AREA.height).toBe(952);
  });

  it('12 columns of 120 px with a 32 px gutter fill the safe area exactly', () => {
    const total = GRID.columns * GRID.columnWidth + (GRID.columns - 1) * GRID.gutter;
    expect(total).toBe(SAFE_AREA.width);
  });

  it('column 12 ends at the right margin', () => {
    expect(columnX(12) + GRID.columnWidth).toBe(STAGE.width - 64);
  });

  it('the exploration zone spans columns 1–8 (x 64 to 1248, 1184 px)', () => {
    expect(EXPLORATION_ZONE.x).toBe(64);
    expect(EXPLORATION_ZONE.width).toBe(1184);
    expect(EXPLORATION_ZONE.x + EXPLORATION_ZONE.width).toBe(1248);
  });

  it('the text column ends at the right margin', () => {
    expect(TEXT_COLUMN.x + TEXT_COLUMN.width).toBe(1856);
  });

  it('the navigation zone ends at the bottom margin', () => {
    expect(NAVIGATION_ZONE.y + NAVIGATION_ZONE.height).toBe(STAGE.height - 64);
  });

  it('the touch targets are the Foundations 04 numbers', () => {
    expect(TOUCH).toEqual({
      minTarget: 64,
      recommendedTarget: 80,
      materialTarget: 112,
      minGap: 24,
    });
  });
});
