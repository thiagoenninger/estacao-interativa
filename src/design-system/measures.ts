/* DESIGN SYSTEM MEASURES */

export const STAGE = { width: 1920, height: 1080 } as const;

export const MARGIN = 64;

export const GRID = {
  columns: 12,
  columnWidth: 120,
  gutter: 32,
} as const;

// Safe area (stage - margin on all sides)
export const SAFE_AREA = {
  x: MARGIN,
  y: MARGIN,
  width: STAGE.width - 2 * MARGIN,
  height: STAGE.height - 2 * MARGIN,
} as const;

// X position of column n (1 to 12)
export function columnX(n: number): number {
  return MARGIN + (n - 1) * (GRID.columnWidth + GRID.gutter);
}

// Exploration zone: column 1 to 8
export const EXPLORATION_ZONE = {
  x: columnX(1),
  y: MARGIN,
  width: 8 * GRID.columnWidth + 7 * GRID.gutter,
  height: SAFE_AREA.height,
} as const;

export const DIVIDER_X = 1264;

// Information zone
export const TEXT_COLUMN = { x: 1312, y: MARGIN, width: 544, height: SAFE_AREA.height } as const;

// Navigation zone: bottom-left corner
export const NAVIGATION_ZONE = { x: 64, y: 952, width: 440, height: 64 } as const;

// Orbit center with panel open and without a panel (universe center)
export const ORBIT_CENTER_WITH_PANEL = { x: 656, y: 540 } as const;
export const UNIVERSE_CENTER = { x: 960, y: 540 } as const;

export const ORBIT_RADIUS = 400;

// Maximum box of the selected object
export const OBJECT_MAX_BOX = { width: 640, height: 480 } as const;

/** Touch targets (Foundations 04): minimum and recommended sizes, and the space between targets. */
export const TOUCH = {
  minTarget: 64,
  recommendedTarget: 80,
  materialTarget: 112,
  minGap: 24,
} as const;
