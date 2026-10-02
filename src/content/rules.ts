/* Limits per object, from Design System */
export const LIMITS = {
  minMaterialsPerObject: 3,
  maxMaterialsPerObject: 8,
  maxHotspotsPerMaterial: 6,
  maxLayersPerMaterial: 5,
  maxRelatedObjects: 4,
  maxWhyCharacters: 180,
  factsPerMaterial: 3,
} as const;

export const OUT_OF_SCOPE_MATERIALS: readonly string[] = [
  'rubber',
  'polymers',
  'plastics',
  'glass',
  'silicon',
  'fabric',
  'leather',
  'wood',
  'foam',
  'organic',
];
