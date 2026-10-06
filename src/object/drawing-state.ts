import { OBJECT_MAX_BOX } from '../design-system/measures.ts';
import { THUMBNAIL_SIZE, UNIVERSE_SIZE } from './drawing-measures.ts';

/**
 * How the object is shown (Components 01):
 * - universe: level 0 only, 2.6 px stroke;
 * - selected: levels 0 and 1, 3.2 px stroke; level 2 only for the selected material;
 * - thumbnail: level 0 only, 2.2 px stroke (trail and list).
 */
export type DrawingView = 'universe' | 'selected' | 'thumbnail';

/** A group of the selected material is highlighted, the others recede. */
export type GroupState = 'normal' | 'highlight' | 'recede';

export type Level = 0 | 1 | 2;

/** The level of a level group by its id ("level-1-structure" is 1), or null for any other id. */
export function levelOf(id: string | undefined): Level | null {
  const digit = /^level-([012])-/.exec(id ?? '')?.[1];
  return digit === undefined ? null : (Number(digit) as Level);
}

/**
 * Whether a whole level is on. Level 0 is always on, level 1 is on for the selected object,
 * and level 2 is on only when a material is selected (its groups then decide one by one).
 */
export function isLevelVisible(level: Level, view: DrawingView, material: string | null): boolean {
  if (level === 0) return true;
  if (view !== 'selected') return false;
  return level === 1 || material !== null;
}

/** Whether a component group is on. Internal groups appear only for the selected material. */
export function isGroupVisible(
  level: Level,
  view: DrawingView,
  material: string | null,
  groupMaterial: string | null,
): boolean {
  if (!isLevelVisible(level, view, material)) return false;
  return level !== 2 || (material !== null && groupMaterial === material);
}

/** Highlight and recede only exist for the selected object with a material chosen. */
export function groupState(
  view: DrawingView,
  material: string | null,
  groupMaterial: string | null,
): GroupState {
  if (view !== 'selected' || material === null) return 'normal';
  return groupMaterial === material ? 'highlight' : 'recede';
}

export type DrawingSize = number | { width: number; height: number };

/** The size the view uses when none is given: the box of the selected object, 120 px, 260 px. */
export function defaultSize(view: DrawingView): DrawingSize {
  if (view === 'selected') return OBJECT_MAX_BOX;
  return view === 'thumbnail' ? THUMBNAIL_SIZE : UNIVERSE_SIZE.mid;
}

/**
 * Pixel size of the drawing, keeping the proportion of its viewBox.
 * A number is the longest side; a box is the space the drawing has to fit in.
 */
export function fitSize(
  viewBox: { width: number; height: number },
  size: DrawingSize,
): { width: number; height: number } {
  const scale =
    typeof size === 'number'
      ? size / Math.max(viewBox.width, viewBox.height)
      : Math.min(size.width / viewBox.width, size.height / viewBox.height);
  return { width: viewBox.width * scale, height: viewBox.height * scale };
}
