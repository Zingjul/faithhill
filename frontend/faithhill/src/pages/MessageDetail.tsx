import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  embedUrl,
  fetchAll,
  fetchOne,
  formatDate,
  mediaUrl,
  type Sermon,
} from "../api";
import Reveal from "../components/Reveal";
import { sermonArt, SermonCard } from "./Messages";

type Tab = "info" | "scripture" | "topic";

export default function MessageDetail() {
  const { slug = "" } = useParams();
  const [sermon, setSermon] = useState<Sermon | null | undefined>(undefined);
  const [all, setAll] = useState<Sermon[]>([]);
  const [tab, setTab] = useState<Tab>("info");
  const [playing, setPlaying] = useState(false);
  const [takingNotes, setTakingNotes] = useState(false);
  const [notesTitle, setNotesTitle] = useState("");
  const [notesBody, setNotesBody] = useState("");

  useEffect(() => {
    setSermon(undefined);
    setPlaying(false);
    setTab("info");
    fetchOne<Sermon>(`/api/sermons/${slug}/`).then(setSermon);
    fetchAll<Sermon>("/api/sermons/").then(setAll).catch(() => setAll([]));
  }, [slug]);

  const upNext = useMemo(() => {
    if (!sermon) return [];
    const sameSeries = sermon.series_detail
      ? all.filter((s) => s.series_detail?.slug === sermon.series_detail?.slug && s.id !== sermon.id)
      : [];
    const others = all.filter((s) => s.id !== sermon.id);
    return (sameSeries.length > 0 ? sameSeries : others).slice(0, 6);
  }, [all, sermon]);

  if (sermon === undefined) return <div className="loading-page">Loading message…</div>;
  if (sermon === null)
    return (
      <div className="error-page">
        <h1 className="h-lg">Message not found</h1>
        <p className="lede center" style={{ marginTop: "0.6rem" }}>
          <Link to="/messages" style={{ color: "var(--blue)", fontWeight: 600 }}>
            Browse all messages →
          </Link>
        </p>
      </div>
    );

  const embed = embedUrl(sermon.video_url);
  const audio = mediaUrl(sermon.audio_file);

  const downloadNotes = () => {
    const text = `${notesTitle || sermon.title}\n${"—".repeat(30)}\n${notesBody}\n`;
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${sermon.slug}-notes.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="container" style={{ paddingBottom: "4.5rem" }}>
      {/* Media hero */}
      <div className="media-hero">
        {playing && embed ? (
          <iframe
            src={`${embed}?autoplay=1`}
            title={sermon.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <img src={sermonArt(sermon)} alt="" />
            {embed ? (
              <button type="button" className="play-big" onClick={() => setPlaying(true)} aria-label="Play video">
                ▶
              </button>
            ) : null}
          </>
        )}
      </div>

      {/* Title row */}
      <div
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          flexWrap: "wrap", gap: "0.8rem", marginTop: "1.6rem",
        }}
      >
        <div>
          <h1 className="h-lg" style={{ marginBottom: "0.2rem" }}>{sermon.title}</h1>
          <p className="meta" style={{ color: "var(--muted)", margin: 0 }}>
            {formatDate(sermon.sermon_date)}
            {sermon.speaker ? ` · ${sermon.speaker}` : ""}
          </p>
        </div>
        {audio ? (
          <audio controls src={audio} style={{ height: "40px" }}>
            <a href={audio}>Download audio</a>
          </audio>
        ) : null}
      </div>

      {/* Info tabs + notes */}
      <div className="two-col-detail">
        <div>
          <div className="detail-tabs" role="tablist" aria-label="Sermon information">
            <button type="button" role="tab" aria-selected={tab === "info"} className={tab === "info" ? "active" : ""} onClick={() => setTab("info")}>
              Info
            </button>
            <button type="button" role="tab" aria-selected={tab === "scripture"} className={tab === "scripture" ? "active" : ""} onClick={() => setTab("scripture")}>
              Scripture
            </button>
            <button type="button" role="tab" aria-selected={tab === "topic"} className={tab === "topic" ? "active" : ""} onClick={() => setTab("topic")}>
              Topic
            </button>
          </div>
          <div className="panel-card" style={{ marginTop: "1rem" }} role="tabpanel">
            {tab === "info" && (
              <p style={{ margin: 0 }}>
                {sermon.description || "No description yet — check back soon."}
                {sermon.series_detail ? (
                  <>
                    <br />
                    <br />
                    <span className="meta" style={{ color: "var(--ink-soft)" }}>
                      Part of the series <strong>{sermon.series_detail.title}</strong>.
                    </span>
                  </>
                ) : null}
              </p>
            )}
            {tab === "scripture" && (
              <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 600 }}>
                {sermon.scripture || "No scripture reference added for this message."}
              </p>
            )}
            {tab === "topic" && (
              <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 600 }}>
                {sermon.topic || "No topic added for this message."}
              </p>
            )}
            {tab === "info" && sermon.notes ? (
              <p style={{ margin: "1rem 0 0", whiteSpace: "pre-wrap", color: "var(--ink-soft)", fontSize: "0.92rem" }}>
                {sermon.notes}
              </p>
            ) : null}
          </div>
        </div>

        {/* Personal notes */}
        <aside className="notes-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "1.15rem" }}>Notes</h3>
            <button type="button" className="btn-pill btn-sm" onClick={() => setTakingNotes((t) => !t)}>
              {takingNotes ? "Done" : "Take Notes"}
            </button>
          </div>
          {takingNotes ? (
            <>
              <input
                placeholder="Add a title…?"
                value={notesTitle}
                onChange={(e) => setNotesTitle(e.target.value)}
                style={{ padding: "0.7rem 0.9rem", borderRadius: 12, border: 0, font: "inherit", fontWeight: 600 }}
              />
              <textarea
                placeholder="You can type as much or as little as you want. When you're done, download the notes to keep them."
                value={notesBody}
                onChange={(e) => setNotesBody(e.target.value)}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="button" className="btn-pill btn-sm btn-outline" onClick={downloadNotes} disabled={!notesBody.trim()}>
                  Download notes
                </button>
              </div>
            </>
          ) : (
            <p className="lede" style={{ margin: 0 }}>
              Follow along and jot down what God highlights to you — then download your notes to keep.
            </p>
          )}
        </aside>
      </div>

      {/* Up next */}
      {upNext.length > 0 ? (
        <section style={{ marginTop: "3.5rem" }} aria-labelledby="up-next">
          <Reveal>
            <h2 id="up-next" className="h-md" style={{ borderTop: "1px solid var(--line)", paddingTop: "1.6rem", marginBottom: "1.4rem" }}>
              Up Next
            </h2>
          </Reveal>
          <div className="sermon-grid">
            {upNext.map((s) => (
              <Reveal key={s.id}>
                <SermonCard s={s} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
