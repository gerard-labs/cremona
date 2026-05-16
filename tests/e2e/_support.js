/**
 * E2E support.
 *
 * Every spec drives a real component inside its Histoire story, loaded
 * standalone through the catalog's sandbox page — the story markup is the
 * top-level document (no iframe), with the kit's Stimulus controllers
 * booted exactly as a consumer would have them.
 */

/**
 * Build the sandbox URL for a component story variant.
 *
 * @param {string} story    story slug, e.g. 'dropdown-menu' (the component
 *                           folder name under src/templates/components/).
 * @param {number} [variant] 0-based variant index (stories declare 4 variants:
 *                           Light·LTR / Light·RTL / Dark·LTR / Dark·RTL).
 */
export function sandbox(story, variant = 0) {
  const id = `src-templates-components-${story}-${story}-story-vue`;
  return `/__sandbox.html?storyId=${id}&variantId=${id}-${variant}`;
}
