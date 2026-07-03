# VeedUndo

Kerala's hyperlocal rental status board. *"Veed undo?"* — Is there a house?

## Tech Stack

- **Frontend:** Next.js 16 + Tailwind CSS
- **Database:** Supabase (Postgres + Auth + RLS)
- **Images:** Cloudflare R2 (zero egress)
- **Deploy:** Vercel + GitHub Actions

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. Then run `supabase/phase3-5.sql` (pg_cron + flag trigger)
4. Copy your project URL and anon key

### 2. Cloudflare R2

1. Create an R2 bucket at [dash.cloudflare.com](https://dash.cloudflare.com)
2. Generate an API token with Object Read & Write permissions
3. Set a public access domain for serving images

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Fill in your Supabase + R2 credentials
npm install
npm run dev
```

### 4. Auth Callback

Add `http://localhost:3000/auth/callback` to your Supabase **Authentication > URL Configuration > Redirect URLs**.

### 5. Deploy

1. Push to GitHub
2. Connect to Vercel
3. Add env vars in Vercel project settings
4. Add `https://your-domain.com/auth/callback` to Supabase redirect URLs

## Features

- **Magic link sign-in** — no passwords, no phone numbers
- **Post listings** — locality, rent, house type, photos (compressed)
- **Browse & filter** — by locality, rent range, type, owner/broker
- **10-day auto-expire** — pg_cron sweeps hourly
- **Renew** — extend listing for 10 more days from dashboard
- **Duplicate check** — warns on similar listings before post
- **Crowd-flag** — 3 reports auto-hide listing, poster can confirm
- **Mark rented** — one-tap from dashboard
- **Owner/broker badge** — filter and visual indicator

## Free Tier Budget

| Service | Limit | Usage |
|---|---|---|
| Supabase DB | 500MB | Text/metadata only |
| Supabase MAU | 50K | Magic-link users |
| Cloudflare R2 | 10GB, 0 egress | Compressed images |
| Vercel | Free tier | Static + SSR |
| GitHub Actions | Free (public) | Keep-alive cron |

## Project Structure

```
├── frontend/           # Next.js app
│   ├── src/app/        # Pages (browse, post, auth, dashboard, listing)
│   ├── src/components/ # PostForm, ListingCard, BrowseFilters
│   └── src/lib/        # Supabase client, types, compression
├── supabase/
│   ├── schema.sql      # Full database schema + RLS + seed data
│   └── phase3-5.sql    # Auto-expire, flag trigger, confirm function
└── .github/workflows/
    └── keep-alive.yml  # Supabase ping + failure alerting
```
