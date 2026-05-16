import { defineConfig } from 'vitest/config';

/**
 * Vitest — Stimulus controllers + utils unit tests.
 * happy-dom is the lightweight DOM Ring 0 needs; jsdom can replace it
 * later if a specific compatibility issue surfaces.
 */
export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/unit/**/*.test.js'],
    exclude: ['node_modules/**', 'dist/**', '.histoire/**'],
    coverage: {
      provider: 'v8',
      include: ['src/js/**/*.js'],
      exclude: ['src/js/i18n/**'],
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
        branches: 60,
      },
    },
  },
});
