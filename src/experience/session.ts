import type { Catalog } from './catalog.ts';
import { createSystemClock, type Clock } from './clock.ts';
import type { UserEvent } from './events.ts';
import { createIdleService, type IdleConfig, type IdleService } from './idle.ts';
import { createExperienceStore, type ExperienceStoreApi } from './store.ts';

export interface SessionOptions {
  catalog: Catalog;
  clock?: Clock;
  idle?: IdleConfig;
}

export interface Session {
  readonly store: ExperienceStoreApi;
  readonly idle: IdleService;
  dispatch(event: UserEvent): boolean;
  touch(): void;
  dispose(): void;
}

export function createSession(options: SessionOptions): Session {
  const { catalog, clock = createSystemClock(), idle: idleConfig } = options;
  const store = createExperienceStore(catalog);

  const idle = createIdleService({
    clock,
    config: idleConfig,
    isAway: () => store.getState().level !== 'universe',
    onWarn: () => store.getState().dispatch({ type: 'idle-warn' }),
    onReturn: () => store.getState().dispatch({ type: 'idle-return' }),
  });

  store.subscribe(() => idle.sync());

  return {
    store,
    idle,
    dispatch(event) {
      const changed = store.getState().dispatch(event);
      idle.restart();
      return changed;
    },
    touch: () => idle.restart(),
    dispose: () => idle.stop(),
  };
}
