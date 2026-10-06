/**
 * Measures of the object drawings (Foundations 07 · Objetos em line art). Single source of
 * truth for the TypeScript side; object.css repeats the stroke numbers and a test keeps the
 * two identical.
 */

/** Stroke on the screen, in px, by view. The app sets it by CSS: the file's width is ignored. */
export const STROKE = { universe: 2.6, selected: 3.2, thumbnail: 2.2 } as const;

/** The fine and dashed strokes are 0.62 × the base stroke; the highlight is 1.35 × the group's own. */
export const STROKE_RATIO = { fine: 0.62, highlight: 1.35 } as const;

/** Longest side of an object in the universe, by plane, and in thumbnails (px). */
export const UNIVERSE_SIZE = { near: 340, mid: 260, far: 200 } as const;
export const THUMBNAIL_SIZE = 120;

/** Smallest distance between parallel strokes on the screen (px at 1920 × 1080). */
export const MIN_STROKE_GAP = 6;

/** At most 6 internal groups (level 2) per material are revealed. */
export const MAX_INTERNAL_GROUPS_PER_MATERIAL = 6;

/** The three levels of detail, in file order. Same file, groups switched on and off. */
export const LEVEL_IDS = ['level-0-universe', 'level-1-structure', 'level-2-internal'] as const;

/** The value of data-stroke on a component group. */
export const STROKE_KINDS = ['line', 'fine', 'dashed', 'filled'] as const;
export type StrokeKind = (typeof STROKE_KINDS)[number];
