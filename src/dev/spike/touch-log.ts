/**
 * Touch tracking for the spike. The Design System says one touch at a time..
 */

export interface PointerSample {
  id: number;
  type: string;
  x: number;
  y: number;
  time: number;
}

export interface FinishedTouch {
  durationMs: number;
  travelPx: number;
}

export interface TouchLog {
  active: Record<number, PointerSample>;
  primaryId: number | null;
  accepted: number;
  ignored: number;
  maxSimultaneous: number;
  types: string[];
  finished: FinishedTouch[];
  currentTravelPx: number;
}

export const EMPTY_TOUCH_LOG: TouchLog = {
  active: {},
  primaryId: null,
  accepted: 0,
  ignored: 0,
  maxSimultaneous: 0,
  types: [],
  finished: [],
  currentTravelPx: 0,
};

const KEPT_TOUCHES = 200;

export type TouchEvent =
  | { kind: 'down'; sample: PointerSample }
  | { kind: 'move'; sample: PointerSample }
  | { kind: 'up'; sample: PointerSample }
  | { kind: 'cancel'; sample: PointerSample };

export function trackTouch(log: TouchLog, event: TouchEvent): TouchLog {
  const { sample } = event;

  if (event.kind === 'down') {
    const active = { ...log.active, [sample.id]: sample };
    const isFirst = log.primaryId === null;
    return {
      ...log,
      active,
      primaryId: isFirst ? sample.id : log.primaryId,
      accepted: log.accepted + (isFirst ? 1 : 0),
      ignored: log.ignored + (isFirst ? 0 : 1),
      maxSimultaneous: Math.max(log.maxSimultaneous, Object.keys(active).length),
      types: log.types.includes(sample.type) ? log.types : [...log.types, sample.type],
      currentTravelPx: isFirst ? 0 : log.currentTravelPx,
    };
  }

  const landing = log.active[sample.id];
  if (!landing) return log;

  if (event.kind === 'move') {
    if (sample.id !== log.primaryId) return log;
    const travel = Math.hypot(sample.x - landing.x, sample.y - landing.y);
    return { ...log, currentTravelPx: Math.max(log.currentTravelPx, travel) };
  }

  // up or cancel
  const active = { ...log.active };
  delete active[sample.id];
  if (sample.id !== log.primaryId) return { ...log, active };
  const travelPx = Math.max(
    log.currentTravelPx,
    Math.hypot(sample.x - landing.x, sample.y - landing.y),
  );
  const finished = [...log.finished, { durationMs: sample.time - landing.time, travelPx }];
  return {
    ...log,
    active,
    primaryId: null,
    currentTravelPx: 0,
    finished: finished.slice(-KEPT_TOUCHES),
  };
}

export interface TouchSummary {
  accepted: number;
  ignored: number;
  maxSimultaneous: number;
  types: string[];
  touches: number;
  averageDurationMs: number;
  veryShort: number;
  maxTravelPx: number;
}

export const VERY_SHORT_MS = 40;

export function summarizeTouch(log: TouchLog): TouchSummary {
  const durations = log.finished.map((touch) => touch.durationMs);
  return {
    accepted: log.accepted,
    ignored: log.ignored,
    maxSimultaneous: log.maxSimultaneous,
    types: log.types,
    touches: log.finished.length,
    averageDurationMs: durations.length
      ? durations.reduce((sum, value) => sum + value, 0) / durations.length
      : 0,
    veryShort: durations.filter((value) => value < VERY_SHORT_MS).length,
    maxTravelPx: log.finished.reduce((max, touch) => Math.max(max, touch.travelPx), 0),
  };
}
