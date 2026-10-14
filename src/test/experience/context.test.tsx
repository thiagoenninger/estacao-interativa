import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExperienceProvider, createSession, useExperience, useSession } from '@/experience';
import { createFakeClock } from './fake-clock.ts';
import { catalog, selectMaterial, selectObject } from './world.ts';

function setup() {
  return createSession({ catalog, clock: createFakeClock() });
}

describe('React bindings', () => {
  it('a component reads the state it selects', () => {
    const session = setup();
    function Level() {
      return <p data-testid="level">{useExperience((state) => state.level)}</p>;
    }
    render(
      <ExperienceProvider session={session}>
        <Level />
      </ExperienceProvider>,
    );
    expect(screen.getByTestId('level').textContent).toBe('universe');

    act(() => {
      session.dispatch(selectObject('bicycle'));
    });
    expect(screen.getByTestId('level').textContent).toBe('object');
  });

  it('a component renders again only when its own piece changes', () => {
    const session = setup();
    const renders = vi.fn();
    function ObjectName() {
      const objectId = useExperience((state) => state.objectId);
      renders();
      return <p data-testid="object">{objectId}</p>;
    }
    render(
      <ExperienceProvider session={session}>
        <ObjectName />
      </ExperienceProvider>,
    );
    act(() => {
      session.dispatch(selectObject('bicycle'));
    });
    const afterObject = renders.mock.calls.length;
    act(() => {
      session.dispatch(selectMaterial('aluminium'));
      session.dispatch(selectMaterial('steel'));
    });
    expect(renders.mock.calls.length).toBe(afterObject);
    expect(screen.getByTestId('object').textContent).toBe('bicycle');
  });

  it('a component can send events through the session', () => {
    const session = setup();
    function Controls() {
      const current = useSession();
      return (
        <button type="button" onClick={() => current.dispatch(selectObject('can'))}>
          open
        </button>
      );
    }
    render(
      <ExperienceProvider session={session}>
        <Controls />
      </ExperienceProvider>,
    );
    act(() => screen.getByRole('button', { name: 'open' }).click());
    expect(session.store.getState().objectId).toBe('can');
  });

  it('refuses to work without a provider', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Orphan() {
      useSession();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow('ExperienceProvider');
    error.mockRestore();
  });
});
