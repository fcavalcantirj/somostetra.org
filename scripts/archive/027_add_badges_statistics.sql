-- Add total_badges_earned column to platform_statistics to track total badges earned by all users
ALTER TABLE platform_statistics
ADD COLUMN IF NOT EXISTS total_badges_earned INTEGER DEFAULT 0;

-- Initialize with current count of badges
UPDATE platform_statistics
SET total_badges_earned = (
  SELECT COUNT(*) FROM user_badges
);

-- Create trigger function to increment badges count
CREATE OR REPLACE FUNCTION public.increment_badges_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.platform_statistics SET total_badges_earned = total_badges_earned + 1;
  RETURN NEW;
END;
$$;

-- Create trigger function to decrement badges count
CREATE OR REPLACE FUNCTION public.decrement_badges_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.platform_statistics SET total_badges_earned = greatest(0, total_badges_earned - 1);
  RETURN OLD;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS increment_badges_count_trigger ON public.user_badges;
DROP TRIGGER IF EXISTS decrement_badges_count_trigger ON public.user_badges;

-- Create trigger for badge inserts
CREATE TRIGGER increment_badges_count_trigger
AFTER INSERT ON public.user_badges
FOR EACH ROW
EXECUTE FUNCTION public.increment_badges_count();

-- Create trigger for badge deletes
CREATE TRIGGER decrement_badges_count_trigger
AFTER DELETE ON public.user_badges
FOR EACH ROW
EXECUTE FUNCTION public.decrement_badges_count();

-- Verify the setup
SELECT 
  total_members,
  total_supporters,
  total_votes,
  total_votes_cast,
  total_connections,
  total_badges_earned,
  last_updated
FROM platform_statistics;
