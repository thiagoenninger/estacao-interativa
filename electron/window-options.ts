import type { LaunchOptions } from './launch-options.ts';

/** `--color-background-secondary` (paper-200): the window color shown before the page paints. */
export const WINDOW_BACKGROUND = '#d9dbd3';

/** Size of the ordinary window used in development and with `--windowed`. */
export const WINDOWED_SIZE = { width: 1280, height: 720 } as const;

/** Hides the cursor on every element. Only inserted in kiosk mode (Foundations 03). */
export const HIDE_CURSOR_CSS = '*, *::before, *::after { cursor: none !important; }';

export function buildWindowOptions(launch: LaunchOptions, preloadPath: string) {
  return {
    ...WINDOWED_SIZE,
    show: false,
    title: 'Estação Interativa dos Objetos',
    backgroundColor: WINDOW_BACKGROUND,
    autoHideMenuBar: true,
    fullscreen: launch.kiosk,
    kiosk: launch.kiosk,
    frame: !launch.kiosk,
    resizable: !launch.kiosk,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      webviewTag: false,
      spellcheck: false,
      devTools: launch.devTools,
    },
  };
}
