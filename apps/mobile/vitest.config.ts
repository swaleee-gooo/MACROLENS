import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs', '../../supabase/functions/**/*.test.ts'],
    globals: false,
    passWithNoTests: true,
  },
});
