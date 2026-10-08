/** What the Electron shell tells the page about itself and the screen */
export interface StationInfo {
  mode: 'development' | 'production';
  /* True when the app runs full screen, without frame or cursor */
  kiosk: boolean;
  /* True when the cursor is hidden (kiosk mode without --cursor) */
  cursorHidden: boolean;
  versions: { electron: string; chrome: string; node: string };
  zoomFactor: number;
  display: { width: number; height: number; scaleFactor: number };
}

/* The function that the preload script puts on `window.station`. */
export interface StationBridge {
  getInfo(): Promise<StationInfo>;
}
