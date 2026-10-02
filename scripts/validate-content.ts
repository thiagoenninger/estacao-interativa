/**
 * Validates data/ against assets/ before the build.
 *
 *   npm run validate:data      development: drafts are warnings, structural errors fail
 *   npm run validate:release   release: drafts and objects with too few materials fail too
 *
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkContent, toRawContent } from '../src/content/check.ts';
import { CONTENT_FILES } from '../src/content/schemas.ts';
import { summarizeIssues, type Issue } from '../src/content/validate.ts';

const root = join(import.meta.dirname, '..');
const release = process.argv.includes('--release');
const verbose = process.argv.includes('--verbose');

function listFiles(folder: string, pattern: RegExp): string[] {
  try {
    return readdirSync(join(root, folder)).filter((name) => pattern.test(name));
  } catch {
    return [];
  }
}

function readText(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

const issues: Issue[] = [];
const json: Record<string, unknown> = {};
for (const { file } of Object.values(CONTENT_FILES)) {
  try {
    json[file] = JSON.parse(readText(`data/${file}`));
  } catch (cause) {
    issues.push({
      severity: 'error',
      code: 'file',
      where: `data/${file}`,
      message: cause instanceof Error ? cause.message : String(cause),
    });
  }
}

const objectSvgs = Object.fromEntries(
  listFiles('assets/objects', /^object-.+\.svg$/).map((name) => [
    name,
    readText(`assets/objects/${name}`),
  ]),
);

if (issues.length === 0) {
  const result = checkContent(
    toRawContent(json),
    {
      objectSvgs,
      sphereFiles: listFiles('assets/materials', /^material-.+-sphere\.png$/),
      imageFiles: [
        ...listFiles('assets/minerals', /\.(png|jpg)$/),
        ...listFiles('assets/photos', /\.(png|jpg)$/),
      ],
    },
    { release },
  );
  issues.push(...result.issues);
}

const summary = summarizeIssues(issues);
const mode = release ? 'release' : 'development';
console.log(`Content validation (${mode} mode)`);

if (verbose) {
  for (const issue of issues) {
    console.log(
      `  ${issue.severity.toUpperCase().padEnd(7)} ${issue.code}  ${issue.where}\n          ${issue.message}`,
    );
  }
} else {
  for (const [code, count, severity] of summary.byCode) {
    console.log(`  ${severity.toUpperCase().padEnd(7)} ${String(count).padStart(3)} × ${code}`);
  }
  const errors = issues.filter((issue) => issue.severity === 'error');
  for (const issue of errors.slice(0, 20)) {
    console.log(`  ✖ ${issue.code}  ${issue.where}\n      ${issue.message}`);
  }
  if (errors.length > 20) console.log(`  … and ${errors.length - 20} more errors (use --verbose).`);
}

console.log(`${summary.errors} error(s), ${summary.warnings} warning(s).`);
if (summary.errors > 0) {
  console.error('Content validation failed.');
  process.exit(1);
}
