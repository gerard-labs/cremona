import { defineConfig } from 'histoire';
import { HstVue } from '@histoire/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';

/**
 * Histoire — preview catalog (Vite-native, framework-agnostic in spirit).
 *
 * Stories are colocated next to templates:
 *   src/templates/<area>/<area>.story.js
 *
 * Stories use the `.story.vue` SFC pattern with `v-html`: an SFC that
 * wires the Histoire `<Story>` / `<Variant>` globals and injects a
 * pure-HTML body via `v-html`. There is no real Vue componentry — Vue
 * is the catalog host runtime ONLY, never shipped to consumers
 * (theme.js carries Stimulus, not Vue).
 */
export default defineConfig({
  plugins: [HstVue()],
  setupFile: 'histoire.setup.js',
  storyMatch: ['src/**/*.story.vue', 'src/**/*.story.js'],
  outDir: '.histoire/dist',
  vite: {
    // Served at the domain root locally, but under `/<repo>/` on GitHub
    // Pages — the deploy workflow sets HISTOIRE_BASE so asset URLs resolve.
    base: process.env.HISTOIRE_BASE || '/',
    plugins: [vue(), tailwindcss()],
  },
  theme: {
    title: 'gerard/theme',
    favicon: undefined,
  },
  // Ring-based grouping in the sidebar tree. Each story declares
  // `group="Ring N"` in its <Story> SFC; Histoire requires the id to be
  // registered here or it emits a "Group X not found" warning and falls
  // back to ungrouped placement. Build-config polish, no doctrine change.
  tree: {
    groups: [
      { id: 'Ring 0', title: 'Ring 0 — Foundations' },
      { id: 'Ring 1', title: 'Ring 1 — Primitives' },
      { id: 'Ring 2', title: 'Ring 2 — Compounds' },
      { id: 'Ring 3', title: 'Ring 3 — Patterns' },
    ],
  },
  responsivePresets: [
    { label: 'Mobile (375)', width: 375, height: 812 },
    { label: 'Tablet (768)', width: 768, height: 1024 },
    { label: 'Desktop (1440)', width: 1440, height: 900 },
  ],
  backgroundPresets: [
    { label: 'Light', color: 'var(--color-bg-base)', contrastColor: 'var(--color-text-primary)' },
    { label: 'Dark', color: '#0e1019', contrastColor: '#fafafa' },
  ],
});
