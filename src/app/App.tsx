import { lazy, Suspense, useEffect, useState } from 'react';
import { DebugGrid } from './stage/DebugGrid';
import { Stage } from './stage/Stage';
import { Background } from '../design-system/background/Background';

const Showcase = lazy(() =>
  import('../dev/showcase/Showcase').then((module) => ({ default: module.Showcase })),
);

function hasUrlFlag(name: string): boolean {
  return new URLSearchParams(window.location.search).has(name);
}

export function App() {
  const [showGrid, setShowGrid] = useState(() => hasUrlFlag('grid'));
  const showShowcase = hasUrlFlag('showcase');

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'g' || event.key === 'G') setShowGrid((current) => !current);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <Stage diagnostics={showGrid}>
      <Background />
      {showShowcase && (
        <Suspense fallback={null}>
          <Showcase />
        </Suspense>
      )}
      {showGrid && <DebugGrid />}
    </Stage>
  );
}
