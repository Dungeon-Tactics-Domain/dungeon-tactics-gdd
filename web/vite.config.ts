import { fileURLToPath } from 'node:url';
import mdx from '@mdx-js/rollup';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import remarkGfm from 'remark-gfm';
import { defineConfig } from 'vitest/config';
import { fabricaMock } from './mock/fabrica-mock.ts';

// `npm run dev` proxies /api to the Rust server (crates/labs-server on 5191);
// `npm run dev:mock` serves a fake /api/fabrica and SSE stream so the UI runs without it.
export default defineConfig(({ mode }) => ({
  // MDX compiles before the React plugin so .mdx pages get the same JSX transform (lab content, src/content)
  plugins: [
    { enforce: 'pre', ...mdx({ remarkPlugins: [remarkGfm] }) },
    react(),
    tailwindcss(),
    mode === 'mock' && fabricaMock(),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // 5190 is the old lab and 5191 the Rust server; strictPort so a clash fails instead of moving silently
  server: {
    port: 5192,
    strictPort: true,
    proxy: mode === 'mock' ? undefined : { '/api': 'http://localhost:5191' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
  },
}));
