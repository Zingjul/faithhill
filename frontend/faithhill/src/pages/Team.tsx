import { useEffect, useState } from "react";
import { fetchAll, mediaUrl, type TeamMember } from "../api";
import Reveal from "../components/Reveal";
import { TEAM_INTRO } from "../copy";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Team() {
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const [selected, setSelected] = useState<TeamMember | null>(null);

  useEffect(() => {
    fetchAll<TeamMember>("/api/team/").then(setTeam).catch(() => setTeam([]));
  }, []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  return (
    <>
      <section className="section center" style={{ paddingTop: "8rem" }}>
        <div className="container">
          <p className="eyebrow">{TEAM_INTRO.label}</p>
          <h1 className="h-lg">{TEAM_INTRO.heading}</h1>
          <p className="lede">{TEAM_INTRO.body}</p>
        </div>
      </section>

      <section className="section-tight" style={{ paddingBottom: "5rem" }}>
        <div className="container">
          {team === null ? (
            <p className="loading-page">Loading our team…</p>
          ) : team.length === 0 ? (
            <p className="loading-page">Team profiles coming soon.</p>
          ) : (
            <div className="team-grid">
              {team.map((m, i) => (
                <Reveal key={m.id} delay={(i % 3) as 0 | 1 | 2}>
                  <article className="team-card">
                    {m.photo ? (
                      <img src={mediaUrl(m.photo)} alt={m.name} loading="lazy" />
                    ) : (
                      <div className="team-initials">
                        <span>{initials(m.name)}</span>
                      </div>
                    )}
                    <div className="team-card-body">
                      <h4>{m.name}</h4>
                      <p className="role">{m.role}</p>
                      <button type="button" className="btn-pill" onClick={() => setSelected(m)}>
                        About {m.name.split(" ")[0]}
                      </button>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Profile pop-up */}
      <div
        className={`modal-backdrop${selected ? " open" : ""}`}
        onClick={() => setSelected(null)}
        role="presentation"
      >
        {selected ? (
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
              {selected.photo ? (
                <img
                  src={mediaUrl(selected.photo)}
                  alt=""
                  style={{ width: 74, height: 74, borderRadius: "50%", objectFit: "cover" }}
                />
              ) : null}
              <div>
                <h3 style={{ margin: 0 }}>{selected.name}</h3>
                <p className="lede" style={{ margin: 0 }}>{selected.role}</p>
              </div>
            </div>
            <p style={{ whiteSpace: "pre-wrap" }}>{selected.about || selected.summary}</p>
            <p className="lede" style={{ fontSize: "0.9rem" }}>
              {selected.email ? (
                <>
                  <a href={`mailto:${selected.email}`} style={{ color: "var(--blue)" }}>{selected.email}</a>
                  <br />
                </>
              ) : null}
              {selected.phone}
            </p>
            <button type="button" className="btn-pill btn-outline btn-sm" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
