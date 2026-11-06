import { useEffect, useState } from "react";
import { fetchAll, type GivingOption } from "../api";
import Reveal from "../components/Reveal";
import { GIVE_INTRO } from "../copy";

export default function Give() {
  const [options, setOptions] = useState<GivingOption[] | null>(null);

  useEffect(() => {
    fetchAll<GivingOption>("/api/giving/").then(setOptions).catch(() => setOptions([]));
  }, []);

  return (
    <>
      <section className="section center" style={{ paddingTop: "8.5rem" }}>
        <div className="container">
          <Reveal>
            <p className="eyebrow">Generosity</p>
            <h1 className="h-lg">{GIVE_INTRO.heading}</h1>
            <p className="lede">{GIVE_INTRO.body}</p>
          </Reveal>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: "5.5rem", maxWidth: "760px" }}>
        {options === null ? (
          <p className="loading-page">Loading giving options…</p>
        ) : options.length === 0 ? (
          <p className="loading-page">Giving details coming soon.</p>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {options.map((o, i) => (
              <Reveal key={o.id} delay={(i % 3) as 0 | 1 | 2}>
                <div className="panel-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1.4rem", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <h2 className="h-md" style={{ fontSize: "1.3rem" }}>{o.label}</h2>
                    {o.instructions ? (
                      <p className="lede" style={{ margin: "0.4rem 0 0" }}>{o.instructions}</p>
                    ) : null}
                  </div>
                  {o.url ? (
                    <a className="btn-pill" href={o.url} target="_blank" rel="noreferrer">
                      Give via {o.label}
                    </a>
                  ) : null}
                </div>
              </Reveal>
            ))}
          </div>
        )}

        <Reveal>
          <p className="lede center" style={{ marginTop: "2.5rem", maxWidth: "52ch" }}>
            “Each of you should give what you have decided in your heart to give, not
            reluctantly or under compulsion, for God loves a cheerful giver.” — 2 Cor. 9:7
          </p>
        </Reveal>
      </section>
    </>
  );
}
