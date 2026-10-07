export const APP_SCHEME = 'app';
export const APP_HOST = 'station';
export const APP_ORIGIN = `${APP_SCHEME}://${APP_HOST}`;

export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

export function normalizeAppPath(pathname: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes('\0') || decoded.includes('\\') || /%2f/i.test(pathname)) return null;
  const parts = decoded.split('/').filter((part) => part !== '');
  if (parts.some((part) => part === '..' || part === '.')) return null;
  return parts.length === 0 ? 'index.html' : parts.join('/');
}

export function isSameOrigin(url: string, allowed: string): boolean {
  try {
    const target = new URL(url);
    const base = new URL(allowed);
    return target.protocol === base.protocol && target.host === base.host;
  } catch {
    return false;
  }
}
