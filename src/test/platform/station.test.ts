import { afterEach, describe, expect, it } from 'vitest';
import { getStation } from '@/platform/station';
import type { StationBridge } from '@/platform/station-info';

afterEach(() => {
  delete window.station;
});

describe('getStation', () => {
  it('is undefined in an ordinary browser', () => {
    expect(getStation()).toBeUndefined();
  });

  it('returns the bridge the preload script put on window', () => {
    const bridge: StationBridge = { getInfo: () => Promise.reject(new Error('unused')) };
    window.station = bridge;
    expect(getStation()).toBe(bridge);
  });

  it('ignores a station that does not have getInfo', () => {
    (window as unknown as { station: unknown }).station = { other: 1 };
    expect(getStation()).toBeUndefined();
  });
});
