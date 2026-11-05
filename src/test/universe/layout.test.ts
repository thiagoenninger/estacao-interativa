import { describe, expect, it } from 'vitest';
import { loadContent } from '@/content';
import {
  MAIN_PROMPT_ZONE,
  UNIVERSE_LAYOUT,
  checkUniverseLayout,
  labelBox,
  objectBox,
  overlaps,
  placementOf,
  rectGap,
  touchBox,
  type Placement,
} from '@/universe/layout.ts';
import { UNIVERSE_SIZE } from '@/object/drawing-measures.ts';

const index = loadContent().index!;
const items = index.listObjects();
const placements = items.map(placementOf);

function at(id: string, x: number, y: number, width = 200, height = 100): Placement {
  return { id, name: id.toUpperCase(), center: { x, y }, box: { width, height } };
}

function codes(list: readonly Placement[]) {
  return checkUniverseLayout(list).map((issue) => issue.code);
}

describe('universe layout: boxes', () => {
  it('sizes every object by its plane: the longest side is 340, 260 or 200 px', () => {
    for (const item of items) {
      const { box } = placementOf(item);
      expect(Math.max(box.width, box.height)).toBeCloseTo(UNIVERSE_SIZE[item.plane], 6);
    }
  });

  it('keeps the proportion of the drawing', () => {
    const bicycle = placementOf(index.getObject('bicycle')!);
    expect(bicycle.box.width).toBeCloseTo(340, 6);
    expect(bicycle.box.height).toBeCloseTo((340 * 460) / 700, 6);
  });

  it('centers the box on the position of the object', () => {
    const box = objectBox(at('a', 500, 400, 200, 100));
    expect(box).toEqual({ x: 400, y: 350, width: 200, height: 100 });
  });

  it('grows the touch area by 16 px on every side', () => {
    expect(touchBox(at('a', 500, 400, 200, 100))).toEqual({
      x: 384,
      y: 334,
      width: 232,
      height: 132,
    });
  });

  it('puts the label 16 px under the base of the object, centered, 24 px high', () => {
    const label = labelBox(at('a', 500, 400, 200, 100));
    expect(label.y).toBe(466);
    expect(label.height).toBe(24);
    expect(label.x + label.width / 2).toBe(500);
  });

  it('makes the label wider than a narrow drawing when the name needs it', () => {
    const narrow = { ...at('watch', 500, 400, 110, 200), name: 'FONE DE OUVIDO' };
    expect(labelBox(narrow).width).toBeCloseTo(14 * UNIVERSE_LAYOUT.labelCharWidth, 6);
  });
});

describe('universe layout: geometry helpers', () => {
  const a = { x: 0, y: 0, width: 100, height: 100 };

  it('measures the gap between two rectangles', () => {
    expect(rectGap(a, { x: 160, y: 0, width: 50, height: 50 })).toBe(60);
    expect(rectGap(a, { x: 0, y: 130, width: 50, height: 50 })).toBe(30);
    expect(rectGap(a, { x: 103, y: 104, width: 50, height: 50 })).toBe(5);
  });

  it('has no gap when the rectangles touch or overlap', () => {
    expect(rectGap(a, { x: 100, y: 0, width: 50, height: 50 })).toBe(0);
    expect(rectGap(a, { x: 50, y: 50, width: 100, height: 100 })).toBe(0);
  });

  it('tells overlap from touching', () => {
    expect(overlaps(a, { x: 50, y: 50, width: 100, height: 100 })).toBe(true);
    expect(overlaps(a, { x: 100, y: 0, width: 50, height: 50 })).toBe(false);
  });
});

describe('universe layout: rules of the Design System', () => {
  it('accepts a calm arrangement', () => {
    expect(codes([at('a', 700, 600), at('b', 1100, 600)])).toEqual([]);
  });

  it('asks for 96 px between objects', () => {
    expect(codes([at('a', 700, 600), at('b', 700 + 200 + 95, 600)])).toContain('too-close');
    expect(codes([at('a', 700, 600), at('b', 700 + 200 + 96, 600)])).not.toContain('too-close');
  });

  it('keeps the touch area, with the float, inside the Stage', () => {
    expect(codes([at('a', 100, 600)])).toContain('outside-stage');
    expect(codes([at('a', 1920 - 100, 600)])).toContain('outside-stage');
    expect(codes([at('a', 126, 600)])).not.toContain('outside-stage');
  });

  it('keeps the label, with the float, inside the safe area', () => {
    expect(codes([at('a', 900, 1000)])).toContain('label-outside-safe-area');
    expect(codes([at('a', 900, 800)])).not.toContain('label-outside-safe-area');
    expect(codes([at('a', 70, 600)])).toContain('label-outside-safe-area');
  });

  it('keeps the main prompt free', () => {
    expect(codes([at('a', 500, 200)])).toContain('over-prompt');
    expect(codes([at('a', 1400, 200)])).not.toContain('over-prompt');
  });

  it('keeps a label away from the touch area of another object', () => {
    expect(codes([at('a', 700, 600), at('b', 700, 740, 200, 100)])).toContain('label-over-object');
  });

  it('names the objects of each problem', () => {
    const [issue] = checkUniverseLayout([at('a', 700, 600), at('b', 800, 600)]);
    expect(issue?.ids).toEqual(['a', 'b']);
    expect(issue?.message).toContain('a and b');
  });
});

describe('universe layout: the content of the project', () => {
  it('has the 8 objects, 2 near, 2 mid and 4 far', () => {
    const planes = (plane: string) =>
      items.filter((item) => item.plane === plane).map((item) => item.id);
    expect(items).toHaveLength(8);
    expect(planes('near')).toEqual(['bicycle', 'car']);
    expect(planes('mid')).toEqual(['laptop', 'pot']);
    expect(planes('far')).toEqual(['can', 'phone', 'headphones', 'watch']);
  });

  it('follows every rule of the layout', () => {
    expect(checkUniverseLayout(placements)).toEqual([]);
  });

  it('has the main prompt zone of the Design System: x 64, y 64, 980 wide', () => {
    expect(MAIN_PROMPT_ZONE).toEqual({ x: 64, y: 64, width: 980, height: 272 });
  });

  it('would have caught the first positions of the placeholder data', () => {
    const early = items.map((item) => {
      if (item.id === 'bicycle') return placementOf({ ...item, position: { x: 560, y: 640 } });
      if (item.id === 'car') return placementOf({ ...item, position: { x: 300, y: 900 } });
      return placementOf(item);
    });
    const found = codes(early);
    expect(found).toContain('too-close');
    expect(found).toContain('label-outside-safe-area');
  });
});
