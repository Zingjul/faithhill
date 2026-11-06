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
            <p style={{ marginTop: "1.4rem" }}>
              <Link to="/about" className="btn-pill btn-sm">
                Want to Learn More?
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section band center" aria-labelledby="worship-home">
        <div className="container">
          <Reveal>
            <p className="eyebrow">{sundayLabel}</p>
            <h2 id="worship-home" className="h-lg">Come Worship with Us</h2>
            <p className="lede">
              Join us in person! We’d love to host you. Find service times, directions,
              and everything else you need for your first visit by clicking the button below.
            </p>
            <p style={{ marginTop: "1.4rem" }}>
              <Link to="/visit" className="btn-pill">
                Plan A Visit
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section center" aria-labelledby="next-home">
        <div className="container">
          <Reveal>
            <p className="eyebrow">Get involved</p>
            <h2 id="next-home" className="h-lg">Next Steps</h2>
            <p className="lede">
              Wondering how you can grow in your relationship with Jesus?
              Find out what your next steps are.
            </p>
            <p style={{ marginTop: "1.4rem" }}>
              <Link to="/next-steps" className="btn-pill">
                Take Your Next Step
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-tight">
        <div className="container two-cards">
          <Reveal>
            <Link to="/team" className="img-card">
              <img src="/images/portrait-archbishop.jpg" alt="Our team" />
              <div className="img-card-body">
                <p className="eyebrow">Meet our team</p>
                <h3>Staff &amp; Leaders</h3>
                <p>
                  Our dedicated team of pastors and staff are here to provide spiritual
                  guidance and support on your faith journey.
                </p>
                <span className="btn-pill">Our Staff &amp; Leaders</span>
              </div>
            </Link>
          </Reveal>
          <Reveal delay={1}>
            <Link to="/calendar" className="img-card">
              <img src="/images/outreach.jpg" alt="Church events" />
              <div className="img-card-body">
                <p className="eyebrow">Our calendar</p>
                <h3>See What’s Happening</h3>
                <p>
                  Check out this month’s events to find out what’s happening and how
                  you can be involved.
                </p>
                <span className="btn-pill">Our Calendar</span>
              </div>
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="section" aria-labelledby="teachings-home">
        <div className="container split">
          <Reveal>
            {latestSermon ? (
              <Link to={`/messages/${latestSermon.slug}`} className="featured-art" aria-label={`Watch ${latestSermon.title}`}>
                <img
                  src={sermonArtwork(latestSermon)}
                  alt=""
                />
                <span className="play">▶</span>
              </Link>
            ) : (
              <div className="featured-art">
                <img src="/images/series-foundations.jpg" alt="" />
              </div>
            )}
            {latestSermon ? (
              <p className="meta" style={{ marginTop: "0.8rem" }}>
                <strong>{latestSermon.series_detail?.title ?? latestSermon.title}</strong>
                <br />
                <span className="lede" style={{ fontSize: "0.85rem" }}>
                  {latestSermon.title}
                </span>
              </p>
            ) : null}
          </Reveal>
          <Reveal delay={1}>
            <p className="eyebrow">Watch or listen</p>
            <h2 id="teachings-home" className="h-lg">Latest Teachings</h2>
            <p className="lede">
              Missed Sunday or want to revisit the message? Catch the latest sermon
              from Faith Hill and be encouraged, challenged, and reminded of the hope
              we have in Jesus.
            </p>
            <p style={{ marginTop: "1.4rem" }}>
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
