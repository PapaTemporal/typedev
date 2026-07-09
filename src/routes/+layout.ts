import { STATIC_MODE } from '$lib/static-mode';

// Static build = pure SPA (no server anywhere); local build keeps SSR.
// In static mode the non-dynamic routes prerender as empty shells (ssr is off,
// so no loads run) and dynamic ones are served by the 404.html fallback.
export const ssr = !STATIC_MODE;
export const prerender = STATIC_MODE;
