// Development mode of the desktop app: starts the Vite dev server, opens the Electron window on
// it and stops the server when the window closes. Run with `npm run electron:dev`.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer } from 'vite';

// In Node, `require('electron')` is the path to the Electron program (a string).
const electronPath = createRequire(import.meta.url)('electron') as unknown as string;

const server = await createServer();
await server.listen();
const url = server.resolvedUrls?.local[0];
if (!url) {
  await server.close();
  throw new Error('The Vite dev server did not report its address.');
}
console.log(`Vite: ${url}`);

// Whatever follows `--` in `npm run electron:dev -- --showcase` goes on to the shell.
const child = spawn(electronPath, ['.', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, ELECTRON_RENDERER_URL: url },
});

child.on('exit', (code) => {
  void server.close().then(() => process.exit(code ?? 0));
});
