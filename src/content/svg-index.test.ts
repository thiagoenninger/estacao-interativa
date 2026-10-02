import { describe, expect, it } from 'vitest';
import { parseSvg } from './svg-index.ts';

const source = `<svg>
<g id="level-0-universe">
  <g id="frame" data-material="aluminium" data-stroke="line"><path/></g>
</g>
<g id="level-1-structure">
  <g id="cables" data-material="copper" data-stroke="fine" data-hotspot="10,20"></g>
</g>
<g id="level-2-internal" style="display:none">
  <g id="frame" data-material="aluminium"></g>
  <g id="plain"></g>
</g>
</svg>`;

describe('parseSvg', () => {
  const index = parseSvg(source);

  it('reads material, stroke and hotspot of each group', () => {
    expect(index.groups['cables']).toEqual({
      material: 'copper',
      stroke: 'fine',
      level: 'level-1-structure',
      hotspot: '10,20',
    });
  });

  it('gives each group the level that came before it', () => {
    expect(index.groups['plain']?.level).toBe('level-2-internal');
  });

  it('does not treat level groups as content groups', () => {
    expect(Object.keys(index.groups).some((id) => id.startsWith('level-'))).toBe(false);
  });

  it('reports ids that appear more than once', () => {
    expect(index.duplicates).toEqual(['frame']);
  });

  it('leaves missing attributes as null', () => {
    expect(index.groups['plain']).toMatchObject({ material: null, stroke: null, hotspot: null });
  });
});
