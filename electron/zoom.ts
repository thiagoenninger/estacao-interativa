import { STAGE } from '../src/design-system/measures.ts';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 5;

export function computeZoomFactor(area: { width: number; height: number }): number {
  if (!(area.width > 0) || !(area.height > 0)) return 1;
  const factor = Math.min(area.width / STAGE.width, area.height / STAGE.height);
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, factor));
}

export function chooseZoomFactor(kiosk: boolean, area: { width: number; height: number }): number {
  return kiosk ? computeZoomFactor(area) : 1;
}
