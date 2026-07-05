-- Saved listings table
CREATE TABLE IF NOT EXISTS saved_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- RLS policies
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own saved listings
CREATE POLICY "Users read own saves" ON saved_listings
  FOR SELECT USING (auth.uid() = user_id);

-- Users can save listings
CREATE POLICY "Users save listings" ON saved_listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can unsave listings
CREATE POLICY "Users unsave listings" ON saved_listings
  FOR DELETE USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_saved_listings_user ON saved_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_listings_listing ON saved_listings(listing_id);
