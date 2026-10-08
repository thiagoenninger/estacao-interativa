// The only bridge between the page and the shell. It runs in the Chromium sandbox, so it has to
// be a plain CommonJS script (a sandboxed preload cannot be TypeScript or an ES module).
// The page gets one read-only function, `window.station.getInfo()`; no Node.js, no `ipcRenderer`.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
  'station',
  Object.freeze({
    getInfo: () => ipcRenderer.invoke('station:info'),
  }),
);
