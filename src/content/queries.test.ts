import { describe, expect, it } from 'vitest';
import { createContentIndex } from './queries.ts';
import { makeValid } from './test-fixtures.ts';

function setup() {
  const { content } = makeValid();
  return { content, index: createContentIndex(content) };
}

describe('content queries', () => {
  it('lists objects and finds one by id', () => {
    const { index } = setup();
    expect(index.listObjects().map((item) => item.id)).toEqual(['bicycle', 'laptop']);
    expect(index.getObject('bicycle')?.name).toBe('Bicicleta');
    expect(index.getObject('nothing')).toBeUndefined();
  });

  it('returns the orbit in order, whatever the order in the file', () => {
    const { content } = setup();
    content.investigations.reverse();
    const orbit = createContentIndex(content).getOrbit('bicycle');
    expect(orbit.map((node) => node.materialId)).toEqual(['aluminium', 'steel', 'copper']);
    expect(orbit.map((node) => node.order)).toEqual([1, 2, 3]);
  });

  it('a complete sheet is an enabled node', () => {
    const { index } = setup();
    expect(index.getOrbit('bicycle').every((node) => node.state === 'enabled')).toBe(true);
  });

  it.each([
    [
      'a draft fact',
      (c: ReturnType<typeof setup>['content']) => {
        c.materials[0]!.facts[0]!.value = '[VALOR]';
      },
    ],
    [
      'a draft reason',
      (c: ReturnType<typeof setup>['content']) => {
        c.investigations[0]!.why = '[TEXTO — curadoria]';
      },
    ],
    [
      'no reason',
      (c: ReturnType<typeof setup>['content']) => {
        c.investigations[0]!.why = null;
      },
    ],
    [
      'a draft place',
      (c: ReturnType<typeof setup>['content']) => {
        c.investigations[0]!.presentIn[0]!.label = '[COMPONENTE]';
      },
    ],
    [
      'no places',
      (c: ReturnType<typeof setup>['content']) => {
        c.investigations[0]!.presentIn = [];
      },
    ],
  ])('%s makes the node disabled', (_name, change) => {
    const { content } = setup();
    change(content);
    const node = createContentIndex(content)
      .getOrbit('bicycle')
      .find((item) => item.materialId === 'aluminium');
    expect(node?.state).toBe('disabled');
  });

  it('builds the sheet in the shape of the Panel', () => {
    const sheet = setup().index.getMaterialSheet('bicycle', 'aluminium');
    expect(sheet).toMatchObject({
      objectId: 'bicycle',
      materialId: 'aluminium',
      name: 'Alumínio',
      atomicNumber: 13,
      complete: true,
    });
    expect(sheet?.facts).toHaveLength(3);
    expect(sheet?.related).toEqual([{ objectId: 'laptop', name: 'Notebook' }]);
  });

  it('an alloy has no atomic number', () => {
    expect(setup().index.getMaterialSheet('bicycle', 'steel')?.atomicNumber).toBeNull();
  });

  it('a layer without text is coming soon, a layer with text is available', () => {
    const layers = setup().index.getMaterialSheet('bicycle', 'aluminium')!.layers;
    expect(layers.map((layer) => [layer.id, layer.status])).toEqual([
      ['origin', 'available'],
      ['production', 'coming-soon'],
    ]);
  });

  it('a draft layer text is also coming soon', () => {
    const { content } = setup();
    content.materials[0]!.layers[0]!.text = '[TEXTO — curadoria]';
    const layer = createContentIndex(content).getMaterialSheet('bicycle', 'aluminium')!.layers[0];
    expect(layer?.status).toBe('coming-soon');
  });

  it('an investigation can override the text of a layer', () => {
    const { content } = setup();
    content.investigations[0]!.layers = [{ id: 'production', text: 'Texto só da bicicleta.' }];
    const layers = createContentIndex(content).getMaterialSheet('bicycle', 'aluminium')!.layers;
    expect(layers[1]).toMatchObject({ text: 'Texto só da bicicleta.', status: 'available' });
    expect(layers[0]?.text).toBe('Texto de origem.');
  });

  it('resolves the sources and routes of a layer', () => {
    const layers = setup().index.getMaterialSheet('bicycle', 'aluminium')!.layers;
    expect(layers[0]?.sources.map((item) => item.id)).toEqual(['rock']);
    expect(layers[1]?.routes.map((item) => item.id)).toEqual(['route-one']);
  });

  it('finds the objects that contain a material', () => {
    const { index } = setup();
    expect(index.objectsWithMaterial('copper').map((item) => item.id)).toEqual([
      'bicycle',
      'laptop',
    ]);
    expect(index.objectsWithMaterial('gold')).toEqual([]);
  });

  it('returns undefined for a pair that does not exist', () => {
    const { index } = setup();
    expect(index.getMaterialSheet('bicycle', 'gold')).toBeUndefined();
    expect(index.getObjectView('nothing')).toBeUndefined();
  });

  it('looks up routes and sources', () => {
    const { index } = setup();
    expect(index.getRoute('route-one')?.materialId).toBe('aluminium');
    expect(index.getSource('rock')?.name).toBe('Rocha');
    expect(index.routesOfMaterial('aluminium')).toHaveLength(1);
    expect(index.routesOfMaterial('steel')).toEqual([]);
  });
});
