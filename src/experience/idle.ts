import type { Clock, TimerId } from './clock.ts';

export const IDLE_WARN_AFTER_MS = 50_000;
export const IDLE_RETURN_AFTER_MS = 60_000;

export interface IdleConfig {
  readonly warnAfterMs: number;
  readonly returnAfterMs: number;
}

export const DEFAULT_IDLE_CONFIG: IdleConfig = {
  warnAfterMs: IDLE_WARN_AFTER_MS,
  returnAfterMs: IDLE_RETURN_AFTER_MS,
};

export type IdlePhase = 'off' | 'counting' | 'warning';

export interface IdleSnapshot {
  phase: IdlePhase;
  elapsedMs: number;
  warnInMs: number | null;
  returnInMs: number | null;
}

export interface IdleService {
  restart(): void;
  sync(): void;
  stop(): void;
  snapshot(): IdleSnapshot;
}

export interface IdleOptions {
  clock: Clock;
  config?: IdleConfig;
  isAway(): boolean;
  onWarn(): void;
  onReturn(): void;
}

/**
 * The inactivity timer. It knows nothing about the screens: it asks `isAway`, and tells the
 * machine to warn (`onWarn`) and to return (`onReturn`). It never runs in the universe.
 */
export function createIdleService(options: IdleOptions): IdleService {
  const { clock, isAway, onWarn, onReturn } = options;
  const config = options.config ?? DEFAULT_IDLE_CONFIG;
  if (config.warnAfterMs <= 0 || config.returnAfterMs <= config.warnAfterMs) {
    throw new RangeError('Idle: the warning must come after 0 and before the return.');
  }

  let startedAt: number | null = null;
  let warned = false;
  let warnTimer: TimerId | null = null;
  let returnTimer: TimerId | null = null;

  function clearTimers(): void {
    if (warnTimer !== null) clock.clearTimeout(warnTimer);
    if (returnTimer !== null) clock.clearTimeout(returnTimer);
    warnTimer = null;
    returnTimer = null;
  }

  function arm(): void {
    clearTimers();
    startedAt = clock.now();
    warned = false;
    warnTimer = clock.setTimeout(() => {
      warnTimer = null;
      warned = true;
      onWarn();
    }, config.warnAfterMs);
    returnTimer = clock.setTimeout(() => {
      returnTimer = null;
      onReturn();
      sync();
    }, config.returnAfterMs);
  }

  function disarm(): void {
    clearTimers();
    startedAt = null;
    warned = false;
  }

  function sync(): void {
    if (isAway()) {
      if (startedAt === null) arm();
    } else if (startedAt !== null) {
      disarm();
    }
  }

  return {
    restart() {
      if (isAway()) arm();
      else disarm();
    },
    sync,
    stop: disarm,
    snapshot() {
      if (startedAt === null) {
        return { phase: 'off', elapsedMs: 0, warnInMs: null, returnInMs: null };
      }
      const elapsedMs = Math.max(0, clock.now() - startedAt);
      return {
        phase: warned ? 'warning' : 'counting',
        elapsedMs,
        warnInMs: warned ? null : Math.max(0, config.warnAfterMs - elapsedMs),
        returnInMs: Math.max(0, config.returnAfterMs - elapsedMs),
      };
    },
  };
}
