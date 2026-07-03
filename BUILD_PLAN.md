# VeedUndo — Build Plan

**Source:** `VeedUndo_PRD.md` (Draft v1, July 2026)
**Goal:** Ship an MVP of Kerala's hyperlocal rental status board on free-tier infra.

---

## 0. Resolved vs. Open Decisions (lock these before coding)

| Item | Decision | Source |
|---|---|---|
| Auth method | **Email magic link** (Supabase Auth). No phone/WhatsApp OTP in v1 — no free-at-volume OTP exists in India (TRAI DLT, Meta auth billing). | PRD §6, §6.1 |
| Image storage | **Cloudflare R2** (10GB free, zero egress). Store only text/metadata in Supabase DB to protect the 500MB cap. | PRD §6 |
| DB + API | Supabase (Postgres + Auth + Row-Level Security). | PRD §6 |
| Frontend hosting | Vercel or Cloudflare Pages — verify 2026 limits before locking in. | PRD §6 |
| Keep-alive | GitHub Actions cron pinging Supabase every few days (avoids 7-day free-tier pause). Build from day one. | PRD §6, §8 |
| Supabase Edge Functions | Note grant requirement effective May 30 2026 (new) / Oct 30 2026 (existing). Revisit closer to date. | PRD §9 footnote |

**Still open (PRD §5) — decide before build:**
1. **Launch radius:** single town vs. state-wide. Drives locality taxonomy complexity. *Recommend: single town (e.g. one city) for first 50 listings to keep taxonomy shallow.*
2. **Acquisition side:** renter-first vs. landlord/broker-first. *Recommend: landlord/broker-first (supply seeds the board); renters follow once listings exist.*

---

## 1. Architecture Overview

```
Browser (Next.js / static SPA on Vercel or CF Pages)
        │
        ├── Supabase Auth (email magic link) ── session
        ├── Supabase Postgres (listings, flags, metadata) ── RLS-protected
        ├── Cloudflare R2 (image blobs, served via public URL / presigned)
        └── Supabase Edge Function / scheduled job (auto-expire, keep-alive)

GitHub Actions (cron) ── keep-alive ping ──► Supabase REST/Edge
```

**Data flow rules**
- DB stores **text/metadata only** (never image bytes) → protects 500MB cap.
- Images compressed **client-side** before upload → protects R2 10GB and bandwidth.
- Expired/flagged listings are **hidden, not deleted** (analytics retention).

---

## 2. Database Schema (Supabase / Postgres)

```sql
-- Locality taxonomy (structured, not free text)
create table localities (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text not null,
  geo_point   geography(point),         -- for ~500m duplicate + "near me" later
  created_at  timestamptz default now()
);

-- Listings (text/metadata only)
create table listings (
  id            uuid primary key default gen_random_uuid(),
  locality_id   uuid not null references localities(id),
  rent_min      int  not null,
  rent_max      int  not null,
  house_type    text not null,          -- 'single_room' | '1bhk' | '2bhk' | ...
  description   text,
  poster_type   text not null,          -- 'owner' | 'broker'
  poster_email  text not null,          -- from magic-link auth
  poster_phone  text,                   -- optional, shown to viewers
  status        text not null default 'active',  -- active|expired|flagged|rented
  image_urls    text[] not null default '{}',    -- 1–3 R2 URLs
  expires_at    timestamptz not null,            -- now() + 10 days
  renewed_at    timestamptz default now(),
  created_at    timestamptz default now(),
  flag_count    int not null default 0
);

-- Crowd flags
create table listing_flags (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references listings(id) on delete cascade,
  flagger_email text not null,
  created_at   timestamptz default now(),
  unique (listing_id, flagger_email)
);

-- Optional: duplicate-check audit
create table duplicate_warnings (
  id            uuid primary key default gen_random_uuid(),
  new_listing_id  uuid references listings(id),
  matched_listing_id uuid references listings(id),
  created_at    timestamptz default now()
);
```

**Row-Level Security (RLS) — mandatory**
- `listings`: SELECT public where `status='active'`; INSERT only by authenticated owner of `poster_email`; UPDATE `status` only by owner or via service role (expire job).
- `listing_flags`: INSERT by any authenticated user (one per email per listing); SELECT by listing owner.
- `localities`: SELECT public; INSERT via service role only.

**Indexes**
- `listings(locality_id, status, rent_min)` for browse filter.
- `listings(expires_at)` for the auto-expire sweep.
- `listings` on geo_point for future "near me" + duplicate match.

---

## 3. Build Phases (mapped from PRD §9 build sequence)

> PRD §9 order adapted: item 1 is now email magic link (not phone OTP), and item 7 (self-mark-rented SMS link) becomes an **email link** since there is no SMS in v1.

### Phase 0 — Foundations (day 1)
- [ ] Create Supabase project; enable email magic-link auth.
- [ ] Create Cloudflare R2 bucket; note public URL / presigned URL strategy.
- [ ] Create frontend repo (Next.js app, deploy to Vercel or CF Pages).
- [ ] Add GitHub Actions keep-alive workflow (cron, pings Supabase REST every 5 days). **Build now, not later.**
- [ ] Seed `localities` table for the chosen launch town.

### Phase 1 — Posting flow (PRD §4.1) — build sequence #1
- [ ] Magic-link sign-in screen → Supabase Auth session.
- [ ] "Post a listing" form: locality (select), rent range, house type, description, poster type (owner/broker), phone (optional), 1–3 images.
- [ ] Client-side image compression before upload.
- [ ] Upload images to R2, store returned URLs in `listings.image_urls`.
- [ ] Insert listing with `expires_at = now() + 10 days`, `status='active'`.
- [ ] **Verification:** post a listing end-to-end in <60s; listing appears in browse.

