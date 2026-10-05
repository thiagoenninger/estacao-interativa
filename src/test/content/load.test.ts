import { describe, expect, it } from 'vitest';
import { loadContent } from '@/content/load.ts';
import { LIMITS } from '@/content/rules.ts';

/**
 * Tests over the REAL data in data/. Only what must stay true while the curatorship fills
 * the texts: no structural error, and the reference object (bicycle) is complete.
 * Warnings are expected until the content is written, so they are not checked here.
 */
describe('real project content', () => {
  const loaded = loadContent();

  it('has no error in development mode', () => {
    expect(loaded.issues.filter((issue) => issue.severity === 'error')).toEqual([]);
    expect(loaded.index).not.toBeNull();
  });

  it('has the 8 objects of the kit', () => {
    expect(
      loaded.index
        ?.listObjects()
        .map((item) => item.id)
        .sort(),
    ).toEqual(['bicycle', 'can', 'car', 'headphones', 'laptop', 'phone', 'pot', 'watch']);
  });

  it('keeps the catalog inside the scope of the Roadmap', () => {
    const ids = loaded.index
      ?.listMaterials()
      .map((item) => item.id)
      .sort();
    expect(ids).toEqual(['aluminium', 'cobalt', 'copper', 'gold', 'lithium', 'neodymium', 'steel']);
  });

  it('the bicycle is the complete reference: 3 materials, all enabled', () => {
    const orbit = loaded.index?.getOrbit('bicycle') ?? [];
    expect(orbit.map((node) => node.materialId)).toEqual(['aluminium', 'steel', 'copper']);
    expect(orbit.every((node) => node.state === 'enabled')).toBe(true);
  });

  it('every bicycle sheet respects the text limit', () => {
    for (const node of loaded.index?.getOrbit('bicycle') ?? []) {
      const sheet = loaded.index?.getMaterialSheet('bicycle', node.materialId);
      expect(sheet?.why?.length ?? 0).toBeLessThanOrEqual(LIMITS.maxWhyCharacters);
      expect(sheet?.facts).toHaveLength(LIMITS.factsPerMaterial);
    }
  });

  it('the other objects exist but are not enabled yet', () => {
    const orbit = loaded.index?.getOrbit('car') ?? [];
    expect(orbit.length).toBeGreaterThan(0);
    expect(orbit.every((node) => node.state === 'disabled')).toBe(true);
  });

  it('in release mode the draft content is rejected', () => {
    const release = loadContent({ release: true });
    expect(release.index).toBeNull();
    expect(
      release.issues.some((issue) => issue.code === 'draft-content' && issue.severity === 'error'),
    ).toBe(true);
  });
});
