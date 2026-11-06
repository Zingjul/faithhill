import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, type Paginated } from "../api";
import { useAuth } from "../auth";

interface Stat {
  label: string;
  value: string;
  to: string;
  tone?: string;
}

export default function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const count = (data: Paginated<unknown> | null) => (data ? String(data.count) : "0");
    Promise.all([
      apiFetch<Paginated<unknown>>("/api/manage/prayer-requests/?status=new"),
      apiFetch<Paginated<unknown>>("/api/manage/contact-messages/"),
      apiFetch<Paginated<unknown>>("/api/manage/testimonies/?approved=0"),
      apiFetch<Paginated<unknown>>("/api/manage/newsletter/"),
      apiFetch<Paginated<unknown>>("/api/manage/events/"),
      apiFetch<Paginated<unknown>>("/api/manage/sermons/"),
    ])
      .then(([prayers, messages, pendingTestimonies, newsletter, events, sermons]) => {
        setStats([
          { label: "New prayer requests", value: count(prayers.data), to: "/inbox/prayer-requests", tone: "accent" },
          { label: "Contact messages", value: count(messages.data), to: "/inbox/contact-messages" },
          { label: "Testimonies awaiting approval", value: count(pendingTestimonies.data), to: "/inbox/testimonies", tone: "warn" },
          { label: "Newsletter subscribers", value: count(newsletter.data), to: "/inbox/newsletter" },
          { label: "Events", value: count(events.data), to: "/r/events" },
          { label: "Sermons", value: count(sermons.data), to: "/r/sermons" },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.first_name || user?.username || "";

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Welcome back{firstName ? `, ${firstName}` : ""} 👋</h1>
          <p className="muted">Here's what needs attention today.</p>
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="stat-grid">
          {stats.map((s) => (
            <Link key={s.label} to={s.to} className={`stat-card card ${s.tone ?? ""}`}>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="card">
        <h2>Quick actions</h2>
        <div className="quick-actions">
          <Link className="btn btn-primary" to="/r/sermons/new">+ New sermon</Link>
          <Link className="btn" to="/r/events/new">+ New event</Link>
          <Link className="btn" to="/r/announcements/new">+ New announcement</Link>
          <Link className="btn" to="/r/team/new">+ New team member</Link>
        </div>
      </div>

      <div className="card">
        <h2>Tips</h2>
        <ul className="tips">
          <li>Content set to <em>Hidden</em> or <em>Draft</em> won't show on the website — perfect for preparing ahead.</li>
          <li>Testimonies appear on the site only after you approve them.</li>
          <li>Prayer requests and contact messages land in the <strong>Inbox</strong> — check it daily.</li>
          <li>Changes go live on the website immediately after saving.</li>
        </ul>
      </div>
    </div>
  );
}
