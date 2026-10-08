/** How the shell was started, decided once from the command line and the environment. */
export interface LaunchOptions {
  mode: 'development' | 'production';
  rendererUrl: string | null;
  kiosk: boolean;
  /** Whether the cursor is hidden. Always in kiosk mode, unless `--cursor` asks for it. */
  hideCursor: boolean;
  devTools: boolean;
  query: string;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const TOOL_FLAGS = ['showcase', 'grid'] as const;

function parseLocalUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' || !LOCAL_HOSTS.has(url.hostname)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function parseLaunchOptions(
  argv: readonly string[],
  env: Readonly<Record<string, string | undefined>>,
  isPackaged: boolean,
): LaunchOptions {
  const rendererUrl = isPackaged ? null : parseLocalUrl(env.ELECTRON_RENDERER_URL);
  const mode = rendererUrl ? 'development' : 'production';
  const windowed = argv.includes('--windowed');
  const tools = isPackaged ? [] : TOOL_FLAGS.filter((name) => argv.includes(`--${name}`));
  const kiosk = mode === 'production' && !windowed;
  return {
    mode,
    rendererUrl,
    kiosk,
    hideCursor: kiosk && (isPackaged || !argv.includes('--cursor')),
    devTools: mode === 'development' || (!isPackaged && argv.includes('--devtools')),
    query: tools.length > 0 ? `?${tools.join('&')}` : '',
  };
}
