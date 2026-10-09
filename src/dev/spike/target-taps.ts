import { logicalPxToMm } from './physical-size';

export const TARGET_SIZES = [32, 48, 64, 80, 112] as const;

export interface Tap {
  dx: number;
  dy: number;
  inside: boolean;
}

/**
 * Converts a tap on a square to its offset from the center, in px of the Stage. The square is
 * measured on the screen (`rect`) and the Stage is scaled, so the offset is divided by the scale.
 */
export function tapOffset(
  point: { x: number; y: number },
  rect: { left: number; top: number; width: number; height: number },
  logicalSize: number,
): Tap {
  const scale = rect.width > 0 ? rect.width / logicalSize : 1;
  const dx = (point.x - (rect.left + rect.width / 2)) / scale;
  const dy = (point.y - (rect.top + rect.height / 2)) / scale;
  const half = logicalSize / 2;
  return { dx, dy, inside: Math.abs(dx) <= half && Math.abs(dy) <= half };
}

export interface TapSummary {
  taps: number;
  hits: number;
  meanErrorMm: number;
  maxErrorMm: number;
}

export function summarizeTaps(taps: readonly Tap[], diagonalInches: number): TapSummary {
  const errors = taps.map((tap) => logicalPxToMm(Math.hypot(tap.dx, tap.dy), diagonalInches));
  return {
    taps: taps.length,
    hits: taps.filter((tap) => tap.inside).length,
    meanErrorMm: errors.length ? errors.reduce((sum, value) => sum + value, 0) / errors.length : 0,
    maxErrorMm: errors.reduce((max, value) => Math.max(max, value), 0),
  };
}
