import type { IconName } from './icon-names';

const files = import.meta.glob<string>('../../../assets/icons/icon-*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const sourceByName = new Map<string, string>();
for (const [path, source] of Object.entries(files)) {
  const name = /icon-([a-z-]+)\.svg$/.exec(path)?.[1];
  if (name) sourceByName.set(name, source);
}

// Complete text of SVG file
export function getIconSource(name: IconName): string {
  const source = sourceByName.get(name);
  if (!source) throw new Error(`Icon file not found: assets/icons/icon-${name}.svg`);
  return source;
}

// Only what is inside the SVG element (the shapes)
export function getIconMarkup(name: IconName): string {
  const inner = /<svg[^>]*>([\s\S]*?)<\/svg>/.exec(getIconSource(name))?.[1];
  if (inner === undefined) throw new Error(`Icon file without <svg>: icon-${name}.svg`);
  return inner.trim();
}

export function listIconFileNames(): string[] {
  return [...sourceByName.keys()].sort();
}
