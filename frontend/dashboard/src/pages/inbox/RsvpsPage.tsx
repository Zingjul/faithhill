import { useCallback, useEffect, useState } from "react";
import { apiFetch, formatDate, type Paginated } from "../../api";

interface Rsvp {
  id: number;
  event_title: string;
  name: string;
  email: string;
  phone: string;
  guests: number;
  created_at: string;
}

interface EventOption {
  id: number;
  title: string;
  slug: string;
}

export default function RsvpsPage() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [data, setData] = useState<Paginated<Rsvp> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Paginated<EventOption>>("/api/manage/events/?page_size=100").then(({ data: d }) => {
      if (d) setEvents(d.results.filter((e) => e.slug));
    });
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const qs = selectedSlug ? `?event=${selectedSlug}` : "";
    apiFetch<Paginated<Rsvp>>(`/api/manage/rsvps/${qs}`)
      .then(({ data: d }) => setData(d))
      .finally(() => setLoading(false));
  }, [selectedSlug]);

  useEffect(load, [load]);

  const totalGuests = data?.results.reduce((sum, r) => sum + r.guests, 0) ?? 0;
  const selectedEvent = events.find((e) => e.slug === selectedSlug);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Event RSVPs</h1>
          <p className="muted">Registrations collected on the website.</p>
        </div>
        <select value={selectedSlug} onChange={(e) => setSelectedSlug(e.target.value)} className="select-inline">
          <option value="">All events</option>
          {events.map((e) => (
            <option key={e.slug} value={e.slug}>
              {e.title}
            </option>
          ))}
        </select>
      </div>

      {selectedEvent && data ? (
        <p className="muted">
          <strong>{data.count}</strong> registration{data.count === 1 ? "" : "s"} · <strong>{totalGuests}</strong>{" "}
          expected attendees
        </p>
      ) : null}

      <div className="card">
        {loading ? (
          <p className="muted pad">Loading…</p>
        ) : !data || data.results.length === 0 ? (
          <p className="empty">No RSVPs yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Event</th>
                  <th>Contact</th>
                  <th>Guests</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.event_title}</td>
                    <td>
                      <a href={`mailto:${r.email}`}>{r.email}</a>
                      {r.phone ? <span className="muted"> · {r.phone}</span> : null}
                    </td>
                    <td>{r.guests}</td>
                    <td>{formatDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
