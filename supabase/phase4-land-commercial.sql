-- VeedUndo Phase 4: Land and Commercial specific fields
-- Run this in Supabase SQL Editor AFTER Phase 1 + Phase 2

-- Land-specific fields
ALTER TABLE listings ADD COLUMN IF NOT EXISTS plot_area_acres numeric;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS road_frontage_ft integer;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS zoning text;

-- Commercial-specific fields
ALTER TABLE listings ADD COLUMN IF NOT EXISTS built_up_sqft integer;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS floor_number integer;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS parking text;

-- Done! All columns nullable, existing rows unaffected.
