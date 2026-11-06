import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth";
import { resources } from "../resources";

const inboxLinks = [
  { to: "/inbox/prayer-requests", label: "Prayer Requests" },
  { to: "/inbox/contact-messages", label: "Contact Messages" },
  { to: "/inbox/rsvps", label: "Event RSVPs" },
  { to: "/inbox/testimonies", label: "Testimonies" },
  { to: "/inbox/newsletter", label: "Newsletter" },
];

const sections: { title: string; section: "content" | "site" }[] = [
  { title: "Website Content", section: "content" },
  { title: "Site Settings", section: "site" },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "";

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">⛰</span>
          <div>
            <strong>Faith Hill</strong>
            <small>Staff Dashboard</small>
          </div>
        </div>

        <nav>
          <NavLink to="/" end className="nav-link">
            Overview
          </NavLink>
          {sections.map(({ title, section }) => (
            <div key={section}>
              <p className="nav-section">{title}</p>
              {resources
                .filter((r) => r.section === section)
                .map((r) => (
                  <NavLink key={r.key} to={`/r/${r.key}`} className="nav-link">
                    {r.label}
                  </NavLink>
                ))}
            </div>
          ))}
          <p className="nav-section">Inbox</p>
          {inboxLinks.map((l) => (
            <NavLink key={l.to} to={l.to} className="nav-link">
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="avatar">{displayName.charAt(0).toUpperCase()}</span>
            <div>
              <strong>{displayName}</strong>
              <small>Staff</small>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-block" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
