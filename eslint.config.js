/**
 * ESLint config — flat config (ESLint 9).
 * Rules kept deliberately small: anti-drift defaults + Stimulus-friendly
 * globals. Tighten per ring as patterns emerge.
 *
 * NOTE: no @hotwired/stimulus-eslint-plugin — not published as of 2026
 * (see ADR-0006 §Open questions). Reassess at Ring 1 lock-in.
 */

import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    rules: {
      'no-debugger': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
    },
  },
  {
    files: ['tools/**/*.js'],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      // tools/check-*.js are CLIs; they need console.log for human output.
      'no-console': 'off',
    },
  },
  {
    files: ['tests/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser, ...globals.vitest },
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['vite.config.js', 'histoire.config.js', 'histoire.setup.js', 'vitest.config.js', 'playwright.*.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    ignores: ['dist/**', '.histoire/**', 'node_modules/**', 'coverage/**', 'test-results/**', 'playwright-report/**'],
  },
];
