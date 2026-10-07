import { describe, expect, it } from 'vitest';
import {
  APP_HOST,
  APP_ORIGIN,
  APP_SCHEME,
  CONTENT_SECURITY_POLICY,
  isSameOrigin,
  normalizeAppPath,
} from '@electron/security.ts';

describe('app address', () => {
  it('is app://station', () => {
    expect(APP_SCHEME).toBe('app');
    expect(APP_HOST).toBe('station');
    expect(APP_ORIGIN).toBe('app://station');
  });
});

describe('normalizeAppPath', () => {
  it('serves index.html for the root', () => {
    expect(normalizeAppPath('/')).toBe('index.html');
    expect(normalizeAppPath('')).toBe('index.html');
  });

  it('turns a path into a path inside dist', () => {
    expect(normalizeAppPath('/assets/index-abc.js')).toBe('assets/index-abc.js');
    expect(normalizeAppPath('/assets//fonts/a.woff2')).toBe('assets/fonts/a.woff2');
    expect(normalizeAppPath('/fonts/IBM%20Plex.woff2')).toBe('fonts/IBM Plex.woff2');
  });

  it('refuses everything that could leave the folder', () => {
    const bad = [
      '/../secret.txt',
      '/assets/../../secret.txt',
      '/%2e%2e/secret.txt',
      '/assets/%2E%2E/x',
      '/assets/./x',
      '/assets\\x',
      '/assets%5cx',
      '/assets%2fx',
      '/assets%2Fx',
      '/x%00.js',
      '/%zz',
    ];
    for (const pathname of bad) expect(normalizeAppPath(pathname), pathname).toBeNull();
  });
});

describe('isSameOrigin', () => {
  it('accepts the same protocol and host, whatever the path', () => {
    expect(isSameOrigin('app://station/index.html', APP_ORIGIN)).toBe(true);
    expect(isSameOrigin('app://station/?showcase#x', APP_ORIGIN)).toBe(true);
    expect(isSameOrigin('http://localhost:5173/?grid', 'http://localhost:5173')).toBe(true);
  });

  it('refuses another host, port or protocol', () => {
    expect(isSameOrigin('app://other/index.html', APP_ORIGIN)).toBe(false);
    expect(isSameOrigin('https://station/index.html', APP_ORIGIN)).toBe(false);
    expect(isSameOrigin('http://localhost:5174/', 'http://localhost:5173')).toBe(false);
    expect(isSameOrigin('https://example.com/', APP_ORIGIN)).toBe(false);
    expect(isSameOrigin('file:///C:/secret.html', APP_ORIGIN)).toBe(false);
  });

  it('refuses what is not a valid address', () => {
    expect(isSameOrigin('', APP_ORIGIN)).toBe(false);
    expect(isSameOrigin('not a url', APP_ORIGIN)).toBe(false);
    expect(isSameOrigin('app://station/', 'not a url')).toBe(false);
  });
});

describe('CONTENT_SECURITY_POLICY', () => {
  const directives = Object.fromEntries(
    CONTENT_SECURITY_POLICY.split('; ').map((part) => {
      const [name, ...values] = part.split(' ');
      return [name, values];
    }),
  );

  it('lets the app load things only from itself', () => {
    expect(directives['default-src']).toEqual(["'self'"]);
    expect(directives['script-src']).toEqual(["'self'"]);
    expect(directives['connect-src']).toEqual(["'self'"]);
    expect(directives['font-src']).toEqual(["'self'"]);
  });

  it('allows no inline script, no eval and nothing from the network', () => {
    expect(CONTENT_SECURITY_POLICY).not.toContain('unsafe-inline');
    expect(CONTENT_SECURITY_POLICY).not.toContain('unsafe-eval');
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/https?:/);
  });

  it('closes plugins, base address, forms and framing', () => {
    expect(directives['object-src']).toEqual(["'none'"]);
    expect(directives['base-uri']).toEqual(["'none'"]);
    expect(directives['form-action']).toEqual(["'none'"]);
    expect(directives['frame-ancestors']).toEqual(["'none'"]);
  });
});
