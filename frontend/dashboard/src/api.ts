/**
 * API client: JWT storage, authenticated fetch with transparent token
 * refresh, and helpers for DRF's paginated responses.
 */

const ACCESS_KEY = "fh_access_token";
const REFRESH_KEY = "fh_refresh_token";
const USER_KEY = "fh_user";

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
      const res = await fetch("/api/auth/token/refresh/", {
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

  let res = await fetch(path, { ...init, headers });

  if (res.status === 401 && !init?.skipAuthRetry && localStorage.getItem(REFRESH_KEY)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers.set("Authorization", `Bearer ${localStorage.getItem(ACCESS_KEY)}`);
      res = await fetch(path, { ...init, headers });
    } else {
      clearAuth();
      window.location.assign("/login");
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

/** DRF ImageField/FileField return absolute URLs pointing at the API host;
 * for display we only need the path (the dev proxy serves /media). */
export function mediaUrl(url?: string | null): string {
  if (!url) return "";
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
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
