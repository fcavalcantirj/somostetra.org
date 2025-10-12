-- Fix Function Search Path Security Warnings
-- This script adds SET search_path = '' to all functions to prevent search path manipulation attacks
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- Add search_path security to generate_referral_code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;

-- Add search_path security to update_vote_count
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.votes SET vote_count = vote_count + 1 WHERE id = NEW.vote_id;
    
    INSERT INTO public.activities (user_id, activity_type, points, description)
    VALUES (NEW.user_id, 'vote', 5, 'Votou em uma pauta');
    
    UPDATE public.profiles SET points = points + 5 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.votes SET vote_count = vote_count - 1 WHERE id = OLD.vote_id;
    
    INSERT INTO public.activities (user_id, activity_type, points, description)
    VALUES (OLD.user_id, 'vote_removed', -5, 'Removeu voto de uma pauta');
    
    UPDATE public.profiles SET points = points - 5 WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Add search_path security to check_is_admin (already has it, but ensuring consistency)
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (SELECT is_admin FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- Add search_path security to increment_user_points
CREATE OR REPLACE FUNCTION increment_user_points(user_id uuid, points_to_add integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET points = points + points_to_add,
      updated_at = now()
  WHERE id = user_id;
END;
$$;

-- Add search_path security to statistics functions
CREATE OR REPLACE FUNCTION update_statistics_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.platform_statistics SET last_updated = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION increment_members()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.platform_statistics SET total_members = total_members + 1;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_members()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.platform_statistics SET total_members = greatest(0, total_members - 1);
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION increment_votes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.platform_statistics SET total_votes = total_votes + 1;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_votes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.platform_statistics SET total_votes = greatest(0, total_votes - 1);
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION increment_connections()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.platform_statistics SET total_connections = total_connections + 1;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_connections()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.platform_statistics SET total_connections = greatest(0, total_connections - 1);
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION increment_supporters()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.platform_statistics SET total_supporters = total_supporters + 1;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_supporters()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.platform_statistics SET total_supporters = greatest(0, total_supporters - 1);
  RETURN OLD;
END;
$$;

-- Add search_path security to badge functions
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_points integer;
  v_badge record;
BEGIN
  SELECT points INTO v_user_points
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_user_points IS NULL THEN
    RETURN;
  END IF;

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
    INSERT INTO public.user_badges (user_id, badge_id)
    VALUES (p_user_id, v_badge.id);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION trigger_check_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.points > OLD.points THEN
    PERFORM check_and_award_badges(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION generate_referral_code() TO authenticated;
GRANT EXECUTE ON FUNCTION update_vote_count() TO authenticated;
GRANT EXECUTE ON FUNCTION check_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION increment_user_points(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_award_badges(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_check_badges() TO authenticated;
