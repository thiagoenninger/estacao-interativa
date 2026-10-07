import { describe, expect, it } from 'vitest';
import colorCss from '@/design-system/tokens/color.css?raw';
import { parseLaunchOptions } from '@electron/launch-options.ts';
import {
  buildWindowOptions,
  HIDE_CURSOR_CSS,
  WINDOW_BACKGROUND,
  WINDOWED_SIZE,
} from '@electron/window-options.ts';

const PRELOAD = 'C:/app/electron/preload.cjs';
const kiosk = parseLaunchOptions([], {}, false);
const windowed = parseLaunchOptions([], { ELECTRON_RENDERER_URL: 'http://localhost:5173' }, false);

describe('buildWindowOptions · security baseline', () => {
  for (const [name, launch] of [
    ['kiosk', kiosk],
    ['windowed', windowed],
  ] as const) {
    it(`gives the page no Node.js and keeps the sandbox (${name})`, () => {
      const { webPreferences } = buildWindowOptions(launch, PRELOAD);
      expect(webPreferences).toMatchObject({
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        webviewTag: false,
        preload: PRELOAD,
      });
    });
  }

  it('allows the DevTools only when the launch options say so', () => {
    expect(buildWindowOptions(kiosk, PRELOAD).webPreferences.devTools).toBe(false);
    expect(buildWindowOptions(windowed, PRELOAD).webPreferences.devTools).toBe(true);
  });
});

describe('buildWindowOptions · window', () => {
  it('is full screen, without frame and fixed in kiosk mode', () => {
    expect(buildWindowOptions(kiosk, PRELOAD)).toMatchObject({
      fullscreen: true,
      kiosk: true,
      frame: false,
      resizable: false,
      show: false,
    });
  });

  it('is an ordinary resizable window of 1280 × 720 otherwise', () => {
    expect(buildWindowOptions(windowed, PRELOAD)).toMatchObject({
      ...WINDOWED_SIZE,
      fullscreen: false,
      kiosk: false,
      frame: true,
      resizable: true,
    });
    expect(WINDOWED_SIZE).toEqual({ width: 1280, height: 720 });
  });

  it('opens hidden, in the Design System background color, to avoid a white flash', () => {
    const options = buildWindowOptions(kiosk, PRELOAD);
    expect(options.backgroundColor).toBe(WINDOW_BACKGROUND);
    // The same color as --color-background-secondary, which is paper-200.
    expect(colorCss).toContain('--color-background-secondary: var(--paper-200);');
    expect(colorCss).toContain(`--paper-200: ${WINDOW_BACKGROUND};`);
  });
});

describe('HIDE_CURSOR_CSS', () => {
  it('hides the cursor everywhere, even where a rule sets its own', () => {
    expect(HIDE_CURSOR_CSS).toContain('cursor: none !important');
    expect(HIDE_CURSOR_CSS).toContain('*');
  });
});
