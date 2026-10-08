import { describe, expect, it } from 'vitest';
import { parseLaunchOptions } from '@electron/launch-options.ts';

const DEV_URL = 'http://localhost:5173/';

describe('parseLaunchOptions', () => {
  it('starts in production kiosk mode by default', () => {
    expect(parseLaunchOptions(['electron', '.'], {}, false)).toEqual({
      mode: 'production',
      rendererUrl: null,
      kiosk: true,
      hideCursor: true,
      devTools: false,
      query: '',
    });
  });

  it('uses the dev server, in an ordinary window with DevTools, when the address is set', () => {
    expect(
      parseLaunchOptions(['electron', '.'], { ELECTRON_RENDERER_URL: DEV_URL }, false),
    ).toEqual({
      mode: 'development',
      rendererUrl: 'http://localhost:5173',
      kiosk: false,
      hideCursor: false,
      devTools: true,
      query: '',
    });
  });

  it('accepts the other names of this computer', () => {
    for (const url of ['http://127.0.0.1:5199/', 'http://[::1]:5173/']) {
      const options = parseLaunchOptions([], { ELECTRON_RENDERER_URL: url }, false);
      expect(options.mode).toBe('development');
    }
  });

  it('ignores an address that is not on this computer', () => {
    for (const url of [
      'http://example.com/',
      'https://localhost:5173/',
      'file:///etc/passwd',
      'x',
    ]) {
      const options = parseLaunchOptions([], { ELECTRON_RENDERER_URL: url }, false);
      expect(options.mode).toBe('production');
      expect(options.rendererUrl).toBeNull();
    }
  });

  it('opens the production build in an ordinary window with --windowed', () => {
    const options = parseLaunchOptions(['electron', '.', '--windowed'], {}, false);
    expect(options).toMatchObject({ mode: 'production', kiosk: false, devTools: false });
  });

  it('hides the cursor in kiosk mode, unless --cursor asks to keep it', () => {
    expect(parseLaunchOptions([], {}, false).hideCursor).toBe(true);
    expect(parseLaunchOptions(['--cursor'], {}, false)).toMatchObject({
      kiosk: true,
      hideCursor: false,
    });
  });

  it('has no cursor to hide in an ordinary window', () => {
    expect(parseLaunchOptions(['--windowed'], {}, false).hideCursor).toBe(false);
    expect(parseLaunchOptions([], { ELECTRON_RENDERER_URL: DEV_URL }, false).hideCursor).toBe(
      false,
    );
  });

  it('an installed app always hides the cursor, even with --cursor', () => {
    expect(parseLaunchOptions(['--cursor'], {}, true).hideCursor).toBe(true);
  });

  it('allows the DevTools in production only with --devtools', () => {
    expect(parseLaunchOptions(['--devtools'], {}, false).devTools).toBe(true);
    expect(parseLaunchOptions([], {}, false).devTools).toBe(false);
  });

  it('never leaves kiosk mode for the dev server alone, only because of --windowed', () => {
    // In development the window is always ordinary, whatever the arguments are.
    expect(parseLaunchOptions([], { ELECTRON_RENDERER_URL: DEV_URL }, false).kiosk).toBe(false);
  });

  it('an installed app ignores the dev server address and the DevTools flag', () => {
    const options = parseLaunchOptions(['--devtools'], { ELECTRON_RENDERER_URL: DEV_URL }, true);
    expect(options).toEqual({
      mode: 'production',
      rendererUrl: null,
      kiosk: true,
      hideCursor: true,
      devTools: false,
      query: '',
    });
  });

  it('opens the development tools through the address of the page', () => {
    expect(parseLaunchOptions(['--showcase'], {}, false).query).toBe('?showcase');
    expect(parseLaunchOptions(['--grid'], {}, false).query).toBe('?grid');
    expect(parseLaunchOptions(['--grid', '--showcase'], {}, false).query).toBe('?showcase&grid');
    expect(
      parseLaunchOptions(['--showcase'], { ELECTRON_RENDERER_URL: DEV_URL }, false).query,
    ).toBe('?showcase');
  });

  it('an installed app never opens the development tools', () => {
    expect(parseLaunchOptions(['--showcase', '--grid'], {}, true).query).toBe('');
  });
});
