# Faith Hill — Project Planning Document

> Living document. Updated as planning discussions happen. No code changes implied by this file.

**Last updated:** 2026-11-06

---

## 1. Vision

An open-source website for **Faith Hill Prophetic Assembly Church**, headed by ArchBishop Emmanuel Musa Jatau.

The product has two sides:

1. **Public website** — what visitors see and interact with (React).
2. **Staff dashboard** — a separate, login-protected area where *trained staff* (non-developers) update all content shown on the public site, without touching code.

## 2. Architecture

```
Trained staff ──login──► Staff Dashboard (React) ──► Django REST API ──► Database
                                                              │
Visitors ──────────────► Public Website (React) ──► Django REST API ◄─┘
                          (reads same content)
```

- **Backend:** Django 6.1 + Django REST Framework (to be added). Single source of truth for all content.
- **Auth:** Token-based login (e.g. JWT) so the React staff dashboard can authenticate against the API.
- **Django Admin:** stays, but only as a developer/superadmin fallback — staff will never see it.
- **CORS** must be configured so the React apps can call the API.

### Open architecture question
- **One React app** (public site + `/dashboard` section) vs **two separate React apps** (public site / staff dashboard). Two apps = cleaner separation and independent deployment; one app = shared components and simpler repo. To be discussed.

## 3. Decisions Log

| Date | Decision | Notes |
|---|---|---|
| 2026-11-05 | Staff area = **custom React dashboard** (not Django Admin) | Heavier build (~2–3×) but matches brand and is friendlier for trained staff. Django Admin remains as developer fallback. |
| 2026-11-05 | Visitor interactions = **full set** | Forms (prayer requests, contact, "plan your visit"), engagement (newsletter, event RSVP, testimonies), media (sermon video/audio, livestream, gallery), online giving links. |
| 2026-11-05 | Build order = **backend foundation first** | Models → API → then the two frontends. |
| 2026-11-06 | Backend apps = `church` (content) + `engagement` (visitor submissions/staff inbox) | Empty `general` app removed. |
| 2026-11-06 | API layout = `/api/…` public read-only, `/api/submit/…` public write-only forms, `/api/manage/…` staff CRUD (JWT + `is_staff`), `/api/auth/token/` login | JWT (simplejwt) chosen for the future React staff dashboard; Django Admin kept at `/admin/` as developer fallback. |
| 2026-11-06 | Django pinned as `>=5.2,<7.0` | Original dev machine runs Python 3.13 / Django 6.1.3; build sandbox has Python 3.11 (max Django 5.2 LTS). Range covers both; code is version-agnostic. |
| 2026-11-06 | Public site design follows owner's **Icon Church reference screenshots** | Full-screen overlay menu, pill CTAs, hero photography, periwinkle bands, accordion + carousel patterns. Placeholder photography is AI-generated (`public/images/`); replace with real church photos before launch. |
| 2026-11-06 | One-vs-two React apps resolved: **two apps** | `frontend/faithhill` = public site (:5173), `frontend/dashboard` = staff dashboard (:5174). |

## 4. Draft Data Models

*(Draft — to be refined before build phase)*

- **Sermon** — title, preacher, date, scripture reference, video/audio, notes
- **Event** — title, date/time, location, description, image, RSVP submissions
- **Announcement** — title, body, publish/expiry dates
- **Ministry** — name, description, leader, image
- **Leadership profile** — name, role/title, bio, photo (e.g. the ArchBishop)
- **Service time** — day, time, service name
- **Gallery album / photo** — for events and church life
- **Testimony** — member story, approved-before-public flag
- **PrayerRequest** *(staff-only visibility)* — name, contact, request, status
- **ContactMessage** *(staff-only visibility)* — name, email, message, replied flag
- **NewsletterSubscriber** — email, subscribed date
- **Giving config** — provider links/details for online giving
- **Staff user / role** — extends Django's auth user

## 5. Roles & Permissions (draft)

- **Superadmin** (developer) — full access, incl. Django Admin
- **Content staff** — manage sermons, events, announcements, ministries
- **Pastoral care staff** — view/respond to prayer requests & contact messages
- **Media team** — gallery and sermon media uploads

## 6. Roadmap

