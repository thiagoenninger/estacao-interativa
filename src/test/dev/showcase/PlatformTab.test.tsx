import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PlatformTab } from '@/dev/showcase/PlatformTab';
import type { StationInfo } from '@/platform/station-info';

function setWindow(width: number, height: number, pixelRatio: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
  Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: pixelRatio });
}

const fact = (id: string) => screen.getByTestId(`platform-fact-${id}`).textContent;

const FOUR_K_AT_150: StationInfo = {
  mode: 'production',
  kiosk: true,
  cursorHidden: true,
  versions: { electron: '44.5.1', chrome: '152.0.7977.130', node: '24.21.0' },
  zoomFactor: 4 / 3,
  display: { width: 2560, height: 1440, scaleFactor: 1.5 },
};

describe('PlatformTab', () => {
  beforeEach(() => setWindow(1920, 1080, 1));
  afterEach(() => {
    delete window.station;
    setWindow(1024, 768, 1);
  });

  it('says it is an ordinary browser and shows the window and the Stage scale', () => {
    setWindow(960, 540, 1);
    render(<PlatformTab />);
    expect(fact('shell')).toContain('Navegador comum');
    expect(fact('window')).toBe('960 × 540');
    expect(fact('stage-scale')).toBe('0,500');
    expect(screen.queryByTestId('platform-fact-zoom')).toBeNull();
  });

  it('shows what the Electron shell reports, on a 4K screen at 150%', async () => {
    setWindow(1920, 1080, 2);
    window.station = { getInfo: () => Promise.resolve(FOUR_K_AT_150) };
    render(<PlatformTab />);

    expect(await screen.findByTestId('platform-fact-zoom')).toBeTruthy();
    expect(fact('shell')).toBe('Electron');
    expect(fact('versions')).toBe('Electron 44.5.1 · Chromium 152.0.7977.130 · Node 24.21.0');
    expect(fact('mode')).toBe('produção');
    expect(fact('kiosk')).toContain('sim');
    expect(fact('cursor')).toBe('escondido');
    expect(fact('display')).toBe('2560 × 1440');
    expect(fact('windows-scale')).toBe('150%');
    expect(fact('zoom')).toBe('1,333');
    expect(fact('window')).toBe('1920 × 1080');
    expect(fact('pixel-ratio')).toBe('2,000');
    expect(fact('physical')).toBe('3840 × 2160');
    expect(fact('stage-scale')).toBe('1,000');
  });

  it('shows the development mode and an ordinary window', async () => {
    window.station = {
      getInfo: () =>
        Promise.resolve({
          ...FOUR_K_AT_150,
          mode: 'development',
          kiosk: false,
          cursorHidden: false,
        }),
    };
    render(<PlatformTab />);
    await screen.findByTestId('platform-fact-mode');
    expect(fact('mode')).toBe('desenvolvimento');
    expect(fact('kiosk')).toContain('não');
    expect(fact('cursor')).toBe('visível');
  });

  it('asks the shell again when the window changes size', async () => {
    let calls = 0;
    window.station = {
      getInfo: () => {
        calls += 1;
        return Promise.resolve(FOUR_K_AT_150);
      },
    };
    render(<PlatformTab />);
    await screen.findByTestId('platform-fact-zoom');
    expect(calls).toBe(1);

    await act(async () => {
      setWindow(1280, 720, 1);
      window.dispatchEvent(new Event('resize'));
    });
    expect(calls).toBe(2);
    expect(fact('window')).toBe('1280 × 720');
  });

  it('tells when the shell does not answer', async () => {
    window.station = { getInfo: () => Promise.reject(new Error('no')) };
    render(<PlatformTab />);
    expect(await screen.findByTestId('platform-error')).toBeTruthy();
  });
});
