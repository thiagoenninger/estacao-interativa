import type { z } from 'zod';
import { CONTENT_FILES, type Content, type ContentKey, type RawContent } from './schemas.ts';
import type { Issue } from './validate.ts';

type Parsed<K extends ContentKey> = z.output<(typeof CONTENT_FILES)[K]['schema']>;

function formatPath(path: readonly PropertyKey[]): string {
  return path
    .map((part, index) =>
      typeof part === 'number' ? `[${part}]` : `${index === 0 ? '' : '.'}${String(part)}`,
    )
    .join('');
}

function parseFile<K extends ContentKey>(key: K, raw: unknown, issues: Issue[]): Parsed<K> | null {
  const { file, schema } = CONTENT_FILES[key];
  const result = (schema as z.ZodType).safeParse(raw);
  if (result.success) return result.data as Parsed<K>;
  for (const problem of result.error.issues) {
    const path = formatPath(problem.path);
    issues.push({
      severity: 'error',
      code: 'schema',
      where: path ? `data/${file} › ${path}` : `data/${file}`,
      message: problem.message,
    });
  }
  return null;
}

export function parseContent(raw: RawContent): { content: Content | null; issues: Issue[] } {
  const issues: Issue[] = [];
  const meta = parseFile('meta', raw.meta, issues);
  const elements = parseFile('elements', raw.elements, issues);
  const materials = parseFile('materials', raw.materials, issues);
  const mineralSources = parseFile('mineralSources', raw.mineralSources, issues);
  const routes = parseFile('routes', raw.routes, issues);
  const objects = parseFile('objects', raw.objects, issues);
  const investigations = parseFile('investigations', raw.investigations, issues);

  if (
    !meta ||
    !elements ||
    !materials ||
    !mineralSources ||
    !routes ||
    !objects ||
    !investigations
  ) {
    return { content: null, issues };
  }
  return {
    content: {
      meta,
      elements: elements.elements,
      materials: materials.materials,
      mineralSources: mineralSources.mineralSources,
      routes: routes.routes,
      objects: objects.objects,
      investigations: investigations.investigations,
    },
    issues,
  };
}