- **Phase 0 — Planning** *(current)* — document decisions, refine models, sitemap, branding.
- **Phase 1 — Backend foundation** ✅ *(built 2026-11-06)* — DRF + JWT + CORS; 18 models across `church`/`engagement`; Django Admin registered (branded "Faith Hill CMS"); 13 public read endpoints, 4 submission endpoints, 18 staff manage endpoints; `seed_demo` command for demo content; 11 API smoke tests passing.
- **Phase 2 — Staff dashboard** ✅ *(built 2026-11-06)* — separate React 19 + TS + Vite app at `frontend/dashboard` (decision: two React apps over one shared app). JWT login (verifies `is_staff` via `/api/auth/me/`), config-driven generic CRUD for all 14 content types (`src/resources.tsx`), inbox pages for prayer requests (status workflow), contact messages (replied tracking), RSVPs (per-event + guest totals), testimonies (approve/unpublish moderate), newsletter (list/export/remove). Dev server on port 5174, Vite proxy → Django :8000.
- **Phase 3 — Public website** ✅ *(built 2026-11-06)* — `frontend/faithhill` rebuilt from the Vite template into the full public site, following the owner's "Icon Church" reference screenshots for layout and feel. Pages: Home, About, Plan A Visit, Next Steps, Messages library, Sermon detail (Info/Scripture/Topic tabs + personal notes w/ download), Team (profile pop-ups), Calendar (month pager + event accordions + RSVP pop-up), Give, Prayer. Detail work: full-screen menu overlay with staggered link animation, fixed header with hero/light variants, pop-up modals (Say Hello / Subscribe / RSVP / team profiles), IntersectionObserver scroll-reveals, snap-scroll carousels with arrow controls, smooth accordion transitions, warm-paper/periwinkle/royal-blue design tokens (Space Grotesk + Inter). All content reads live from the API; forms submit to `/api/submit/*`.
- **Phase 4 — Interactions** — visitor forms wired to staff inbox; newsletter signup; RSVP.
- **Phase 5 — Media & giving** — sermon media, livestream embed, gallery, giving integration.
- **Phase 6 — Launch** — hosting, media storage, backups, analytics, handover docs & staff training notes (audience: *trained staff*, so the dashboard needs onboarding guidance).

## 7. Open Questions for Next Discussion

1. **Sitemap** — see proposed sitemap in §8.4; needs owner approval.
2. **Staff size & roles** — how many staff, and which of the roles above actually exist?
3. **Branding** — existing logo, colors, fonts, or design from scratch?
4. **Sermon media hosting** — YouTube/Vimeo embeds (free, easy) vs self-hosted files?
5. **Online giving provider** — Paystack / Flutterwave are the standard options in Nigeria; which does the church use?
6. **One vs two React apps** (see §2).
7. **Domain & hosting** — where should this live when done?
8. **Homepage hero formula** (see §8.3) — depends on quality/quantity of church photos available.

---

## 8. Research Notes (2026-11-05)

Two sources studied and distilled below.

