-- Fix missing WHERE clauses in badge statistics trigger functions
-- This prevents "UPDATE requires a WHERE clause" errors when assigning/removing badges

-- Fix increment_badges_count function
CREATE OR REPLACE FUNCTION public.increment_badges_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.platform_statistics 
  SET total_badges_earned = total_badges_earned + 1 
  WHERE true;
  RETURN NEW;
END;
$$;

-- Fix decrement_badges_count function
CREATE OR REPLACE FUNCTION public.decrement_badges_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.platform_statistics 
  SET total_badges_earned = greatest(0, total_badges_earned - 1) 
  WHERE true;
  RETURN OLD;
END;
$$;
