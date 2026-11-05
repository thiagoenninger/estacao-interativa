import type { ObjectItem } from '../content/index.ts';
import { MARGIN, SAFE_AREA, STAGE } from '../design-system/measures.ts';
import { UNIVERSE_SIZE } from '../object/drawing-measures.ts';
import { fitSize } from '../object/drawing-state.ts';
import { getDrawing } from '../object/object-source.ts';

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export const UNIVERSE_LAYOUT = {
  minObjectGap: 96,
  touchPad: 16,
  labelGap: 16,
  labelHeight: 24,
  labelCharWidth: 13.4,
  floatMargin: 8,
} as const;

export const MAIN_PROMPT_ZONE: Rect = { x: MARGIN, y: MARGIN, width: 980, height: 272 };

export interface Placement {
  readonly id: string;
  readonly name: string;
  readonly center: { readonly x: number; readonly y: number };
  readonly box: { readonly width: number; readonly height: number };
}

export function placementOf(item: ObjectItem): Placement {
  const { viewBox } = getDrawing(item.svg);
  return {
    id: item.id,
    name: item.name,
    center: item.position,
    box: fitSize(viewBox, UNIVERSE_SIZE[item.plane]),
  };
}

export function objectBox(placement: Placement): Rect {
  const { center, box } = placement;
  return {
    x: center.x - box.width / 2,
    y: center.y - box.height / 2,
    width: box.width,
    height: box.height,
  };
}

function grow(rect: Rect, amount: number): Rect {
  return {
    x: rect.x - amount,
    y: rect.y - amount,
    width: rect.width + 2 * amount,
    height: rect.height + 2 * amount,
  };
}

export function touchBox(placement: Placement): Rect {
  return grow(objectBox(placement), UNIVERSE_LAYOUT.touchPad);
}

export function labelBox(placement: Placement): Rect {
  const box = objectBox(placement);
  const width = Math.max(box.width, placement.name.length * UNIVERSE_LAYOUT.labelCharWidth);
  return {
    x: placement.center.x - width / 2,
    y: box.y + box.height + UNIVERSE_LAYOUT.labelGap,
    width,
    height: UNIVERSE_LAYOUT.labelHeight,
  };
}

export function rectGap(a: Rect, b: Rect): number {
  const dx = Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width), 0);
  const dy = Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height), 0);
  return Math.hypot(dx, dy);
}

export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

function isInside(rect: Rect, area: Rect): boolean {
  return (
    rect.x >= area.x &&
    rect.y >= area.y &&
    rect.x + rect.width <= area.x + area.width &&
    rect.y + rect.height <= area.y + area.height
  );
}

export type LayoutIssueCode =
  'too-close' | 'outside-stage' | 'label-outside-safe-area' | 'over-prompt' | 'label-over-object';

export interface LayoutIssue {
  readonly code: LayoutIssueCode;
  readonly ids: readonly string[];
  readonly message: string;
}

const STAGE_AREA: Rect = { x: 0, y: 0, width: STAGE.width, height: STAGE.height };

export function checkUniverseLayout(placements: readonly Placement[]): LayoutIssue[] {
  const issues: LayoutIssue[] = [];
  const { minObjectGap, floatMargin } = UNIVERSE_LAYOUT;

  for (const placement of placements) {
    if (!isInside(grow(touchBox(placement), floatMargin), STAGE_AREA)) {
      issues.push({
        code: 'outside-stage',
        ids: [placement.id],
        message: `${placement.id}: the touch area, with the float, crosses the edge of the Stage`,
      });
    }
    if (!isInside(grow(labelBox(placement), floatMargin), SAFE_AREA)) {
      issues.push({
        code: 'label-outside-safe-area',
        ids: [placement.id],
        message: `${placement.id}: the label, with the float, leaves the safe area`,
      });
    }
    if (overlaps(touchBox(placement), MAIN_PROMPT_ZONE)) {
      issues.push({
        code: 'over-prompt',
        ids: [placement.id],
        message: `${placement.id}: the touch area covers the main prompt`,
      });
    }
  }

  for (let i = 0; i < placements.length; i += 1) {
    for (let j = i + 1; j < placements.length; j += 1) {
      const a = placements[i];
      const b = placements[j];
      if (a === undefined || b === undefined) continue;
      const gap = rectGap(objectBox(a), objectBox(b));
      if (gap < minObjectGap) {
        issues.push({
          code: 'too-close',
          ids: [a.id, b.id],
          message: `${a.id} and ${b.id}: ${gap.toFixed(1)} px apart, the minimum is ${minObjectGap} px`,
        });
      }
      for (const [owner, other] of [
        [a, b],
        [b, a],
      ] as const) {
        if (overlaps(labelBox(owner), touchBox(other))) {
          issues.push({
            code: 'label-over-object',
            ids: [owner.id, other.id],
            message: `${owner.id}: the label runs into the touch area of ${other.id}`,
          });
        }
      }
    }
  }

  return issues;
}
