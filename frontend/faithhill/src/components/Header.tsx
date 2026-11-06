import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { CHURCH } from "../copy";

/* The menu-open state is shared so pages can dim their content if needed. */
const MenuContext = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({
  open: false,
  setOpen: () => undefined,
});
export const useMenu = () => useContext(MenuContext);

const NAV = [
  { to: "/about", label: "About Us" },
  { to: "/visit", label: "Plan A Visit" },
  { to: "/next-steps", label: "Next Steps" },
  { to: "/calendar", label: "Calendar" },
  { to: "/team", label: "Our Team" },
  { to: "/messages", label: "Messages" },
  { to: "/give", label: "Give" },
];

export function Logo() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden>
      <circle cx="20" cy="20" r="18.5" stroke="currentColor" strokeWidth="2.4" />
      <path d="M6 27 L15 14 L20 21 L26 11 L34 27" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" fill="none" />
      <path d="M26 11 V 27" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );
}

/** Pages whose top is a full-bleed photo (white logo needed). */
const HERO_ROUTES = new Set(["/", "/visit", "/next-steps"]);

export default function Header() {
  const { open, setOpen } = useMenu();
  const { pathname } = useLocation();
  const onHero = HERO_ROUTES.has(pathname);

  // Close the overlay on route change or Escape.
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return (
    <>
      <header className={`site-header${onHero ? " on-hero" : ""}${open ? " menu-open" : ""}`} id="site-header">
        <Link to="/" className="brand-link" onClick={() => setOpen(false)}>
          <Logo />
          <span className="brand-name">{CHURCH.name}</span>
        </Link>
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="menu-overlay"
          onClick={() => setOpen(!open)}
        >
          {open ? "Close" : "Menu"}
          <span className="menu-dot" aria-hidden />
        </button>
      </header>

      <div className={`menu-overlay${open ? " open" : ""}`} id="menu-overlay" aria-hidden={!open}>
        <div className="menu-image">
          <img src="/images/about-worship.jpg" alt="" />
        </div>
        <nav className="menu-links" aria-label="Main">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className="nav-big" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
              {item.label}
            </NavLink>
          ))}
          <div className="menu-cta">
            <NavLink to="/give" className="btn-pill" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
              Give
            </NavLink>
          </div>
        </nav>
      </div>
    </>
  );
}

export function MenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <MenuContext.Provider value={{ open, setOpen }}>{children}</MenuContext.Provider>;
}
