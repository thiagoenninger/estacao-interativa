import { describe, expect, it } from 'vitest';
import fontsCss from '@/design-system/fonts.css?raw';

/** Font files that really exist in assets/fonts (glob keys are the existing paths). */
const files = Object.keys(import.meta.glob('../../../assets/fonts/*.woff2', { query: '?url' }));
const existing = new Set(files.map((path) => path.split('/').pop()));

const declared = [...fontsCss.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((match) => {
  const body = match[1] ?? '';
  return {
    family: /font-family:\s*'([^']+)'/.exec(body)?.[1],
    weight: Number(/font-weight:\s*(\d+)/.exec(body)?.[1]),
    file: /url\('[^']*\/([^/']+\.woff2)'\)/.exec(body)?.[1],
    range: /unicode-range:\s*([^;]+);/.exec(body)?.[1],
  };
});

describe('local fonts', () => {
  it('declares 8 styles in 2 subsets (Latin and Latin Extended)', () => {
    expect(declared).toHaveLength(16);
  });

  it('uses only the weights of the Design System', () => {
    const styles = new Set(declared.map((face) => `${face.family} ${face.weight}`));
    expect([...styles].sort()).toEqual([
      'IBM Plex Mono 400',
      'IBM Plex Mono 500',
      'IBM Plex Sans 300',
      'IBM Plex Sans 400',
      'IBM Plex Sans 500',
      'IBM Plex Sans 600',
      'IBM Plex Sans 700',
      'IBM Plex Sans Condensed 600',
    ]);
  });

  it('points every declaration to a file that exists', () => {
    for (const face of declared) expect(existing.has(face.file), face.file).toBe(true);
  });

  it('has no font file that is not declared', () => {
    const used = new Set(declared.map((face) => face.file));
    for (const file of existing) expect(used.has(file), file).toBe(true);
  });

  it('never loads anything from the internet', () => {
    expect(fontsCss).not.toMatch(/https?:\/\//);
  });

  it('gives every face a unicode-range, so each browser downloads only what it needs', () => {
    for (const face of declared) expect(face.range).toMatch(/^U\+/);
  });
});
