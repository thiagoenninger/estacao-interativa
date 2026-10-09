import { describe, expect, it } from 'vitest';
import { GPU_UNAVAILABLE, isSoftwareRenderer, readGpuRenderer } from '@/dev/spike/environment';

describe('isSoftwareRenderer', () => {
  it.each([
    'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)',
    'llvmpipe (LLVM 15.0.7, 256 bits)',
    'Microsoft Basic Render Driver',
  ])('says yes for %s', (name) => {
    expect(isSoftwareRenderer(name)).toBe(true);
  });

  it('says no for a real graphics chip', () => {
    expect(
      isSoftwareRenderer(
        'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x00009A49) Direct3D11, D3D11)',
      ),
    ).toBe(false);
  });
});

describe('readGpuRenderer', () => {
  it('says "indisponível" where there is no WebGL (the test environment)', () => {
    expect(readGpuRenderer()).toBe(GPU_UNAVAILABLE);
    expect(GPU_UNAVAILABLE).toBe('indisponível');
  });
});
