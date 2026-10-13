import type { ContentIndex } from '../content';

export interface Catalog {
  hasObject(objectId: string): boolean;
  isMaterialOpen(objectId: string, materialId: string): boolean;
  hasPresentIn(objectId: string, materialId: string, n: number): boolean;
  isLayerOpen(objectId: string, materialId: string, layerId: string): boolean;
  canOpenRelated(objectId: string, materialId: string, relatedId: string): boolean;
}

export function createCatalog(index: ContentIndex): Catalog {
  const isMaterialOpen = (objectId: string, materialId: string): boolean =>
    index
      .getOrbit(objectId)
      .some((node) => node.materialId === materialId && node.state === 'enabled');

  return {
    hasObject: (objectId) => index.getObject(objectId) !== undefined,
    isMaterialOpen,
    hasPresentIn: (objectId, materialId, n) =>
      index.getMaterialSheet(objectId, materialId)?.presentIn.some((item) => item.n === n) ?? false,
    isLayerOpen: (objectId, materialId, layerId) =>
      index
        .getMaterialSheet(objectId, materialId)
        ?.layers.some((layer) => layer.id === layerId && layer.status === 'available') ?? false,
    canOpenRelated: (objectId, materialId, relatedId) =>
      relatedId !== objectId &&
      (index
        .getMaterialSheet(objectId, materialId)
        ?.related.some((item) => item.objectId === relatedId) ??
        false) &&
      isMaterialOpen(relatedId, materialId),
  };
}
