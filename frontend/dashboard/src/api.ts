/**
 * API client: JWT storage, authenticated fetch with transparent token
 * refresh, and helpers for DRF's paginated responses.
 */

import { BASE_PATH } from "./config";

const ACCESS_KEY = "fh_access_token";
const REFRESH_KEY = "fh_refresh_token";
const USER_KEY = "fh_user";


/**
 * Base URL of the Django API.
 *
 * Development: empty, so requests stay relative and the Vite proxy forwards
 * them to localhost:8000.
 * Production: set VITE_API_URL at build time, e.g.
 *   VITE_API_URL=https://faith-hill-api.onrender.com
 */
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

/** Resolve an app path ("/api/auth/me/") against the API base URL. */
export function apiPath(path: string): string {
  if (!path.startsWith("/")) return path;
  return `${API_BASE}${path}`;
}

export interface StaffUser {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export function getTokens() {
  return {
    access: localStorage.getItem(ACCESS_KEY),
    refresh: localStorage.getItem(REFRESH_KEY),
  };
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function setStoredUser(user: StaffUser | null) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): StaffUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StaffUser) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

let refreshing: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return false;
  refreshing ??= (async () => {
    try {
      const res = await fetch(apiPath("/api/auth/token/refresh/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) {
        clearAuth();
        return false;
      }
      const data = await res.json();
      localStorage.setItem(ACCESS_KEY, data.access);
      if (data.refresh) localStorage.setItem(REFRESH_KEY, data.refresh);
      return true;
    } catch {
      return false;
    }
  })();
  const ok = await refreshing;
  refreshing = null;
  return ok;
}

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
}

/** fetch() wrapper: attaches the JWT, retries once after a token refresh. */
export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit & { skipAuthRetry?: boolean },
): Promise<ApiResult<T>> {
  const headers = new Headers(init?.headers);
  const access = localStorage.getItem(ACCESS_KEY);
  if (access) headers.set("Authorization", `Bearer ${access}`);

  // A network failure must surface as { ok: false }, not an unhandled
  // rejection that blanks the console.
  let res: Response;
  try {
    res = await fetch(apiPath(path), { ...init, headers });
  } catch {
    return { ok: false, status: 0, data: null };
  }

  if (res.status === 401 && !init?.skipAuthRetry && localStorage.getItem(REFRESH_KEY)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers.set("Authorization", `Bearer ${localStorage.getItem(ACCESS_KEY)}`);
      res = await fetch(apiPath(path), { ...init, headers });
    } else {
      clearAuth();
      window.location.assign(`${BASE_PATH}login`);
    }
  }

  let data: T | null = null;
  if (res.status !== 204) {
    try {
      data = (await res.json()) as T;
    } catch {
      /* non-JSON response */
    }
  }
  return { ok: res.ok, status: res.status, data };
}

/**
 * Resolve a media URL for an <img src>.
 *
 * Locally, Django serves /media/... on the API origin, so a path works through
 * the Vite proxy. In production the file lives in Supabase Storage and Django
 * returns an absolute CDN URL, which must be used as-is.
 */
export function mediaUrl(url?: string | null): string {
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) return url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  const apiHost = API_BASE ? new URL(API_BASE).host : window.location.host;
  if (parsed.host === apiHost || parsed.host === window.location.host) {
    return parsed.pathname;
  }
  return url;
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      });
}
