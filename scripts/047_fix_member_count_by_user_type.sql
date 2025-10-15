-- Fix member counting to only count profiles with user_type = 'member'
-- This fixes the homepage statistics showing all profiles instead of just members

-- ============================================================================
-- STEP 1: Fix the increment function to only count members
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_members()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment if the new profile is a member
  IF NEW.user_type = 'member' THEN
    UPDATE platform_statistics SET total_members = total_members + 1 WHERE true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 2: Fix the decrement function to only count members
-- ============================================================================
CREATE OR REPLACE FUNCTION decrement_members()
RETURNS TRIGGER AS $$
BEGIN
  -- Only decrement if the deleted profile was a member
  IF OLD.user_type = 'member' THEN
    UPDATE platform_statistics SET total_members = greatest(0, total_members - 1) WHERE true;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: Recalculate the current correct total_members count
-- ============================================================================
DO $$
DECLARE
  correct_member_count INTEGER;
  current_count INTEGER;
BEGIN
  -- Get correct count of members only
  SELECT COUNT(*) INTO correct_member_count
  FROM public.profiles
  WHERE user_type = 'member';

  -- Get current (incorrect) count
  SELECT total_members INTO current_count
  FROM public.platform_statistics;

  -- Update to correct value
  UPDATE public.platform_statistics
  SET total_members = correct_member_count,
      last_updated = NOW()
  WHERE true;

  RAISE NOTICE 'Fixed member count: % -> %', current_count, correct_member_count;
END $$;

-- ============================================================================
-- VERIFICATION: Check the counts
-- ============================================================================
SELECT
  'VERIFICATION' as report,
  (SELECT COUNT(*) FROM profiles WHERE user_type = 'member') as actual_members,
  (SELECT COUNT(*) FROM profiles WHERE user_type = 'supporter') as actual_supporters,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT total_members FROM platform_statistics) as stats_members
FROM platform_statistics;
