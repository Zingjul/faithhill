import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  fetchAll,
  formatDate,
  mediaUrl,
  type Sermon,
  type SermonSeries,
} from "../api";
import CarouselRow from "../components/CarouselRow";
import Reveal from "../components/Reveal";

const PAGE = 6;
const FALLBACK_ART = "/images/series-foundations.jpg";

export function sermonArt(s: Sermon): string {
  return mediaUrl(s.thumbnail) || mediaUrl(s.series_detail?.artwork) || FALLBACK_ART;
}

export function SermonCard({ s }: { s: Sermon }) {
  return (
    <article className="sermon-card">
      <Link to={`/messages/${s.slug}`} className="sermon-thumb" aria-label={s.title}>
        <img src={sermonArt(s)} alt="" loading="lazy" />
        <span className="play">▶</span>
      </Link>
      <h4>
        <Link to={`/messages/${s.slug}`}>{s.title}</Link>
      </h4>
      <p className="meta">
        {s.speaker || "Faith Hill"} · {formatDate(s.sermon_date)}
        {s.series_detail ? ` · ${s.series_detail.title}` : ""}
      </p>
    </article>
  );
}

export default function Messages() {
  const [sermons, setSermons] = useState<Sermon[] | null>(null);
  const [seriesList, setSeriesList] = useState<SermonSeries[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");
  const [sort, setSort] = useState<"latest" | "oldest">("latest");
  const [visible, setVisible] = useState(PAGE);

  const seriesFilter = searchParams.get("series") ?? "";

  useEffect(() => {
    fetchAll<Sermon>("/api/sermons/").then(setSermons).catch(() => setSermons([]));
    fetchAll<SermonSeries>("/api/sermon-series/").then(setSeriesList).catch(() => setSeriesList([]));
  }, []);

  const topics = useMemo(
    () => Array.from(new Set((sermons ?? []).map((s) => s.topic).filter(Boolean))),
    [sermons],
  );

  const filtered = useMemo(() => {
    let list = sermons ?? [];
    if (seriesFilter) list = list.filter((s) => s.series_detail?.slug === seriesFilter);
    if (topic) list = list.filter((s) => s.topic === topic);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((s) =>
        [s.title, s.speaker, s.scripture, s.topic].some((f) => f.toLowerCase().includes(q)),
      );
    }
    return [...list].sort((a, b) =>
      sort === "latest"
        ? b.sermon_date.localeCompare(a.sermon_date)
        : a.sermon_date.localeCompare(b.sermon_date),
    );
  }, [sermons, seriesFilter, topic, query, sort]);

  const featured = (sermons ?? [])[0] ?? null;
  const hasFilters = Boolean(seriesFilter || topic || query.trim());

  if (sermons === null) return <div className="loading-page">Loading messages…</div>;

  return (
    <div style={{ paddingTop: "6.5rem" }}>
      {featured && !hasFilters ? (
        <section className="container">
          <div className="featured-sermon">
            <Reveal>
              <Link to={`/messages/${featured.slug}`} className="featured-art">
                <img src={sermonArt(featured)} alt="" />
                <span className="play" aria-hidden>▶</span>
              </Link>
            </Reveal>
            <Reveal delay={1}>
              <p className="eyebrow">Featured</p>
              <h1 className="h-md">{featured.title}</h1>
              <p className="lede" style={{ marginBottom: "1.4rem" }}>
                {featured.description || `${featured.speaker} · ${formatDate(featured.sermon_date)}`}
              </p>
              <Link to={`/messages/${featured.slug}`} className="btn-pill">
                View Media
              </Link>
            </Reveal>
          </div>
        </section>
      ) : null}

      <section className="container" style={{ marginTop: "2.5rem" }}>
        {/* Filter bar */}
        <div className="filter-bar">
          <button
            type="button"
            className={`filter-pill${!hasFilters ? " active" : ""}`}
            onClick={() => {
              setQuery("");
              setTopic("");
              setSearchParams({});
            }}
          >
            All
          </button>
          {seriesList.map((s) => (
            <button
              key={s.slug}
              type="button"
              className={`filter-pill${seriesFilter === s.slug ? " active" : ""}`}
              onClick={() => setSearchParams(seriesFilter === s.slug ? {} : { series: s.slug })}
            >
              {s.title}
            </button>
          ))}
          <span style={{ flex: 1 }} />
          {topics.length > 0 ? (
            <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Filter by topic">
              <option value="">All topics</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          ) : null}
          <select value={sort} onChange={(e) => setSort(e.target.value as "latest" | "oldest")} aria-label="Sort">
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
          </select>
          <input
            className="search-input"
            type="search"
            placeholder="Search sermons…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search sermons"
          />
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <p className="loading-page">No messages match your filters yet.</p>
        ) : (
          <>
            <div className="sermon-grid">
              {filtered.slice(0, visible).map((s) => (
                <Reveal key={s.id}>
                  <SermonCard s={s} />
                </Reveal>
              ))}
            </div>
            {visible < filtered.length ? (
              <div className="load-more-wrap">
                <button type="button" className="btn-pill" onClick={() => setVisible((v) => v + PAGE)}>
                  Load More
                </button>
              </div>
            ) : null}
          </>
        )}

        {/* Playlists */}
        {!hasFilters && seriesList.length > 0 ? (
          <div style={{ marginBottom: "4.5rem" }}>
            <h2 className="h-md" style={{ marginTop: "3.5rem", marginBottom: "0.5rem" }}>
              Playlists
            </h2>
            {seriesList.map((series) => {
              const inSeries = (sermons ?? []).filter((s) => s.series_detail?.slug === series.slug);
              if (inSeries.length === 0) return null;
              return (
                <div key={series.slug} className="playlist-block">
                  <div className="playlist-head">
                    <h3>▦ {series.title}</h3>
                    <Link to={`/messages?series=${series.slug}`}>View Playlist</Link>
                  </div>
                  <CarouselRow>
                    {inSeries.map((s) => (
                      <div key={s.id} style={{ flex: "0 0 clamp(240px, 24vw, 320px)" }}>
                        <SermonCard s={s} />
                      </div>
                    ))}
                  </CarouselRow>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}
