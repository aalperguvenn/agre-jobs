import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@agre/taxonomy': r('./packages/taxonomy/src/index.ts'),
      '@agre/core': r('./packages/core/src/index.ts'),
      '@agre/db': r('./packages/db/src/index.ts'),
    },
  },
  test: {
    include: ['packages/**/*.test.ts', 'apps/worker/**/*.test.ts'],
  },
});
