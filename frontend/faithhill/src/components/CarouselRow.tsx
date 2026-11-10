import { useEffect, useRef, useState, type ReactNode } from "react";

/** Horizontal snap-scroll row with circular arrow buttons (like the reference design). */
export default function CarouselRow({
  children,
  heading,
}: {
  children: ReactNode;
  /** Optional section heading; when given, the arrows sit beside it. */
  heading?: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const update = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    update();
    const el = trackRef.current;
    el?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [children]);

  const scrollBy = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior: "smooth" });
  };

  const arrows = (
    <div className="carousel-arrows">
      <button type="button" className="arrow-btn" onClick={() => scrollBy(-1)} disabled={!canPrev} aria-label="Scroll back">
        ←
      </button>
      <button type="button" className="arrow-btn" onClick={() => scrollBy(1)} disabled={!canNext} aria-label="Scroll forward">
        →
      </button>
    </div>
  );

  return (
    <div className="carousel-wrap">
      {heading ? (
        <div className="section-head">
          {heading}
          {arrows}
        </div>
      ) : null}
      <div className="carousel" ref={trackRef}>
        {children}
      </div>
      {heading ? null : arrows}
    </div>
  );
}
