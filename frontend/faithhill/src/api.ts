/** Typed API client for the public site (all endpoints are anonymous). */

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ServiceTime {
  id: number;
  name: string;
  day_of_week: number;
  day_name: string;
  start_time: string;
  end_time: string | null;
  notes: string;
}

export interface SermonSeries {
  id: number;
  title: string;
  slug: string;
  description: string;
  artwork: string | null;
  sermon_count: number;
}

export interface Sermon {
  id: number;
  title: string;
  slug: string;
  speaker: string;
  sermon_date: string;
  scripture: string;
  topic: string;
  description: string;
  video_url: string;
  /** YouTube id parsed by the API, or null for non-YouTube links. */
  video_id: string | null;
  /** YouTube poster frame — only set when no custom thumbnail was uploaded. */
  youtube_thumbnail: string | null;
  audio_file: string | null;
  notes: string;
  thumbnail: string | null;
  series: number | null;
  series_detail: SermonSeries | null;
  is_published: boolean;
}

export interface ChurchEvent {
  id: number;
  title: string;
  slug: string;
  summary: string;
  description: string;
  start_datetime: string;
  end_datetime: string | null;
  location: string;
  image: string | null;
  is_featured: boolean;
  rsvp_enabled: boolean;
  is_upcoming: boolean;
  rsvp_count?: number;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  summary: string;
  about: string;
  email: string;
  phone: string;
  photo: string | null;
  order: number;
}

export interface Ministry {
  id: number;
  name: string;
  slug: string;
  summary: string;
  description: string;
  leader_name: string;
  image: string | null;
}

export interface SimpleItem {
  id: number;
  title: string;
  description: string;
  order: number;
}

export interface NextStepItem {
  id: number;
  title: string;
  description: string;
  link: string;
  icon: string;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  publish_at: string;
  expire_at: string | null;
}

export interface GivingOption {
  id: number;
  label: string;
  instructions: string;
  url: string;
}

/**
 * Base URL of the Django API.
 *
 * Development: empty, so requests stay relative and the Vite proxy forwards
 * them to localhost:8000 (also keeps the Arena preview same-origin).
 * Production: set VITE_API_URL at build time, e.g.
 *   VITE_API_URL=https://faith-hill-api.onrender.com
 */
const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

/** Resolve an app path ("/api/sermons/") against the API base URL. */
export function apiPath(path: string): string {
  if (!path.startsWith("/")) return path;
  return `${API_BASE}${path}`;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(apiPath(path));
  if (!res.ok) throw new Error(`Request failed: ${path} (${res.status})`);
  return res.json() as Promise<T>;
}

/** Fetch a list endpoint, unwrapping DRF pagination (asks for up to 100). */
export async function fetchAll<T>(path: string): Promise<T[]> {
  const sep = path.includes("?") ? "&" : "?";
  const data = await get<Paginated<T>>(`${path}${sep}page_size=100`);
  return data.results;
}

export async function fetchOne<T>(path: string): Promise<T | null> {
  const res = await fetch(apiPath(path));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Request failed: ${path}`);
  return res.json() as Promise<T>;
}

export async function submit<T extends object>(path: string, payload: T) {
  const res = await fetch(apiPath(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

/**
 * Resolve a media URL for an <img src>.
 *
 * Two storage setups exist:
 *  - Local development: Django serves /media/... on the API origin, so the path
 *    is used and the Vite proxy (or same origin) serves it.
 *  - Production: files live in Supabase Storage, and Django returns an absolute
 *    CDN URL. That must be used as-is — rewriting it to a path would 404.
 *
 * Absolute URLs that point at the API host are reduced to a path so they go
 * through the proxy in development; every other absolute URL is returned
 * untouched.
 */
export function mediaUrl(url?: string | null): string {
  if (!url) return "";
  let parsed: URL;
  try {
    parsed = new URL(url, window.location.origin);
  } catch {
    return url;
  }
  if (!/^https?:$/.test(parsed.protocol)) return url;

  const isAbsolute = /^https?:\/\//i.test(url);
  if (!isAbsolute) return url;

  // Same host as the API this app talks to → keep relative so dev proxy works.
  const apiHost = API_BASE ? new URL(API_BASE).host : window.location.host;
  if (parsed.host === apiHost || parsed.host === window.location.host) {
    return parsed.pathname;
  }
  // Anything else (Supabase CDN, YouTube thumbnails) is already a usable URL.
  return url;
}

/**
 * Artwork for a sermon card, in priority order:
 * uploaded thumbnail → YouTube poster frame → series artwork → bundled image.
 * The YouTube poster keeps the library looking complete before staff upload
 * custom art for every sermon.
 */
export function sermonArtwork(s: Sermon): string {
  return (
    mediaUrl(s.thumbnail) ||
    s.youtube_thumbnail ||
    mediaUrl(s.series_detail?.artwork) ||
    "/images/series-foundations.jpg"
  );
}

/** "09:00:00" → "9AM" · "10:45:00" → "10:45AM" */
export function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const hour12 = ((h + 11) % 12) + 1;
  const suffix = h < 12 ? "AM" : "PM";
  return m === 0 ? `${hour12}${suffix}` : `${hour12}:${String(m).padStart(2, "0")}${suffix}`;
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

/** Build the hero service line, e.g. "Join us Sundays at 9AM & 10:45AM". */
export function serviceLine(times: ServiceTime[]): string {
  const sundays = times.filter((t) => t.day_of_week === 6);
  if (sundays.length === 0) return "Join us for church this Sunday";
  const at = sundays.map((t) => formatTime(t.start_time)).join(" & ");
  return `Join us Sundays at ${at}`;
}

/** Convert a YouTube/Vimeo page URL to an embeddable URL. */
export function embedUrl(url: string): string | null {
  if (!url) return null;
  const yt =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/) ||
    url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}
