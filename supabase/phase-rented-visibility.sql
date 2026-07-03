-- Allow public read of rented listings (visible but styled differently)
-- Run after phase-location-hierarchy.sql

-- Drop the old active-only select policy
DROP POLICY IF EXISTS "Public can read active listings" ON listings;

-- New policy: active + rented visible publicly
CREATE POLICY "Public can read active and rented listings" ON listings
  FOR SELECT USING (status IN ('active', 'rented'));
