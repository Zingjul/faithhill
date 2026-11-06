import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAll, mediaUrl, type Ministry, type NextStepItem } from "../api";
import CarouselRow from "../components/CarouselRow";
import Reveal from "../components/Reveal";
import { useModals } from "../components/modals";
import { NEXT_STEPS } from "../copy";

const STEP_IMAGES: Record<string, string> = {
  Connect: "/images/lobby-connect.jpg",
  Pray: "/images/about-worship.jpg",
  Contact: "/images/church-hero.jpg",
  Give: "/images/outreach.jpg",
};

const MINISTRY_IMAGES = [
  "/images/kids-ministry.jpg",
  "/images/about-worship.jpg",
  "/images/community-groups.jpg",
  "/images/outreach.jpg",
];

export default function NextSteps() {
  const [steps, setSteps] = useState<NextStepItem[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const { openHello } = useModals();

  useEffect(() => {
    fetchAll<NextStepItem>("/api/next-steps/").then(setSteps).catch(() => setSteps([]));
    fetchAll<Ministry>("/api/ministries/").then(setMinistries).catch(() => setMinistries([]));
  }, []);

  return (
    <>
      <header className="hero hero-slim">
        <div className="hero-media">
          <img src="/images/community-groups.jpg" alt="Community at Faith Hill" />
        </div>
        <div className="hero-content container">
          <h1 className="h-xl" style={{ fontSize: "clamp(2.4rem, 5.5vw, 4rem)" }}>
            {NEXT_STEPS.heroHeadline}
          </h1>
        </div>
      </header>

      {/* Get involved carousel */}
      <section className="section center" aria-labelledby="involved">
        <div className="container">
          <Reveal>
            <h2 id="involved" className="h-lg">{NEXT_STEPS.involvedHeading}</h2>
            <p className="lede" style={{ marginBottom: "2.2rem" }}>{NEXT_STEPS.involvedIntro}</p>
          </Reveal>
          <CarouselRow>
            {steps.map((s, i) => (
              <article key={s.id} className="mini-card">
                <img src={STEP_IMAGES[s.title] ?? MINISTRY_IMAGES[i % MINISTRY_IMAGES.length]} alt="" />
                <div className="mini-card-body">
                  <h4>{s.title}</h4>
                  <p>{s.description}</p>
                  <StepLink step={s} />
                </div>
              </article>
            ))}
          </CarouselRow>
        </div>
      </section>

      {/* Community / Serving band */}
      <section className="section band" aria-labelledby="community">
        <div className="container split" style={{ alignItems: "start" }}>
          <Reveal>
            <p className="eyebrow">{NEXT_STEPS.community.label}</p>
            <h2 id="community" className="h-md">{NEXT_STEPS.community.heading}</h2>
            <p className="lede" style={{ marginBottom: "1.3rem" }}>{NEXT_STEPS.community.body}</p>
            <button type="button" className="btn-pill" onClick={openHello}>
              {NEXT_STEPS.community.cta}
            </button>
          </Reveal>
          <Reveal delay={1}>
            <p className="eyebrow">{NEXT_STEPS.serving.label}</p>
            <h2 className="h-md">{NEXT_STEPS.serving.heading}</h2>
            <p className="lede" style={{ marginBottom: "1.3rem" }}>{NEXT_STEPS.serving.body}</p>
            <button type="button" className="btn-pill btn-outline" onClick={openHello}>
              {NEXT_STEPS.serving.cta}
            </button>
          </Reveal>
        </div>
      </section>

      {/* Ministries carousel */}
      <section className="section center" aria-labelledby="ministries">
        <div className="container">
          <Reveal>
            <h2 id="ministries" className="h-lg">{NEXT_STEPS.ministriesHeading}</h2>
            <p className="lede" style={{ marginBottom: "2.2rem" }}>{NEXT_STEPS.ministriesIntro}</p>
          </Reveal>
          <CarouselRow>
            {ministries.map((m, i) => (
              <article key={m.id} className="mini-card">
                <img src={mediaUrl(m.image) || MINISTRY_IMAGES[i % MINISTRY_IMAGES.length]} alt="" />
                <div className="mini-card-body">
                  <h4>{m.name}</h4>
                  <p>{m.summary}</p>
                  <button type="button" className="btn-pill btn-sm" onClick={openHello}>
                    Learn More
                  </button>
                </div>
              </article>
            ))}
          </CarouselRow>
        </div>
      </section>
    </>
  );
}

function StepLink({ step }: { step: NextStepItem }) {
  const { openHello } = useModals();
  if (step.title.toLowerCase() === "contact") {
    return (
      <button type="button" className="btn-pill btn-sm" onClick={openHello}>
        Reach Out
      </button>
    );
  }
  const external = step.link.startsWith("http");
  const label = step.title.toLowerCase() === "give" ? "Give Now" : step.title.toLowerCase() === "connect" ? "Reach Out" : "Learn More";
  return (
    <Link
      className="btn-pill btn-sm"
      to={external ? step.link : step.link || "/contact"}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {label}
    </Link>
  );
}
