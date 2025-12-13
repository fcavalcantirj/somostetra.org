-- Automatic Badge Awarding System
-- This script creates a function and trigger to automatically award badges when users reach point thresholds

-- Function to check and award badges based on current points
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_points integer;
  v_badge record;
BEGIN
  -- Get user's current points
  SELECT points INTO v_user_points
  FROM profiles
  WHERE id = p_user_id;

  -- If user not found, exit
  IF v_user_points IS NULL THEN
    RETURN;
  END IF;

  -- Loop through all badges the user qualifies for but hasn't earned yet
  FOR v_badge IN
    SELECT b.id, b.name, b.points_required
    FROM badges b
    WHERE b.points_required <= v_user_points
      AND NOT EXISTS (
        SELECT 1 
        FROM user_badges ub 
        WHERE ub.user_id = p_user_id 
          AND ub.badge_id = b.id
      )
    ORDER BY b.points_required ASC
  LOOP
    -- Award the badge
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, v_badge.id);

    -- Removed activity record insertion since badges don't award points
    -- Badge awards are tracked in user_badges table with earned_at timestamp
    -- The activities table is reserved for point-earning activities only
  END LOOP;
END;
$$;

-- Trigger function to check badges after points change
CREATE OR REPLACE FUNCTION trigger_check_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only check if points increased
  IF NEW.points > OLD.points THEN
    PERFORM check_and_award_badges(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_points_change_check_badges ON profiles;

-- Create trigger on profiles table to check badges when points change
CREATE TRIGGER on_points_change_check_badges
  AFTER UPDATE OF points ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_badges();

-- Award badges to existing users based on their current points
-- This is a one-time operation to catch up existing users
DO $$
DECLARE
  v_user record;
BEGIN
  FOR v_user IN
    SELECT id FROM profiles WHERE points > 0
  LOOP
    PERFORM check_and_award_badges(v_user.id);
  END LOOP;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION check_and_award_badges(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_check_badges() TO authenticated;
