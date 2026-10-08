import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { app, BrowserWindow, ipcMain, Menu, net, protocol, screen, session } from 'electron';
import type { StationInfo } from '../src/platform/station-info.ts';
import { parseLaunchOptions } from './launch-options.ts';
import {
  APP_HOST,
  APP_ORIGIN,
  APP_SCHEME,
  CONTENT_SECURITY_POLICY,
  isSameOrigin,
  normalizeAppPath,
} from './security.ts';
import { buildWindowOptions, HIDE_CURSOR_CSS } from './window-options.ts';
import { chooseZoomFactor } from './zoom.ts';

const launch = parseLaunchOptions(process.argv, process.env, app.isPackaged);
/** The only address the page may be on: the dev server, or the app protocol. */
const pageOrigin = launch.rendererUrl ?? APP_ORIGIN;
const distRoot = path.join(app.getAppPath(), 'dist');
const preloadPath = path.join(import.meta.dirname, 'preload.cjs');

// Both calls have to happen before the app is ready.
protocol.registerSchemesAsPrivileged([
  { scheme: APP_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);
app.enableSandbox();

/** Serves `dist/` under app://station/, refusing anything outside that folder. */
async function serveApp(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const relative = url.host === APP_HOST ? normalizeAppPath(url.pathname) : null;
  if (!relative) return new Response('Not found', { status: 404 });

  const file = path.join(distRoot, relative);
  const fromRoot = path.relative(distRoot, file);
  if (fromRoot.startsWith('..') || path.isAbsolute(fromRoot)) {
    return new Response('Forbidden', { status: 403 });
  }
  try {
    const response = await net.fetch(pathToFileURL(file).toString());
    const headers = new Headers(response.headers);
    headers.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
    return new Response(response.body, { status: response.status, headers });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

/** The screen the window is on, in device-independent pixels. */
function screenOf(win: BrowserWindow) {
  return screen.getDisplayMatching(win.getBounds());
}

function applyZoom(win: BrowserWindow) {
  win.webContents.setZoomFactor(chooseZoomFactor(launch.kiosk, screenOf(win).bounds));
}

function createWindow() {
  const win = new BrowserWindow(buildWindowOptions(launch, preloadPath));
  // Pinch and Ctrl + wheel never change the zoom: only the shell does.
  void win.webContents.setVisualZoomLevelLimits(1, 1);

  win.once('ready-to-show', () => win.show());
  win.webContents.on('did-finish-load', () => {
    applyZoom(win);
    if (launch.hideCursor) void win.webContents.insertCSS(HIDE_CURSOR_CSS);
  });
  win.on('enter-full-screen', () => applyZoom(win));

  if (launch.devTools) {
    // The window has no menu, so F12 and Ctrl+Shift+I are handled here.
    win.webContents.on('before-input-event', (event, input) => {
      const isToggle =
        input.type === 'keyDown' &&
        (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i'));
      if (isToggle) {
        event.preventDefault();
        win.webContents.toggleDevTools();
      }
    });
  }

  void win.loadURL(`${pageOrigin}/${launch.query}`);
}

function registerStationInfo() {
  ipcMain.handle('station:info', (event): StationInfo => {
    // Only the app's own page may ask; a frame from anywhere else gets an error.
    if (!isSameOrigin(event.senderFrame?.url ?? '', pageOrigin)) {
      throw new Error('Untrusted sender');
    }
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) throw new Error('No window');
    const display = screenOf(win);
    return {
      mode: launch.mode,
      kiosk: launch.kiosk,
      cursorHidden: launch.hideCursor,
      versions: {
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node,
      },
      zoomFactor: win.webContents.getZoomFactor(),
      display: {
        width: display.bounds.width,
        height: display.bounds.height,
        scaleFactor: display.scaleFactor,
      },
    };
  });
}

if (!app.requestSingleInstanceLock()) {
  // A station runs one copy only: the second start gives up and the first one comes forward.
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });

  // Rules for every page the app ever opens.
  app.on('web-contents-created', (_event, contents) => {
    contents.setWindowOpenHandler(() => ({ action: 'deny' }));
    contents.on('will-navigate', (event) => {
      if (!isSameOrigin(event.url, pageOrigin)) event.preventDefault();
    });
    contents.on('will-redirect', (event) => {
      if (!isSameOrigin(event.url, pageOrigin)) event.preventDefault();
    });
    contents.on('will-attach-webview', (event) => event.preventDefault());
  });

  app.on('window-all-closed', () => app.quit());

  void app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    // No camera, microphone, location, notifications… the experience asks for nothing.
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) =>
      callback(false),
    );
    session.defaultSession.setPermissionCheckHandler(() => false);
    if (!launch.rendererUrl) protocol.handle(APP_SCHEME, serveApp);
    registerStationInfo();
    createWindow();
    screen.on('display-metrics-changed', () => {
      for (const win of BrowserWindow.getAllWindows()) applyZoom(win);
    });
  });
}
