import type { ContentIndex } from '../content/index.ts';
import { useSession } from '../experience/index.ts';
import { MainPrompt } from './MainPrompt';
import { UNIVERSE_TEXT } from './texts.ts';
import { UniverseObject } from './UniverseObject';
import './universe.css';

interface UniverseProps {
  index: ContentIndex;
}

export function Universe({ index }: UniverseProps) {
  const session = useSession();

  return (
    <main className="universe" data-testid="universe" aria-label={UNIVERSE_TEXT.region}>
      <MainPrompt />
      {index.listObjects().map((item) => (
        <UniverseObject
          key={item.id}
          item={item}
          onSelect={(objectId) => session.dispatch({ type: 'select-object', objectId })}
        />
      ))}
    </main>
  );
}
