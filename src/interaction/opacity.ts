import { MIN_TOUCH_OPACITY } from './constants';

export function effectiveOpacity(element: Element): number {
  let opacity = 1;
  for (let node: Element | null = element; node !== null; node = node.parentElement) {
    const own = Number.parseFloat(getComputedStyle(node).opacity);
    if (Number.isFinite(own)) opacity *= own;
    if (opacity === 0) return 0;
  }
  return opacity;
}

export function isEntering(element: Element): boolean {
  return effectiveOpacity(element) < MIN_TOUCH_OPACITY;
}
