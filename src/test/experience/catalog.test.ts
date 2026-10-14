import { describe, expect, it } from 'vitest';
import { createCatalog } from '@/experience/catalog.ts';
import { createContentIndex } from '@/content/queries.ts';
import { loadContent } from '@/content';
import { makeValid } from '../content/test-fixtures.ts';

function setup(change?: (content: ReturnType<typeof makeValid>['content']) => void) {
  const { content } = makeValid();
  change?.(content);
  return createCatalog(createContentIndex(content));
}

describe('catalog over the content index', () => {
  it('knows the objects', () => {
    const catalog = setup();
    expect(catalog.hasObject('bicycle')).toBe(true);
    expect(catalog.hasObject('ghost')).toBe(false);
  });

  it('a material is open when its sheet is complete', () => {
    const catalog = setup();
    expect(catalog.isMaterialOpen('bicycle', 'aluminium')).toBe(true);
    expect(catalog.isMaterialOpen('bicycle', 'gold')).toBe(false);
    expect(catalog.isMaterialOpen('ghost', 'aluminium')).toBe(false);
  });

  it('a draft sheet is a disabled material', () => {
    const catalog = setup((content) => {
      content.investigations[0]!.why = null;
    });
    expect(catalog.isMaterialOpen('bicycle', 'aluminium')).toBe(false);
    expect(catalog.isMaterialOpen('bicycle', 'steel')).toBe(true);
  });

  it('finds the "Presente em" items by number', () => {
    const catalog = setup();
    expect(catalog.hasPresentIn('bicycle', 'aluminium', 1)).toBe(true);
    expect(catalog.hasPresentIn('bicycle', 'aluminium', 2)).toBe(false);
    expect(catalog.hasPresentIn('ghost', 'aluminium', 1)).toBe(false);
  });

  it('a layer opens only when it has text', () => {
    const catalog = setup();
    expect(catalog.isLayerOpen('bicycle', 'aluminium', 'origin')).toBe(true);
    expect(catalog.isLayerOpen('bicycle', 'aluminium', 'production')).toBe(false);
    expect(catalog.isLayerOpen('bicycle', 'aluminium', 'nothing')).toBe(false);
  });

  it('a related object must be listed, different and have the material open', () => {
    const catalog = setup();
    expect(catalog.canOpenRelated('bicycle', 'aluminium', 'laptop')).toBe(true);
    expect(catalog.canOpenRelated('bicycle', 'aluminium', 'bicycle')).toBe(false);
    expect(catalog.canOpenRelated('bicycle', 'aluminium', 'ghost')).toBe(false);

    const draft = setup((content) => {
      content.investigations.find(
        (item) => item.objectId === 'laptop' && item.materialId === 'aluminium',
      )!.why = null;
    });
    expect(draft.canOpenRelated('bicycle', 'aluminium', 'laptop')).toBe(false);
  });

  it('works with the real content: the bicycle opens, its aluminium has an origin layer', () => {
    const index = loadContent().index!;
    const catalog = createCatalog(index);
    expect(catalog.hasObject('bicycle')).toBe(true);
    expect(catalog.isMaterialOpen('bicycle', 'aluminium')).toBe(true);
    expect(catalog.isLayerOpen('bicycle', 'aluminium', 'origin')).toBe(true);
    expect(catalog.isLayerOpen('bicycle', 'aluminium', 'production')).toBe(false);
  });
});
