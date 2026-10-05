import { describe, expect, it } from 'vitest';
import { loadContent } from '@/content';
import { getDrawing, getObjectSource, listDrawingFiles } from '@/objects/object-source';

describe('object drawings', () => {
  it('has exactly the files the content points to', () => {
    const index = loadContent().index;
    const fromContent = (index?.listObjects() ?? []).map((object) => object.svg).sort();
    expect(fromContent).toHaveLength(8);
    expect(listDrawingFiles()).toEqual(fromContent);
  });

  it('reads the source of a file, and nothing for a missing one', () => {
    expect(getObjectSource('object-bicycle.svg')).toContain('level-1-structure');
    expect(getObjectSource('object-nothing.svg')).toBeUndefined();
  });

  it('reads the tree and the viewBox of a drawing, once', () => {
    const drawing = getDrawing('object-can.svg');
    expect(drawing.root.tag).toBe('svg');
    expect(drawing.viewBox).toEqual({ x: 0, y: 0, width: 210, height: 320 });
    expect(getDrawing('object-can.svg')).toBe(drawing);
  });

  it('throws for a file that does not exist', () => {
    expect(() => getDrawing('object-nothing.svg')).toThrow('Object drawing not found');
  });
});
