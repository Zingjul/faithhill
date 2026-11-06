import { useState, type FormEvent } from "react";
import { submit } from "../api";
import Reveal from "../components/Reveal";
import { PRAY_INTRO } from "../copy";

export default function Prayer() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const f = new FormData(e.currentTarget);
    const ok = await submit("/api/submit/prayer-request/", {
      name: f.get("name"),
      email: f.get("email"),
      phone: f.get("phone"),
      request: f.get("request"),
    });
    setBusy(false);
    ok ? setDone(true) : setError(true);
  };

  return (
    <section className="section" style={{ paddingTop: "8.5rem" }}>
      <div className="container split" style={{ alignItems: "start" }}>
        <Reveal>
          <p className="eyebrow">Prayer</p>
          <h1 className="h-lg" style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)" }}>
            {PRAY_INTRO.heading}
          </h1>
          <p className="lede">{PRAY_INTRO.body}</p>
          <div className="frame" style={{ marginTop: "1.8rem", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <img src="/images/about-worship.jpg" alt="Prayer at Faith Hill" style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover" }} />
          </div>
        </Reveal>

        <Reveal delay={1}>
          {done ? (
            <div className="panel-card center" style={{ padding: "3rem 1.5rem" }}>
              <div className="form-success">
                <span className="check">✓</span>
                <h2 className="h-md">We’ve received your request</h2>
                <p className="lede">
                  Our pastors and prayer team will be praying over it this week.
                  “The prayer of a righteous person is powerful and effective.” — James 5:16
                </p>
              </div>
            </div>
          ) : (
            <form className="form-stack panel-card" style={{ padding: "1.8rem", background: "#fff" }} onSubmit={onSubmit}>
              <label>
                Your name
                <input name="name" required autoFocus />
              </label>
              <label>
                Email (optional)
                <input name="email" type="email" />
              </label>
              <label>
                Phone (optional)
                <input name="phone" type="tel" />
              </label>
              <label>
                Your prayer request
                <textarea name="request" rows={6} required placeholder="How can we pray for you?" />
              </label>
              {error ? <p className="form-error">Something went wrong — please try again.</p> : null}
              <button className="btn-pill" type="submit" disabled={busy}>
                {busy ? "Sending…" : "Send prayer request"}
              </button>
              <p className="lede" style={{ fontSize: "0.8rem", margin: 0 }}>
                Requests are private — only our pastoral team sees them.
              </p>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
