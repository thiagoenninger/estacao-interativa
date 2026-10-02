import type {
  Content,
  Fact,
  Investigation,
  Material,
  MineralSource,
  ObjectItem,
  PresentIn,
  Route,
} from './schemas.ts';
import { hasText } from './text.ts';

export type OrbitState = 'enabled' | 'disabled';
export type LayerStatus = 'available' | 'coming-soon';

/** One material around an object. A disabled node is shown but cannot be opened. */
export interface OrbitNode {
  materialId: string;
  name: string;
  sphere: string;
  order: number;
  state: OrbitState;
}

export interface SheetLayer {
  id: string;
  title: string;
  text: string | null;
  image: string | null;
  credit: string | null;
  status: LayerStatus;
  sources: MineralSource[];
  routes: Route[];
}

/** Everything the Panel needs to show one material inside one object. */
export interface MaterialSheet {
  objectId: string;
  materialId: string;
  name: string;
  family: string;
  symbol: string;
  atomicNumber: number | null;
  classification: string;
  facts: Fact[];
  presentIn: PresentIn[];
  why: string | null;
  layers: SheetLayer[];
  related: { objectId: string; name: string }[];
  complete: boolean;
}

export interface ObjectView {
  object: ObjectItem;
  nodes: OrbitNode[];
}

export interface ContentIndex {
  listObjects(): ObjectItem[];
  getObject(id: string): ObjectItem | undefined;
  listMaterials(): Material[];
  getMaterial(id: string): Material | undefined;
  getOrbit(objectId: string): OrbitNode[];
  getObjectView(objectId: string): ObjectView | undefined;
  getMaterialSheet(objectId: string, materialId: string): MaterialSheet | undefined;
  objectsWithMaterial(materialId: string): ObjectItem[];
  getRoute(id: string): Route | undefined;
  getSource(id: string): MineralSource | undefined;
  routesOfMaterial(materialId: string): Route[];
}

function isComplete(material: Material, item: Investigation): boolean {
  return (
    material.facts.length > 0 &&
    material.facts.every((fact) => hasText(fact.label) && hasText(fact.value)) &&
    hasText(item.why) &&
    item.presentIn.length > 0 &&
    item.presentIn.every((entry) => hasText(entry.label))
  );
}

/**
 * Query layer: the rest of the app reads content only through these functions, never from the
 * JSON files, so the storage can change without touching the screens.
 */
export function createContentIndex(content: Content): ContentIndex {
  const objects = new Map(content.objects.map((item) => [item.id, item]));
  const materials = new Map(content.materials.map((item) => [item.id, item]));
  const sources = new Map(content.mineralSources.map((item) => [item.id, item]));
  const routes = new Map(content.routes.map((item) => [item.id, item]));
  const elements = new Map(content.elements.map((item) => [item.symbol, item]));

  const investigation = (objectId: string, materialId: string): Investigation | undefined =>
    content.investigations.find(
      (item) => item.objectId === objectId && item.materialId === materialId,
    );

  function getOrbit(objectId: string): OrbitNode[] {
    return content.investigations
      .filter((item) => item.objectId === objectId)
      .sort((a, b) => a.order - b.order)
      .flatMap((item) => {
        const material = materials.get(item.materialId);
        if (!material) return [];
        return [
          {
            materialId: material.id,
            name: material.name,
            sphere: material.sphere,
            order: item.order,
            state: isComplete(material, item) ? 'enabled' : 'disabled',
          } satisfies OrbitNode,
        ];
      });
  }

  function getMaterialSheet(objectId: string, materialId: string): MaterialSheet | undefined {
    const item = investigation(objectId, materialId);
    const material = materials.get(materialId);
    if (!item || !material) return undefined;

    const layers = material.layers.map((layer): SheetLayer => {
      const override = item.layers.find((candidate) => candidate.id === layer.id);
      const text = override?.text !== undefined ? override.text : layer.text;
      return {
        id: layer.id,
        title: layer.title,
        text,
        image: override?.image !== undefined ? override.image : layer.image,
        credit: override?.credit !== undefined ? override.credit : layer.credit,
        status: hasText(text) ? 'available' : 'coming-soon',
        sources: layer.sourceIds.flatMap((id) => sources.get(id) ?? []),
        routes: layer.routeIds.flatMap((id) => routes.get(id) ?? []),
      };
    });

    const [onlyElement] = material.composition;
    const atomicNumber =
      material.composition.length === 1 && onlyElement !== undefined
        ? (elements.get(onlyElement)?.atomicNumber ?? null)
        : null;

    return {
      objectId,
      materialId,
      name: material.name,
      family: material.family,
      symbol: material.symbol,
      atomicNumber,
      classification: material.classification,
      facts: material.facts,
      presentIn: item.presentIn,
      why: item.why,
      layers,
      related: item.related.flatMap((id) => {
        const related = objects.get(id);
        return related ? [{ objectId: related.id, name: related.name }] : [];
      }),
      complete: isComplete(material, item),
    };
  }

  return {
    listObjects: () => [...content.objects],
    getObject: (id) => objects.get(id),
    listMaterials: () => [...content.materials],
    getMaterial: (id) => materials.get(id),
    getOrbit,
    getObjectView(objectId) {
      const object = objects.get(objectId);
      return object ? { object, nodes: getOrbit(objectId) } : undefined;
    },
    getMaterialSheet,
    objectsWithMaterial: (materialId) =>
      content.objects.filter((object) => investigation(object.id, materialId) !== undefined),
    getRoute: (id) => routes.get(id),
    getSource: (id) => sources.get(id),
    routesOfMaterial: (materialId) =>
      content.routes.filter((route) => route.materialId === materialId),
  };
}
