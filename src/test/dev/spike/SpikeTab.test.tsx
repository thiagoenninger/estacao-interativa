import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MEASURE_MS, SCENES, WARMUP_MS } from '@/dev/spike/scenes';
import { SpikeTab } from '@/dev/spike/SpikeTab';
import type { StationInfo } from '@/platform/station-info';

function setWindow(width: number, height: number, pixelRatio: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
  Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: pixelRatio });
}

/** `detail: 0` is how a click without a mouse arrives: the base Button accepts it. */
const press = (element: HTMLElement) => fireEvent.click(element, { detail: 0 });
const text = (id: string) => screen.getByTestId(id).textContent;

/** A screen that only draws when the test says so. */
function fakeScreen() {
  let callback: ((time: number) => void) | null = null;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((next) => {
    callback = next;
    return 1;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {
    callback = null;
  });
  let clock = 0;
  return {
    /** Draws frames at 60 fps for `ms` milliseconds. */
    play(ms: number) {
      act(() => {
        const end = clock + ms;
        for (; clock <= end; clock += 1000 / 60) {
          const run = callback;
          callback = null;
          if (!run) return;
          run(clock);
        }
      });
    },
  };
}

const FOUR_K: StationInfo = {
  mode: 'production',
  kiosk: true,
  cursorHidden: true,
  versions: { electron: '44.5.1', chrome: '152.0.7977.130', node: '24.21.0' },
  zoomFactor: 2,
  display: { width: 3840, height: 2160, scaleFactor: 1 },
};

describe('SpikeTab', () => {
  beforeEach(() => setWindow(1920, 1080, 1));
  afterEach(() => {
    vi.restoreAllMocks();
    delete window.station;
    setWindow(1024, 768, 1);
  });

  it('lists the scenes, none measured yet', () => {
    render(<SpikeTab />);
    const rows = screen.getAllByTestId(/^scene-row-/);
    expect(rows).toHaveLength(SCENES.length);
    expect(rows.every((row) => row.textContent?.includes('—'))).toBe(true);
    expect(screen.queryByTestId('spike-stage')).toBeNull();
  });

  describe('the screen in test', () => {
    it('starts with 43 inches: 0.496 mm per pixel and a 32 mm minimum target', () => {
      render(<SpikeTab />);
      expect(text('spike-size')).toBe('952 × 535 mm');
      expect(text('spike-mm-per-px')).toBe('0,496 mm');
      expect(text('spike-targets-mm')).toBe('31,7 mm · 39,7 mm');
    });

    it('changes with the diagonal: on 55 inches the 64 px are 40 mm, as the DS says', () => {
      render(<SpikeTab />);
      press(screen.getByRole('button', { name: '55″' }));
      expect(text('spike-mm-per-px')).toBe('0,634 mm');
      expect(text('spike-targets-mm')).toBe('40,6 mm · 50,7 mm');
      expect(screen.getByRole('button', { name: '55″' }).getAttribute('aria-pressed')).toBe('true');
    });

    it('measures the load by the Stage: Full HD is 25% of the 4K panel', () => {
      render(<SpikeTab />);
      expect(text('spike-load')).toBe('1920 × 1080 · 25%');
    });

    it('a 4K screen at 150% is 100%', () => {
      setWindow(2560, 1440, 1.5);
      render(<SpikeTab />);
      expect(text('spike-load')).toBe('3840 × 2160 · 100%');
    });

    it('says the graphics chip is unavailable where there is no WebGL', () => {
      render(<SpikeTab />);
      expect(text('spike-gpu')).toBe('indisponível');
    });
  });

  describe('touch', () => {
    const pad = () => screen.getByTestId('touch-pad');
    const down = (id: number, x = 10, y = 10) =>
      fireEvent.pointerDown(pad(), { pointerId: id, pointerType: 'touch', clientX: x, clientY: y });

    it('counts the first finger and ignores the second', () => {
      render(<SpikeTab />);
      down(1);
      down(2, 50, 50);
      expect(text('touch-counts')).toBe('1 / 1');
      expect(text('touch-max')).toBe('2');
      expect(pad().querySelectorAll('.spike-finger')).toHaveLength(2);
      expect(pad().querySelectorAll('.spike-finger[data-primary="true"]')).toHaveLength(1);
    });

    it('records the pointer type and the drift of the finger', () => {
      render(<SpikeTab />);
      down(1, 0, 0);
      fireEvent.pointerMove(pad(), { pointerId: 1, pointerType: 'touch', clientX: 3, clientY: 4 });
      fireEvent.pointerUp(pad(), { pointerId: 1, pointerType: 'touch', clientX: 3, clientY: 4 });
      expect(text('touch-travel')).toBe('5,0 px · touch');
      expect(pad().querySelectorAll('.spike-finger')).toHaveLength(0);
    });

    it('a target tap shows how far from the center it landed, in millimeters', () => {
      render(<SpikeTab />);
      // No layout in the test: the square has size 0 and the scale is 1, so the offset is the point.
      fireEvent.pointerDown(screen.getByTestId('target-64'), { clientX: 3, clientY: 4 });
      expect(text('target-hits-64')).toBe('1/1');
      expect(text('target-error-64')).toBe('2,5 · 2,5 mm');
      expect(text('target-hits-32')).toBe('0/0');
    });

    it('resets the touches and the targets together', () => {
      render(<SpikeTab />);
      down(1);
      fireEvent.pointerDown(screen.getByTestId('target-64'), { clientX: 3, clientY: 4 });
      press(screen.getByRole('button', { name: 'Zerar toques e alvos' }));
      expect(text('touch-counts')).toBe('0 / 0');
      expect(text('target-hits-64')).toBe('0/0');
    });
  });

  describe('a measurement', () => {
    const SCENE_MS = WARMUP_MS + MEASURE_MS;

    it('puts the scene on the whole Stage with the counter and the stop button', () => {
      fakeScreen();
      render(<SpikeTab />);
      press(screen.getByRole('button', { name: 'Espera (M08)' }));
      expect(screen.getByTestId('spike-stage').getAttribute('data-scene')).toBe('idle');
      expect(text('spike-hud')).toContain('1/1 · Espera (M08)');
      expect(
        within(screen.getByTestId('spike-hud')).getByRole('button', { name: 'Parar' }),
      ).toBeTruthy();
      // The other scene buttons cannot start a second run.
      expect(
        screen.getByRole('button', { name: 'Objeto selecionado' }).hasAttribute('disabled'),
      ).toBe(true);
    });

    it('fills the row of the scene when it ends and takes the stage away', () => {
      const screenOf = fakeScreen();
      render(<SpikeTab />);
      press(screen.getByRole('button', { name: 'Espera (M08)' }));
      screenOf.play(SCENE_MS + 100);
      expect(screen.queryByTestId('spike-stage')).toBeNull();
      expect(text('scene-row-idle')).toContain('60,0');
      expect(text('scene-row-idle')).toContain('bom');
    });

    it('a slow scene is marked bad', () => {
      let clock = 0;
      let callback: ((time: number) => void) | null = null;
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((next) => {
        callback = next;
        return 1;
      });
      render(<SpikeTab />);
      press(screen.getByRole('button', { name: 'M02 completa' }));
      act(() => {
        // 20 fps: a frame every 50 ms.
        for (; clock <= SCENE_MS + 200; clock += 50) {
          const run = callback;
          callback = null;
          if (!run) return;
          run(clock);
        }
      });
      expect(text('scene-row-m02')).toContain('ruim');
    });

    it('measure all starts at the first scene and counts them', () => {
      fakeScreen();
      render(<SpikeTab />);
      press(screen.getByRole('button', { name: /Medir todas/ }));
      expect(text('spike-hud')).toContain(`1/${SCENES.length} · Espera (M08)`);
    });

    it('the stop button ends the run and keeps nothing of the unfinished scene', () => {
      const screenOf = fakeScreen();
      render(<SpikeTab />);
      press(screen.getByRole('button', { name: 'Espera (M08)' }));
      screenOf.play(3000);
      press(within(screen.getByTestId('spike-hud')).getByRole('button', { name: 'Parar' }));
      expect(screen.queryByTestId('spike-stage')).toBeNull();
      expect(text('scene-row-idle')).toContain('—');
    });

    it('Esc also stops it', () => {
      fakeScreen();
      render(<SpikeTab />);
      press(screen.getByRole('button', { name: 'Espera (M08)' }));
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByTestId('spike-stage')).toBeNull();
    });

    it('leaving the tab in the middle of a run stops the frames', () => {
      fakeScreen();
      const { unmount } = render(<SpikeTab />);
      press(screen.getByRole('button', { name: 'Espera (M08)' }));
      unmount();
      expect(window.cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('the report', () => {
    const report = () => (screen.getByTestId('spike-report') as HTMLTextAreaElement).value;

    it('starts empty and cannot be copied', () => {
      render(<SpikeTab />);
      expect(report()).toBe('');
      expect(screen.getByRole('button', { name: 'Copiar' }).hasAttribute('disabled')).toBe(true);
    });

    it('carries the environment, the scenes that ran, the touch and the targets', () => {
      const screenOf = fakeScreen();
      render(<SpikeTab />);
      press(screen.getByRole('button', { name: 'Espera (M08)' }));
      screenOf.play(WARMUP_MS + MEASURE_MS + 100);
      fireEvent.pointerDown(screen.getByTestId('touch-pad'), {
        pointerId: 1,
        pointerType: 'touch',
      });
      press(screen.getByRole('button', { name: 'Gerar relatório' }));

      expect(report()).toContain('# Relatório do teste de desempenho');
      expect(report()).toContain('- Casca: Navegador comum');
      expect(report()).toContain('| Espera (M08) | 60,0 |');
      expect(report()).not.toContain('Objeto selecionado |');
      expect(report()).toContain('- Toques aceitos: 1');
      expect(report()).toContain('| 64 | 31,7 | 0 | 0 |');
    });

    it('uses the screen size chosen', () => {
      render(<SpikeTab />);
      press(screen.getByRole('button', { name: '55″' }));
      press(screen.getByRole('button', { name: 'Gerar relatório' }));
      expect(report()).toContain('55″ · 1.218 × 685 mm');
    });

    it('says what the Electron shell reports', async () => {
      window.station = { getInfo: () => Promise.resolve(FOUR_K) };
      render(<SpikeTab />);
      await act(async () => {
        await Promise.resolve();
      });
      press(screen.getByRole('button', { name: 'Gerar relatório' }));
      expect(report()).toContain('- Casca: Electron · Electron 44.5.1 · Chromium 152.0.7977.130');
      expect(report()).toContain('- Tela: 3840 × 2160 px do Windows · escala 100%');
    });

    it('copies the text to the clipboard', async () => {
      const writeText = vi.fn(() => Promise.resolve());
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
      render(<SpikeTab />);
      press(screen.getByRole('button', { name: 'Gerar relatório' }));
      press(screen.getByRole('button', { name: 'Copiar' }));
      expect(writeText).toHaveBeenCalledWith(report());
      await act(async () => {
        await Promise.resolve();
      });
      expect(text('spike-copy-status')).toBe('Relatório copiado.');
    });

    it('copies by selecting the text when the clipboard is not allowed (the Electron shell)', async () => {
      const writeText = vi.fn(() => Promise.reject(new DOMException('denied', 'NotAllowedError')));
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
      const execCommand = vi.fn(() => true);
      Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommand });
      render(<SpikeTab />);
      press(screen.getByRole('button', { name: 'Gerar relatório' }));
      press(screen.getByRole('button', { name: 'Copiar' }));
      await act(async () => {
        await Promise.resolve();
      });
      expect(execCommand).toHaveBeenCalledWith('copy');
      expect(document.activeElement).toBe(screen.getByTestId('spike-report'));
      expect(text('spike-copy-status')).toBe('Relatório copiado.');
    });

    it('says how to copy by hand when nothing works, and forgets it with a new report', async () => {
      const writeText = vi.fn(() => Promise.reject(new DOMException('denied', 'NotAllowedError')));
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
      Object.defineProperty(document, 'execCommand', { configurable: true, value: () => false });
      render(<SpikeTab />);
      press(screen.getByRole('button', { name: 'Gerar relatório' }));
      press(screen.getByRole('button', { name: 'Copiar' }));
      await act(async () => {
        await Promise.resolve();
      });
      expect(text('spike-copy-status')).toContain('Ctrl+A');
      press(screen.getByRole('button', { name: 'Gerar relatório' }));
      expect(text('spike-copy-status')).toBe('');
    });
  });
});
