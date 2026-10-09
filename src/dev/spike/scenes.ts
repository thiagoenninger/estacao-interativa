/**
 * The scenes of the performance test. Every scene shows the same page (the universe floating, the
 * selected object, the orbit); what changes is what moves besides the floating, so the cost of
 * each thing shows up as the difference from the "idle" scene.
 */
export const SCENES = [
  {
    id: 'idle',
    label: 'Espera (M08)',
    animates: 'transform',
    description:
      'Só a flutuação dos objetos do universo. É o estado em que a estação passa a maior parte do tempo.',
  },
  {
    id: 'selected',
    label: 'Objeto selecionado',
    animates: 'transform',
    description:
      'O objeto selecionado com a órbita e as esferas, e o universo esmaecido flutuando. Nada mais se move: é a base de comparação das cenas seguintes.',
  },
  {
    id: 'stroke-width',
    label: 'Espessura do traço',
    animates: 'stroke-width',
    description: 'Os grupos do material passam de 1× a 1,35× a espessura do traço, como no M02.',
  },
  {
    id: 'stroke-opacity',
    label: 'Recuo por grupo',
    animates: 'stroke-opacity',
    description:
      'Os grupos sem o material passam de 100% a 20% de opacidade do traço, grupo a grupo, como no M02.',
  },
  {
    id: 'recede-copy',
    label: 'Recuo por cópia',
    animates: 'opacity',
    description:
      'Mesmo resultado visual, mas cruzando a opacidade de duas cópias do desenho (alternativa ao recuo por grupo).',
  },
  {
    id: 'ring-draw',
    label: 'Anel desenhado',
    animates: 'stroke-dashoffset',
    description: 'O anel orbital e o arco ativo se desenham (stroke draw de 480 ms).',
  },
  {
    id: 'm02',
    label: 'M02 completa',
    animates: 'tudo do M02',
    description:
      'A seleção do material inteira: traço, recuo por grupo, anel, órbita deslizando, universo recuando e painel entrando. Repetida sem pausa: pior caso.',
  },
  {
    id: 'm02-copy',
    label: 'M02 com recuo por cópia',
    animates: 'tudo do M02, recuo por cópia',
    description:
      'A mesma M02, trocando o traço e o recuo por grupo pelo cruzamento de duas cópias do desenho.',
  },
] as const;

export type SceneId = (typeof SCENES)[number]['id'];

export const SCENE_IDS = SCENES.map((scene) => scene.id) as readonly SceneId[];

export function isKnownScene(id: string): id is SceneId {
  return (SCENE_IDS as readonly string[]).includes(id);
}

export const EFFECTS = [
  'stroke-width',
  'recede-group',
  'recede-copy',
  'ring-draw',
  'arc-heat',
  'orbit-slide',
  'universe-recede',
  'panel',
] as const;

export type Effect = (typeof EFFECTS)[number];

const EFFECTS_OF: Record<SceneId, readonly Effect[]> = {
  idle: [],
  selected: [],
  'stroke-width': ['stroke-width'],
  'stroke-opacity': ['recede-group'],
  'recede-copy': ['recede-copy'],
  'ring-draw': ['ring-draw'],
  m02: ['stroke-width', 'recede-group', 'arc-heat', 'orbit-slide', 'universe-recede', 'panel'],
  'm02-copy': ['recede-copy', 'arc-heat', 'orbit-slide', 'universe-recede', 'panel'],
};

export function effectsOf(id: SceneId): readonly Effect[] {
  return EFFECTS_OF[id];
}

export function showsSelection(id: SceneId): boolean {
  return id !== 'idle';
}

export function usesPhases(id: SceneId): boolean {
  return effectsOf(id).length > 0;
}

export const PHASE_INTERVAL_MS = 1700;

export const WARMUP_MS = 1500;
export const MEASURE_MS = 10000;

export const SPIKE_OBJECT_ID = 'bicycle';
export const SPIKE_MATERIAL = 'steel';
