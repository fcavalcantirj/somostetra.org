-- Migration: Add clinical_trial_searches table
-- Purpose: Track user search queries for study purposes
-- Run via Supabase SQL Editor

-- Create table to store clinical trial search queries
CREATE TABLE IF NOT EXISTS clinical_trial_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_conditions TEXT[] NOT NULL,          -- array of condition keywords searched
  query_status TEXT[],                       -- status filters applied (RECRUITING, etc.)
  query_phase TEXT[],                        -- phase filters applied
  query_location_state TEXT,                 -- Brazilian state if selected
  query_distance INTEGER,                    -- distance in miles if location search
  brazil_only BOOLEAN DEFAULT FALSE,         -- if "Apenas Brasil" filter was active
  results_count INTEGER,                     -- number of results returned
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics by user
CREATE INDEX IF NOT EXISTS idx_clinical_searches_user ON clinical_trial_searches(user_id);

-- Index for date-based analytics
CREATE INDEX IF NOT EXISTS idx_clinical_searches_date ON clinical_trial_searches(created_at);

-- Enable Row Level Security
ALTER TABLE clinical_trial_searches ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own searches
CREATE POLICY "Users can insert own searches"
  ON clinical_trial_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own searches
CREATE POLICY "Users can view own searches"
  ON clinical_trial_searches FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can view all searches for analytics
CREATE POLICY "Admins can view all searches"
  ON clinical_trial_searches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Grant necessary permissions
GRANT ALL ON clinical_trial_searches TO authenticated;
GRANT ALL ON clinical_trial_searches TO service_role;
