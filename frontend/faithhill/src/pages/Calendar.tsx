import { useEffect, useMemo, useState } from "react";
import {
  fetchAll,
  formatTime,
  type ChurchEvent,
} from "../api";
import Accordion, { AccordionItem } from "../components/Accordion";
import Reveal from "../components/Reveal";
import { useModals } from "../components/modals";
import { CALENDAR_INTRO } from "../copy";

function monthLabel(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  return `${fmt(first)} – ${fmt(last)}`;
}

export default function Calendar() {
  const [events, setEvents] = useState<ChurchEvent[] | null>(null);
  const [cursor, setCursor] = useState(() => new Date());
  const { openRsvp } = useModals();

  useEffect(() => {
    fetchAll<ChurchEvent>("/api/events/")
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  const monthEvents = useMemo(() => {
    const list = events ?? [];
    return list.filter((e) => {
      const d = new Date(e.start_datetime);
      return d.getFullYear() === cursor.getFullYear() && d.getMonth() === cursor.getMonth();
    });
  }, [events, cursor]);

  const move = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  return (
    <>
      <section className="section center" style={{ paddingTop: "8rem", paddingBottom: "2.5rem" }}>
        <div className="container">
          <h1 className="h-lg">{CALENDAR_INTRO.heading}</h1>
          <p className="lede">{CALENDAR_INTRO.body}</p>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: "5rem", maxWidth: "820px" }}>
        <Reveal>
          <div className="frame" style={{ borderRadius: "var(--radius)", overflow: "hidden", marginBottom: "2.2rem" }}>
            <img src="/images/outreach.jpg" alt="Church life at Faith Hill" style={{ width: "100%", aspectRatio: "21/8", objectFit: "cover" }} />
          </div>
        </Reveal>

        {/* Month navigation */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: "1rem", padding: "0.7rem 1rem", border: "1px solid var(--line)",
            borderRadius: "14px", background: "#fff", marginBottom: "0.8rem", flexWrap: "wrap",
          }}
        >
          <span className="eyebrow" style={{ margin: 0 }}>Month view</span>
          <strong style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem" }}>{monthLabel(cursor)}</strong>
          <span style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" className="arrow-btn" style={{ width: 38, height: 38 }} onClick={() => move(-1)} aria-label="Previous month">
              ←
            </button>
            <button type="button" className="arrow-btn" style={{ width: 38, height: 38 }} onClick={() => move(1)} aria-label="Next month">
              →
            </button>
          </span>
        </div>

        {events === null ? (
          <p className="loading-page">Loading events…</p>
        ) : monthEvents.length === 0 ? (
          <p className="loading-page">No events this month — try the arrows above.</p>
        ) : (
          <Reveal>
            <Accordion>
              {monthEvents.map((e) => {
                const start = new Date(e.start_datetime);
                return (
                  <AccordionItem
                    key={e.id}
                    renderTitle={() => (
                      <span className="acc-head-event">
                        <span className="acc-date">{start.getDate()}</span>
                        <span className="event-meta">
                          <span>{e.title}</span>
                          <span className="event-time">
                            {start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                            {e.end_datetime
                              ? ` – ${new Date(e.end_datetime).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
                              : ""}
                          </span>
                        </span>
                      </span>
                    )}
                  >
                    <div className="event-detail">
                      <div className="row">
                        <span>
                          <strong>When</strong>
                          {start.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                          {" at "}
                          {formatTime(start.toTimeString().slice(0, 8))}
                        </span>
                        <span>
                          <strong>Where</strong>
                          {e.location || "Faith Hill Auditorium"}
                        </span>
                      </div>
                      <p>{e.description || e.summary}</p>
                      {e.rsvp_enabled && e.is_upcoming ? (
                        <button type="button" className="btn-pill btn-sm" onClick={() => openRsvp(e.slug, e.title)}>
                          Register
                        </button>
                      ) : null}
                    </div>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </Reveal>
        )}
      </section>
    </>
  );
}
