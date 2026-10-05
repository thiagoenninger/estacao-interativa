import { describe, expect, it } from 'vitest';
import { loadContent } from '@/content';
import { auditDrawing, type AuditOptions } from '@/objects/audit.ts';
import { getObjectSource, listDrawingFiles } from '@/objects/object-source';

const VALID = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
<g id="level-0-universe"><g id="body" data-material="aluminium" data-stroke="line"><circle cx="100" cy="100" r="50"/></g></g>
<g id="level-1-structure"><g id="ring" data-material="steel" data-stroke="fine" data-hotspot="120,140"><rect x="10" y="10" width="20" height="20"/></g></g>
<g id="level-2-internal"><g id="core" data-material="copper" data-stroke="dashed"><path d="M0 0 L10 10"/></g></g>
</svg>`;

function codes(source: string, options?: AuditOptions, fileName = 'object-test.svg') {
  return auditDrawing(fileName, source, options).issues.map((issue) => issue.code);
}

describe('auditDrawing: a correct drawing', () => {
  it('has no issue', () => {
    expect(auditDrawing('object-test.svg', VALID).issues).toEqual([]);
  });

  it('reports what it found', () => {
    expect(auditDrawing('object-test.svg', VALID).stats).toEqual({
      viewBox: { width: 400, height: 300 },
      levels: [
        { id: 'level-0-universe', groups: 1, shapes: 1 },
        { id: 'level-1-structure', groups: 1, shapes: 1 },
        { id: 'level-2-internal', groups: 1, shapes: 1 },
      ],
      materials: ['aluminium', 'copper', 'steel'],
      hotspots: 1,
    });
  });
});

describe('auditDrawing: errors (they break the app)', () => {
  const errors: [string, string, string][] = [
    ['svg-syntax', 'a file that is not an SVG', '<svg><g></svg>'],
    ['root-viewbox', 'a root without a viewBox', VALID.replace(' viewBox="0 0 400 300"', '')],
    ['root-attribute', 'a root without currentColor', VALID.replace('stroke="currentColor" ', '')],
    ['root-attribute', 'a root without round ends', VALID.replace('stroke-linecap="round" ', '')],
    [
      'forbidden-attribute',
      'a transform',
      VALID.replace('<circle ', '<circle transform="scale(2)" '),
    ],
    ['forbidden-attribute', 'a clip-path', VALID.replace('<rect ', '<rect clip-path="url(#a)" ')],
    ['forbidden-attribute', 'a mask', VALID.replace('<g id="body"', '<g mask="url(#a)" id="body"')],
    ['forbidden-attribute', 'a filter', VALID.replace('<path ', '<path filter="url(#a)" ')],
    ['forbidden-element', 'a <defs>', VALID.replace('</svg>', '<defs></defs></svg>')],
    ['forbidden-element', 'a <text>', VALID.replace('<path ', '<text></text><path ')],
    ['fixed-color', 'a fixed stroke color', VALID.replace('<circle ', '<circle stroke="#ff0000" ')],
    ['fixed-color', 'a fixed fill color', VALID.replace('<rect ', '<rect fill="red" ')],
    [
      'loose-shape',
      'a shape directly under the root',
      VALID.replace('</svg>', '<path d="M0 0"/></svg>'),
    ],
    [
      'loose-shape',
      'a shape directly under a level',
      VALID.replace(
        'data-stroke="line"><circle cx="100" cy="100" r="50"/></g>',
        'data-stroke="line"></g><circle cx="1" cy="1" r="1"/>',
      ),
    ],
    [
      'level-missing',
      'a missing level',
      VALID.replace(/<g id="level-2-internal">.*<\/g><\/g>\n/, ''),
    ],
    [
      'level-order',
      'levels out of order',
      VALID.replace('level-0-universe', 'level-9')
        .replace('level-1-structure', 'level-0-universe')
        .replace('level-9', 'level-1-structure'),
    ],
    [
      'level-unknown',
      'a group under the root that is not a level',
      VALID.replace('</svg>', '<g id="extra"></g></svg>'),
    ],
    ['group-id', 'a group without id', VALID.replace('<g id="body" ', '<g ')],
    ['group-id', 'a group with an id in capitals', VALID.replace('id="body"', 'id="Body"')],
    ['group-duplicate', 'a repeated id', VALID.replace('id="core"', 'id="body"')],
    [
      'group-material',
      'a group without data-material',
      VALID.replace(' data-material="aluminium"', ''),
    ],
    ['group-stroke', 'a group without data-stroke', VALID.replace(' data-stroke="line"', '')],
    [
      'group-stroke',
      'a group with an unknown data-stroke',
      VALID.replace('data-stroke="line"', 'data-stroke="thick"'),
    ],
    [
      'nested-group',
      'a group inside a component group',
      VALID.replace('<circle ', '<g><circle ').replace('r="50"/>', 'r="50"/></g>'),
    ],
    ['hotspot-format', 'a hotspot that is not x,y', VALID.replace('120,140', '120')],
    ['hotspot-outside', 'a hotspot outside the viewBox', VALID.replace('120,140', '120,900')],
  ];

  it.each(errors)('%s: %s', (code, _name, source) => {
    const issues = auditDrawing('object-test.svg', source).issues;
    const found = issues.find((issue) => issue.code === code);
    expect(found?.severity).toBe('error');
  });

  it('rejects a file name that is not object-<name>.svg', () => {
    expect(codes(VALID, undefined, 'Objeto Bicicleta.svg')).toEqual(['file-name']);
  });

  it('limits the hotspots to 6 per material', () => {
    const seven = Array.from(
      { length: 7 },
      (_, n) =>
        `<g id="spot-${n}" data-material="steel" data-stroke="fine" data-hotspot="10,10"><path d="M0 0"/></g>`,
    ).join('');
    // The seven groups go into level 1, after the group "ring".
    const source = VALID.replace(
      '</g></g>\n<g id="level-2-internal">',
      `</g>${seven}</g>\n<g id="level-2-internal">`,
    );
    const issue = auditDrawing('object-test.svg', source).issues.find(
      (item) => item.code === 'hotspot-too-many',
    );
    expect(issue?.where).toContain('material "steel"');
  });

  it('limits the internal groups to 6 per material', () => {
    const seven = Array.from(
      { length: 7 },
      (_, n) => `<g id="part-${n}" data-material="copper" data-stroke="fine"><path d="M0 0"/></g>`,
    ).join('');
    const source = VALID.replace('</g></g>\n</svg>', `</g>${seven}</g>\n</svg>`);
    expect(codes(source)).toContain('level-2-too-many');
  });
});

describe('auditDrawing: warnings (finishing work)', () => {
  const warnings: [string, string, string][] = [
    [
      'ignored-attribute',
      'stroke-width in a group',
      VALID.replace('data-stroke="line"', 'data-stroke="line" stroke-width="5"'),
    ],
    [
      'ignored-attribute',
      'stroke-dasharray in a group',
      VALID.replace('data-stroke="dashed"', 'data-stroke="dashed" stroke-dasharray="7 6"'),
    ],
    [
      'ignored-attribute',
      'vector-effect on the root',
      VALID.replace('<svg ', '<svg vector-effect="non-scaling-stroke" '),
    ],
    [
      'ignored-attribute',
      'width and height on the root',
      VALID.replace('<svg ', '<svg width="400" height="300" '),
    ],
    [
      'inline-style',
      'a style attribute',
      VALID.replace('<g id="level-2-internal">', '<g id="level-2-internal" style="display:none">'),
    ],
    [
      'accessible-name-in-file',
      'a <title>',
      VALID.replace('<g id="level-0', '<title>bike</title><g id="level-0'),
    ],
    [
      'accessible-name-in-file',
      'an aria-label on the root',
      VALID.replace('<svg ', '<svg aria-label="bike" '),
    ],
    ['accessible-name-in-file', 'a role on the root', VALID.replace('<svg ', '<svg role="img" ')],
  ];

  it.each(warnings)('%s: %s', (code, _name, source) => {
    const issues = auditDrawing('object-test.svg', source).issues;
    expect(issues.map((issue) => issue.severity)).toEqual(['warning']);
    expect(issues[0]?.code).toBe(code);
  });

  it('lists every ignored attribute of an element in one issue', () => {
    const source = VALID.replace(
      'data-stroke="line"',
      'data-stroke="line" stroke-width="5" opacity="0.5"',
    );
    const issues = auditDrawing('object-test.svg', source).issues;
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain('stroke-width, opacity');
  });
});

describe('auditDrawing: density of the strokes', () => {
  // Two concentric circles 10 units apart in a 400-wide drawing.
  const ringed = VALID.replace(
    '<circle cx="100" cy="100" r="50"/>',
    '<circle cx="100" cy="100" r="50"/><circle cx="100" cy="100" r="60"/>',
  );

  it('warns when concentric strokes end up closer than 6 px in the universe', () => {
    // far plane: 200 px for 400 units = 0.5 px per unit, so 10 units are 5 px
    const issues = auditDrawing('object-test.svg', ringed, { plane: 'far' }).issues;
    expect(issues.map((issue) => issue.code)).toEqual(['dense-strokes']);
    expect(issues[0]?.message).toContain('5.0 px');
  });

  it('accepts the same drawing on a larger plane', () => {
    // near plane: 340 px for 400 units = 0.85 px per unit, so 10 units are 8.5 px
    expect(auditDrawing('object-test.svg', ringed, { plane: 'near' }).issues).toEqual([]);
  });

  it('checks the smallest universe size when the plane is unknown', () => {
    expect(codes(ringed)).toEqual(['dense-strokes']);
  });
});

describe('the real drawings', () => {
  const index = loadContent().index;
  const planeOf = (file: string) =>
    index?.listObjects().find((object) => object.svg === file)?.plane;

  it.each(listDrawingFiles())('%s passes the audit with no error and no warning', (file) => {
    const plane = planeOf(file);
    const issues = auditDrawing(file, getObjectSource(file) ?? '', plane ? { plane } : {}).issues;
    expect(issues).toEqual([]);
  });
});
