import {
  createContext,
  useContext,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { submit } from "../api";

/* ---------------------------------------------------------------- */

type ModalKind = "hello" | "subscribe" | { rsvp: string; rsvpTitle: string };

interface ModalContextValue {
  openHello: () => void;
  openSubscribe: () => void;
  openRsvp: (eventSlug: string, eventTitle: string) => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModals() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModals must be used within ModalProvider");
  return ctx;
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ModalKind | null>(null);

  const close = () => setActive(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  const value: ModalContextValue = {
    openHello: () => setActive("hello"),
    openSubscribe: () => setActive("subscribe"),
    openRsvp: (eventSlug, rsvpTitle) => setActive({ rsvp: eventSlug, rsvpTitle }),
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      <ModalShell open={active !== null} onClose={close}>
        {active === "hello" && <HelloForm onDone={close} />}
        {active === "subscribe" && <SubscribeForm onDone={close} />}
        {active !== null && typeof active === "object" && (
          <RsvpForm slug={active.rsvp} title={active.rsvpTitle} />
        )}
      </ModalShell>
    </ModalContext.Provider>
  );
}

/* ---------------------------------------------------------------- */

function ModalShell({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return createPortal(
    <div className={`modal-backdrop${open ? " open" : ""}`} onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function Success({ title, body }: { title: string; body: string }) {
  return (
    <div className="form-success">
      <span className="check">✓</span>
      <h3>{title}</h3>
      <p className="lede">{body}</p>
    </div>
  );
}

function useFormState() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  return { busy, setBusy, done, setDone, error, setError };
}

function HelloForm({ onDone }: { onDone: () => void }) {
  const st = useFormState();
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    st.setBusy(true);
    st.setError(false);
    const f = new FormData(e.currentTarget);
    const ok = await submit("/api/submit/contact/", {
      name: f.get("name"),
      email: f.get("email"),
      subject: "Say Hello",
      message: f.get("message"),
    });
    st.setBusy(false);
    ok ? st.setDone(true) : st.setError(true);
  };

  if (st.done)
    return <Success title="Thanks for saying hello 👋" body="Someone from the team will get back to you soon." />;
  return (
    <>
      <h3>Say Hello</h3>
      <p className="lede">Questions, introductions, anything at all — we'd love to hear from you.</p>
      <form className="form-stack" onSubmit={onSubmit}>
        <label>
          Your name
          <input name="name" required autoFocus />
        </label>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Message
          <textarea name="message" rows={4} required />
        </label>
        {st.error && <p className="form-error">Something went wrong — please try again.</p>}
        <button className="btn-pill" type="submit" disabled={st.busy}>
          {st.busy ? "Sending…" : "Send message"}
        </button>
      </form>
      <CloseRow onClose={onDone} />
    </>
  );
}

function SubscribeForm({ onDone }: { onDone: () => void }) {
  const st = useFormState();
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    st.setBusy(true);
    st.setError(false);
    const ok = await submit("/api/submit/newsletter/", {
      email: new FormData(e.currentTarget).get("email"),
    });
    st.setBusy(false);
    ok ? st.setDone(true) : st.setError(true);
  };

  if (st.done) return <Success title="You're subscribed ✉️" body="Weekly updates will land in your inbox." />;
  return (
    <>
      <h3>Subscribe to Weekly Updates</h3>
      <p className="lede">Service reminders, events and encouragement — once a week, no spam.</p>
      <form className="form-stack" onSubmit={onSubmit}>
        <label>
          Email address
          <input name="email" type="email" required autoFocus />
        </label>
        {st.error && <p className="form-error">Something went wrong — please try again.</p>}
        <button className="btn-pill" type="submit" disabled={st.busy}>
          {st.busy ? "Subscribing…" : "Subscribe"}
        </button>
      </form>
      <CloseRow onClose={onDone} />
    </>
  );
}

function RsvpForm({ slug, title }: { slug: string; title: string }) {
  const st = useFormState();
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    st.setBusy(true);
    st.setError(false);
    const f = new FormData(e.currentTarget);
    const ok = await submit("/api/submit/rsvp/", {
      event: slug,
      name: f.get("name"),
      email: f.get("email"),
      phone: f.get("phone"),
      guests: Number(f.get("guests")) || 1,
    });
    st.setBusy(false);
    ok ? st.setDone(true) : st.setError(true);
  };

  if (st.done) return <Success title="You're registered 🎉" body={`We've saved your spot for ${title}. See you there!`} />;
  return (
    <>
      <h3>Register — {title}</h3>
      <p className="lede">Let us know you're coming so we can prepare well.</p>
      <form className="form-stack" onSubmit={onSubmit}>
        <label>
          Full name
          <input name="name" required autoFocus />
        </label>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Phone (optional)
          <input name="phone" type="tel" />
        </label>
        <label>
          How many are coming (including you)?
          <select name="guests" defaultValue="1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        {st.error && <p className="form-error">Couldn't save your registration — please try again.</p>}
        <button className="btn-pill" type="submit" disabled={st.busy}>
          {st.busy ? "Registering…" : "Register"}
        </button>
      </form>
    </>
  );
}

function CloseRow({ onClose }: { onClose: () => void }) {
  return (
    <p className="center" style={{ margin: "1rem 0 0" }}>
      <button type="button" onClick={onClose} style={{ background: "none", border: 0, color: "var(--muted)", fontSize: "0.85rem" }}>
        Close
      </button>
    </p>
  );
}
