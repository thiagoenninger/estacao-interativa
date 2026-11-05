import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { loadContent } from '@/content';
import { ExperienceProvider, createCatalog, createSession, type Session } from '@/experience';
import { createFakeClock } from '@/test/experience/fake-clock';
import { Universe } from '@/universe/Universe';

const index = loadContent().index!;
const inside = { pointerId: 1, clientX: 0, clientY: 0 };

let session: Session | null = null;

function setup() {
  const clock = createFakeClock();
  session = createSession({ catalog: createCatalog(index), clock });
  render(
    <ExperienceProvider session={session}>
      <Universe index={index} />
    </ExperienceProvider>,
  );
  return { clock, session };
}

function tap(name: string) {
  const button = screen.getByRole('button', { name });
  fireEvent.pointerDown(button, inside);
  fireEvent.pointerUp(button, inside);
}

afterEach(() => {
  session?.dispose();
  session = null;
});

describe('Universe: the screen', () => {
  it('is the main region, with the call and the 8 objects', () => {
    setup();
    const region = screen.getByRole('main', { name: 'Universo de objetos' });
    expect(within(region).getByTestId('main-prompt')).toBeTruthy();
    expect(within(region).getAllByTestId('universe-object')).toHaveLength(8);
    expect(within(region).getAllByRole('button')).toHaveLength(8);
  });

  it('shows every object by its name, in the order of the content', () => {
    setup();
    const names = screen
      .getAllByTestId('universe-object')
      .map((root) => root.getAttribute('data-object'));
    expect(names).toEqual(index.listObjects().map((item) => item.id));
  });

  it('puts the objects on the three planes', () => {
    setup();
    const count = (plane: string) =>
      screen
        .getAllByTestId('universe-object')
        .filter((root) => root.getAttribute('data-plane') === plane).length;
    expect([count('near'), count('mid'), count('far')]).toEqual([2, 2, 4]);
  });

  it('shows nothing faded in the universe', () => {
    setup();
    for (const root of screen.getAllByTestId('universe-object')) {
      expect(root.getAttribute('data-state')).toBe('default');
    }
  });
});

describe('Universe: touch', () => {
  it('selects the object the visitor touched, on the real session', () => {
    const { session } = setup();
    tap('Bicicleta');
    const state = session.store.getState();
    expect(state.level).toBe('object');
    expect(state.objectId).toBe('bicycle');
    expect(state.trail).toEqual([{ kind: 'object', id: 'bicycle' }]);
  });

  it('does not select anything while the finger is still down', () => {
    const { session } = setup();
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Notebook' }), inside);
    expect(session.store.getState().level).toBe('universe');
  });

  it('changes the protagonist when another object is touched', () => {
    const { session } = setup();
    tap('Bicicleta');
    tap('Lata');
    expect(session.store.getState().objectId).toBe('can');
  });

  it('leaves the screen as it is: the selection animation arrives with Etapa 13', () => {
    setup();
    tap('Bicicleta');
    expect(screen.getAllByTestId('universe-object')).toHaveLength(8);
    expect(screen.getByTestId('main-prompt')).toBeTruthy();
  });

  it('starts counting the idle time once an object is selected', () => {
    const { clock, session } = setup();
    tap('Bicicleta');
    act(() => clock.advance(50_000));
    expect(session.store.getState().warning).toBe(true);
    act(() => clock.advance(10_000));
    expect(session.store.getState().level).toBe('universe');
  });
});
