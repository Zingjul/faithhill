import { useEffect, useState } from "react";
import { fetchAll, type SimpleItem } from "../api";
import Accordion, { AccordionItem } from "../components/Accordion";
import CarouselRow from "../components/CarouselRow";
import Reveal from "../components/Reveal";
import { useModals } from "../components/modals";
import { MISSION, MISSION_LABEL, OUR_STORY, VISION, WHY_FAITH_HILL } from "../copy";

const VALUE_IMAGES = [
  "/images/about-worship.jpg",
  "/images/community-groups.jpg",
  "/images/lobby-connect.jpg",
  "/images/outreach.jpg",
];

export default function About() {
  const { openHello } = useModals();
  const [values, setValues] = useState<SimpleItem[]>([]);
  const [beliefs, setBeliefs] = useState<SimpleItem[]>([]);

  useEffect(() => {
    fetchAll<SimpleItem>("/api/values/").then(setValues).catch(() => setValues([]));
    fetchAll<SimpleItem>("/api/beliefs/").then(setBeliefs).catch(() => setBeliefs([]));
  }, []);

  return (
    <>
      {/* Vision: image left, text right */}
      <section className="section" style={{ paddingTop: "7rem" }}>
        <div className="container split">
          <Reveal>
            <div className="frame">
              <img src="/images/about-worship.jpg" alt="Worship at Faith Hill" />
            </div>
          </Reveal>
          <Reveal delay={1}>
            <p className="eyebrow">Our vision</p>
            <h1 className="h-lg">{VISION}</h1>
          </Reveal>
        </div>
      </section>

      {/* Values carousel */}
      <section className="section center" aria-labelledby="values">
        <div className="container">
          <Reveal>
            <h2 id="values" className="h-lg" style={{ marginBottom: "2.2rem" }}>
              Our Values
            </h2>
          </Reveal>
        </div>
        <div className="container">
          <CarouselRow>
            {values.map((v, i) => (
              <article key={v.id} className="mini-card">
                <img src={VALUE_IMAGES[i % VALUE_IMAGES.length]} alt="" />
                <div className="mini-card-body">
                  <h4>{v.title}</h4>
                  <p>{v.description}</p>
                </div>
              </article>
            ))}
          </CarouselRow>
        </div>
      </section>

      {/* Mission band */}
      <section
        className="section center on-dark"
        aria-labelledby="mission"
        style={{
          backgroundImage: "url(/images/mission-band.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "#fff",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "rgba(10,12,18,0.55)" }} />
        <div className="container" style={{ position: "relative" }}>
          <Reveal>
            <p className="eyebrow" style={{ color: "rgba(255,255,255,0.7)" }}>
              {MISSION_LABEL}
            </p>
            <h2 className="h-lg" id="mission">
              Our Mission
            </h2>
            <p className="lede" style={{ color: "rgba(255,255,255,0.88)" }}>
              {MISSION}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Why Faith Hill */}
      <section className="section">
        <div className="container split">
          <Reveal>
            <div className="frame">
              <img src="/images/church-hero.jpg" alt="Life at Faith Hill" />
            </div>
          </Reveal>
          <Reveal delay={1}>
            <p className="eyebrow">{WHY_FAITH_HILL.label}</p>
            <h2 className="h-md">{WHY_FAITH_HILL.headline}</h2>
            <p className="lede">{WHY_FAITH_HILL.body}</p>
          </Reveal>
        </div>
      </section>

      {/* Beliefs accordion */}
      <section className="section" aria-labelledby="beliefs">
        <div className="container split" style={{ alignItems: "start" }}>
          <Reveal>
            <p className="eyebrow">Statements of faith</p>
            <h2 id="beliefs" className="h-lg">
              Our Beliefs
            </h2>
            <p className="lede">
              Faith Hill affirms the historic Christian faith passed down through the ages.
            </p>
          </Reveal>
          <Reveal delay={1}>
            <Accordion>
              {beliefs.map((b) => (
                <AccordionItem key={b.id} title={b.title}>
                  {b.description}
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      {/* Story band */}
      <section className="section band center" aria-labelledby="story">
        <div className="container">
          <Reveal>
            <h2 id="story" className="h-lg" style={{ marginBottom: "1.4rem" }}>
              Our Story
            </h2>
            {OUR_STORY.map((p) => (
              <p key={p.slice(0, 20)} className="lede" style={{ maxWidth: "640px", marginBottom: "1rem" }}>
                {p}
              </p>
            ))}
          </Reveal>
          <Reveal delay={1}>
            <div className="frame" style={{ maxWidth: "720px", margin: "2rem auto 0", borderRadius: "var(--radius)", overflow: "hidden" }}>
              <img src="/images/mission-band.jpg" alt="The Faith Hill family" style={{ width: "100%" }} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Questions CTA */}
      <section className="section center" aria-labelledby="questions">
        <div className="container">
          <Reveal>
            <h2 id="questions" className="h-lg">Have Questions?</h2>
            <p className="lede">
              If you have questions about faith, life, or what we’re all about, we’d love
              to talk. No perfect questions required. Just a conversation and a chance to
              get to know each other.
            </p>
            <p style={{ marginTop: "1.4rem" }}>
              <button type="button" className="btn-pill" onClick={openHello}>
                We’d love to hear from you!
              </button>
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
