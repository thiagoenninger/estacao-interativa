import { baseName, checkContent, toRawContent, type CheckResult } from './check.ts';
import { createContentIndex, type ContentIndex } from './queries.ts';
import type { ValidateOptions } from './validate.ts';

/** Vite reads the files at build time: the data, the drawings (as text) and the file names. */
const dataFiles = import.meta.glob<unknown>('../../data/*.json', {
  eager: true,
  import: 'default',
});
const objectSvgs = import.meta.glob<string>('../../assets/objects/object-*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
});
const sphereFiles = Object.keys(import.meta.glob('../../assets/materials/material-*-sphere.png'));
const imageFiles = Object.keys(import.meta.glob('../../assets/{minerals,photos}/*.{png,jpg}'));

function byBaseName<T>(files: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(files).map(([path, value]) => [baseName(path), value]));
}

export interface LoadedContent extends CheckResult {
  index: ContentIndex | null;
}

/**
 * Validates the content of the project and, when it passes, builds the query layer.
 * `npm run build` already stops on an error (validate:data), so in the app this is a second
 * line of defense and the source of the warnings shown in the development showcase.
 */
export function loadContent(options: ValidateOptions = {}): LoadedContent {
  const result = checkContent(
    toRawContent(byBaseName(dataFiles)),
    {
      objectSvgs: byBaseName(objectSvgs),
      sphereFiles: sphereFiles.map(baseName),
      imageFiles: imageFiles.map(baseName),
    },
    options,
  );
  const failed =
    result.content === null || result.issues.some((issue) => issue.severity === 'error');
  return {
    ...result,
    index: failed || !result.content ? null : createContentIndex(result.content),
  };
}
