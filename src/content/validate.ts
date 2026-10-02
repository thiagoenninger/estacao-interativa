import { LIMITS, OUT_OF_SCOPE_MATERIALS } from './rules.ts';
import { CONTENT_FILES, type Content, type ContentKey } from './schemas.ts';
import type { SvgIndex } from './svg-index.ts';
import { isDraft } from './text.ts';

export type Severity = 'error' | 'warning';

export interface Issue {
  severity: Severity;
  code: string;
  where: string;
  message: string;
}

/** What the validator needs to know about the files beside the data. */
export interface ContentEnv {
  svgs: Readonly<Record<string, SvgIndex>>;
  sphereFiles: ReadonlySet<string>;
  imageFiles: ReadonlySet<string>;
}

export interface ValidateOptions {
  /**
   * Release mode: a draft marker ("[...]") and an object with fewer than the minimum number
   * of materials are errors. In development they are warnings.
   */
  release?: boolean;
}

const FILE_OF: Record<ContentKey, string> = Object.fromEntries(
  Object.entries(CONTENT_FILES).map(([key, value]) => [key, value.file]),
) as Record<ContentKey, string>;

function where(key: ContentKey, path: string): string {
  return `data/${FILE_OF[key]} › ${path}`;
}

function findDuplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicated = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicated.add(value);
    seen.add(value);
  }
  return [...duplicated];
}

/** Every string of a value, with the path where it was found. */
function* walkStrings(value: unknown, path: string): Generator<[string, string]> {
  if (typeof value === 'string') {
    yield [path, value];
  } else if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) yield* walkStrings(item, `${path}[${index}]`);
  } else if (value !== null && typeof value === 'object') {
    for (const [name, item] of Object.entries(value)) {
      yield* walkStrings(item, path === '' ? name : `${path}.${name}`);
    }
  }
}

/**
 * Step 2 of the validation: the rules that cross files. Integrity problems are always errors.
 * Completeness problems (draft markers, too few materials) are warnings in development and
 * errors in release mode, so the build never ships a placeholder.
 */
