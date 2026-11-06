/**
 * Resource registry: every content type manageable from the dashboard.
 *
 * The list/form pages are generated from these configs, mirroring the
 * backend /api/manage/<endpoint>/ contracts. To add a new content type:
 * add a config here and (if new) a backend model + manage viewset.
 */

import { formatDate, formatDateTime, mediaUrl } from "./api";
import type { ResourceConfig } from "./types";

const boolBadge = (v: unknown, yes = "Yes", no = "No") =>
  v ? <span className="badge badge-ok">{yes}</span> : <span className="badge">{no}</span>;

const activeBadge = (v: unknown) => boolBadge(v, "Active", "Hidden");
const publishedBadge = (v: unknown) => boolBadge(v, "Published", "Draft");

const thumb = (url: string | null) =>
  url ? <img src={mediaUrl(url)} alt="" className="thumb" /> : <span className="muted">—</span>;

const truncate = (s: unknown, n = 70) => {
  const str = String(s ?? "");
  return str.length > n ? str.slice(0, n) + "…" : str;
};

export const DAY_OPTIONS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

export const resources: ResourceConfig[] = [
  // ------------------------------------------------------------- content
  {
    key: "sermons",
    label: "Sermons",
    singular: "Sermon",
    endpoint: "sermons",
    section: "content",
    intro: "Publish sermons with video, audio and fill-in-the-blank notes.",
    columns: [
      { key: "thumbnail", label: "", render: (r) => thumb(r.thumbnail) },
      { key: "title", label: "Title" },
      { key: "speaker", label: "Speaker", render: (r) => r.speaker || "—" },
      { key: "sermon_date", label: "Date", render: (r) => formatDate(r.sermon_date) },
      { key: "is_published", label: "Status", render: (r) => publishedBadge(r.is_published) },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "sermon_date", label: "Sermon date", type: "date", required: true },
      { name: "speaker", label: "Speaker", type: "text", placeholder: "ArchBishop Emmanuel Musa Jatau" },
      { name: "series", label: "Series", type: "fk", fkEndpoint: "sermon-series", fkLabelField: "title" },
      { name: "scripture", label: "Scripture", type: "text", placeholder: "e.g. John 3:16-21" },
      { name: "topic", label: "Topic", type: "text" },
      { name: "video_url", label: "Video URL", type: "url", help: "YouTube or Vimeo link", fullWidth: true },
      { name: "audio_file", label: "Audio file", type: "file", help: "MP3 of the sermon" },
      { name: "thumbnail", label: "Thumbnail image", type: "image" },
      { name: "description", label: "Description", type: "textarea", fullWidth: true },
      { name: "notes", label: "Sermon notes", type: "textarea", fullWidth: true, help: "Fill-in-the-blank notes shown on the sermon page" },
      { name: "is_published", label: "Published on website", type: "checkbox", initial: true },
    ],
  },
  {
    key: "sermon-series",
    label: "Sermon Series",
    singular: "Series",
    endpoint: "sermon-series",
    section: "content",
    columns: [
      { key: "artwork", label: "", render: (r) => thumb(r.artwork) },
      { key: "title", label: "Title" },
      { key: "sermon_count", label: "Sermons" },
      { key: "is_active", label: "Status", render: (r) => activeBadge(r.is_active) },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", fullWidth: true },
      { name: "artwork", label: "Series artwork", type: "image" },
      { name: "is_active", label: "Visible on website", type: "checkbox", initial: true },
    ],
  },
  {
    key: "events",
    label: "Events",
    singular: "Event",
    endpoint: "events",
    section: "content",
    intro: "Events appear in the calendar accordions; featured ones get homepage spots.",
    columns: [
      { key: "title", label: "Title" },
      { key: "start_datetime", label: "Starts", render: (r) => formatDateTime(r.start_datetime) },
      { key: "location", label: "Location", render: (r) => r.location || "—" },
      { key: "rsvp_count", label: "RSVPs" },
      { key: "is_published", label: "Status", render: (r) => publishedBadge(r.is_published) },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "summary", label: "Short summary", type: "text", required: true, fullWidth: true, help: "One line shown in the collapsed calendar accordion (max 300 chars)" },
      { name: "description", label: "Full description", type: "textarea", fullWidth: true },
      { name: "start_datetime", label: "Starts", type: "datetime", required: true },
      { name: "end_datetime", label: "Ends (optional)", type: "datetime" },
      { name: "location", label: "Location", type: "text", placeholder: "Faith Hill Auditorium" },
      { name: "image", label: "Event image", type: "image" },
      { name: "is_featured", label: "Featured event", type: "checkbox" },
      { name: "rsvp_enabled", label: "Accept RSVPs", type: "checkbox" },
      { name: "is_published", label: "Published on website", type: "checkbox", initial: true },
    ],
  },
  {
    key: "announcements",
    label: "Announcements",
    singular: "Announcement",
    endpoint: "announcements",
    section: "content",
    columns: [
      { key: "title", label: "Title" },
      { key: "publish_at", label: "Publishes", render: (r) => formatDateTime(r.publish_at) },
      { key: "expire_at", label: "Expires", render: (r) => (r.expire_at ? formatDateTime(r.expire_at) : "Never") },
      { key: "is_current", label: "Live", render: (r) => boolBadge(r.is_current, "Live", "Not live") },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "body", label: "Announcement body", type: "textarea", required: true, fullWidth: true },
      { name: "publish_at", label: "Publish at", type: "datetime", initial: "now" },
      { name: "expire_at", label: "Expire at (optional)", type: "datetime", help: "Announcement hides itself after this time" },
      { name: "is_active", label: "Active", type: "checkbox", initial: true },
    ],
  },
  {
    key: "ministries",
    label: "Ministries",
    singular: "Ministry",
    endpoint: "ministries",
    section: "content",
    columns: [
      { key: "name", label: "Name" },
      { key: "leader_name", label: "Leader", render: (r) => r.leader_name || "—" },
      { key: "order", label: "Order" },
      { key: "is_active", label: "Status", render: (r) => activeBadge(r.is_active) },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "summary", label: "Short summary", type: "text", required: true, fullWidth: true },
      { name: "description", label: "Full description", type: "textarea", fullWidth: true },
      { name: "leader", label: "Leader", type: "fk", fkEndpoint: "team", fkLabelField: "name" },
      { name: "image", label: "Image", type: "image" },
      { name: "order", label: "Display order", type: "number", initial: 0 },
      { name: "is_active", label: "Visible on website", type: "checkbox", initial: true },
    ],
  },
  {
    key: "next-steps",
    label: "Next Steps",
    singular: "Next Step",
    endpoint: "next-steps",
    section: "content",
    intro: "The core action cards (Connect / Pray / Contact / Give).",
    columns: [
      { key: "title", label: "Title" },
      { key: "link", label: "Links to", render: (r) => r.link || "—" },
      { key: "order", label: "Order" },
      { key: "is_active", label: "Status", render: (r) => activeBadge(r.is_active) },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", required: true, fullWidth: true },
      { name: "link", label: "Link", type: "text", placeholder: "/give or https://…", help: "Page path or full URL" },
      { name: "icon", label: "Icon name", type: "text", help: "Icon identifier used by the website theme" },
      { name: "order", label: "Display order", type: "number", initial: 0 },
      { name: "is_active", label: "Visible on website", type: "checkbox", initial: true },
    ],
  },

  // ------------------------------------------------------------------ site
  {
    key: "team",
    label: "Team & Leaders",
    singular: "Team Member",
    endpoint: "team",
    section: "site",
    columns: [
      { key: "photo", label: "", render: (r) => thumb(r.photo) },
      { key: "name", label: "Name" },
      { key: "role", label: "Role" },
      { key: "order", label: "Order" },
      { key: "is_active", label: "Status", render: (r) => activeBadge(r.is_active) },
    ],
    fields: [
      { name: "name", label: "Full name", type: "text", required: true },
      { name: "role", label: "Role / title", type: "text", required: true, placeholder: "e.g. Worship Director" },
      { name: "summary", label: "Short summary", type: "text", fullWidth: true, help: "Shown on the team card" },
      { name: "about", label: "Full bio", type: "textarea", fullWidth: true },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "photo", label: "Photo", type: "image" },
      { name: "order", label: "Display order", type: "number", initial: 0, help: "Lower numbers show first" },
      { name: "is_active", label: "Visible on website", type: "checkbox", initial: true },
    ],
  },
  {
    key: "service-times",
    label: "Service Times",
    singular: "Service Time",
    endpoint: "service-times",
    section: "site",
    columns: [
      { key: "name", label: "Service" },
      { key: "day_name", label: "Day" },
      { key: "start_time", label: "Time", render: (r) => `${String(r.start_time).slice(0, 5)}${r.end_time ? " – " + String(r.end_time).slice(0, 5) : ""}` },
      { key: "is_active", label: "Status", render: (r) => activeBadge(r.is_active) },
    ],
    fields: [
      { name: "name", label: "Service name", type: "text", required: true, placeholder: "Sunday Worship Service" },
      { name: "day_of_week", label: "Day of week", type: "select", required: true, options: DAY_OPTIONS, initial: 6 },
      { name: "start_time", label: "Start time", type: "time", required: true },
      { name: "end_time", label: "End time (optional)", type: "time" },
      { name: "notes", label: "Notes", type: "text", placeholder: "e.g. First Sunday of the month" },
      { name: "is_active", label: "Active", type: "checkbox", initial: true },
    ],
  },
  {
    key: "values",
    label: "Our Values",
    singular: "Value",
    endpoint: "values",
    section: "site",
    columns: [
      { key: "title", label: "Title" },
      { key: "description", label: "Description", render: (r) => truncate(r.description) },
      { key: "order", label: "Order" },
      { key: "is_active", label: "Status", render: (r) => activeBadge(r.is_active) },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", required: true, fullWidth: true },
      { name: "order", label: "Display order", type: "number", initial: 0 },
      { name: "is_active", label: "Visible on website", type: "checkbox", initial: true },
    ],
  },
  {
    key: "beliefs",
    label: "Beliefs",
    singular: "Belief",
    endpoint: "beliefs",
    section: "site",
    intro: "Shown as accordion dropdowns on the About page.",
    columns: [
      { key: "title", label: "Title" },
      { key: "description", label: "Description", render: (r) => truncate(r.description) },
      { key: "order", label: "Order" },
      { key: "is_active", label: "Status", render: (r) => activeBadge(r.is_active) },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", required: true, fullWidth: true },
      { name: "order", label: "Display order", type: "number", initial: 0 },
      { name: "is_active", label: "Visible on website", type: "checkbox", initial: true },
    ],
  },
  {
    key: "gallery",
    label: "Gallery Albums",
    singular: "Album",
    endpoint: "gallery",
    section: "site",
    intro: "Albums group photos; add photos under Gallery Images.",
    columns: [
      { key: "cover", label: "", render: (r) => thumb(r.cover) },
      { key: "title", label: "Title" },
      { key: "images", label: "Photos", render: (r) => (r.images ? r.images.length : 0) },
    ],
    fields: [
      { name: "title", label: "Album title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", fullWidth: true },
      { name: "cover", label: "Cover image", type: "image" },
      { name: "event", label: "Related event", type: "fk", fkEndpoint: "events", fkLabelField: "title" },
    ],
  },
  {
    key: "gallery-images",
    label: "Gallery Images",
    singular: "Image",
    endpoint: "gallery-images",
    section: "site",
    columns: [
      { key: "image", label: "", render: (r) => thumb(r.image) },
      { key: "caption", label: "Caption", render: (r) => r.caption || <span className="muted">(no caption)</span> },
      { key: "album", label: "Album" },
      { key: "order", label: "Order" },
    ],
    fields: [
      { name: "album", label: "Album", type: "fk", fkEndpoint: "gallery", fkLabelField: "title", required: true },
      { name: "image", label: "Photo", type: "image", required: true },
      { name: "caption", label: "Caption", type: "text" },
      { name: "order", label: "Display order", type: "number", initial: 0 },
    ],
  },
  {
    key: "giving",
    label: "Giving Options",
    singular: "Giving Option",
    endpoint: "giving",
    section: "site",
    columns: [
      { key: "label", label: "Label" },
      { key: "url", label: "Link", render: (r) => r.url || "—" },
      { key: "order", label: "Order" },
      { key: "is_active", label: "Status", render: (r) => activeBadge(r.is_active) },
    ],
    fields: [
      { name: "label", label: "Label", type: "text", required: true, placeholder: "e.g. Bank Transfer" },
      { name: "instructions", label: "Instructions", type: "textarea", fullWidth: true },
      { name: "url", label: "External link", type: "url", help: "Paystack/Flutterwave payment link, if any" },
      { name: "order", label: "Display order", type: "number", initial: 0 },
      { name: "is_active", label: "Visible on website", type: "checkbox", initial: true },
    ],
  },
];

export function getResource(key: string): ResourceConfig {
  const found = resources.find((r) => r.key === key);
  if (!found) throw new Error(`Unknown resource: ${key}`);
  return found;
}
