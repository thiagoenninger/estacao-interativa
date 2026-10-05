import { buildEnv } from '@/content/check.ts';
import type { Content } from '@/content/schemas.ts';
import type { ContentEnv } from '@/content/validate.ts';

export function svg(groups: [id: string, material: string][]): string {
  const body = groups
    .map(
      ([id, material]) =>
        `<g id="${id}" data-material="${material}" data-stroke="line"><path d="M0 0"/></g>`,
    )
    .join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
<g id="level-0-universe">
${body}
</g>
</svg>`;
}

function material(id: string, name: string, composition: string[]): Content['materials'][number] {
  return {
    id,
    name,
    category: 'metal',
    family: 'Família',
    symbol: composition.join(''),
    classification: 'Classe',
    composition,
    sphere: `material-${id}-sphere.png`,
    facts: [
      { label: 'Densidade', value: '1 g/cm³' },
      { label: 'Ponto de fusão', value: '2 °C' },
      { label: 'Origem principal', value: 'Rocha' },
    ],
    layers: [
      {
        id: 'origin',
        title: 'De onde vem?',
        text: 'Texto de origem.',
        image: null,
        credit: null,
        sourceIds: ['rock'],
        routeIds: [],
      },
      {
        id: 'production',
        title: 'Como é produzido?',
        text: null,
        image: null,
        credit: null,
        sourceIds: [],
        routeIds: ['route-one'],
      },
    ],
  };
}

function investigation(
  objectId: string,
  materialId: string,
  order: number,
  group: string,
  related: string[],
): Content['investigations'][number] {
  return {
    objectId,
    materialId,
    order,
    presentIn: [{ n: 1, label: 'Parte', groups: [group] }],
    why: 'Porque é leve e resistente.',
    layers: [],
    related,
  };
}

export function makeValid(): { content: Content; env: ContentEnv } {
  const content: Content = {
    meta: { schemaVersion: 1, language: 'pt-BR' },
    elements: [
      { symbol: 'Al', name: 'Alumínio', atomicNumber: 13 },
      { symbol: 'Fe', name: 'Ferro', atomicNumber: 26 },
      { symbol: 'C', name: 'Carbono', atomicNumber: 6 },
      { symbol: 'Cu', name: 'Cobre', atomicNumber: 29 },
    ],
    materials: [
      material('aluminium', 'Alumínio', ['Al']),
      material('steel', 'Aço', ['Fe', 'C']),
      material('copper', 'Cobre', ['Cu']),
    ],
    mineralSources: [
      {
        id: 'rock',
        name: 'Rocha',
        kind: 'rock',
        formula: null,
        constituents: [],
        image: null,
        occurrence: null,
      },
    ],
    routes: [
      {
        id: 'route-one',
        materialId: 'aluminium',
        sourceIds: ['rock'],
        steps: [{ kind: 'extraction', label: 'Mineração' }],
        intermediates: [],
      },
    ],
    objects: [
      {
        id: 'bicycle',
        name: 'Bicicleta',
        svg: 'object-bicycle.svg',
        plane: 'near',
        position: { x: 560, y: 640 },
      },
      {
        id: 'laptop',
        name: 'Notebook',
        svg: 'object-laptop.svg',
        plane: 'mid',
        position: { x: 1210, y: 520 },
      },
    ],
    investigations: [
      investigation('bicycle', 'aluminium', 1, 'frame', ['laptop']),
      investigation('bicycle', 'steel', 2, 'fork', ['laptop']),
      investigation('bicycle', 'copper', 3, 'cables', ['laptop']),
      investigation('laptop', 'aluminium', 1, 'lid', ['bicycle']),
      investigation('laptop', 'steel', 2, 'hinge', ['bicycle']),
      investigation('laptop', 'copper', 3, 'ports', ['bicycle']),
    ],
  };
  const env = buildEnv({
    objectSvgs: {
      'object-bicycle.svg': svg([
        ['frame', 'aluminium'],
        ['fork', 'steel'],
        ['cables', 'copper'],
        ['tires', 'rubber'],
      ]),
      'object-laptop.svg': svg([
        ['lid', 'aluminium'],
        ['hinge', 'steel'],
        ['ports', 'copper'],
        ['screen', 'glass'],
      ]),
    },
    sphereFiles: [
      'material-aluminium-sphere.png',
      'material-steel-sphere.png',
      'material-copper-sphere.png',
    ],
    imageFiles: ['photo-one-01.jpg'],
  });
  return { content, env };
}
