-- VeedUndo Phase 6: Trust & Verification
-- Run this in Supabase SQL Editor AFTER Phase 1–5

-- 1. Add verified badge to listings (owner has verified phone/email)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS verified_owner boolean NOT NULL DEFAULT false;

-- 2. Add flag threshold config (default auto-hide at 3 flags)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS flag_threshold integer NOT NULL DEFAULT 3;

-- 3. Add listing quality score (0-100, computed from completeness)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS quality_score integer NOT NULL DEFAULT 0;

-- 4. Ensure listing_flags has unique constraint (one flag per user per listing)
ALTER TABLE listing_flags ADD CONSTRAINT unique_listing_flagger UNIQUE (listing_id, flagger_email);

-- 5. Create index for auto-flag check
CREATE INDEX IF NOT EXISTS idx_listing_flags_count ON listing_flags (listing_id);

-- 6. Function to compute quality score
CREATE OR REPLACE FUNCTION compute_quality_score(
  p_description text,
  p_image_urls text[],
  p_poster_phone text,
  p_poster_whatsapp text,
  p_house_type text,
  p_price integer,
  p_rent_min integer
) RETURNS integer AS $$
DECLARE
  score integer := 0;
  img_count integer := 0;
BEGIN
  -- Description (up to 30 points)
  IF p_description IS NOT NULL AND length(p_description) > 20 THEN score := score + 15; END IF;
  IF p_description IS NOT NULL AND length(p_description) > 100 THEN score := score + 15; END IF;
  -- Images (up to 30 points)
  IF p_image_urls IS NOT NULL THEN img_count := array_length(p_image_urls, 1); ELSE img_count := 0; END IF;
  IF img_count >= 1 THEN score := score + 10; END IF;
  IF img_count >= 3 THEN score := score + 10; END IF;
  IF img_count >= 5 THEN score := score + 10; END IF;
  -- Contact info (up to 20 points)
  IF p_poster_phone IS NOT NULL AND length(p_poster_phone) > 0 THEN score := score + 10; END IF;
  IF p_poster_whatsapp IS NOT NULL AND length(p_poster_whatsapp) > 0 THEN score := score + 10; END IF;
  -- Property details (up to 20 points)
  IF p_house_type IS NOT NULL THEN score := score + 10; END IF;
  IF (p_price > 0 OR p_rent_min > 0) THEN score := score + 10; END IF;
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- 7. Function to auto-flag when threshold reached
CREATE OR REPLACE FUNCTION check_auto_flag()
RETURNS TRIGGER AS $$
DECLARE
  flag_count integer;
  threshold integer;
BEGIN
  SELECT count(*) INTO flag_count FROM listing_flags WHERE listing_id = NEW.listing_id;
  SELECT flag_threshold INTO threshold FROM listings WHERE id = NEW.listing_id;
  IF flag_count >= threshold THEN
    UPDATE listings SET status = 'flagged' WHERE id = NEW.listing_id AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_flag ON listing_flags;
CREATE TRIGGER trg_auto_flag AFTER INSERT ON listing_flags
  FOR EACH ROW EXECUTE FUNCTION check_auto_flag();

-- 8. Backfill quality scores for existing listings
UPDATE listings SET quality_score = compute_quality_score(description, image_urls, poster_phone, poster_whatsapp, house_type, price, rent_min);

-- Done!
