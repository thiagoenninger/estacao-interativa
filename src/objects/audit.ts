import { LIMITS } from '../content/rules.ts';
import type { Issue } from '../content/validate.ts';
import { OBJECT_MAX_BOX } from '../design-system/measures.ts';
import {
  LEVEL_IDS,
  MAX_INTERNAL_GROUPS_PER_MATERIAL,
  MIN_STROKE_GAP,
  STROKE_KINDS,
  UNIVERSE_SIZE,
} from './drawing-measures.ts';
import {
  parseSvgTree,
  readViewBox,
  SvgSyntaxError,
  walkElements,
  type SvgElement,
} from './svg-tree.ts';

/* Audit of and objetct drawing against the rules of Foundation 07 and decision C12 */

export type ObjectPlane = keyof typeof UNIVERSE_SIZE;

export interface AuditOptions {
  plane?: ObjectPlane;
}

export interface LevelStats {
  id: string;
  groups: number;
  shapes: number;
}

export interface DrawingStats {
  viewBox: { width: number; height: number };
  levels: LevelStats[];
  materials: string[];
  hotspots: number;
}

export interface AuditResults {
  issues: Issue[];
  stats: DrawingStats | null;
}

const FILE_NAME = /^object-[a-z][a-z0-9]*(-[a-z0-9]+)*\.svg$/;
const SLUG = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const HOTSPOT = /^\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$/;

const SHAPE_TAGS = new Set(['path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon']);
const TEXT_TAGS = new Set(['title', 'desc']);
const FORBIDDEN_ATTRIBUTES = ['transform', 'mask', 'filter', 'clip-path'];

const IGNORED_ATTRIBUTES = [
  'stroke-width',
  'stroke-dasharray',
  'stroke-dashoffset',
  'vector-effect',
  'opacity',
  'stroke-opacity',
  'fill-opacity',
];

const ROOT_REQUIRED: Record<string, string> = {
  fill: 'none',
  stroke: 'currentColor',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
};

interface Round {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  group: string;
}

function readRound(shape: SvgElement, group: string): Round | null {
  const cx = Number(shape.attributes['cx'] ?? 0);
  const cy = Number(shape.attributes['cy'] ?? 0);
  if (shape.tag === 'circle') {
    const r = Number(shape.attributes['r']);
    return Number.isFinite(r) && r > 0 ? { cx, cy, rx: r, ry: r, group } : null;
  }
  if (shape.tag === 'elipse') {
    const rx = Number(shape.attributes['rx']);
    const ry = Number(shape.attributes['ry']);
    return rx > 0 && ry > 0 ? { cx, cy, rx, ry, group } : null;
  }
  return null;
}

function findDenseConcentric(rounds: Round[], scale: number): [Round, Round, number][] {
  const found: [Round, Round, number][] = [];
  for (const [index, first] of rounds.entries()) {
    for (const second of rounds.slice(index + 1)) {
      if (Math.abs(first.cx - second.cx) > 0.01 || Math.abs(first.cy - second.cy) > 0.01) continue;
      const gap = Math.min(Math.abs(first.rx - second.rx), Math.abs(first.ry - second.ry)) * scale;
      if (gap > 0.01 && gap < MIN_STROKE_GAP) found.push([first, second, gap]);
    }
  }
  return found;
}

