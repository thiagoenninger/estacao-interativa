import { describe, expect, it } from 'vitest';
import { baseName, checkContent, toRawContent } from './check.ts';
import { makeValid, svg } from './test-fixtures.ts';
import { buildEnv } from './check.ts';
import { hasErrors, summarizeIssues, validateContent, type Issue } from './validate.ts';

function codes(issues: Issue[]): string[] {
  return issues.map((issue) => issue.code);
}

describe('validateContent', () => {
  it('accepts content that follows every rule, with no issue at all', () => {
    const { content, env } = makeValid();
    expect(validateContent(content, env)).toEqual([]);
  });

  describe('integrity (always an error)', () => {
    it('duplicate ids', () => {
      const { content, env } = makeValid();
      content.objects.push({ ...content.objects[0]! });
      expect(codes(validateContent(content, env))).toContain('duplicate-id');
    });

    it('a material outside the scope of the Roadmap (C1)', () => {
      const { content, env } = makeValid();
      content.materials[0]!.id = 'glass';
      content.materials[0]!.sphere = 'material-glass-sphere.png';
      expect(codes(validateContent(content, env))).toContain('out-of-scope-material');
    });

    it('unknown element in a composition', () => {
      const { content, env } = makeValid();
      content.materials[0]!.composition = ['Xx'];
      expect(codes(validateContent(content, env))).toContain('unknown-element');
    });

    it('a sphere that is not in assets/materials', () => {
      const { content, env } = makeValid();
      content.materials[0]!.sphere = 'material-nothing-sphere.png';
      expect(codes(validateContent(content, env))).toContain('missing-asset');
    });

    it('a drawing that is not in assets/objects', () => {
      const { content, env } = makeValid();
      content.objects[0]!.svg = 'object-nothing.svg';
      expect(codes(validateContent(content, env))).toContain('missing-asset');
    });

    it('a layer image that was not found', () => {
      const { content, env } = makeValid();
      content.materials[0]!.layers[0]!.image = 'photo-missing-01.jpg';
      expect(codes(validateContent(content, env))).toContain('missing-asset');
    });

    it('accepts a layer image that exists', () => {
      const { content, env } = makeValid();
      content.materials[0]!.layers[0]!.image = 'photo-one-01.jpg';
      expect(validateContent(content, env)).toEqual([]);
    });

    it('unknown source, route, object and material', () => {
      const { content, env } = makeValid();
      content.materials[0]!.layers[0]!.sourceIds = ['nothing'];
      content.materials[0]!.layers[1]!.routeIds = ['nothing'];
      content.routes[0]!.materialId = 'nothing';
      content.investigations[0]!.objectId = 'nothing';
      content.investigations[1]!.materialId = 'nothing';
      const found = codes(validateContent(content, env));
      expect(found).toContain('unknown-source');
      expect(found).toContain('unknown-route');
      expect(found).toContain('unknown-material');
      expect(found).toContain('unknown-object');
    });

    it('an investigation layer that the material does not have', () => {
      const { content, env } = makeValid();
      content.investigations[0]!.layers = [{ id: 'nothing', text: 'x' }];
      expect(codes(validateContent(content, env))).toContain('unknown-layer');
    });

    it('a group that is not in the drawing', () => {
      const { content, env } = makeValid();
      content.investigations[0]!.presentIn[0]!.groups = ['nothing'];
      expect(codes(validateContent(content, env))).toContain('svg-group-missing');
    });

    it('a group made of another material', () => {
      const { content, env } = makeValid();
      content.investigations[0]!.presentIn[0]!.groups = ['fork'];
      expect(codes(validateContent(content, env))).toContain('svg-group-material-mismatch');
    });

    it('a related object that does not contain the material', () => {
      const { content, env } = makeValid();
      content.investigations = content.investigations.filter(
        (item) => !(item.objectId === 'laptop' && item.materialId === 'copper'),
      );
      content.investigations.find(
        (item) => item.objectId === 'bicycle' && item.materialId === 'copper',
      )!.related = ['laptop'];
      expect(codes(validateContent(content, env))).toContain('related-without-material');
    });

    it('an object related to itself', () => {
      const { content, env } = makeValid();
      content.investigations[0]!.related = ['bicycle'];
      expect(codes(validateContent(content, env))).toContain('related-self');
    });

    it('duplicate group ids inside one drawing', () => {
      const { content } = makeValid();
      const env = buildEnv({
        objectSvgs: {
          'object-bicycle.svg': svg([
            ['frame', 'aluminium'],
            ['frame', 'aluminium'],
            ['fork', 'steel'],
            ['cables', 'copper'],
          ]),
          'object-laptop.svg': svg([
            ['lid', 'aluminium'],
            ['hinge', 'steel'],
            ['ports', 'copper'],
          ]),
        },
        sphereFiles: [
          'material-aluminium-sphere.png',
          'material-steel-sphere.png',
          'material-copper-sphere.png',
        ],
        imageFiles: [],
      });
      expect(codes(validateContent(content, env))).toContain('duplicate-id');
    });
  });

  describe('limits (always an error)', () => {
    it('more than 6 places for one material', () => {
      const { content, env } = makeValid();
      content.investigations[0]!.presentIn = Array.from({ length: 7 }, (_, index) => ({
        n: index + 1,
        label: 'Parte',
        groups: ['frame'],
      }));
      expect(codes(validateContent(content, env))).toContain('too-many-hotspots');
    });

    it('repeated place numbers', () => {
      const { content, env } = makeValid();
      content.investigations[0]!.presentIn.push({ n: 1, label: 'Outra', groups: ['frame'] });
      expect(codes(validateContent(content, env))).toContain('duplicate-present-number');
    });

    it('a reason with more than 180 characters', () => {
      const { content, env } = makeValid();
      content.investigations[0]!.why = 'a'.repeat(181);
      expect(codes(validateContent(content, env))).toContain('why-too-long');
    });

    it('a reason with exactly 180 characters is fine', () => {
      const { content, env } = makeValid();
      content.investigations[0]!.why = 'a'.repeat(180);
      expect(validateContent(content, env)).toEqual([]);
    });

    it('more than 4 related objects', () => {
      const { content, env } = makeValid();
      content.investigations[0]!.related = ['laptop', 'laptop', 'laptop', 'laptop', 'laptop'];
      expect(codes(validateContent(content, env))).toContain('too-many-related');
    });

    it('more than 5 layers in a material', () => {
      const { content, env } = makeValid();
      const layer = content.materials[0]!.layers[1]!;
      content.materials[0]!.layers = Array.from({ length: 6 }, (_, index) => ({
        ...layer,
        id: `layer-${index}`,
      }));
      expect(codes(validateContent(content, env))).toContain('too-many-layers');
    });

    it('a sheet without exactly 3 facts', () => {
      const { content, env } = makeValid();
      content.materials[0]!.facts.pop();
      expect(codes(validateContent(content, env))).toContain('facts-count');
    });

    it('an orbit order with a gap', () => {
      const { content, env } = makeValid();
      content.investigations[2]!.order = 5;
      expect(codes(validateContent(content, env))).toContain('order-invalid');
    });

    it('more than 8 materials in one object', () => {
      const { content, env } = makeValid();
      for (let index = 0; index < 6; index += 1) {
        const id = `extra-${index}`;
        content.materials.push({
          ...structuredClone(content.materials[0]!),
          id,
          sphere: `material-${id}-sphere.png`,
        });
        content.investigations.push({
          ...structuredClone(content.investigations[0]!),
          materialId: id,
          order: 4 + index,
          related: [],
        });
      }
      expect(codes(validateContent(content, env))).toContain('too-many-materials');
    });
  });

  describe('completeness (warning in development, error in release)', () => {
    it('an object with fewer than 3 materials', () => {
      const { content, env } = makeValid();
      content.investigations = content.investigations.filter(
        (item) => !(item.objectId === 'laptop' && item.materialId === 'copper'),
      );
      content.investigations.find(
        (item) => item.objectId === 'bicycle' && item.materialId === 'copper',
      )!.related = [];
      const dev = validateContent(content, env).filter(
        (issue) => issue.code === 'too-few-materials',
      );
      const release = validateContent(content, env, { release: true }).filter(
        (issue) => issue.code === 'too-few-materials',
      );
      expect(dev.map((issue) => issue.severity)).toEqual(['warning']);
      expect(release.map((issue) => issue.severity)).toEqual(['error']);
    });

    it('a draft marker, found at any depth', () => {
      const { content, env } = makeValid();
      content.materials[0]!.layers[0]!.text = '[TEXTO — curadoria]';
      content.investigations[0]!.presentIn[0]!.label = '[COMPONENTE]';
      content.materials[1]!.facts[0]!.value = '[VALOR]';
      const dev = validateContent(content, env);
      expect(codes(dev)).toEqual(['draft-content', 'draft-content', 'draft-content']);
      expect(hasErrors(dev)).toBe(false);
      expect(hasErrors(validateContent(content, env, { release: true }))).toBe(true);
    });

    it('null is an intentional absence, not a draft', () => {
      const { content, env } = makeValid();
      content.investigations[0]!.why = null;
      content.materials[0]!.layers[0]!.text = null;
      expect(validateContent(content, env, { release: true })).toEqual([]);
    });
  });

  it('warns about a drawing material that is neither in the catalog nor out of scope', () => {
    const { content, env } = makeValid();
    const withLead = buildEnv({
      objectSvgs: {
        'object-bicycle.svg': svg([
          ['frame', 'aluminium'],
          ['fork', 'steel'],
          ['cables', 'copper'],
          ['battery', 'lead'],
          ['tires', 'rubber'],
        ]),
        'object-laptop.svg': svg([
          ['lid', 'aluminium'],
          ['hinge', 'steel'],
          ['ports', 'copper'],
        ]),
      },
      sphereFiles: [...env.sphereFiles],
      imageFiles: [],
    });
    const issues = validateContent(content, withLead);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ code: 'svg-unmapped-material', severity: 'warning' });
    expect(issues[0]?.message).toContain('lead');
  });
});

