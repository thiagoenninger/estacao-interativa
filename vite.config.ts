import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

if (Number(process.versions.node.split('.')[0]) !== 24) {
  throw new Error(
    `This project requires Node 24 (current: ${process.version}). ` +
      'Close every terminal and VS Code window, reopen, and check "node -v".',
  );
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@electron': fileURLToPath(new URL('./electron', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    css: { include: [/\.css\?raw$/] },
  },
});
