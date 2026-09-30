// Motion tokens for JavaScript

// Duration in milliseconds
export const DURATION = {
  instant: 80,
  fast: 160,
  heat: 200,
  base: 320,
  medium: 480,
  slow: 700,
  slower: 1000,
} as const;

// Interval between elements that enter in sequence
export const STAGGER_STEP = 50;

export const EASING = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  enter: 'cubic-bezier(0, 0, 0.2, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;

// Idle rules
export const IDLE = {
  // range of the floating period, per object
  cycleMin: 8000,
  cycleMax: 14000,
  // time without touch before the automatic return
  timeout: 60000,
} as const;
