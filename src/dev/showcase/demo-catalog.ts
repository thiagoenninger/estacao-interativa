import type { ContentIndex } from '../../content';
import type { Catalog } from '../../experience';

export function createDemoCatalog(index: ContentIndex): Catalog {
  const hasMaterial = (objectId: string, materialId: string): boolean =>
    index.getOrbit(objectId).some((node) => node.materialId === materialId);

  return {
    hasObject: (objectId) => index.getObject(objectId) !== undefined,
    isMaterialOpen: hasMaterial,
    hasPresentIn: (objectId, materialId, n) =>
      index.getMaterialSheet(objectId, materialId)?.presentIn.some((item) => item.n === n) ?? false,
    isLayerOpen: (objectId, materialId, layerId) =>
      index.getMaterialSheet(objectId, materialId)?.layers.some((item) => item.id === layerId) ??
      false,
    canOpenRelated: (objectId, materialId, relatedId) =>
      relatedId !== objectId &&
      (index
        .getMaterialSheet(objectId, materialId)
        ?.related.some((item) => item.objectId === relatedId) ??
        false) &&
      hasMaterial(relatedId, materialId),
  };
}