export function validateContent(
  content: Content,
  env: ContentEnv,
  options: ValidateOptions = {},
): Issue[] {
  const issues: Issue[] = [];
  const completeness: Severity = options.release ? 'error' : 'warning';
  const add = (severity: Severity, code: string, at: string, message: string): void => {
    issues.push({ severity, code, where: at, message });
  };
  const error = (code: string, at: string, message: string): void =>
    add('error', code, at, message);

  const elementSymbols = new Set(content.elements.map((item) => item.symbol));
  const materialIds = new Set(content.materials.map((item) => item.id));
  const sourceIds = new Set(content.mineralSources.map((item) => item.id));
  const routeIds = new Set(content.routes.map((item) => item.id));
  const objectIds = new Set(content.objects.map((item) => item.id));
  const objectById = new Map(content.objects.map((item) => [item.id, item]));

  // Unique ids.
  const uniques: [ContentKey, string, string[]][] = [
    ['elements', 'elements', content.elements.map((item) => item.symbol)],
    ['materials', 'materials', content.materials.map((item) => item.id)],
    ['mineralSources', 'mineralSources', content.mineralSources.map((item) => item.id)],
    ['routes', 'routes', content.routes.map((item) => item.id)],
    ['objects', 'objects', content.objects.map((item) => item.id)],
    [
      'investigations',
      'investigations',
      content.investigations.map((item) => `${item.objectId}/${item.materialId}`),
    ],
  ];
  for (const [key, path, values] of uniques) {
    for (const value of findDuplicates(values)) {
      error('duplicate-id', where(key, path), `"${value}" appears more than once.`);
    }
  }

  // Materials.
  for (const [index, material] of content.materials.entries()) {
    const at = `materials[${index}] (${material.id})`;
    if (OUT_OF_SCOPE_MATERIALS.includes(material.id)) {
      error(
        'out-of-scope-material',
        where('materials', at),
        `"${material.id}" is out of scope (decision C1) and cannot be in the catalog.`,
      );
    }
    for (const symbol of material.composition) {
      if (!elementSymbols.has(symbol)) {
        error(
          'unknown-element',
          where('materials', at),
          `Element "${symbol}" is not in elements.json.`,
        );
      }
    }
    if (!env.sphereFiles.has(material.sphere)) {
      error(
        'missing-asset',
        where('materials', at),
        `Sphere "${material.sphere}" is not in assets/materials.`,
      );
    }
    if (material.facts.length !== LIMITS.factsPerMaterial) {
      error(
        'facts-count',
        where('materials', at),
        `A sheet has exactly ${LIMITS.factsPerMaterial} facts, found ${material.facts.length}.`,
      );
    }
    if (material.layers.length > LIMITS.maxLayersPerMaterial) {
      error(
        'too-many-layers',
        where('materials', at),
        `At most ${LIMITS.maxLayersPerMaterial} layers, found ${material.layers.length}.`,
      );
    }
    for (const duplicated of findDuplicates(material.layers.map((layer) => layer.id))) {
      error(
        'duplicate-id',
        where('materials', `${at}.layers`),
        `Layer "${duplicated}" appears more than once.`,
      );
    }
    for (const layer of material.layers) {
      const layerAt = `${at}.layers[${layer.id}]`;
      if (layer.image !== null && !env.imageFiles.has(layer.image)) {
        error(
          'missing-asset',
          where('materials', layerAt),
          `Image "${layer.image}" was not found.`,
        );
      }
      for (const id of layer.sourceIds) {
        if (!sourceIds.has(id))
          error('unknown-source', where('materials', layerAt), `Source "${id}" does not exist.`);
      }
      for (const id of layer.routeIds) {
        if (!routeIds.has(id))
          error('unknown-route', where('materials', layerAt), `Route "${id}" does not exist.`);
      }
    }
  }

  // Mineral sources.
  for (const [index, source] of content.mineralSources.entries()) {
    const at = `mineralSources[${index}] (${source.id})`;
    if (source.image !== null && !env.imageFiles.has(source.image)) {
      error('missing-asset', where('mineralSources', at), `Image "${source.image}" was not found.`);
    }
    for (const id of source.constituents) {
      if (!sourceIds.has(id))
        error('unknown-source', where('mineralSources', at), `Constituent "${id}" does not exist.`);
    }
  }

  // Routes.
  for (const [index, route] of content.routes.entries()) {
    const at = `routes[${index}] (${route.id})`;
    if (!materialIds.has(route.materialId)) {
      error(
        'unknown-material',
        where('routes', at),
        `Material "${route.materialId}" does not exist.`,
      );
    }
    for (const id of route.sourceIds) {
      if (!sourceIds.has(id))
        error('unknown-source', where('routes', at), `Source "${id}" does not exist.`);
    }
  }

  // Objects and their drawings.
  for (const [index, object] of content.objects.entries()) {
    const at = `objects[${index}] (${object.id})`;
    const svg = env.svgs[object.svg];
    if (!svg) {
      error(
        'missing-asset',
        where('objects', at),
        `Drawing "${object.svg}" is not in assets/objects.`,
      );
      continue;
    }
    for (const duplicated of svg.duplicates) {
      error(
        'duplicate-id',
        `assets/objects/${object.svg}`,
        `Group "${duplicated}" appears more than once.`,
      );
    }
    const unmapped = new Set<string>();
    for (const group of Object.values(svg.groups)) {
      const material = group.material;
      if (material && !materialIds.has(material) && !OUT_OF_SCOPE_MATERIALS.includes(material)) {
        unmapped.add(material);
      }
    }
    for (const material of unmapped) {
      add(
        'warning',
        'svg-unmapped-material',
        `assets/objects/${object.svg}`,
        `The drawing uses "${material}", which is neither in the catalog nor out of scope.`,
      );
    }
  }

  // Investigations (object × material).
  const byObject = new Map<string, Content['investigations']>();
  for (const [index, item] of content.investigations.entries()) {
    const at = `investigations[${index}] (${item.objectId}/${item.materialId})`;
    const place = where('investigations', at);
    byObject.set(item.objectId, [...(byObject.get(item.objectId) ?? []), item]);

    if (!objectIds.has(item.objectId))
      error('unknown-object', place, `Object "${item.objectId}" does not exist.`);
    if (!materialIds.has(item.materialId))
      error('unknown-material', place, `Material "${item.materialId}" does not exist.`);

    if (item.presentIn.length > LIMITS.maxHotspotsPerMaterial) {
      error(
        'too-many-hotspots',
        place,
        `At most ${LIMITS.maxHotspotsPerMaterial} places, found ${item.presentIn.length}.`,
      );
    }
    for (const duplicated of findDuplicates(item.presentIn.map((entry) => String(entry.n)))) {
      error('duplicate-present-number', place, `Number ${duplicated} is used twice in presentIn.`);
    }
    if (item.why !== null && item.why.length > LIMITS.maxWhyCharacters) {
      error(
        'why-too-long',
        place,
        `"why" has ${item.why.length} characters; the limit is ${LIMITS.maxWhyCharacters}.`,
      );
    }
    if (item.related.length > LIMITS.maxRelatedObjects) {
      error(
        'too-many-related',
        place,
        `At most ${LIMITS.maxRelatedObjects} related objects, found ${item.related.length}.`,
      );
    }
    for (const id of item.related) {
      if (id === item.objectId) {
        error('related-self', place, 'An object cannot be related to itself.');
      } else if (!objectIds.has(id)) {
        error('unknown-object', place, `Related object "${id}" does not exist.`);
      } else if (
        !content.investigations.some(
          (other) => other.objectId === id && other.materialId === item.materialId,
        )
      ) {
        error(
          'related-without-material',
          place,
          `Related object "${id}" does not contain "${item.materialId}".`,
        );
      }
    }

    const material = content.materials.find((candidate) => candidate.id === item.materialId);
    if (material) {
      const known = new Set(material.layers.map((layer) => layer.id));
      for (const layer of item.layers) {
        if (!known.has(layer.id)) {
          error(
            'unknown-layer',
            place,
            `Layer "${layer.id}" is not in the material "${material.id}".`,
          );
        }
        if (layer.image && !env.imageFiles.has(layer.image)) {
          error('missing-asset', place, `Image "${layer.image}" was not found.`);
        }
      }
    }

    const svg = env.svgs[objectById.get(item.objectId)?.svg ?? ''];
    if (svg) {
      for (const entry of item.presentIn) {
        for (const id of entry.groups) {
          const group = svg.groups[id];
          if (!group) {
            error(
              'svg-group-missing',
              place,
              `Group "${id}" is not in the drawing of "${item.objectId}".`,
            );
          } else if (group.material !== item.materialId) {
            error(
              'svg-group-material-mismatch',
              place,
              `Group "${id}" is made of "${group.material ?? 'nothing'}", not "${item.materialId}".`,
            );
          }
        }
      }
    }
  }

  // Order in the orbit and number of materials, per object.
  for (const [objectId, list] of byObject) {
    const at = where('investigations', objectId);
    const orders = list.map((item) => item.order).sort((a, b) => a - b);
    if (orders.some((order, position) => order !== position + 1)) {
      error(
        'order-invalid',
        at,
        `The order of "${objectId}" must be 1..${list.length} without gaps or repeats.`,
      );
    }
    if (list.length > LIMITS.maxMaterialsPerObject) {
      error(
        'too-many-materials',
        at,
        `At most ${LIMITS.maxMaterialsPerObject} materials, found ${list.length}.`,
      );
    }
  }
  for (const object of content.objects) {
    const total = byObject.get(object.id)?.length ?? 0;
    if (total < LIMITS.minMaterialsPerObject) {
      add(
        completeness,
        'too-few-materials',
        where('investigations', object.id),
        `"${object.id}" has ${total} material(s); the minimum is ${LIMITS.minMaterialsPerObject}.`,
      );
    }
  }

  // Draft markers.
  for (const key of Object.keys(CONTENT_FILES) as ContentKey[]) {
    if (key === 'meta') continue;
    for (const [path, value] of walkStrings(content[key], key)) {
      if (isDraft(value)) {
        add(completeness, 'draft-content', where(key, path), `Draft marker ${value}.`);
      }
    }
  }

  return issues;
}

export interface IssueSummary {
  errors: number;
  warnings: number;
  /** Count per code, most frequent first. */
  byCode: [code: string, count: number, severity: Severity][];
}

export function summarizeIssues(issues: readonly Issue[]): IssueSummary {
  const counts = new Map<string, { count: number; severity: Severity }>();
  for (const issue of issues) {
    const current = counts.get(issue.code);
    counts.set(issue.code, { count: (current?.count ?? 0) + 1, severity: issue.severity });
  }
  return {
    errors: issues.filter((issue) => issue.severity === 'error').length,
    warnings: issues.filter((issue) => issue.severity === 'warning').length,
    byCode: [...counts.entries()]
      .map(([code, value]): [string, number, Severity] => [code, value.count, value.severity])
      .sort((a, b) => b[1] - a[1]),
  };
}

export function hasErrors(issues: readonly Issue[]): boolean {
  return issues.some((issue) => issue.severity === 'error');
}
