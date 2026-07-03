# VeedUndo — Product Requirements Document

**Tagline:** Veed undo? (Is there a house?) — Kerala's hyperlocal rental status board.

**Status:** Draft v1
**Owner:** Midlaj
**Date:** July 2026

---

## 1. Problem Statement

Kerala's rental hunt runs on decaying Facebook groups and word-of-mouth. There is no single, low-friction place to check "is a house available near me right now" — and no existing tool solves the two hardest parts: **staleness** (nobody marks a house as rented) and **duplicates** (same house posted by landlord and broker separately).

## 2. Goals (v1 / MVP)

- Let anyone post a house-for-rent listing in under 60 seconds, no login.
- Let renters browse/filter listings by locality, rent range, house type.
- Keep the board trustworthy — minimize dead/duplicate listings.
- Ship entirely on free-tier infrastructure.

**Non-goals for v1:** payments, in-app messaging, broker verification/KYC, multi-city expansion, native apps.

## 3. Target Users

| User | Need |
|---|---|
| House hunter (renter) | Find available houses near a locality, fast, with photos |
| Owner | Post a vacancy, get calls, mark it rented easily |
| Broker | Post multiple listings (tagged as broker, not owner) |

## 4. Core Features

### 4.1 Posting a listing
- No login required. Phone number + OTP verification required before a post goes live (spam control + contact for renewal).
- Fields: locality (structured, not free text), rent range, house type (single room / 1BHK / etc.), 1–3 images, description, phone, poster type (Owner / Broker — self-declared).
- **Duplicate-check at submission:** fuzzy match on locality + rent range + house type within ~500m. If a close match exists, warn poster: "A similar listing already exists — is this the same house?" Soft warning, not a hard block.

### 4.2 Browsing
- Filter by locality, rent range, house type, poster type (Owner/Broker).
- List view with hero image, no gallery/carousel in v1.
- No login required to browse or view contact number.

### 4.3 Listing lifecycle (staleness fix — the core differentiator)
Three layers, not one:
1. **Self-mark rented** — one-tap link sent via SMS after OTP verification. Low reliability alone.
2. **Crowd-flag** — viewers who call and find it unavailable can flag "no longer available." 3 flags → auto-hide pending poster confirmation.
3. **Auto-expire** — every listing drops from active search after 10 days unless the poster taps "still available" to renew. This is the mandatory safety net; build it first.

### 4.4 Archiving
- Expired/flagged listings are hidden from active search, **not deleted**. Retained for future analytics (e.g., average days-to-rent by locality).

## 5. Explicit Open Questions (need your decision before build)

- First 50 listings: single town or state-wide? Affects locality taxonomy complexity.
- Renter-first or landlord/broker-first acquisition? Determines which side you court in week 1.

## 6. Tech Stack (free-tier only)

| Layer | Choice | Free tier notes |
|---|---|---|
| Database + API | Supabase | 500MB DB, 50K MAUs, 5GB bandwidth/month, 500K Edge Function calls/month. No credit card required, commercial use permitted. (certain) |
| **Store listing text/metadata only in DB — never store image bytes here.** | | Prevents the 500MB cap from being hit by images; DB stays text-only and lasts years at MVP scale. (Likely) |
| Image storage | Cloudflare R2 | 10GB free storage, **zero egress/bandwidth fees** — matters more than storage size, since DB-native storage charges for bandwidth out. Compress client-side before upload. (Likely — verify current R2 free-tier numbers before locking in) |
| Frontend hosting | Vercel or Cloudflare Pages | (guessing — verify current 2026 free-tier limits before locking in) |
| Keep-alive (avoid 7-day pause) | GitHub Actions scheduled workflow pinging Supabase every few days | Free on public repos; counts against Actions minutes on private repos. (certain) |
| **Identity verification (replaces phone OTP for v1)** | **Email magic link via Supabase Auth or Firebase Auth** | Free and unlimited — no per-verification cost, unlike phone OTP. (certain) |

### Why not phone/WhatsApp OTP for v1 (certain, researched July 2026)
No free-at-volume OTP option exists in India:
- **SMS OTP** requires TRAI DLT registration; all compliant providers charge per message (MSG91 ~₹0.15, Message Central ~₹0.10–0.20). No legitimate unregistered/free route — carriers block it.
- **WhatsApp OTP** is billed under Meta's "Authentication" category, separate from and NOT covered by the free "Service conversation" tier (that free tier is for customer-initiated support replies only; authentication was repriced upward in 2025).
- Any "1,000 free OTPs/month" claim floating around online is outdated or conflates service conversations with authentication — they're billed differently.

**Decision: use email magic-link verification for v1 instead of phone OTP.** Free and unlimited, and fully serves the OTP's real job here — spam deterrence, not identity. Revisit phone OTP once revenue justifies ~₹0.15/message.

**Known free-tier risk (certain):** Supabase free projects pause after 7 days of no API requests. Mitigate with a scheduled keep-alive job from day one.

## 7. Success Metrics (v1)

- # of listings posted per week
- % of listings that get marked rented/expired vs. going stale past 30 days (proxy for trust/data quality)
- # of duplicate-warning triggers (signal of real overlap in the market)
- Renter-side: # of unique visitors filtering by locality

## 8. Risks

| Risk | Mitigation |
|---|---|
| Cold start — no listings, no renters | Seed manually via WhatsApp/local FB groups before public launch |
| Stale listings erode trust | Auto-expire is mandatory, not optional, from v1 |
| Duplicate postings (owner + broker) | Soft-match warning at submission time |
| Free-tier pause during demo/traction moment | Scheduled keep-alive ping (GitHub Actions or UptimeRobot) |
| No login = low accountability | OTP-gated posting as minimum friction |

## 9. Build Sequence

1. OTP-gated posting flow
2. Image upload (compressed, 1–3 images)
3. Duplicate-check warning at submission
4. Owner/Broker self-tag
5. Auto-expire (10 days) — **before** crowd-flag, since it doesn't depend on user cooperation
6. Crowd-flag ("no longer available")
7. Self-mark-rented SMS link
8. Keep-alive job for Supabase free-tier pause

---

*This PRD reflects free-tier limits as researched July 2026. Supabase's Edge Function grant requirement (effective for new projects from May 30, 2026 and existing projects from October 30, 2026) may require action — confirm scope closer to that date.*
