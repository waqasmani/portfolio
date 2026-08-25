# CustomerFlow — Premium Development Studio Platform

A production-grade brand platform for CustomerFlow (customerflow.work), a full stack
development studio — not a static portfolio, but a complete application: public site, developer blog, project request intake with an
AI assistant, real-time live chat, privacy-friendly analytics, and a full admin dashboard, all in
one self-hostable Next.js codebase.

Built with **Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · PostgreSQL · Prisma 7**.

> The original build specification lives in [`docs/SPEC.md`](docs/SPEC.md).

---

## Feature map

### Public site
- **Home** — animated hero (rotating tech keywords, live code panel, cursor-tracking glow,
  availability status), brand-icon tech marquee, animated stat counters, interactive skills grid,
  featured project showcase, services strip, testimonial carousel, CTA band
- **Projects** — category filters (server-rendered, shareable URLs) and full case studies:
  problem/solution, measured results, a layered architecture diagram, challenge/solution
  breakdowns, tech stack, gallery, prev/next navigation, per-project view counts
- **Services** — six service offerings with feature lists, a four-phase process timeline, FAQ
- **Blog** — search, category filters with counts, featured article, pagination; article reader
  with server-side shiki syntax highlighting (zero highlighter JS shipped), scroll-spy table of
  contents, reading progress bar, copy-code buttons, share buttons, related articles
- **Custom Development** — full project request form (category, budget, deadline, priority,
  technology preferences, file attachments) with an **AI Project Assistant** that turns a rough
  idea into a structured brief (requirements, features, stack, complexity, phases) for review
  before submitting
- **Contact** — validated form with honeypot spam protection, availability/response-time panel
- **Live chat** — floating widget with lead capture, real-time messaging over SSE, typing
  indicators both directions, emoji picker, file sharing, history restore, unread badges, and an
  automatic assistant when the team is away
- Dark-first design with a light mode, `prefers-reduced-motion` respected throughout, semantic
  HTML with skip links and keyboard-accessible components

### Admin (`/admin`)
- Session auth (bcrypt, DB-backed revocable sessions, sliding expiry) with **Admin/Editor roles**
- **Overview** — visitors, page views, inquiries, chats, blog reads, traffic chart, conversions
- **Live Chat** — searchable conversation inbox, real-time threads, assign/close/reopen
- **Project Requests** — pipeline statuses (New → Reviewing → … → Completed/Rejected), AI brief
  snapshot, attachment downloads, internal notes
- **Messages** — contact inbox with statuses
- **Projects** — full case-study CRUD (challenges, architecture, results, gallery, stack)
- **Blog CMS** — markdown editor with true-fidelity preview, scheduling, SEO fields, tags
- **Testimonials** — modal editor with ordering and visibility
- **Analytics** — 7/30/90-day ranges, top pages, referrers, devices, countries, conversion events
- **Settings** — availability status, chat presence, identity, socials, SEO defaults (live
  immediately, no redeploy)

### Platform
- **Privacy-friendly first-party analytics** — no cookies, no third parties; visitors are counted
  with a daily-rotating salted hash; conversion events (contact, request, profile download, chat, demo)
- **SEO** — per-page metadata with canonicals, branded dynamic OG images, `sitemap.xml`,
  `robots.txt`, JSON-LD (`Person`, `WebSite`, `ProfessionalService`, `BlogPosting`,
  `BreadcrumbList`, `CreativeWork`)
- **Security** — zod validation at every trust boundary, token-bucket rate limiting on all public
  endpoints, composite login limiting (per-IP + per-account), timing-safe auth, honeypots,
  escaped markdown HTML, security headers, admin-only file downloads
- **File storage** — Cloudflare R2 / any S3-compatible store (SigV4 via `aws4fetch`), with a
  zero-config local-disk fallback

---

## Quick start

Requirements: **Node 22+**, **PostgreSQL 14+** (16 recommended).

```bash
# 1. Install (postinstall generates the Prisma client)
npm install

# 2. Configure
cp .env.example .env        # then edit DATABASE_URL, SESSION_SECRET, admin credentials

# 3. Create schema + demo content (idempotent)
npm run db:migrate
npm run db:seed

# 4. Run
npm run dev                 # http://localhost:3000
```

