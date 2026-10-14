import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExperienceTab } from '@/dev/showcase/ExperienceTab';
import { Showcase } from '@/dev/showcase/Showcase';

/** `detail: 0` is how a click without a mouse arrives: the base Button accepts it. */
const press = (name: string | RegExp) =>
  act(() => {
    fireEvent.click(screen.getByRole('button', { name }), { detail: 0 });
  });
const fact = (id: string) => screen.getByTestId(`experience-fact-${id}`).textContent;
const log = () =>
  screen.queryAllByTestId('experience-log-entry').map((entry) => entry.textContent ?? '');

describe('ExperienceTab', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance'],
    });
  });
  afterEach(() => vi.useRealTimers());

  it('is a tab of the showcase', () => {
    render(<Showcase />);
    fireEvent.click(screen.getByRole('tab', { name: 'Experiência' }), { detail: 0 });
    expect(screen.getByTestId('showcase-tab-experience')).toBeTruthy();
    expect(screen.getByTestId('experience-tab')).toBeTruthy();
  });

  it('starts in the universe with the idle timer off and an empty log', () => {
    render(<ExperienceTab />);
    expect(fact('level')).toBe('01 · Universo');
    expect(fact('object')).toBe('—');
    expect(fact('trail')).toBe('—');
    expect(screen.getByTestId('experience-idle-phase').textContent).toBe('desligado (universo)');
    expect(log()).toEqual([]);
    expect(screen.getByTestId('experience-accepted').textContent).toBe('Selecionar objeto');
  });

  it('walks the short journey and writes the log', () => {
    render(<ExperienceTab />);
    press('Bicicleta');
    expect(fact('level')).toBe('03 · Objeto selecionado');
    expect(fact('object')).toBe('Bicicleta');

    press('Alumínio');
    expect(fact('level')).toBe('04/05 · Material selecionado');
    expect(fact('material')).toBe('Alumínio');
    expect(fact('trail')).toBe('Bicicleta · Alumínio');
    expect(screen.getByTestId('experience-idle-phase').textContent).toBe('contando');
    expect(screen.getByTestId('experience-accepted').textContent).toContain('Início');

    press('Início');
    expect(fact('level')).toBe('01 · Universo');
    expect(screen.getByTestId('experience-idle-phase').textContent).toBe('desligado (universo)');
    expect(log()).toEqual([
      'Início' + 'aplicado · 01 · Universo',
      'Material: Alumínio' + 'aplicado · 04/05 · Material selecionado',
      'Objeto: Bicicleta' + 'aplicado · 03 · Objeto selecionado',
    ]);
  });

  it('shows that an event with no effect did nothing', () => {
    render(<ExperienceTab />);
    press('Voltar');
    press('Tocar no fundo');
    expect(fact('level')).toBe('01 · Universo');
    expect(log().every((line) => line.includes('sem efeito'))).toBe(true);
  });

  it('marks a disabled material and ignores it', () => {
    render(<ExperienceTab />);
    press('Notebook');
    press(/^Aço · sem conteúdo$/);
    expect(fact('level')).toBe('03 · Objeto selecionado');
    expect(log()[0]).toContain('sem efeito');
  });

  it('with everything open, a related object keeps the material and extends the trail', () => {
    render(<ExperienceTab />);
    press('Tudo aberto (demonstração)');
    press('Bicicleta');
    press('Alumínio');
    press('De onde vem?');
    expect(fact('level')).toBe('Camada aprofundada');
    expect(fact('layer')).toBe('origin');

    press('Relacionado: Lata');
    expect(fact('level')).toBe('04/05 · Material selecionado');
    expect(fact('object')).toBe('Lata');
    expect(fact('material')).toBe('Alumínio');
    expect(fact('trail')).toBe('Bicicleta · Alumínio · Lata');
  });

  it('with the real content, a layer "EM BREVE" and a related object without content do nothing', () => {
    render(<ExperienceTab />);
    press('Bicicleta');
    press('Alumínio');
    press(/Como é produzido\? · EM BREVE/);
    expect(fact('level')).toBe('04/05 · Material selecionado');
    press('De onde vem?');
    press(/Relacionado: Lata · sem este material/);
    expect(fact('level')).toBe('Camada aprofundada');
  });

  it('highlights an item of "Presente em" and clears it with the same item', () => {
    render(<ExperienceTab />);
    press('Bicicleta');
    press('Alumínio');
    press(/^02 /);
    expect(fact('present')).toBe('02');
    press(/^02 /);
    expect(fact('present')).toBe('—');
  });

  it('changing the content starts a new visit with an empty log', () => {
    render(<ExperienceTab />);
    press('Bicicleta');
    press('Tudo aberto (demonstração)');
    expect(fact('level')).toBe('01 · Universo');
    expect(log()).toEqual([]);
  });

  it('the idle timer warns and returns, and the speed makes it quick', () => {
    render(<ExperienceTab />);
    press('60×');
    expect(screen.getByRole('button', { name: '60×' }).getAttribute('aria-pressed')).toBe('true');
    press('Bicicleta');
    press('Alumínio');

    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(fact('warning')).toBe('na tela');
    expect(screen.getByTestId('experience-idle-phase').textContent).toBe('aviso na tela');
    expect(log()[0]).toContain('Aviso de retorno (50 s)');

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(fact('level')).toBe('01 · Universo');
    expect(fact('warning')).toBe('não');
    expect(log()[0]).toContain('Retorno automático (60 s)');
  });

  it('a touch on the warning keeps the state and restarts the count', () => {
    render(<ExperienceTab />);
    press('60×');
    press('Bicicleta');
    press('Alumínio');
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(fact('warning')).toBe('na tela');
    press('Tocar no aviso');
    expect(fact('warning')).toBe('não');
    expect(fact('level')).toBe('04/05 · Material selecionado');
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(fact('warning')).toBe('não');
  });

  it('shows the countdown in seconds', () => {
    render(<ExperienceTab />);
    press('Bicicleta');
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByTestId('experience-idle-elapsed').textContent).toBe('10,0 s');
    expect(screen.getByTestId('experience-idle-warn').textContent).toBe('40,0 s');
    expect(screen.getByTestId('experience-idle-return').textContent).toBe('50,0 s');
  });

  it('the log keeps the newest entry first and no more than 40', () => {
    render(<ExperienceTab />);
    for (let i = 0; i < 45; i += 1) press('Tocar no fundo');
    const entries = within(screen.getByTestId('experience-log')).getAllByTestId(
      'experience-log-entry',
    );
    expect(entries).toHaveLength(40);
  });
});
