-- VeedUndo Database Schema
-- Run in Supabase SQL Editor

-- Locality taxonomy (structured, not free text)
create table localities (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text not null,
  created_at  timestamptz default now()
);

-- Listings (text/metadata only — images in Cloudflare R2)
create table listings (
  id              uuid primary key default gen_random_uuid(),
  locality_id     uuid not null references localities(id),
  rent_min        int  not null,
  rent_max        int  not null,
  house_type      text not null,
  description     text,
  poster_type     text not null,
  poster_email    text not null,
  poster_phone    text,
  poster_whatsapp text,
  status          text not null default 'active',
  image_urls      text[] not null default '{}',
  expires_at      timestamptz not null,
  renewed_at      timestamptz default now(),
  created_at      timestamptz default now(),
  flag_count      int not null default 0
);

-- Crowd flags (one per email per listing)
create table listing_flags (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references listings(id) on delete cascade,
  flagger_email text not null,
  created_at   timestamptz default now(),
  unique (listing_id, flagger_email)
);

-- Duplicate-check audit log
create table duplicate_warnings (
  id               uuid primary key default gen_random_uuid(),
  new_listing_id   uuid references listings(id),
  matched_listing_id uuid references listings(id),
  created_at       timestamptz default now()
);

-- Indexes
create index idx_listings_active on listings(locality_id, status, rent_min) where status = 'active';
create index idx_listings_expire on listings(expires_at) where status = 'active';
create index idx_listings_email on listings(poster_email);

-- Row-Level Security
alter table localities enable row level security;
alter table listings enable row level security;
alter table listing_flags enable row level security;
alter table duplicate_warnings enable row level security;

-- localities: public read
create policy "Public can read localities" on localities
  for select using (true);

-- listings: public read active, owner can insert/update own
create policy "Public can read active listings" on listings
  for select using (status = 'active');

create policy "Authenticated users can insert listings" on listings
  for insert with check (auth.email() = poster_email);

create policy "Owners can update own listings" on listings
  for update using (auth.email() = poster_email);

-- listing_flags
create policy "Authenticated users can flag" on listing_flags
  for insert with check (auth.email() = flagger_email);

create policy "Listing owners can read flags" on listing_flags
  for select using (
    exists (
      select 1 from listings
      where listings.id = listing_flags.listing_id
        and listings.poster_email = auth.email()
    )
  );

-- Seed Kochi localities
insert into localities (name, city) values
  ('Kakkanad', 'Kochi'),
  ('Edappally', 'Kochi'),
  ('Kaloor', 'Kochi'),
  ('Palarivattom', 'Kochi'),
  ('Vyttila', 'Kochi'),
  ('Marine Drive', 'Kochi'),
  ('Fort Kochi', 'Kochi'),
  ('Mattancherry', 'Kochi'),
  ('Aluva', 'Kochi'),
  ('Perumbavoor', 'Kochi');
