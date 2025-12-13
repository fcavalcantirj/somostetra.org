-- Fix all UPDATE statements to include WHERE clauses
-- PostgreSQL requires WHERE clauses for UPDATE statements as a safety measure

-- Fix update_statistics_timestamp function
CREATE OR REPLACE FUNCTION update_statistics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE platform_statistics SET last_updated = now() WHERE true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix increment_members function
CREATE OR REPLACE FUNCTION increment_members()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE platform_statistics SET total_members = total_members + 1 WHERE true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix decrement_members function
CREATE OR REPLACE FUNCTION decrement_members()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE platform_statistics SET total_members = greatest(0, total_members - 1) WHERE true;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Fix increment_votes function
CREATE OR REPLACE FUNCTION increment_votes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE platform_statistics SET total_votes = total_votes + 1 WHERE true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix decrement_votes function
CREATE OR REPLACE FUNCTION decrement_votes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE platform_statistics SET total_votes = greatest(0, total_votes - 1) WHERE true;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Fix increment_connections function
CREATE OR REPLACE FUNCTION increment_connections()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE platform_statistics SET total_connections = total_connections + 1 WHERE true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix decrement_connections function
CREATE OR REPLACE FUNCTION decrement_connections()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE platform_statistics SET total_connections = greatest(0, total_connections - 1) WHERE true;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Fix increment_votes_cast function (from script 025)
CREATE OR REPLACE FUNCTION public.increment_votes_cast()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.platform_statistics SET total_votes_cast = total_votes_cast + 1 WHERE true;
  RETURN NEW;
END;
$$;

-- Fix decrement_votes_cast function (from script 025)
CREATE OR REPLACE FUNCTION public.decrement_votes_cast()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.platform_statistics SET total_votes_cast = greatest(0, total_votes_cast - 1) WHERE true;
  RETURN OLD;
END;
$$;

-- Fix increment_badges_earned function (from script 027)
CREATE OR REPLACE FUNCTION public.increment_badges_earned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.platform_statistics SET total_badges_earned = total_badges_earned + 1 WHERE true;
  RETURN NEW;
END;
$$;

-- Fix decrement_badges_earned function (from script 027)
CREATE OR REPLACE FUNCTION public.decrement_badges_earned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.platform_statistics SET total_badges_earned = greatest(0, total_badges_earned - 1) WHERE true;
  RETURN OLD;
END;
$$;

-- Verify all functions are updated
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%statistics%'
  OR routine_name LIKE '%votes_cast%'
  OR routine_name LIKE '%badges_earned%'
ORDER BY routine_name;
