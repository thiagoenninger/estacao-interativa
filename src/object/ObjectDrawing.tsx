import { createElement, type ReactNode } from 'react';
import {
  defaultSize,
  fitSize,
  groupState,
  isGroupVisible,
  isLevelVisible,
  levelOf,
  type DrawingSize,
  type DrawingView,
  type Level,
} from './drawing-state';
import { getDrawing } from './object-source';
import type { SvgElement } from './svg-tree';
import './object.css';

interface ObjectDrawingProps {
  /** The file of the drawing, like "object-bicycle.svg" (the `svg` field of the object). */
  file: string;
  /** Accessible name of the object, from the content (the files carry no text). */
  label: string;
  view?: DrawingView;
  /** Slug of the selected material. Without it, no group is highlighted or receded. */
  material?: string | null;
  /** Longest side in px, or the box the drawing has to fit in. Each view has its own default. */
  size?: DrawingSize;
  className?: string;
}

/** Tags the app never draws: the name comes from the content. */
const SKIPPED_TAGS = new Set(['title', 'desc']);

/**
 * From the attribute names of the file to the names React uses (stroke-linecap → strokeLinecap).
 * The id of a group becomes data-group: an id repeats from one drawing to the other, and a page
 * can hold many drawings (the universe holds eight).
 */
function toProps(attributes: Record<string, string>, skip: readonly string[] = []) {
  const props: Record<string, string> = {};
  for (const [name, value] of Object.entries(attributes)) {
    if (name === 'style' || skip.includes(name)) continue;
    if (name === 'id') props['data-group'] = value;
    else if (name === 'class') props['className'] = value;
    else if (name.startsWith('data-') || name.startsWith('aria-')) props[name] = value;
    else props[name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())] = value;
  }
  return props;
}

interface Context {
  view: DrawingView;
  material: string | null;
}

function renderChildren(element: SvgElement, context: Context, level: Level | null): ReactNode[] {
  return element.children
    .filter((child) => !SKIPPED_TAGS.has(child.tag))
    .map((child, index) => renderElement(child, context, level, index));
}

function renderElement(
  element: SvgElement,
  context: Context,
  level: Level | null,
  key: number,
): ReactNode {
  const { view, material } = context;
  const props: Record<string, unknown> = { ...toProps(element.attributes), key };
  const ownLevel = element.tag === 'g' ? levelOf(element.attributes['id']) : null;

  if (ownLevel !== null) {
    // A level group: switched on and off as a whole.
    props['data-level'] = ownLevel;
    props['data-visible'] = isLevelVisible(ownLevel, view, material);
    return createElement(element.tag, props, ...renderChildren(element, context, ownLevel));
  }
  if (element.tag === 'g' && level !== null) {
    // A component group: on or off, and highlighted or receded when a material is selected.
    const groupMaterial = element.attributes['data-material'] ?? null;
    props['data-visible'] = isGroupVisible(level, view, material, groupMaterial);
    props['data-state'] = groupState(view, material, groupMaterial);
  }
  return createElement(element.tag, props, ...renderChildren(element, context, null));
}

/**
 * Inline SVG of an object (Components 01 · Objeto). One file carries the three levels of
 * detail; the view and the material only switch groups on and off, stroke and color come from
 * object.css. There is no animation here: the motion arrives with the choreographies.
 */
export function ObjectDrawing({
  file,
  label,
  view = 'universe',
  material = null,
  size,
  className,
}: ObjectDrawingProps) {
  const { root, viewBox } = getDrawing(file);
  const box = fitSize(viewBox, size ?? defaultSize(view));
  const classes = className ? `object-drawing ${className}` : 'object-drawing';

  return createElement(
    'svg',
    {
      ...toProps(root.attributes, ['width', 'height']),
      className: classes,
      width: box.width,
      height: box.height,
      role: 'img',
      'aria-label': label,
      focusable: 'false',
      'data-object': file,
      'data-view': view,
      'data-material': material ?? undefined,
    },
    ...renderChildren(root, { view, material }, null),
  );
}
