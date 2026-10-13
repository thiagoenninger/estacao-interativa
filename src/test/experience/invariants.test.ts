import { describe, expect, it } from 'vitest';
import { loadContent } from '@/content';
import { createCatalog, type Catalog } from '@/experience/catalog.ts';
import type { ExperienceEvent } from '@/experience/events.ts';
import { INITIAL_STATE, MAX_TRAIL_NODES, type ExperienceState } from '@/experience/state.ts';
import { transition } from '@/experience/transitions.ts';
import { WORLD, deepFreeze, makeCatalog } from './world.ts';

/** What must be true about every state the machine can reach. Returns the broken rules. */
export function brokenRules(state: ExperienceState, catalog: Catalog): string[] {
  const broken: string[] = [];
  const check = (rule: string, ok: boolean) => {
    if (!ok) broken.push(`${rule} (${JSON.stringify(state)})`);
  };
  const { level, objectId, materialId, layerId, presentInN, trail, warning } = state;
  const last = trail[trail.length - 1];

  check('the trail has at most four nodes', trail.length <= MAX_TRAIL_NODES);
  if (level === 'universe') {
    check('the universe is empty', objectId === null && materialId === null && layerId === null);
    check(
      'the universe has no highlight, trail or warning',
      presentInN === null && trail.length === 0 && !warning,
    );
    return broken;
  }
  check(
    'away from the universe there is an object',
    objectId !== null && catalog.hasObject(objectId),
  );
  check(
    'the trail ends at what is on screen',
    last?.kind === 'object' ? last.id === objectId : level !== 'object' && last?.id === materialId,
  );
  if (level === 'object') {
    check(
      'level 03 has no material, layer or highlight',
      materialId === null && layerId === null && presentInN === null,
    );
    check(
      'level 03 ends the trail with the object',
      last?.kind === 'object' && last.id === objectId,
    );
  } else {
    check(
      'the material is open',
      objectId !== null && materialId !== null && catalog.isMaterialOpen(objectId, materialId),
    );
    if (level === 'material') {
      check('the material level has no layer', layerId === null);
      check(
        'the highlighted item exists',
        presentInN === null ||
          (objectId !== null &&
            materialId !== null &&
            catalog.hasPresentIn(objectId, materialId, presentInN)),
      );
    } else {
      check(
        'the layer is open',
        objectId !== null &&
          materialId !== null &&
          layerId !== null &&
          catalog.isLayerOpen(objectId, materialId, layerId),
      );
      check('the layer level has no highlight', presentInN === null);
    }
  }
  return broken;
}

/** Small seeded random generator, so a failure can be repeated. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomEvents(
  objects: string[],
  materials: string[],
  layers: string[],
  count: number,
  random: () => number,
): ExperienceEvent[] {
  const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)]!;
  const events: ExperienceEvent[] = [];
  for (let i = 0; i < count; i += 1) {
    const roll = random();
    if (roll < 0.2) events.push({ type: 'select-object', objectId: pick(objects) });
    else if (roll < 0.4) events.push({ type: 'select-material', materialId: pick(materials) });
    else if (roll < 0.5)
      events.push({ type: 'select-present-in', n: 1 + Math.floor(random() * 7) });
    else if (roll < 0.62) events.push({ type: 'open-layer', layerId: pick(layers) });
    else if (roll < 0.72) events.push({ type: 'open-related', objectId: pick(objects) });
    else if (roll < 0.8) events.push({ type: 'back' });
    else if (roll < 0.85) events.push({ type: 'home' });
    else if (roll < 0.9) events.push({ type: 'touch-background' });
    else if (roll < 0.93) events.push({ type: 'touch-warning' });
    else if (roll < 0.97) events.push({ type: 'idle-warn' });
    else events.push({ type: 'idle-return' });
  }
  return events;
}

function fuzz(catalog: Catalog, objects: string[], materials: string[], layers: string[]) {
  const random = mulberry32(20261009);
  let visited = 0;
  const reached = new Set<string>();
  for (let sequence = 0; sequence < 300; sequence += 1) {
    let state: ExperienceState = INITIAL_STATE;
    for (const event of randomEvents(
      [...objects, 'ghost'],
      [...materials, 'ghost'],
      [...layers, 'ghost'],
      80,
      random,
    )) {
      deepFreeze(state);
      state = transition(state, event, catalog);
      const broken = brokenRules(state, catalog);
      if (broken.length > 0) {
        throw new Error(`After ${JSON.stringify(event)}: ${broken.join('; ')}`);
      }
      visited += 1;
      reached.add(state.level);
    }
  }
  return { visited, reached };
}

describe('invariants over random visits', () => {
  it('hold in the test world, for 24 000 events', () => {
    const { visited, reached } = fuzz(
      makeCatalog(WORLD),
      Object.keys(WORLD),
      ['aluminium', 'steel', 'rubber'],
      ['origin', 'production', 'uses'],
    );
    expect(visited).toBe(24_000);
    expect([...reached].sort()).toEqual(['layer', 'material', 'object', 'universe']);
  });

  it('hold with the real content too', () => {
    const index = loadContent().index!;
    const { reached } = fuzz(
      createCatalog(index),
      index.listObjects().map((item) => item.id),
      index.listMaterials().map((item) => item.id),
      ['origin', 'production', 'uses', 'curiosities'],
    );
    expect(reached.has('universe')).toBe(true);
  });

  it('the checker catches a broken state', () => {
    const catalog = makeCatalog(WORLD);
    const broken: ExperienceState = { ...INITIAL_STATE, level: 'material', objectId: 'bicycle' };
    expect(brokenRules(broken, catalog).length).toBeGreaterThan(0);
  });
});
