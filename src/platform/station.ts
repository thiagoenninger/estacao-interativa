import type { StationBridge } from './station-info';

declare global {
  interface Window {
    station?: StationBridge;
  }
}

export function getStation(): StationBridge | undefined {
  const station = window.station;
  return station && typeof station.getInfo === 'function' ? station : undefined;
}