### 8.1 Source A — "Building an Engaging Church Website" (marketing.church)
[Article](https://marketing.church/building-an-engaging-church-website-best-practices-and-key-elements/)

**Why the site matters:**
- Enhances communication with the congregation (service times, schedule changes, Bible studies — accessible 24/7).
- Attracts new members — a visually appealing homepage + easy "plan a visit" path.
- Increases visibility & outreach — SEO, social media integration, testimonials/stories.

**Key elements every church website needs:**
1. Clear **mission & vision statement** — concise, inspiring, understandable at first glance.
2. **Church calendar & event info** — date, time, location, specific instructions per event.
3. **Donation page for easy giving** — clear instructions, multiple methods, secure.
4. **Inspiring visuals & multimedia** — photos, testimonial videos, sermons; creates emotional connection.
5. **Volunteer opportunities & engagement** — positions listed, success stories, sign-up forms.

**Best practices:**
- User-friendly design & nav: intuitive layout, simple menu, service times/location easy to find, clear CTAs, consistent branding, fast loading.
- SEO: keywords, optimized titles/meta, logical site structure, **local SEO** (address, phone, hours), fresh content.
- Integrate existing tools: online donations, social media, email marketing (e.g. Mailchimp), livestreaming (YouTube/Facebook Live), event registration tools.
- **Mobile-first / responsive** — most visitors (esp. younger) browse on phones; also affects search ranking.
- **Regularly updated content** — stale events/sermons make a church look inactive; freshness also boosts SEO.

**Reference church sites mentioned:** Lifepoint (strong "Plan a Visit" CTA), Rock Church (mobile + SEO), NewSpring (clear mission/vision/values), Hillsong (navigation + visuals), North Point (giving + livestream integration).

### 8.2 Source B — "The Church Website Page Template Library" (Pro Church Tools, PDF)

A page-by-page blueprint library. Core pages it prescribes:

**Homepage — 4 hero formulas:**
- **Formula 1:** collapsible menu + full-width hero image; headline mid-left. ⚠ don't overlap text with people's eyelines in photos.
- **Formula 2:** traditional top menu; headline bottom-justified → photos can center people's faces.
- **Formula 3:** traditional menu; headline lower-left variant.
- **Formula 4:** collapsible menu + **5-photo collage hero** — ideal when the church lacks professional photos (likely our case early on).
- Rule for all: *every important next step is reachable in 1 click*; prominent CTA buttons.

**Full homepage section order (template):**
1. Hero (logo + headline + 2 CTAs + short intro)
2. "A Statement About Us" + CTA
3. "Plan Your Visit" + CTA
4. "Next Steps" + CTA
5. Calendar preview + CTA
6. Staff & Leaders preview + CTA

**About Us page:**
- Headline + intro paragraph
- **Beliefs** — titles nested in *accordion dropdowns* (saves space)
- **Our Values** — 4 value cards, horizontal scrolling

**Next Steps page:**
- Hero: "Your Next Step" + featured event + secondary events with CTAs
- **Core Next Steps cards:** Connect · Pray · Contact · Give
- Ministries cards

**Sermons page:**
- Sermon **video + audio**
- Metadata: **Scripture, Speaker, Topic**
- Fill-in-the-blank **sermon notes**
- "Up Next": links to other sermons **in the same series** → implies a `SermonSeries` concept

**Staff & Leaders page:**
- One card per staff member → click opens full profile
- Profile contains: Summary / About / Contact (email + office phone)

**Calendar page:**
- Events listed in **accordions**; expand to see full details (title, date/time, actions like RSVP)

**Design principles from the PDF:** 1-click access to next steps everywhere; accordions/cards to compress dense content; match hero formula to photo assets; CTA button on every section.

### 8.3 Impact on our data models

Refinements to §4 based on the templates:
- **Sermon** — add `series`, `topic`, `scripture`, structured `notes` (fill-in-the-blank), both `video_url` and `audio_file`.
- → New model: **SermonSeries** (title, artwork, description).
- **StaffProfile** — fields for summary/about/contact; ordered cards with full-profile view.
- **NextStep** type items (Connect, Pray, Contact, Give) — could be fixed pages or a model; decide at build time.
- **Event** — must support RSVP "actions" and accordion-friendly short vs full detail.
- **Value** and **Belief** content → fit into the About page (simple text blocks or small models).

### 8.4 Proposed sitemap (pending approval)

**Public site:**
1. **Home** (hero + About statement + Plan Your Visit + Next Steps + Calendar + Staff previews)
2. **About Us** (mission/vision, beliefs accordions, values cards)
3. **Plan Your Visit** (service times, location, what to expect) — *the article stresses this CTA*
4. **Next Steps** (Connect / Pray / Contact / Give + featured events + ministries)
5. **Sermons** (library by series, with video/audio/notes) + livestream embed
6. **Events / Calendar** (accordion list, RSVP)
7. **Ministries** (could live under Next Steps or standalone)
8. **Staff & Leaders** (cards → profiles)
9. **Give** (donation page, secure, clear instructions)
10. **Contact** (form + socials + map)

**Staff dashboard:** login → manage all content models above + inbox for prayer requests, contact messages, testimonies.

### 8.5 Design & technical guidelines adopted

- Mobile-first, responsive; fast loading (optimized images).
- SEO basics baked in: titles/meta, logical structure, local SEO (address, phone, service times).
- Consistent branding once colors/logo exist (see open question 3).
- Integrate rather than build: YouTube/Facebook for livestream, email marketing service for newsletter, Paystack/Flutterwave for giving (pending open question 5).
- Fresh content discipline: the staff dashboard exists precisely to enable this.
