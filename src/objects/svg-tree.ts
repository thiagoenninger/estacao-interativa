export interface SvgElement {
  tag: string;
  attributes: Record<string, string>;
  children: SvgElement[];
}

export class SvgSyntaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SvgSyntaxError';
  }
}

const IGNORED = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>/gi;
const TAG = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g;
const ATTRIBUTE = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

function readAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const match of source.matchAll(ATTRIBUTE)) {
    const name = match[1];
    if (name !== undefined) attributes[name] = match[2] ?? match[3] ?? '';
  }
  return attributes;
}

export function parseSvgTree(source: string): SvgElement {
  const text = source.replace(IGNORED, '');
  const stack: SvgElement[] = [];
  let root: SvgElement | null = null;

  for (const match of text.matchAll(TAG)) {
    const [, closing, tag = '', rawAttributes = '', selfClosing] = match;

    if (closing) {
      const open = stack.pop();
      if (!open || open.tag !== tag) {
        throw new SvgSyntaxError(`Unexpected </${tag}>${open ? `, expected </${open.tag}>` : ''}`);
      }
      continue;
    }

    const element: SvgElement = { tag, attributes: readAttributes(rawAttributes), children: [] };
    const parent = stack[stack.length - 1];
    if (parent) {
      parent.children.push(element);
    } else if (root) {
      throw new SvgSyntaxError(`More than one root element (found <${tag}> after <${root.tag}>)`);
    } else {
      root = element;
    }
    if (!selfClosing) stack.push(element);
  }

  const unclosed = stack[stack.length - 1];
  if (unclosed) throw new SvgSyntaxError(`<${unclosed.tag}> is never closed`);
  if (!root) throw new SvgSyntaxError('No element found');
  if (root.tag !== 'svg') throw new SvgSyntaxError(`The root is <${root.tag}>, not <svg>`);
  return root;
}

export function* walkElements(element: SvgElement): Generator<SvgElement> {
  yield element;
  for (const child of element.children) yield* walkElements(child);
}

export function readViewBox(
  root: SvgElement,
): { x: number; y: number; width: number; height: number } | null {
  const numbers = (root.attributes['viewBox'] ?? '')
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  const [x, y, width, height] = numbers;
  if (
    numbers.length !== 4 ||
    numbers.some((value) => !Number.isFinite(value)) ||
    x === undefined ||
    y === undefined ||
    !width ||
    !height ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }
  return { x, y, width, height };
}
