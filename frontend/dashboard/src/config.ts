/**
 * Staff dashboard: URLs derive from where the app is actually served.
 *
 * The dashboard is a single-page app served from a static host. Vite injects
 * `import.meta.env.BASE_URL` from its `base` setting, so assets and the router
 * read the same value and cannot disagree.
 *
 * There is deliberately no VITE_BASE_PATH setting. Serving the app from a
 * sub-path requires the host to serve index.html *and* the assets from that
 * sub-path, which a plain static publish directory does not do — the app loads
 * but its JavaScript 404s, producing a blank page. A static build is served
 * from the site root, so the base path is always "/".
 */
export const BASE_PATH = import.meta.env.BASE_URL || "/";

/** Strip the deployment base path from window.location.pathname. */
export function stripBase(pathname: string): string {
  if (BASE_PATH === "/") return pathname;
  const base = BASE_PATH.replace(/\/$/, "");
  if (pathname === base) return "/";
  if (pathname.startsWith(BASE_PATH)) return pathname.slice(base.length);
  return pathname;
}
