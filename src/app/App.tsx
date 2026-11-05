import { lazy, Suspense, useEffect, useState } from 'react';
import { DebugGrid } from './stage/DebugGrid';
import { Stage } from './stage/Stage';
import { SessionReadout } from './SessionReadout';
import { loadContent } from '../content/index.ts';
import { Background } from '../design-system/background/Background';
import { createCatalog, createSession, ExperienceProvider } from '../experience/index.ts';
import { Universe } from '../universe/index.ts';
import './app.css';

const Showcase = lazy(() =>
  import('../dev/showcase/Showcase').then((module) => ({ default: module.Showcase })),
);

function hasUrlFlag(name: string): boolean {
  return new URLSearchParams(window.location.search).has(name);
}

export function App() {
  const [showGrid, setShowGrid] = useState(() => hasUrlFlag('grid'));
  const showShowcase = hasUrlFlag('showcase');
  const [station] = useState(() => {
    const { index } = loadContent();
    if (index === null) return null;
    return { index, session: createSession({ catalog: createCatalog(index) }) };
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'g' || event.key === 'G') setShowGrid((current) => !current);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (station === null) return undefined;
    const { session } = station;
    const restartIdle = () => session.touch();
    window.addEventListener('pointerdown', restartIdle, true);
    return () => {
      window.removeEventListener('pointerdown', restartIdle, true);
      session.dispose();
    };
  }, [station]);

  return (
    <Stage diagnostics={showGrid}>
      <Background />
      {showShowcase && (
        <Suspense fallback={null}>
          <Showcase />
        </Suspense>
      )}
      {!showShowcase && station === null && (
        <p className="station-error type-heading-3" data-testid="station-error">
          Não foi possível carregar o conteúdo.
        </p>
      )}
      {!showShowcase && station !== null && (
        <ExperienceProvider session={station.session}>
          <Universe index={station.index} />
          {showGrid && <SessionReadout />}
        </ExperienceProvider>
      )}
      {showGrid && <DebugGrid />}
    </Stage>
  );
}