Sign in at **`/admin/login`** with the credentials from `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` (defaults: `admin@example.com` / `admin12345` — change them).

The seed creates six full project case studies, seven technical articles, testimonials, sample
inquiries, a sample chat, and 30 days of analytics so every screen demonstrates itself.

### Docker

```bash
cp .env.example .env                 # set SESSION_SECRET (required) and passwords
SEED=1 docker compose up --build     # db + migrations (+ first-run seed) + app
```

---

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `SESSION_SECRET` | ✅ | ≥32-char random string; salts the analytics visitor hash |
| `NEXT_PUBLIC_SITE_URL` | ✅ (prod) | Public origin for SEO, sitemap, OG images |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | seed only | Initial admin account |
| `ANTHROPIC_API_KEY` | optional | Claude-powered project assistant + offline chat replies (a built-in heuristic engine is used without it) |
| `ASSISTANT_MODEL` / `CHAT_MODEL` | optional | Override the Claude model (default `claude-opus-5`) |
| `S3_ENDPOINT` `S3_BUCKET` `S3_ACCESS_KEY_ID` `S3_SECRET_ACCESS_KEY` | optional | S3/R2 attachment storage (local `.uploads/` fallback otherwise) |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop / production build / serve |
| `npm run lint` / `typecheck` | ESLint / strict TypeScript |
| `npm run db:migrate` / `db:deploy` | Create dev migration / apply in production |
| `npm run db:seed` / `db:studio` | Seed demo content / browse data |
| `node scripts/generate-profile.mjs` | Regenerate `public/profile.pdf` (company profile) |

---

## Architecture notes

```
src/
├── app/
│   ├── (site)/            # public pages (navbar/footer/chat shell)
│   ├── admin/             # login + role-guarded dashboard
│   └── api/               # REST + SSE route handlers
├── components/            # ui/ (design system) · site/ · home/ · blog/ ·
│                          # request/ · chat/ · admin/ · motion/
├── config/site.ts         # single source of truth for identity & structure
├── lib/                   # db, auth, schemas, analytics, chat bus, markdown,
│                          # storage, assistant, rate limiting, settings
└── generated/prisma/      # generated client (git-ignored)
```

- **Rendering** — data-driven pages render dynamically (content changes from the admin apply
  instantly); heavy work (markdown, syntax highlighting, charts) happens server-side. Client
  JavaScript is reserved for genuine interactivity.
- **Real-time** — Server-Sent Events over an in-process pub/sub bus with heartbeats and bounded
  subscriptions. Client → server messages use plain POSTs.
- **Validation** — one zod schema per boundary, shared by the form and its API route, so client
  and server can never disagree about what "valid" means.
- **Settings** — a singleton JSON row validated with zod and merged over code defaults; the site
  re-themes its availability/identity from the admin with no redeploy.
- **AI assistant** — forced tool call against a strict JSON schema, re-validated server-side,
  with an archetype-based heuristic fallback so the feature works without an API key. Idea text
  is never logged.

### Scaling note

The chat bus and rate limiter are deliberately in-process, which is correct for the single-node
deployments this targets (PM2 fork of 1 / one container). To run multiple instances, back both
with Redis (pub/sub for `src/lib/chat-bus.ts`, a shared store for `src/lib/rate-limit.ts`) —
both are small interfaces designed to be swapped.

## Deployment

**Docker + Nginx (recommended):** `docker compose up -d --build`, then install
[`deploy/nginx.conf`](deploy/nginx.conf) — it includes the SSE-specific settings
(`proxy_buffering off`, long read timeout) the live chat needs, plus immutable caching for
hashed assets.

**Bare VPS with PM2:** `npm run build && npm run db:deploy`, copy `public/` and `.next/static/`
into `.next/standalone/` per the Next.js standalone docs, then `pm2 start ecosystem.config.js`
(kept intentionally at a single fork instance — see the file header).

**Cloudflare in front** adds edge caching, WAF, and country data for the analytics dashboard
(`CF-IPCountry`).

## Rebranding

Identity lives in exactly two places: [`src/config/site.ts`](src/config/site.ts) (name, socials,
navigation, skills, defaults) and the admin **Settings** page (runtime overrides). Replace
`public/profile.pdf` (or edit `scripts/generate-profile.mjs` and regenerate), and re-run the
seed if you want fresh demo content.
