-- Add total_votes_cast column to platform_statistics to track individual votes cast
ALTER TABLE platform_statistics
ADD COLUMN IF NOT EXISTS total_votes_cast INTEGER DEFAULT 0;

-- Initialize with current count of votes cast
UPDATE platform_statistics
SET total_votes_cast = (SELECT COUNT(*) FROM user_votes);

-- Function to increment votes cast count
CREATE OR REPLACE FUNCTION public.increment_votes_cast()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.platform_statistics SET total_votes_cast = total_votes_cast + 1;
  RETURN NEW;
END;
$$;

-- Function to decrement votes cast count
CREATE OR REPLACE FUNCTION public.decrement_votes_cast()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.platform_statistics SET total_votes_cast = greatest(0, total_votes_cast - 1);
  RETURN OLD;
END;
$$;

-- Trigger to increment when a vote is cast
DROP TRIGGER IF EXISTS trigger_increment_votes_cast ON user_votes;
CREATE TRIGGER trigger_increment_votes_cast
AFTER INSERT ON user_votes
FOR EACH ROW
EXECUTE FUNCTION increment_votes_cast();

-- Trigger to decrement when a vote is deleted
DROP TRIGGER IF EXISTS trigger_decrement_votes_cast ON user_votes;
CREATE TRIGGER trigger_decrement_votes_cast
AFTER DELETE ON user_votes
FOR EACH ROW
EXECUTE FUNCTION decrement_votes_cast();

-- Verify the count
SELECT 
  total_votes as voting_topics,
  total_votes_cast as individual_votes_cast,
  total_members,
  total_supporters,
  total_connections
FROM platform_statistics;
