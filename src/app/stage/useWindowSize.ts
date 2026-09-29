import { useSyncExternalStore } from 'react';

export interface WindowSize {
  width: number;
  height: number;
}

let last: WindowSize = { width: window.innerWidth, height: window.innerHeight };

function subscribe(onChange: () => void): () => void {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
}

// Always return the same object while the size does not change
function readSize(): WindowSize {
  if (last.width !== window.innerWidth || last.height !== window.innerHeight) {
    last = { width: window.innerHeight, height: window.innerHeight };
  }
  return last;
}

export function useWindowSize(): WindowSize {
  return useSyncExternalStore(subscribe, readSize);
}
