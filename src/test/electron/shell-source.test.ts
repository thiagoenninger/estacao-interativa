import { describe, expect, it } from 'vitest';
import mainSource from '@electron/main.ts?raw';
import preloadSource from '@electron/preload.cjs?raw';

/**
 * The shell cannot run inside the tests, so these look at the text of the two files for the
 * guards that must never disappear. They do not replace running the app (see the stage tests).
 */
describe('electron/main.ts', () => {
  it('turns on the sandbox for every window and registers the app protocol before ready', () => {
    expect(mainSource).toContain('app.enableSandbox()');
    expect(mainSource).toContain('protocol.registerSchemesAsPrivileged');
    expect(mainSource.indexOf('registerSchemesAsPrivileged')).toBeLessThan(
      mainSource.indexOf('app.whenReady()'),
    );
  });

  it('denies new windows, foreign navigation, redirects and webviews', () => {
    expect(mainSource).toContain("setWindowOpenHandler(() => ({ action: 'deny' }))");
    expect(mainSource).toContain("'will-navigate'");
    expect(mainSource).toContain("'will-redirect'");
    expect(mainSource).toContain("'will-attach-webview'");
    expect(mainSource.match(/isSameOrigin\(event\.url, pageOrigin\)/g)).toHaveLength(2);
  });

  it('grants no permission at all', () => {
    expect(mainSource).toContain('setPermissionRequestHandler');
    expect(mainSource).toContain('callback(false)');
    expect(mainSource).toContain('setPermissionCheckHandler(() => false)');
  });

  it('answers the station info only to the app page', () => {
    expect(mainSource).toContain("ipcMain.handle('station:info'");
    expect(mainSource).toContain('isSameOrigin(event.senderFrame?.url');
  });

  it('keeps one copy running and has no application menu', () => {
    expect(mainSource).toContain('requestSingleInstanceLock()');
    expect(mainSource).toContain('Menu.setApplicationMenu(null)');
  });

  it('serves the app protocol with the content security policy and the path guard', () => {
    expect(mainSource).toContain('CONTENT_SECURITY_POLICY');
    expect(mainSource).toContain('normalizeAppPath(url.pathname)');
  });

  it('never weakens the web security settings', () => {
    for (const forbidden of [
      'nodeIntegration: true',
      'contextIsolation: false',
      'sandbox: false',
      'webSecurity: false',
      'allowRunningInsecureContent: true',
      'enableRemoteModule',
      'disable-web-security',
      'no-sandbox',
    ]) {
      expect(mainSource).not.toContain(forbidden);
    }
  });

  it('opens the page with the tools the launch options ask for', () => {
    expect(mainSource).toContain('`${pageOrigin}/${launch.query}`');
  });

  it('waits for ready with then(), because awaiting it at the top level never finishes', () => {
    expect(mainSource).not.toMatch(/await\s+app\.whenReady\(\)/);
  });
});

describe('electron/preload.cjs', () => {
  it('exposes one frozen object with the one function the page needs', () => {
    expect(preloadSource).toContain("exposeInMainWorld(\n  'station'");
    expect(preloadSource).toContain('Object.freeze');
    expect(preloadSource).toContain("ipcRenderer.invoke('station:info')");
  });

  it('does not hand the page ipcRenderer, require or the whole electron module', () => {
    expect(preloadSource.match(/exposeInMainWorld/g)).toHaveLength(1);
    expect(preloadSource).not.toMatch(
      /exposeInMainWorld\(\s*'[a-zA-Z]+',\s*(ipcRenderer|require|electron)/,
    );
    expect(preloadSource).not.toContain('.send(');
    expect(preloadSource).not.toContain('.on(');
  });
});
