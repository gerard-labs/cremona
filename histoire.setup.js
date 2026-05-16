import { defineSetupVue3 } from '@histoire/plugin-vue';
import './src/styles/cremona.css';
import { boot } from './src/js/index.js';

/**
 * Histoire setup — runs once per story iframe.
 *
 *  1. Imports the kit's CSS so every story sees the tokens + reset.
 *  2. Stamps `<html lang>` / `dir` so each story iframe is a valid,
 *     accessible document (axe `html-has-lang`).
 *  3. Boots Stimulus inside the iframe so controller-driven stories work.
 */
let app;

export const setupVue3 = defineSetupVue3(({ app: vueApp }) => {
  // Every story renders in its own iframe — give that document the
  // language + direction the kit's microcopy is authored in.
  document.documentElement.lang = 'fr';
  document.documentElement.dir = 'ltr';

  if (!app) {
    app = boot(document.documentElement);
    globalThis.__themeStimulus = app;
  }
  vueApp.provide('themeStimulus', app);
});
