// Helpers to read the project's own CSS files in tests
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

// All custom properties declared in a CSS text
export function parseCustomProperties(css: string): Map<string, string> {
  const result = new Map<string, string>();
  for (const match of stripComments(css).matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    const [, name, value] = match;
    if (name && value) result.set(name, value.trim());
  }
  return result;
}

// Declarations of each simple rule, by selector
export function parseRules(css: string): Map<string, Map<string, string>> {
  const rules = new Map<string, Map<string, string>>();
  for (const match of stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const [, selector, body] = match;
    if (!selector || !body) continue;
    const declarations = new Map<string, string>();
    for (const declaration of body.split(';')) {
      const index = declaration.indexOf(':');
      if (index === -1) continue;
      declarations.set(declaration.slice(0, index).trim(), declaration.slice(index + 1).trim());
    }
    rules.set(selector.trim(), declarations);
  }
  return rules;
}

// WCAG 2x contrast ratio between two #rrggbb colors
export function contrastRatio(foreground: string, background: string): number {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map((start) => {
      const value = parseInt(hex.slice(start, start + 2), 16) / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    const [r = 0, g = 0, b = 0] = channels;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [lighter = 0, darker = 0] = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}
