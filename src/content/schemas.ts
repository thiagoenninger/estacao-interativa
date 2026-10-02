import { z } from 'zod';

/* Content model: normalized files, one schema per file */

const slug = z
  .string()
  .regex(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/, 'use lowercase letters, digits and hyphens');

const fileName = z
  .string()
  .regex(
    /^[a-z][a-z0-9]*(-[a-z0-9]+)*\.(svg|png|jpg)$/,
    'use lowercase, hyphens and a .svg, .png or .jpg extension',
  );

const text = z.string().min(1);

export const MATERIAL_CATEGORIES = ['metal', 'alloy', 'ceramic', 'refractory', 'mineral'] as const;
export const MINERAL_SOURCE_KINDS = ['mineral', 'ore', 'rock', 'brine', 'raw-material'] as const;
export const ROUTE_STEP_KINDS = [
  'extraction',
  'beneficiation',
  'refining',
  'transformation',
  'recycling',
] as const;
export const OBJECT_PLANES = ['near', 'mid', 'far'] as const;

export const MetaSchema = z.strictObject({
  schemaVersion: z.literal(1),
  language: z.literal('pt-BR'),
});

export const ElementSchema = z.strictObject({
  symbol: z.string().regex(/^[A-Z][a-z]?$/, 'a chemical symbol, like Al or Fe'),
  name: text,
  atomicNumber: z.number().int().min(1).max(118),
});

export const FactSchema = z.strictObject({ label: text, value: text });

export const LayerSchema = z.strictObject({
  id: slug,
  title: text,
  text: text.nullable(),
  image: fileName.nullable(),
  credit: text.nullable(),
  sourceIds: z.array(slug).default([]),
  routeIds: z.array(slug).default([]),
});

export const LayerOverrideSchema = z.strictObject({
  id: slug,
  text: text.nullable().optional(),
  image: fileName.nullable().optional(),
  credit: text.nullable().optional(),
});

export const MaterialSchema = z.strictObject({
  id: slug,
  name: text,
  category: z.enum(MATERIAL_CATEGORIES),
  family: text,
  symbol: text,
  classification: text,
  /* Chemical symbols of the elements */
  composition: z.array(z.string()).min(1),
  sphere: fileName,
  facts: z.array(FactSchema),
  layers: z.array(LayerSchema),
});

export const MineralSourceSchema = z.strictObject({
  id: slug,
  name: text,
  kind: z.enum(MINERAL_SOURCE_KINDS),
  formula: text.nullable(),
  /** For an ore or a rock: the minerals that compose it. */
  constituents: z.array(slug).default([]),
  image: fileName.nullable(),
  occurrence: text.nullable(),
});

export const RouteSchema = z.strictObject({
  id: slug,
  materialId: slug,
  sourceIds: z.array(slug).default([]),
  steps: z.array(z.strictObject({ kind: z.enum(ROUTE_STEP_KINDS), label: text })).min(1),
  intermediates: z.array(text).default([]),
});

export const ObjectSchema = z.strictObject({
  id: slug,
  name: text,
  svg: fileName,
  plane: z.enum(OBJECT_PLANES),
  position: z.strictObject({
    x: z.number().int().min(0).max(1920),
    y: z.number().int().min(0).max(1080),
  }),
});

export const PresentInSchema = z.strictObject({
  /** Number shown in the hotspot label and in the panel list. */
  n: z.number().int().min(1),
  label: text,
  /** Ids of groups in the object drawing. */
  groups: z.array(slug).min(1),
});

export const InvestigationSchema = z.strictObject({
  objectId: slug,
  materialId: slug,
  /** Position in the orbit, starting at 1 (the top). */
  order: z.number().int().min(1),
  presentIn: z.array(PresentInSchema),
  why: text.nullable(),
  layers: z.array(LayerOverrideSchema).default([]),
  related: z.array(slug).default([]),
});

/* One schema per data file. The file name is the key of CONTENT_FILES */
export const CONTENT_FILES = {
  meta: { file: 'meta.json', schema: MetaSchema },
  elements: { file: 'elements.json', schema: z.strictObject({ elements: z.array(ElementSchema) }) },
  materials: {
    file: 'materials.json',
    schema: z.strictObject({ materials: z.array(MaterialSchema) }),
  },
  mineralSources: {
    file: 'mineral-sources.json',
    schema: z.strictObject({ mineralSources: z.array(MineralSourceSchema) }),
  },
  routes: { file: 'routes.json', schema: z.strictObject({ routes: z.array(RouteSchema) }) },
  objects: { file: 'objects.json', schema: z.strictObject({ objects: z.array(ObjectSchema) }) },
  investigations: {
    file: 'investigations.json',
    schema: z.strictObject({ investigations: z.array(InvestigationSchema) }),
  },
} as const;

export type ContentKey = keyof typeof CONTENT_FILES;

export type Meta = z.infer<typeof MetaSchema>;
export type Element = z.infer<typeof ElementSchema>;
export type Fact = z.infer<typeof FactSchema>;
export type Layer = z.infer<typeof LayerSchema>;
export type LayerOverride = z.infer<typeof LayerOverrideSchema>;
export type Material = z.infer<typeof MaterialSchema>;
export type MineralSource = z.infer<typeof MineralSourceSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type ObjectItem = z.infer<typeof ObjectSchema>;
export type PresentIn = z.infer<typeof PresentInSchema>;
export type Investigation = z.infer<typeof InvestigationSchema>;

export interface Content {
  meta: Meta;
  elements: Element[];
  materials: Material[];
  mineralSources: MineralSource[];
  routes: Route[];
  objects: ObjectItem[];
  investigations: Investigation[];
}

export type RawContent = Record<ContentKey, unknown>;
