import { useSyncExternalStore } from 'react';

export interface WindowSize {
  width: number;
  height: number;
}

function measure(): WindowSize {
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * The snapshot is replaced ONLY here, inside the resize handler. React calls `getSnapshot`
 * several times per render and requires the same result each time. Reading
 * `window.innerWidth` directly in `getSnapshot` breaks that during a real window drag,
 * because the size can change between two consecutive reads.
 */
let snapshot: WindowSize = measure();

function subscribe(onChange: () => void): () => void {
  function handleResize() {
    const next = measure();
    if (next.width === snapshot.width && next.height === snapshot.height) return;
    snapshot = next;
    onChange();
  }

  window.addEventListener('resize', handleResize);
  // The window may have changed between the module load and this subscription.
  handleResize();
  return () => window.removeEventListener('resize', handleResize);
}

function getSnapshot(): WindowSize {
  return snapshot;
}

export function useWindowSize(): WindowSize {
  return useSyncExternalStore(subscribe, getSnapshot);
}
