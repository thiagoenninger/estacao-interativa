/** Reads the real value of a CSS variable in the browser. A plain read while rendering is enough: the stylesheets load before React starts.
 */

export function readTokenValue(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
