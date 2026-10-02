export interface SvgGroup {
  material: string | null;
  stroke: string | null;
  level: string | null;
  hotspot: string | null;
}

export interface SvgIndex {
  groups: Record<string, SvgGroup>;
  duplicates: string[];
}

const GROUP_TAG = /<g\b([^>]*)>/g;
const ATTRIBUTE = /([\w:-]+)="([^"]*)"/g;

function readAttributes(source: string): Map<string, string> {
  const attributes = new Map<string, string>();
  for (const match of source.matchAll(ATTRIBUTE)) {
    if (match[1] !== undefined && match[2] !== undefined) {
      attributes.set(match[1], match[2]);
    }
  }
  return attributes;
}

export function parseSvg(source: string): SvgIndex {
  const groups: Record<string, SvgGroup> = {};
  const duplicates: string[] = [];
  let level: string | null = null;

  for (const tag of source.matchAll(GROUP_TAG)) {
    const attributes = readAttributes(tag[1] ?? '');
    const id = attributes.get('id');
    if (!id) continue;
    if (id.startsWith('level-')) {
      level = id;
      continue;
    }
    if (Object.hasOwn(groups, id)) duplicates.push(id);
    groups[id] = {
      material: attributes.get('data-material') ?? null,
      stroke: attributes.get('data-stroke') ?? null,
      level,
      hotspot: attributes.get('data-hotspot') ?? null,
    };
  }
  return { groups, duplicates };
}
