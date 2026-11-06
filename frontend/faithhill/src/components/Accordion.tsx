import { useRef, useState, type ReactNode } from "react";

/** Classic +/− accordion row with smooth height animation. */
export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  renderTitle,
}: {
  title?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  renderTitle?: () => ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`acc-item${open ? " open" : ""}`}>
      <button
        type="button"
        className="acc-head"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {renderTitle ? renderTitle() : title}
        <span className="acc-icon" aria-hidden>
          +
        </span>
      </button>
      <div
        className="acc-panel"
        style={{ maxHeight: open ? panelRef.current?.scrollHeight ?? 1200 : 0 }}
        aria-hidden={!open}
      >
        <div className="acc-panel-inner" ref={panelRef}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Accordion({ children }: { children: ReactNode }) {
  return <div className="accordion">{children}</div>;
}