describe('summarizeIssues', () => {
  it('counts per code, most frequent first', () => {
    const issue = (code: string, severity: Issue['severity']): Issue => ({
      severity,
      code,
      where: '',
      message: '',
    });
    const summary = summarizeIssues([
      issue('a', 'warning'),
      issue('b', 'error'),
      issue('a', 'warning'),
    ]);
    expect(summary).toEqual({
      errors: 1,
      warnings: 2,
      byCode: [
        ['a', 2, 'warning'],
        ['b', 1, 'error'],
      ],
    });
  });
});

describe('checkContent (shape, then rules)', () => {
  function rawOf(content: ReturnType<typeof makeValid>['content']) {
    return toRawContent({
      'meta.json': content.meta,
      'elements.json': { elements: content.elements },
      'materials.json': { materials: content.materials },
      'mineral-sources.json': { mineralSources: content.mineralSources },
      'routes.json': { routes: content.routes },
      'objects.json': { objects: content.objects },
      'investigations.json': { investigations: content.investigations },
    });
  }
  const assetsOf = () => {
    const { env } = makeValid();
    return {
      objectSvgs: {
        'object-bicycle.svg': svg([
          ['frame', 'aluminium'],
          ['fork', 'steel'],
          ['cables', 'copper'],
        ]),
        'object-laptop.svg': svg([
          ['lid', 'aluminium'],
          ['hinge', 'steel'],
          ['ports', 'copper'],
        ]),
      },
      sphereFiles: [...env.sphereFiles],
      imageFiles: [],
    };
  };

  it('passes valid files', () => {
    const { content } = makeValid();
    const result = checkContent(rawOf(content), assetsOf());
    expect(result.issues).toEqual([]);
    expect(result.content).not.toBeNull();
  });

  it('stops at the shape: no rules run and no content is returned', () => {
    const { content } = makeValid();
    const raw = rawOf(content) as Record<string, unknown>;
    raw['materials'] = { materials: [{ id: 'Not A Slug' }] };
    const result = checkContent(raw as ReturnType<typeof rawOf>, assetsOf());
    expect(result.content).toBeNull();
    expect(codes(result.issues).every((code) => code === 'schema')).toBe(true);
    expect(result.issues[0]?.where).toContain('data/materials.json');
  });

  it('rejects unknown fields', () => {
    const { content } = makeValid();
    const raw = rawOf(content) as Record<string, unknown>;
    raw['objects'] = { objects: [{ ...content.objects[0], extra: 1 }] };
    expect(checkContent(raw as ReturnType<typeof rawOf>, assetsOf()).content).toBeNull();
  });

  it('baseName keeps only the file name', () => {
    expect(baseName('../../assets/objects/object-car.svg')).toBe('object-car.svg');
    expect(baseName('data\\meta.json')).toBe('meta.json');
  });
});
