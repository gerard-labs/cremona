import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

/**
 * Vite build config — produces a vanilla `dist/` consumable by any client
 * (Symfony AssetMapper, Webpack Encore, React/Vue, static HTML, CDN).
 *
 * Two passes, both wired into `pnpm build`:
 *  - default mode → `dist/theme.js`  — Stimulus boot + controller register (ESM)
 *  - `--mode css` → `dist/theme.css` — Tailwind v4 processed: tokens + base
 *                                       reset + every component's styles
 *
 * The CSS is a separate pass because the JS entry deliberately does NOT
 * import the stylesheet — consumers decide when/whether to load styles.
 */

const root = resolve(import.meta.dirname);

export default defineConfig(({ mode }) => {
  // --- CSS pass: `vite build --mode css` -----------------------------------
  if (mode === 'css') {
    // A virtual JS entry that simply imports the stylesheet — this routes
    // `theme.css` through Vite's full pipeline so the Tailwind v4 plugin
    // compiles `@theme`/`@import "tailwindcss"` rather than passing them
    // through verbatim (which happens when a `.css` file is the raw entry).
    const CSS_ENTRY = 'virtual:theme-css-entry';
    const CSS_ENTRY_RESOLVED = '\0' + CSS_ENTRY;
    const themeCss = resolve(root, 'src/styles/theme.css');

    return {
      root,
      publicDir: false,
      plugins: [
        tailwindcss(),
        {
          name: 'theme-css-entry',
          resolveId(id) {
            if (id === CSS_ENTRY) return CSS_ENTRY_RESOLVED;
          },
          load(id) {
            if (id === CSS_ENTRY_RESOLVED) return `import ${JSON.stringify(themeCss)};`;
          },
          // The entry leaves behind an empty JS chunk — drop it so `dist/`
          // carries only `theme.js` (JS pass) + `theme.css`.
          generateBundle(_options, bundle) {
            for (const file of Object.keys(bundle)) {
              if (file.endsWith('.js')) delete bundle[file];
            }
          },
        },
      ],
      build: {
        outDir: 'dist',
        emptyOutDir: false, // keep `dist/theme.js` emitted by the JS pass
        sourcemap: false,
        rollupOptions: {
          input: CSS_ENTRY,
          output: { assetFileNames: 'theme.css' },
        },
      },
    };
  }

  // --- JS pass: default `vite build` ---------------------------------------
  return {
    root,
    publicDir: false,
    plugins: [tailwindcss()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      lib: {
        entry: resolve(root, 'src/js/index.js'),
        formats: ['es'],
        fileName: () => 'theme.js',
      },
      rollupOptions: {
        external: ['@hotwired/stimulus', 'dayjs'],
        output: {
          globals: {
            '@hotwired/stimulus': 'Stimulus',
            dayjs: 'dayjs',
          },
        },
      },
      sourcemap: true,
    },
  };
});
