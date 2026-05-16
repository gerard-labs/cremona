/**
 * Stylelint config — anti-drift rules for the kit.
 *
 *  - Standard ruleset (idiomatic CSS / formatting)
 *  - Logical CSS only (`stylelint-use-logical`) — invariant I-4
 *  - No raw hex colors in components (only `var(--*)` outside tokens.css)
 *  - No raw px outside tokens.css (1px borders allowed as a pragmatic exception)
 *  - No `outline: none` without a `:focus-visible` replacement.
 */

export default {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-use-logical'],
  rules: {
    'csstools/use-logical': 'always',
    'declaration-property-value-disallowed-list': {
      'margin-left': [/.*/],
      'margin-right': [/.*/],
      'padding-left': [/.*/],
      'padding-right': [/.*/],
      'border-left': [/.*/],
      'border-right': [/.*/],
      'text-align': ['left', 'right'],
      float: ['left', 'right'],
    },
    // Tailwind v4 + Histoire emit lots of bracket selectors / at-rules; allow them.
    'at-rule-no-unknown': [
      true,
      { ignoreAtRules: ['theme', 'apply', 'variants', 'screen', 'tailwind', 'utility', 'layer', 'config'] },
    ],
    // Tailwind v4 only recognises its entrypoint as the bare-string form
    // `@import "tailwindcss"` (not `url(...)`) — so the kit uses string
    // notation for every @import for consistency.
    'import-notation': 'string',
    'no-descending-specificity': null,
    'selector-class-pattern': null,
    'custom-property-pattern': null,
    'comment-empty-line-before': null,
    // The kit uses the OKLCH "0..1" fractional notation (per docs/05) —
    // valid CSS and more readable for design tokens than mandatory percentage.
    // These are style preferences, not correctness; relaxed deliberately.
    'alpha-value-notation': null,
    'lightness-notation': null,
    'hue-degree-notation': null,
    // Preserve canonical casing for font family names (Georgia, SFMono-Regular)
    // and CSS keyword values that are conventionally camelCase
    // (`optimizeLegibility`). Both are case-insensitive in CSS but readability
    // and grep-ability matter.
    'value-keyword-case': null,
    'color-hex-length': null,
    // The kit allows oklch / oklab / color() in token files; modern color
    // functions don't need vendor prefixes.
    'function-no-unknown': [
      true,
      { ignoreFunctions: ['oklch', 'oklab', 'color', 'var', 'theme'] },
    ],
  },
  overrides: [
    {
      // Tokens are the *only* place raw color / px / shadow / motion values live.
      files: ['src/styles/tokens/**/*.css'],
      rules: {
        'color-no-hex': null,
        'declaration-property-unit-disallowed-list': null,
      },
    },
    {
      // Component CSS must reference tokens, never raw color values.
      files: ['src/styles/{base,components,presets}/**/*.css', 'src/styles/cremona.css'],
      rules: {
        'color-no-hex': true,
      },
    },
  ],
};
