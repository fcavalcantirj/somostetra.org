-- Drop any problematic admin policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything on referrals" ON public.referrals;
DROP POLICY IF EXISTS "Admins can do everything on votes" ON public.votes;
DROP POLICY IF EXISTS "Admins can do everything on user_votes" ON public.user_votes;
DROP POLICY IF EXISTS "Admins can do everything on badges" ON public.badges;
DROP POLICY IF EXISTS "Admins can do everything on user_badges" ON public.user_badges;
DROP POLICY IF EXISTS "Admins can do everything on activities" ON public.activities;

-- Recreate the is_admin function to use a simpler approach
DROP FUNCTION IF EXISTS public.is_admin(UUID);

-- Create a function that checks admin status without causing recursion
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  SELECT is_admin INTO admin_status
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(admin_status, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_is_admin() TO authenticated;

-- Add admin-friendly policies that don't cause recursion
-- These policies allow admins to bypass restrictions by checking the column directly

-- Profiles: Allow admins to update any profile
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- Votes: Allow admins to update any vote
CREATE POLICY "Admins can update any vote"
  ON public.votes FOR UPDATE
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- Votes: Allow admins to delete any vote
CREATE POLICY "Admins can delete any vote"
  ON public.votes FOR DELETE
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- Badges: Allow admins to insert badges
CREATE POLICY "Admins can insert badges"
  ON public.badges FOR INSERT
  WITH CHECK (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- Badges: Allow admins to update badges
CREATE POLICY "Admins can update badges"
  ON public.badges FOR UPDATE
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- Badges: Allow admins to delete badges
CREATE POLICY "Admins can delete badges"
  ON public.badges FOR DELETE
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  );

-- User badges: Allow admins to insert user badges
CREATE POLICY "Admins can assign badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  );
