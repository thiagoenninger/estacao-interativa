import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SessionReadout } from '@/app/SessionReadout';
import { ExperienceProvider, createSession, type Session } from '@/experience';
import { createFakeClock } from '@/test/experience/fake-clock';
import { makeCatalog } from '@/test/experience/world';

let session: Session | null = null;

function setup() {
  const clock = createFakeClock();
  session = createSession({ catalog: makeCatalog(), clock });
  render(
    <ExperienceProvider session={session}>
      <SessionReadout />
    </ExperienceProvider>,
  );
  return { clock, session };
}

afterEach(() => {
  session?.dispose();
  session = null;
});

describe('SessionReadout', () => {
  it('starts in the universe, with no object and no warning', () => {
    setup();
    expect(screen.getByTestId('session-readout').textContent).toBe(
      'sessão · nível universo · objeto — · aviso não',
    );
  });

  it('follows the level, the object and the warning', () => {
    const { clock, session } = setup();
    act(() => {
      session.dispatch({ type: 'select-object', objectId: 'bicycle' });
    });
    expect(screen.getByTestId('session-readout').textContent).toBe(
      'sessão · nível objeto · objeto bicycle · aviso não',
    );
    act(() => session.dispatch({ type: 'select-material', materialId: 'aluminium' }));
    expect(screen.getByTestId('session-readout').textContent).toContain('nível material');
    act(() => clock.advance(50_000));
    expect(screen.getByTestId('session-readout').textContent).toContain('aviso sim');
  });
});
