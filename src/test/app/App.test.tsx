import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '@/app/App';

function setWindowSize(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
}

describe('App · Stage', () => {
  beforeEach(() => {
    setWindowSize(1920, 1080);
    window.history.pushState({}, '', '/');
  });

  it('renders the Stage with scale 1 at Full HD', () => {
    render(<App />);
    expect(screen.getByTestId('stage').style.transform).toBe('translate(0px, 0px) scale(1)');
  });

  it('rescales the Stage when the window size changes', () => {
    render(<App />);
    act(() => {
      setWindowSize(960, 540);
      window.dispatchEvent(new Event('resize'));
    });
    expect(screen.getByTestId('stage').style.transform).toBe('translate(0px, 0px) scale(0.5)');
  });

  it('the debug grid starts hidden and toggles with the G key', () => {
    render(<App />);
    expect(screen.queryByTestId('debug-grid')).toBeNull();

    fireEvent.keyDown(window, { key: 'g' });
    expect(screen.getByTestId('debug-grid')).toBeTruthy();
    expect(screen.getByTestId('stage-diagnostics').textContent).toContain('scale 1.000');

    fireEvent.keyDown(window, { key: 'G' });
    expect(screen.queryByTestId('debug-grid')).toBeNull();
  });

  it('the grid opens right away with ?grid in the URL', () => {
    window.history.pushState({}, '', '/?grid');
    render(<App />);
    expect(screen.getByTestId('debug-grid')).toBeTruthy();
  });

  it('draws the background behind everything', () => {
    render(<App />);
    expect(screen.getByTestId('stage').firstElementChild).toBe(screen.getByTestId('background'));
  });

  it('does not load the showcase without ?showcase', () => {
    render(<App />);
    expect(screen.queryByTestId('showcase')).toBeNull();
  });
});

describe('App · Showcase', () => {
  beforeEach(() => {
    setWindowSize(1920, 1080);
    window.history.pushState({}, '', '/?showcase');
  });

  it('opens the showcase with ?showcase, on the Colors tab', async () => {
    render(<App />);
    expect(await screen.findByTestId('showcase')).toBeTruthy();
    expect(screen.getByTestId('showcase-tab-colors')).toBeTruthy();
    expect(screen.getAllByTestId('primitive-swatch')).toHaveLength(11);
    expect(screen.getAllByTestId('semantic-token')).toHaveLength(22);
  });

  it('switches tabs with the base buttons', async () => {
    render(<App />);
    await screen.findByTestId('showcase');
    const tab = (name: string) => screen.getByRole('tab', { name });

    fireEvent.click(tab('Tipografia'), { detail: 0 });
    expect(screen.getByTestId('showcase-tab-typography')).toBeTruthy();
    expect(screen.getAllByTestId('type-sample')).toHaveLength(12);

    fireEvent.click(tab('Ícones'), { detail: 0 });
    expect(screen.getAllByTestId('icon-cell')).toHaveLength(12);

    fireEvent.click(tab('Botões'), { detail: 0 });
    expect(screen.getByTestId('press-counter').textContent).toContain('0');

    fireEvent.click(tab('Fundo'), { detail: 0 });
    expect(screen.getByTestId('background-legend')).toBeTruthy();
    expect(tab('Fundo').getAttribute('aria-selected')).toBe('true');
  });

  it('shows the validated content on the Content tab', async () => {
    render(<App />);
    await screen.findByTestId('showcase');
    fireEvent.click(screen.getByRole('tab', { name: 'Conteúdo' }), { detail: 0 });

    expect(screen.getByTestId('showcase-tab-content')).toBeTruthy();
    expect(screen.getByTestId('content-summary').textContent).toContain('0 erros');

    // The bicycle opens first: three enabled materials and a complete sheet.
    const nodes = screen.getAllByTestId('orbit-node');
    expect(nodes.map((node) => node.getAttribute('data-state'))).toEqual([
      'enabled',
      'enabled',
      'enabled',
    ]);
    expect(screen.getByTestId('content-sheet').textContent).toContain('2,70 g/cm³');
    expect(screen.getAllByTestId('sheet-layer')[0]?.getAttribute('data-status')).toBe('available');

    // The car has only draft sheets, so every node is disabled.
    fireEvent.click(screen.getByRole('button', { name: 'Automóvel' }), { detail: 0 });
    const carNodes = screen.getAllByTestId('orbit-node');
    expect(carNodes.every((node) => node.getAttribute('data-state') === 'disabled')).toBe(true);
  });

  it('shows the object drawings on the Objects tab', async () => {
    render(<App />);
    await screen.findByTestId('showcase');
    fireEvent.click(screen.getByRole('tab', { name: 'Objetos' }), { detail: 0 });

    expect(screen.getByTestId('showcase-tab-objects')).toBeTruthy();
    expect(screen.getByTestId('object-audit').textContent).toContain('0 erros · 0 avisos');

    // The bicycle opens first, selected and with no material.
    const main = within(screen.getByTestId('object-main'));
    const bicycle = main.getByRole('img', { name: 'Bicicleta' });
    expect(bicycle.getAttribute('data-view')).toBe('selected');

    // Copper: the headlight, which lives inside, appears and the frame recedes.
    fireEvent.click(screen.getByRole('button', { name: 'Cobre' }), { detail: 0 });
    expect(bicycle.querySelector('[data-group="headlight"]')?.getAttribute('data-visible')).toBe(
      'true',
    );
    expect(bicycle.querySelector('[data-group="frame"]')?.getAttribute('data-state')).toBe(
      'recede',
    );

    // Another object starts again with no material.
    fireEvent.click(screen.getByRole('button', { name: 'Lata' }), { detail: 0 });
    expect(main.getByRole('img', { name: 'Lata' }).getAttribute('data-material')).toBeNull();
  });

  it('shows the platform on the Platform tab', async () => {
    render(<App />);
    await screen.findByTestId('showcase');
    fireEvent.click(screen.getByRole('tab', { name: 'Plataforma' }), { detail: 0 });

    expect(screen.getByTestId('showcase-tab-platform')).toBeTruthy();
    expect(screen.getByTestId('platform-fact-shell').textContent).toContain('Navegador comum');
  });

  it('counts only the touches that end inside the button', async () => {
    render(<App />);
    await screen.findByTestId('showcase');
    fireEvent.click(screen.getByRole('tab', { name: 'Botões' }), { detail: 0 });
    const button = screen.getByRole('button', { name: /tocar aqui/i });
    fireEvent.pointerDown(button, { pointerId: 1, clientX: 0, clientY: 0 });
    fireEvent.pointerUp(button, { pointerId: 1, clientX: 0, clientY: 0 });
    fireEvent.pointerDown(button, { pointerId: 2, clientX: 0, clientY: 0 });
    fireEvent.pointerUp(button, { pointerId: 2, clientX: 900, clientY: 900 });
    expect(screen.getByTestId('press-counter').textContent).toContain('1');
  });
});
