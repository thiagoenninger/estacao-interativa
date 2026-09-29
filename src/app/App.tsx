import { useEffect, useState } from 'react';
import { DebugGrid } from './stage/DebugGrid';
import { Stage } from './stage/Stage';

function isGridInUrl(): boolean {
  return new URLSearchParams(window.location.search).has('grid');
}

export function App() {
  const [showGrid, setShowGrid] = useState(isGridInUrl);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'g' || event.key === 'G') setShowGrid((current) => !current);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return <Stage diagnostics={showGrid}>{showGrid && <DebugGrid />}</Stage>;
}
