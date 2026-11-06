/**
 * Staff dashboard runtime configuration.
 *
 * BASE_PATH
 *   The URL path the dashboard is served from. Staff reach the console at
 *   something unguessable (e.g. https://site.example/fh-console-7x2k9/) rather
 *   than a predictable /admin. Set VITE_BASE_PATH at build time to change it.
 *
 *   This is obscurity, not security: the API enforces JWT auth plus is_staff on
 *   every request, login is throttled, and the host sends X-Robots-Tag noindex.
 *   The long path simply keeps the door out of view of casual scanners.
 */
const rawBase = import.meta.env.VITE_BASE_PATH ?? "/";

/** Always begins and ends with "/" so React Router and asset URLs agree. */
export const BASE_PATH =
  "/" + rawBase.replace(/^\/+|\/+$/g, "") + (rawBase.replace(/^\/+|\/+$/g, "") ? "/" : "");

/** Strip the deployment base path from window.location.pathname. */
export function stripBase(pathname: string): string {
  if (BASE_PATH === "/") return pathname;
  const base = BASE_PATH.replace(/\/$/, "");
  if (pathname === base) return "/";
  if (pathname.startsWith(BASE_PATH)) return pathname.slice(base.length);
  return pathname;
}
