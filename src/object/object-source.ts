import { parseSvgTree, readViewBox, type SvgElement } from './svg-tree.ts';

/** The SVG files in assets/objects are the single source of each drawing. */
const files = import.meta.glob<string>('../../assets/objects/object-*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const sourceByFile = new Map<string, string>();
for (const [path, source] of Object.entries(files)) {
  sourceByFile.set(path.split('/').pop() ?? path, source);
}

/** The complete text of a drawing file, or undefined when there is no such file. */
export function getObjectSource(file: string): string | undefined {
  return sourceByFile.get(file);
}

export interface Drawing {
  root: SvgElement;
  viewBox: { x: number; y: number; width: number; height: number };
}

const cache = new Map<string, Drawing>();

/** The drawing of a file (like "object-bicycle.svg"), read once. Throws if it is not there. */
export function getDrawing(file: string): Drawing {
  const cached = cache.get(file);
  if (cached) return cached;
  const source = sourceByFile.get(file);
  if (source === undefined) throw new Error(`Object drawing not found: assets/objects/${file}`);
  const root = parseSvgTree(source);
  const viewBox = readViewBox(root);
  if (!viewBox) throw new Error(`Object drawing without a valid viewBox: ${file}`);
  const drawing = { root, viewBox };
  cache.set(file, drawing);
  return drawing;
}

/** Names of the drawing files that exist, sorted, to compare with the content. */
export function listDrawingFiles(): string[] {
  return [...sourceByFile.keys()].sort();
}
