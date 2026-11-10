import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchAll,
  formatTime,
  sermonArtwork,
  serviceLine,
  type Announcement,
  type Sermon,
} from "../api";
import { useServiceTimes } from "../serviceTimes";
import Reveal from "../components/Reveal";
import { ABOUT_STATEMENT } from "../copy";

export default function Home() {
  const times = useServiceTimes();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announceDismissed, setAnnounceDismissed] = useState(false);
  const [latestSermon, setLatestSermon] = useState<Sermon | null>(null);

  useEffect(() => {
    fetchAll<Announcement>("/api/announcements/")
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]));
    fetchAll<Sermon>("/api/sermons/")
      .then((s) => setLatestSermon(s[0] ?? null))
      .catch(() => setLatestSermon(null));
  }, []);

  const current = announcements[0] ?? null;
  const sundays = times.filter((t) => t.day_of_week === 6);
  const sundayLabel =
    sundays.length > 0
      ? `${sundays.map((t) => formatTime(t.start_time)).join(" & ")} ON SUNDAYS`
      : "SUNDAYS";

  return (
    <>
      {current && !announceDismissed ? (
        <div className="announce-bar" role="status">
          <strong>{current.title}</strong> {current.body}
          <button type="button" aria-label="Dismiss announcement" onClick={() => setAnnounceDismissed(true)}>
            ✕
          </button>
        </div>
      ) : null}

      <header className="hero">
        <div className="hero-media">
          <img src="/images/church-hero.jpg" alt="Sunday worship at Faith Hill" />
        </div>
        <div className="hero-content container">
          <h1 className="h-xl">{serviceLine(times)}</h1>
          <div className="hero-actions">
            <Link to="/visit" className="btn-pill">
              Plan Your Visit
            </Link>
            <Link to="/messages" className="btn-pill btn-outline on-dark">
              Messages
            </Link>
          </div>
        </div>
      </header>

      <section className="section center" aria-labelledby="about-home">
        <div className="container">
          <Reveal>
            <h2 id="about-home" className="h-lg">About Us</h2>
            <p className="lede">{ABOUT_STATEMENT}</p>
            <p style={{ marginTop: "2rem" }}>
              <Link to="/about" className="btn-pill btn-outline">
                Want to Learn More?
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      <section className="statement center" aria-labelledby="worship-home">
        <div className="container">
          <Reveal>
            <p className="eyebrow">{sundayLabel}</p>
            <h2 id="worship-home" className="h-lg">Come Worship with Us</h2>
            <p className="lede">
              Join us in person! We’d love to host you. Find service times, directions,
              and everything else you need for your first visit by clicking the button below.
            </p>
            <p style={{ marginTop: "2.1rem" }}>
              <Link to="/visit" className="btn-pill">
                Plan A Visit
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      <section className="split-bleed" aria-labelledby="next-home">
        <div className="split-media">
          <img src="/images/lobby-connect.jpg" alt="People connecting after a Sunday service" />
        </div>
        <div className="split-copy">
          <Reveal>
            <p className="eyebrow">Get involved</p>
            <h2 id="next-home" className="h-lg">Next Steps</h2>
            <p className="lede">
              Wondering how you can grow in your relationship with Jesus?
              Find out what your next steps are.
            </p>
            <p style={{ marginTop: "2rem" }}>
              <Link to="/next-steps" className="btn-pill">
                Take Your Next Step
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      <section aria-label="Our team and calendar">
        <div className="photo-halves">
          <Link to="/team" className="photo-half" aria-label="Meet our team">
            <img src="/images/portrait-archbishop.jpg" alt="Our team" />
          </Link>
          <Link to="/calendar" className="photo-half" aria-label="See our calendar">
            <img src="/images/outreach.jpg" alt="Church events" />
          </Link>
        </div>
        <div className="band-dark">
          <div className="container two-cards text-cards">
            <Reveal>
              <p className="eyebrow">Meet our team</p>
              <h3 className="h-lg">Staff &amp; Leaders</h3>
              <p className="lede">
                Our dedicated team of pastors and staff are here to provide spiritual
                guidance and support on your faith journey.
              </p>
              <p style={{ marginTop: "2rem" }}>
                <Link to="/team" className="btn-pill">
                  Our Staff &amp; Leaders
                </Link>
              </p>
            </Reveal>
            <Reveal delay={1}>
              <p className="eyebrow">Our calendar</p>
              <h3 className="h-lg">See What’s Happening</h3>
              <p className="lede">
                Check out this month’s events to find out what’s happening and how
                you can be involved.
              </p>
              <p style={{ marginTop: "2rem" }}>
                <Link to="/calendar" className="btn-pill">
                  Our Calendar
                </Link>
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="split-bleed flip" aria-labelledby="teachings-home">
        <div className="split-media">
          {latestSermon ? (
            <Link to={`/messages/${latestSermon.slug}`} className="split-art" aria-label={`Watch ${latestSermon.title}`}>
              <img src={sermonArtwork(latestSermon)} alt="" />
              <span className="play">▶</span>
            </Link>
          ) : (
            <img src="/images/series-foundations.jpg" alt="" />
          )}
        </div>
        <div className="split-copy">
          <Reveal>
            <p className="eyebrow">Watch or listen</p>
            <h2 id="teachings-home" className="h-lg">Latest Teachings</h2>
            <p className="lede">
              Missed Sunday or want to revisit the message? Catch the latest sermon
              from Faith Hill and be encouraged, challenged, and reminded of the hope
              we have in Jesus.
            </p>
            {latestSermon ? (
              <p className="meta" style={{ marginTop: "1.4rem" }}>
                <strong>{latestSermon.title}</strong>
                {latestSermon.series_detail?.title ? (
                  <span className="muted"> — {latestSermon.series_detail.title}</span>
                ) : null}
              </p>
            ) : null}
            <p style={{ marginTop: "2rem" }}>
              <Link to="/messages" className="btn-pill btn-outline">
                More Messages
              </Link>
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
