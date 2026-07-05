-- VeedUndo Phase 1: Add listing_mode (rent/sell) and price columns
-- Run this in Supabase SQL Editor

-- 1. Add listing_mode column (defaults to 'rent' for all existing rows)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_mode text NOT NULL DEFAULT 'rent';

-- 2. Add price column for sell listings (nullable, used only when listing_mode = 'sell')
ALTER TABLE listings ADD COLUMN IF NOT EXISTS price integer;

-- 3. Extend house_type to include new types (text column, no enum constraint needed)
-- New values: pg_room, apartment, independent_house, studio, plot, commercial, farm_house
-- Existing values remain valid: single_room, 1bhk, 2bhk, 3bhk, 4bhk, villa

-- 4. Add check constraints for listing_mode
ALTER TABLE listings ADD CONSTRAINT listings_listing_mode_check CHECK (listing_mode IN ('rent', 'sell'));

-- 5. Create index for filtering by listing mode
CREATE INDEX IF NOT EXISTS idx_listings_listing_mode ON listings (listing_mode) WHERE status = 'active';

-- 6. Create composite index for common browse queries
CREATE INDEX IF NOT EXISTS idx_listings_mode_status ON listings (listing_mode, status, created_at DESC);

-- Done! Existing rent listings are unaffected (listing_mode defaults to 'rent').
