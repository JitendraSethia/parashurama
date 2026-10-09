import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['packages/**/test/**/*.test.ts', 'apps/server/test/**/*.test.ts'],
    coverage: { include: ['packages/engine/src/**'], reporter: ['text', 'html'] },
  },
});
