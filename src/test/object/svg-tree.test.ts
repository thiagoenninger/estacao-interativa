import { describe, expect, it } from 'vitest';
import {
  parseSvgTree,
  readViewBox,
  SvgSyntaxError,
  walkElements,
  type SvgElement,
} from '@/objects/svg-tree.ts';

const source = `<?xml version="1.0"?>
<!-- a comment <g id="not-an-element"> -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50">
  <title>some text</title>
  <g id='one' data-material="steel">
    <path d="M0 0 L10 10"/>
    <circle cx="5" cy="5" r="2"></circle>
  </g>
  <g id="two"/>
</svg>`;

describe('parseSvgTree', () => {
  const root = parseSvgTree(source);

  it('reads the root and the nesting', () => {
    expect(root.tag).toBe('svg');
    expect(root.children.map((child) => child.tag)).toEqual(['title', 'g', 'g']);
    expect(root.children[1]?.children.map((child) => child.tag)).toEqual(['path', 'circle']);
  });

  it('reads attributes with double and single quotes', () => {
    expect(root.attributes['viewBox']).toBe('0 0 100 50');
    expect(root.children[1]?.attributes).toEqual({ id: 'one', 'data-material': 'steel' });
  });

  it('understands self-closing tags and empty elements', () => {
    expect(root.children[2]).toEqual({ tag: 'g', attributes: { id: 'two' }, children: [] });
    expect(root.children[1]?.children[1]?.children).toEqual([]);
  });

  it('ignores comments, the XML declaration and the text between tags', () => {
    const ids = [...walkElements(root)].map((element) => element.attributes['id']);
    expect(ids).not.toContain('not-an-element');
    expect(root.children[0]?.children).toEqual([]);
  });

  it('walks parents before children', () => {
    const tags = [...walkElements(root)].map((element: SvgElement) => element.tag);
    expect(tags).toEqual(['svg', 'title', 'g', 'path', 'circle', 'g']);
  });
});

describe('parseSvgTree errors', () => {
  it.each([
    ['a closing tag that does not match', '<svg><g></svg>'],
    ['a closing tag with nothing open', '<svg></svg></g>'],
    ['an element that is never closed', '<svg><g>'],
    ['two roots', '<svg></svg><svg></svg>'],
    ['a root that is not svg', '<div></div>'],
    ['no element at all', 'just text'],
  ])('throws for %s', (_name, broken) => {
    expect(() => parseSvgTree(broken)).toThrow(SvgSyntaxError);
  });
});

describe('readViewBox', () => {
  const root = (viewBox?: string): SvgElement => ({
    tag: 'svg',
    attributes: viewBox === undefined ? {} : { viewBox },
    children: [],
  });

  it('reads four numbers separated by spaces or commas', () => {
    expect(readViewBox(root('0 0 700 460'))).toEqual({ x: 0, y: 0, width: 700, height: 460 });
    expect(readViewBox(root('-10,5,200,100'))).toEqual({ x: -10, y: 5, width: 200, height: 100 });
  });

  it.each([undefined, '', '0 0 700', '0 0 a b', '0 0 0 460', '0 0 -5 10'])(
    'returns null for %j',
    (value) => {
      expect(readViewBox(root(value))).toBeNull();
    },
  );
});
