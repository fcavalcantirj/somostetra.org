-- Fix for missing check_and_award_badges function
-- This script ensures the function exists before the trigger tries to use it

-- First, drop the trigger to prevent errors during updates
DROP TRIGGER IF EXISTS on_points_change_check_badges ON profiles;

-- Recreate the badge checking function with proper error handling
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_points integer;
  v_badge record;
BEGIN
  -- Get user's current points
  SELECT points INTO v_user_points
  FROM public.profiles
  WHERE id = p_user_id;

  -- If user not found, exit
  IF v_user_points IS NULL THEN
    RETURN;
  END IF;

  -- Loop through all badges the user qualifies for but hasn't earned yet
  FOR v_badge IN
    SELECT b.id, b.name, b.points_required
    FROM public.badges b
    WHERE b.points_required <= v_user_points
      AND NOT EXISTS (
        SELECT 1 
        FROM public.user_badges ub 
        WHERE ub.user_id = p_user_id 
          AND ub.badge_id = b.id
      )
    ORDER BY b.points_required ASC
  LOOP
    -- Award the badge
    INSERT INTO public.user_badges (user_id, badge_id)
    VALUES (p_user_id, v_badge.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Error in check_and_award_badges for user %: %', p_user_id, SQLERRM;
END;
$$;

-- Recreate the trigger function
CREATE OR REPLACE FUNCTION public.trigger_check_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only check if points increased
  IF NEW.points > OLD.points THEN
    PERFORM public.check_and_award_badges(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_points_change_check_badges
  AFTER UPDATE OF points ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_check_badges();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_and_award_badges(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_check_badges() TO authenticated;

-- Award badges to existing users based on their current points
DO $$
DECLARE
  v_user record;
BEGIN
  FOR v_user IN
    SELECT id FROM public.profiles WHERE points > 0
  LOOP
    PERFORM public.check_and_award_badges(v_user.id);
  END LOOP;
END;
$$;
