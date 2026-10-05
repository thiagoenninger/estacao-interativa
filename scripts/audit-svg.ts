/**
 * Audits the object drawings in assets/objects against Foundations 07 and decision C12.
 *
 *   npm run audit:svg                 errors fail, warnings are finishing work
 *   npm run audit:svg -- --release    warnings fail too
 *   npm run audit:svg -- --verbose    print every issue instead of the summary per code
 *
 * It only reads: it never changes a drawing. Node 24 runs this .ts file directly
 * (type stripping), so imports keep the .ts extension.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { summarizeIssues, type Issue } from '../src/content/validate.ts';
import { auditDrawing, type ObjectPlane } from '../src/objects/audit.ts';

const root = join(import.meta.dirname, '..');
const release = process.argv.includes('--release');
const verbose = process.argv.includes('--verbose');

const planes = new Map<string, ObjectPlane>();
try {
  const data = JSON.parse(readFileSync(join(root, 'data/objects.json'), 'utf8')) as {
    objects?: { svg?: string; plane?: ObjectPlane }[];
  };
  for (const object of data.objects ?? []) {
    if (object.svg && object.plane) planes.set(object.svg, object.plane);
  }
} catch {
  // Without the data the density is checked at the smallest universe size.
}

const files = readdirSync(join(root, 'assets/objects'))
  .filter((name) => name.endsWith('.svg'))
  .sort();

const issues: Issue[] = [];
console.log(`SVG audit (${release ? 'release' : 'development'} mode) · ${files.length} drawings`);
console.log(
  '  drawing                    size       L0 g/s   L1 g/s   L2 g/s  materials  hotspots',
);

for (const name of files) {
  const plane = planes.get(name);
  const result = auditDrawing(
    name,
    readFileSync(join(root, 'assets/objects', name), 'utf8'),
    plane ? { plane } : {},
  );
  issues.push(...result.issues);
  const { stats } = result;
  if (!stats) {
    console.log(`  ${name.padEnd(26)} unreadable`);
    continue;
  }
  const level = (index: number) => {
    const item = stats.levels[index];
    return (item ? `${item.groups}/${item.shapes}` : '-').padEnd(8);
  };
  console.log(
    `  ${name.padEnd(26)} ${`${stats.viewBox.width}×${stats.viewBox.height}`.padEnd(10)} ${level(0)} ${level(1)} ${level(2)} ${String(stats.materials.length).padStart(5)}      ${stats.hotspots}`,
  );
}

const summary = summarizeIssues(issues);
console.log('');
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
  const blocking = issues.filter((issue) => issue.severity === 'error' || release);
  for (const issue of blocking.slice(0, 20)) {
    console.log(`  ✖ ${issue.code}  ${issue.where}\n      ${issue.message}`);
  }
  if (blocking.length > 20) console.log(`  … and ${blocking.length - 20} more (use --verbose).`);
}

console.log(`${summary.errors} error(s), ${summary.warnings} warning(s).`);
if (summary.errors > 0 || (release && summary.warnings > 0)) {
  console.error('SVG audit failed.');
  process.exit(1);
}
