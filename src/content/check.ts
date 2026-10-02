import { parseContent } from './parse.ts';
import { CONTENT_FILES, type Content, type RawContent } from './schemas.ts';
import { parseSvg } from './svg-index.ts';
import { validateContent, type ContentEnv, type Issue, type ValidateOptions } from './validate.ts';

export function baseName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

export interface AssetFiles {
  objectSvgs: Readonly<Record<string, string>>;
  sphereFiles: Iterable<string>;
  imageFiles: Iterable<string>;
}

export function buildEnv(assets: AssetFiles): ContentEnv {
  return {
    svgs: Object.fromEntries(
      Object.entries(assets.objectSvgs).map(([name, source]) => [name, parseSvg(source)]),
    ),
    sphereFiles: new Set(assets.sphereFiles),
    imageFiles: new Set(assets.imageFiles),
  };
}

export function toRawContent(jsonByFileName: Readonly<Record<string, unknown>>): RawContent {
  return Object.fromEntries(
    Object.entries(CONTENT_FILES).map(([key, { file }]) => [key, jsonByFileName[file]]),
  ) as RawContent;
}

export interface CheckResult {
  content: Content | null;
  issues: Issue[];
}

export function checkContent(
  raw: RawContent,
  assets: AssetFiles,
  options: ValidateOptions = {},
): CheckResult {
  const parsed = parseContent(raw);
  if (!parsed.content) return parsed;
  return {
    content: parsed.content,
    issues: [...parsed.issues, ...validateContent(parsed.content, buildEnv(assets), options)],
  };
}
