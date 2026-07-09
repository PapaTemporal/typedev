/**
 * True when the app was built as a static site (GitHub Pages): content comes
 * from baked JSON and stats/progress live in localStorage instead of SQLite.
 * Injected at build time via vite `define` (see vite.config.ts).
 */
export const STATIC_MODE: boolean = typeof __STATIC__ !== 'undefined' && !!__STATIC__;
