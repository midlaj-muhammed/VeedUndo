-- VeedUndo Phase 2: Add property detail columns
-- Run this in Supabase SQL Editor AFTER Phase 1

-- 1. Bedrooms (integer, nullable — for residential properties)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS bedrooms integer;

-- 2. Furnishing status (text, nullable)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS furnishing text;
ALTER TABLE listings ADD CONSTRAINT listings_furnishing_check CHECK (furnishing IS NULL OR furnishing IN ('unfurnished', 'semi_furnished', 'furnished'));

-- 3. Area in square feet (integer, nullable — mainly for sell mode)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS area_sqft integer;

-- Done! All new columns are nullable, existing rows unaffected.
