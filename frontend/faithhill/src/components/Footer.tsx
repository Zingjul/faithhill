import { Link } from "react-router-dom";
import { CHURCH, SOCIALS } from "../copy";
import { Logo } from "./Header";
import { useModals } from "./modals";

export default function Footer({ serviceLabel }: { serviceLabel: string }) {
  const { openHello, openSubscribe } = useModals();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="brand-link">
              <Logo />
              <span className="brand-name">{CHURCH.name}</span>
            </span>
            <p>{serviceLabel}</p>
            <p>No matter the situation, you can always feel free to reach out, even if it's just to say hi 👋</p>
            <div className="footer-actions">
              <button type="button" className="btn-pill" onClick={openHello}>
                Say Hello
              </button>
              <Link to="/next-steps" className="btn-pill btn-outline on-dark">
                Take Your Next Step
              </Link>
            </div>
            <div className="footer-contact">
              <a href={`mailto:${CHURCH.email}`}>{CHURCH.email}</a>
              <a href={`tel:${CHURCH.phone.replace(/\s/g, "")}`}>{CHURCH.phone}</a>
              <span>
                {CHURCH.addressLines.map((l) => (
                  <span key={l}>
                    {l}
                    <br />
                  </span>
                ))}
              </span>
            </div>
          </div>

          <div className="footer-col">
            <h5>Visit</h5>
            <ul>
              <li><Link to="/visit">Plan A Visit</Link></li>
              <li><Link to="/team">Staff &amp; Leaders</Link></li>
              <li><Link to="/messages">Messages</Link></li>
              <li><Link to="/next-steps">Next Steps</Link></li>
            </ul>
            <h5 style={{ marginTop: "1.6rem" }}>Social Media</h5>
            <ul>
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h5>Learn More</h5>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/calendar">Calendar</Link></li>
              <li><Link to="/give">Give</Link></li>
            </ul>
            <h5 style={{ marginTop: "1.6rem" }}>Stay Updated</h5>
            <ul>
              <li>
                <button type="button" className="linklike" onClick={openSubscribe}>
                  ✉️ Subscribe to Weekly Updates
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>Copyright {new Date().getFullYear()} {CHURCH.fullName}. All Rights Reserved.</span>
          <span>Built with faith, hope &amp; love.</span>
        </div>
      </div>
    </footer>
  );
}
