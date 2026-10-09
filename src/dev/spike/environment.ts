export const GPU_UNAVAILABLE = 'indisponível';

export function readGpuRenderer(): string {
  try {
    if (typeof WebGLRenderingContext === 'undefined') return GPU_UNAVAILABLE;
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const extension = gl?.getExtension('WEBGL_debug_renderer_info');
    if (!gl || !extension) return GPU_UNAVAILABLE;
    return String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL));
  } catch {
    return GPU_UNAVAILABLE;
  }
}

export function isSoftwareRenderer(renderer: string): boolean {
  return /swiftshader|llvmpipe|software|basic render/i.test(renderer);
}
