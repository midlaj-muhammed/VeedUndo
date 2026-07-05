-- VeedUndo Phase 5: Full-text search and saved searches
-- Run this in Supabase SQL Editor AFTER Phase 1–4

-- 1. Add generated tsvector column for full-text search on descriptions
ALTER TABLE listings ADD COLUMN IF NOT EXISTS description_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(description, ''))) STORED;

-- 2. Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_listings_description_tsv ON listings USING gin(description_tsv);

-- 3. Create trigram index for ilike fallback (accent-insensitive partial matches)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_listings_description_trgm ON listings USING gin(description gin_trgm_ops);

-- 4. Saved searches table
CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  filters jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. RLS: users can CRUD their own saved searches
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saved searches" ON saved_searches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved searches" ON saved_searches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved searches" ON saved_searches FOR DELETE USING (auth.uid() = user_id);

-- Done!