export function auditDrawing(
  fileName: string,
  source: string,
  options: AuditOptions = {},
): AuditResults {
  const issues: Issue[] = [];
  const file = `assets/objects/${fileName}`;
  const add = (severity: Issue['severity'], code: string, where: string, message: string) =>
    issues.push({ severity, code, where: where ? `${file} › ${where}` : file, message });

  if (!FILE_NAME.test(fileName)) {
    add('error', 'file-name', '', 'Use object-<name>.svg: lowercase, digits and hyphens.');
  }

  let root: SvgElement;
  try {
    root = parseSvgTree(source);
  } catch (cause) {
    if (!(cause instanceof SvgSyntaxError)) throw cause;
    add('error', 'svg-syntax', '', cause.message);
    return { issues, stats: null };
  }

  const viewBox = readViewBox(root);
  if (!viewBox) {
    add(
      'error',
      'root-viewbox',
      'svg',
      'The root needs a viewBox with four numbers, like "0 0 700 460".',
    );
  }

  for (const [name, expected] of Object.entries(ROOT_REQUIRED)) {
    if (root.attributes[name] !== expected) {
      add('error', 'root-attribute', 'svg', `The root needs ${name}="${expected}".`);
    }
  }

  for (const element of walkElements(root)) {
    const where =
      element === root
        ? 'svg'
        : `<${element.tag}${element.attributes['id'] ? ` id="${element.attributes['id']}"` : ''}>`;
    const names = Object.keys(element.attributes);

    for (const name of FORBIDDEN_ATTRIBUTES) {
      if (names.includes(name)) {
        add(
          'error',
          'forbidden-attribute',
          where,
          `${name} is not allowed: the app only switches groups on and off.`,
        );
      }
    }
    if (element !== root) {
      const stroke = element.attributes['stroke'];
      if (stroke !== undefined && stroke !== 'currentColor') {
        add(
          'error',
          'fixed-color',
          where,
          `stroke="${stroke}": no fixed colors, the app sets the ink and the oxide.`,
        );
      }
      const fill = element.attributes['fill'];
      if (fill !== undefined && fill !== 'none' && fill !== 'currentColor') {
        add(
          'error',
          'fixed-color',
          where,
          `fill="${fill}": no fixed colors, the app sets the ink and the oxide.`,
        );
      }
    }

    const ignored = IGNORED_ATTRIBUTES.filter((name) => names.includes(name));
    if (element === root) {
      for (const name of ['width', 'height']) if (names.includes(name)) ignored.push(name);
    }

    if (ignored.length > 0) {
      add(
        'warning',
        'ignored-attribute',
        where,
        `${ignored.join(', ')}: the app sets this by CSS, remove it from the file.`,
      );
    }

    if (names.includes('style')) {
      add(
        'warning',
        'inline-style',
        where,
        'style is ignored: levels and groups are switched by the app, remove it.',
      );
    }

    if (element === root) {
      for (const name of ['role', 'aria-label', 'aria-labelledby']) {
        if (names.includes(name)) {
          add(
            'warning',
            'accessible-name-in-file',
            where,
            `${name}: the name comes from the content, remove it.`,
          );
        }
      }
    }

    if (element !== root) {
      if (TEXT_TAGS.has(element.tag)) {
        add(
          'warning',
          'accessible-name-in-file',
          where,
          `<${element.tag}>: the name comes from the content, remove it.`,
        );
      } else if (element.tag !== 'g' && !SHAPE_TAGS.has(element.tag)) {
        add(
          'error',
          'forbidden-element',
          where,
          `<${element.tag}> is not allowed: only groups and basic shapes.`,
        );
      }
    }
  }

  const rootChildren = root.children.filter((child) => !TEXT_TAGS.has(child.tag));
  const levels: SvgElement[] = [];
  for (const child of rootChildren) {
    const id = child.attributes['id'];
    if (child.tag !== 'g') {
      if (SHAPE_TAGS.has(child.tag))
        add(
          'error',
          'loose-shape',
          `<${child.tag}>`,
          'Every stroke belongs to a named group inside a level.',
        );
      continue;
    }
    if (id !== undefined && (LEVEL_IDS as readonly string[]).includes(id)) levels.push(child);
    else
      add(
        'error',
        'level-unknown',
        `<g id="${id ?? ''}">`,
        `A group directly under the root must be one of ${LEVEL_IDS.join(', ')}.`,
      );
  }
  for (const id of LEVEL_IDS) {
    if (!levels.some((level) => level.attributes['id'] === id))
      add('error', 'level-missing', id, `The level ${id} does not exist.`);
  }
  const foundOrder = levels.map((level) => level.attributes['id'] ?? '');
  const expectedOrder = LEVEL_IDS.filter((id) => foundOrder.includes(id));
  if (foundOrder.join() !== expectedOrder.join()) {
    add(
      'error',
      'level-order',
      'svg',
      `The levels must come in this order: ${LEVEL_IDS.join(', ')}.`,
    );
  }

  // Component groups.
  const seenIds = new Set<string>();
  const materials = new Set<string>();
  const hotspotsByMaterial = new Map<string, number>();
  const internalByMaterial = new Map<string, number>();
  const levelStats: LevelStats[] = [];
  let hotspots = 0;

  for (const level of levels) {
    const levelId = level.attributes['id'] ?? '';
    let groups = 0;
    let shapes = 0;

    for (const group of level.children) {
      if (group.tag !== 'g') {
        if (SHAPE_TAGS.has(group.tag))
          add(
            'error',
            'loose-shape',
            `${levelId} › <${group.tag}>`,
            'Every stroke belongs to a named group.',
          );
        continue;
      }
      groups += 1;
      const id = group.attributes['id'];
      const where = `group "${id ?? ''}"`;

      if (id === undefined || !SLUG.test(id)) {
        add(
          'error',
          'group-id',
          `${levelId} › ${where}`,
          'Every group needs an id in lowercase with hyphens.',
        );
      } else if (seenIds.has(id)) {
        add('error', 'group-duplicate', where, `The id "${id}" appears more than once.`);
      } else {
        seenIds.add(id);
      }

      const material = group.attributes['data-material'];
      if (material === undefined || !SLUG.test(material)) {
        add(
          'error',
          'group-material',
          where,
          'Every group needs data-material with the slug of its material.',
        );
      } else {
        materials.add(material);
      }

      const stroke = group.attributes['data-stroke'];
      if (!(STROKE_KINDS as readonly (string | undefined)[]).includes(stroke)) {
        add(
          'error',
          'group-stroke',
          where,
          `data-stroke must be one of ${STROKE_KINDS.join(', ')}.`,
        );
      }

      for (const inner of walkElements(group)) {
        if (inner === group) continue;
        if (inner.tag === 'g')
          add('error', 'nested-group', where, 'A component group cannot hold another group.');
        else if (SHAPE_TAGS.has(inner.tag)) shapes += 1;
      }

      const hotspot = group.attributes['data-hotspot'];
      if (hotspot !== undefined) {
        hotspots += 1;
        if (!HOTSPOT.test(hotspot)) {
          add(
            'error',
            'hotspot-format',
            where,
            `data-hotspot="${hotspot}" must be "x,y", two numbers in viewBox units.`,
          );
        } else if (viewBox) {
          const [x = 0, y = 0] = hotspot.split(',').map(Number);
          if (
            x < viewBox.x ||
            x > viewBox.x + viewBox.width ||
            y < viewBox.y ||
            y > viewBox.y + viewBox.height
          ) {
            add(
              'error',
              'hotspot-outside',
              where,
              `The hotspot ${hotspot} is outside the viewBox.`,
            );
          }
        }
        if (material) hotspotsByMaterial.set(material, (hotspotsByMaterial.get(material) ?? 0) + 1);
      }
      if (levelId === 'level-2-internal' && material) {
        internalByMaterial.set(material, (internalByMaterial.get(material) ?? 0) + 1);
      }
    }
    levelStats.push({ id: levelId, groups, shapes });
  }

  for (const [material, count] of hotspotsByMaterial) {
    if (count > LIMITS.maxHotspotsPerMaterial) {
      add(
        'error',
        'hotspot-too-many',
        `material "${material}"`,
        `${count} hotspots; the limit is ${LIMITS.maxHotspotsPerMaterial} per material.`,
      );
    }
  }
  for (const [material, count] of internalByMaterial) {
    if (count > MAX_INTERNAL_GROUPS_PER_MATERIAL) {
      add(
        'error',
        'level-2-too-many',
        `material "${material}"`,
        `${count} internal groups; the limit is ${MAX_INTERNAL_GROUPS_PER_MATERIAL} per material.`,
      );
    }
  }

  // Density: parallel strokes closer than 6 px. Only concentric circles and ellipses are measured.
  if (viewBox) {
    const roundsOf = (...ids: string[]) =>
      levels
        .filter((level) => ids.includes(level.attributes['id'] ?? ''))
        .flatMap((level) =>
          level.children.flatMap((group) =>
            [...walkElements(group)].flatMap((shape) => {
              const round = readRound(shape, group.attributes['id'] ?? '');
              return round ? [round] : [];
            }),
          ),
        );
    const longest = Math.max(viewBox.width, viewBox.height);
    const universeSize = UNIVERSE_SIZE[options.plane ?? 'far'];
    const checks: [string, Round[], number][] = [
      [`${universeSize} px in the universe`, roundsOf('level-0-universe'), universeSize / longest],
      [
        `${OBJECT_MAX_BOX.width} × ${OBJECT_MAX_BOX.height} px selected`,
        roundsOf('level-0-universe', 'level-1-structure'),
        Math.min(OBJECT_MAX_BOX.width / viewBox.width, OBJECT_MAX_BOX.height / viewBox.height),
      ],
    ];
    for (const [size, rounds, scale] of checks) {
      for (const [first, second, gap] of findDenseConcentric(rounds, scale)) {
        add(
          'warning',
          'dense-strokes',
          `groups "${first.group}" and "${second.group}"`,
          `Concentric strokes only ${gap.toFixed(1)} px apart at ${size}; the minimum is ${MIN_STROKE_GAP} px.`,
        );
      }
    }
  }

  return {
    issues,
    stats: viewBox
      ? {
          viewBox: { width: viewBox.width, height: viewBox.height },
          levels: levelStats,
          materials: [...materials].sort(),
          hotspots,
        }
      : null,
  };
}
