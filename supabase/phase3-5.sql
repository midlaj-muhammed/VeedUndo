-- ============================================================
-- PHASE 3: Auto-expire via pg_cron
-- ============================================================

-- Enable pg_cron + pg_net (Supabase has these pre-installed)
create extension if not exists pg_cron;

-- Expire listings where expires_at < now()
select cron.schedule(
  'expire-listings',
  '0 * * * *',  -- every hour
  $$
    update listings
    set status = 'expired'
    where status = 'active'
      and expires_at < now();
  $$
);

-- ============================================================
-- PHASE 5: Auto-flag at 3 flags (via trigger)
-- ============================================================

create or replace function auto_flag_listing()
returns trigger as $$
begin
  update listings
  set flag_count = (
    select count(*) from listing_flags
    where listing_id = new.listing_id
  )
  where id = new.listing_id;

  -- Auto-hide at 3 flags
  update listings
  set status = 'flagged'
  where id = new.listing_id
    and flag_count >= 3
    and status = 'active';

  return new;
end;
$$ language plpgsql;

create trigger on_flag_insert
  after insert on listing_flags
  for each row
  execute function auto_flag_listing();

-- ============================================================
-- PHASE 5: Poster confirm listing (restore from flagged)
-- ============================================================

create or replace function confirm_listing(listing_id uuid, email text)
returns void as $$
begin
  update listings
  set status = 'active',
      flag_count = 0,
      renewed_at = now(),
      expires_at = now() + interval '10 days'
  where id = listing_id
    and poster_email = email
    and status = 'flagged';
end;
$$ language plpgsql security definer;

-- Allow authenticated users to call confirm_listing
-- (handled via API route in frontend)
