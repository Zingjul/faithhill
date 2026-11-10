import { formatTime } from "../api";
import { useServiceTimes } from "../serviceTimes";
import Accordion, { AccordionItem } from "../components/Accordion";
import Reveal from "../components/Reveal";
import { useModals } from "../components/modals";
import { CHURCH, FAQS, VISIT } from "../copy";

export default function Visit() {
  const times = useServiceTimes();
  const { openHello } = useModals();

  return (
    <>
      <header className="hero">
        <div className="hero-media">
          <img src="/images/lobby-connect.jpg" alt="Welcome to Faith Hill" />
        </div>
        <div className="hero-content container">
          <h1 className="h-xl" style={{ maxWidth: "18ch" }}>
            {VISIT.heroHeadline}
          </h1>
        </div>
      </header>

      {/* Service times */}
      <section className="section" aria-labelledby="service-times">
        <div className="container split" style={{ alignItems: "start" }}>
          <Reveal>
            <div className="frame">
              <img src="/images/church-hero.jpg" alt="Inside a Sunday service" />
            </div>
          </Reveal>
          <Reveal delay={1}>
            <p className="eyebrow">Service times</p>
            <h2 id="service-times" className="h-md" style={{ marginBottom: "1rem" }}>
              Service Times
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.2rem", display: "grid", gap: "0.7rem" }}>
              {times.map((t) => (
                <li key={t.id} style={{ fontSize: "1.05rem" }}>
                  <strong style={{ fontFamily: "var(--font-display)" }}>
                    {t.day_name}s · {formatTime(t.start_time)}
                    {t.end_time ? ` – ${formatTime(t.end_time)}` : ""}
                  </strong>
                  <span className="lede" style={{ display: "block", fontSize: "0.88rem", marginTop: 0 }}>
                    {t.name}
                    {t.notes ? ` · ${t.notes}` : ""}
                  </span>
                </li>
              ))}
            </ul>
            <p className="lede" style={{ marginBottom: "1.2rem" }}>{VISIT.servicesIntro}</p>
            <p className="lede">
              We meet at {CHURCH.shortAddress} — {CHURCH.oneLine}.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Location card */}
      <section className="section-tight">
        <div className="container">
          <Reveal>
            <div className="panel-card center" style={{ padding: "3rem 1.5rem" }}>
              <p className="eyebrow">{VISIT.locationLabel}</p>
              <h2 className="h-lg">{VISIT.locationTitle}</h2>
              <p className="lede" style={{ marginBottom: "1.2rem" }}>{VISIT.locationBody}</p>
              <address className="address-block">
                {CHURCH.addressLines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </address>
              <p className="lede">{CHURCH.phone}</p>
              <p style={{ marginTop: "1.6rem" }}>
                <a
                  className="btn-pill btn-outline"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CHURCH.mapQuery)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Get Directions
                </a>
              </p>
              <p className="lede">See you on Sunday. We’ll have a seat for you.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Parking */}
      <section className="section" aria-labelledby="parking">
        <div className="container split" style={{ alignItems: "start" }}>
          <Reveal>
            <p className="eyebrow" style={{ fontStyle: "italic", textTransform: "none", letterSpacing: 0, fontSize: "0.85rem" }}>
              I’m coming!
            </p>
            <h2 id="parking" className="h-md">Where do I park?</h2>
          </Reveal>
          <Reveal delay={1}>
            <p className="lede">{VISIT.parking}</p>
          </Reveal>
        </div>
      </section>

      {/* First stop / kids */}
      <section className="section-tight">
        <div className="container two-cards">
          <Reveal>
            <article className="img-card" style={{ minHeight: "300px" }}>
              <img src="/images/lobby-connect.jpg" alt="Welcome desk" />
              <div className="img-card-body">
                <p className="eyebrow">Say hello</p>
                <h3>Your First Stop</h3>
                <p>{VISIT.firstStop}</p>
                <div className="hero-actions">
                  <button type="button" className="btn-pill" onClick={openHello}>
                    Ask a Question
                  </button>
                </div>
              </div>
            </article>
          </Reveal>
          <Reveal delay={1}>
            <article className="img-card" style={{ minHeight: "300px" }}>
              <img src="/images/kids-ministry.jpg" alt="Children's church" />
              <div className="img-card-body">
                <p className="eyebrow">Faith Hill Kids</p>
                <h3>Have Kids?</h3>
                <p>{VISIT.kids}</p>
                <div className="hero-actions">
                  <button type="button" className="btn-pill" onClick={openHello}>
                    Pre-Register Your Kids
                  </button>
                </div>
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="section center" aria-labelledby="faq">
        <div className="container" style={{ maxWidth: "760px" }}>
          <Reveal>
            <p className="eyebrow">{VISIT.faqIntro}</p>
            <h2 id="faq" className="h-lg" style={{ marginBottom: "2rem" }}>
              Frequently Asked Questions
            </h2>
          </Reveal>
          <Reveal delay={1}>
            <div style={{ textAlign: "left" }}>
              <Accordion>
                {FAQS.map((f) => (
                  <AccordionItem key={f.q} title={f.q}>
                    {f.a}
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
