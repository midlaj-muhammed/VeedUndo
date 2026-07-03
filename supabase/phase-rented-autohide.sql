-- Add rented_at timestamp to track when a listing was marked as rented
-- Browse page hides rented listings older than 7 days

ALTER TABLE listings ADD COLUMN IF NOT EXISTS rented_at TIMESTAMPTZ;