### Phase 2 — Browsing (PRD §4.2) — build sequence context
- [ ] List view: hero image, locality, rent range, house type, poster type badge.
- [ ] Filters: locality, rent range, house type, poster type (owner/broker).
- [ ] Contact number visible without login.
- [ ] Only `status='active'` and `expires_at > now()` shown.
- [ ] **Verification:** filters return correct subset; expired rows hidden.

### Phase 3 — Auto-expire (PRD §4.3 layer 3) — build sequence #5, build FIRST among lifecycle
- [ ] Scheduled job (Supabase Edge Function or pg_cron / GH Actions cron): set `status='expired'` where `expires_at < now()` and `status='active'`.
- [ ] "Still available?" renew button on poster's dashboard → bumps `expires_at = now()+10d`, `renewed_at=now()`.
- [ ] Expired rows hidden from active search, retained in DB (PRD §4.4).
- [ ] **Verification:** force-set `expires_at` to past, run sweep, confirm status flips and row disappears from browse.

### Phase 4 — Duplicate-check warning (PRD §4.1) — build sequence #3
- [ ] On submit, query active listings matching same `locality_id` + same `house_type` + overlapping rent range + within ~500m (if geo available).
- [ ] Soft warning UI: "A similar listing already exists — is this the same house?" → user confirms to proceed.
- [ ] Log to `duplicate_warnings` for analytics (PRD §7 metric).
- [ ] **Verification:** post a near-duplicate, confirm warning appears and is loggable; post still allowed.

### Phase 5 — Crowd-flag (PRD §4.3 layer 2) — build sequence #6
- [ ] "No longer available" flag button on listing detail.
- [ ] One flag per authenticated email (unique constraint).
- [ ] At **3 flags** → `status='flagged'`, auto-hide pending poster confirmation.
- [ ] Poster gets email: "Your listing was flagged — still available? Tap to confirm."
- [ ] Confirm → `status='active'`, reset `flag_count`; ignore → stays hidden.
- [ ] **Verification:** 3 distinct emails flag a listing → it hides; poster confirm restores it.

### Phase 6 — Self-mark rented (PRD §4.3 layer 1) — build sequence #7 (email, not SMS)
- [ ] "Mark as rented" action on poster dashboard → `status='rented'`.
- [ ] Renewal/reminder email (via Supabase Auth email or transactional email) with one-tap link to mark rented.
- [ ] Rented rows hidden from active search, retained for analytics.
- [ ] **Verification:** poster marks rented → disappears from browse, remains in DB.

### Phase 7 — Owner/Broker self-tag polish (PRD §4.1) — build sequence #4
- [ ] Poster type already captured in Phase 1; here add the filter + badge in browse and a per-poster listing dashboard.
- [ ] **Verification:** filter by owner-only / broker-only returns correct set.

### Phase 8 — Keep-alive hardening (PRD §6, §8) — build sequence #8
- [ ] Confirm GH Actions cron runs successfully over a week.
- [ ] Add failure alert (e.g. email on workflow failure).
- [ ] **Verification:** no 7-day pause observed; alert fires on intentional break.

---

## 4. Free-Tier Budget Guardrails

| Resource | Free limit | Guardrail |
|---|---|---|
| Supabase DB | 500MB | Text/metadata only; images in R2. Monitor `pg_database_size`. |
| Supabase MAU | 50K | Magic-link users count; fine for MVP. |
| Supabase bandwidth | 5GB/mo | Avoid returning images through Supabase; serve from R2. |
| Supabase Edge calls | 500K/mo | Auto-expire + keep-alive cron well under. |
| Cloudflare R2 | 10GB storage, 0 egress fee | Compress images client-side; cap 3 imgs/listing. |
| Vercel/CF Pages | verify 2026 limits | Static/SSR within free tier. |
| GH Actions | free on public repos | Keep-alive cron on public repo to avoid minute cap. |

---

## 5. Success Metrics Instrumentation (PRD §7)

Capture from day one so v1 success is measurable:
- Listings posted per week → `count(*) from listings where created_at >= week_start`.
- % listings marked rented/expired vs. stale >30 days → compare `status` distribution against `created_at` age.
- Duplicate-warning triggers → `count(*) from duplicate_warnings`.
- Unique visitors filtering by locality → analytics event on filter apply (e.g. Plausible/Umami free tier).

---

## 6. Risk Checkpoints (PRD §8)

| Risk | When to verify |
|---|---|
| Cold start (no listings) | Before public launch: seed 20–50 listings manually via WhatsApp/FB groups. |
| Stale listings erode trust | Phase 3 live before any public traffic. |
| Duplicates | Phase 4 live before broker onboarding. |
| Free-tier pause | Phase 0 keep-alive + Phase 8 alerting. |
| Low accountability | Magic-link gating enforced via RLS on INSERT. |

---

## 7. Out of Scope for v1 (PRD §2)

Payments, in-app messaging, broker verification/KYC, multi-city expansion, native apps, phone/WhatsApp OTP.

---

## 8. Recommended Build Order (summary)

```
Phase 0  Foundations + keep-alive
Phase 1  Magic-link posting (with images)
Phase 2  Browse + filters
Phase 3  Auto-expire + renew            ← build before crowd-flag
Phase 4  Duplicate-check warning
Phase 5  Crowd-flag (3 → hide)
Phase 6  Self-mark rented (email link)
Phase 7  Owner/Broker tag polish
Phase 8  Keep-alive hardening + alerts
```

Each phase ends with the verification step listed in §3 before moving on.
