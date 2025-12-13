-- Fix missing INSERT policy for supporters table
-- The handle_new_user() trigger needs to be able to insert supporter records

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "System can insert supporters" ON public.supporters;
DROP POLICY IF EXISTS "Anyone can insert supporters" ON public.supporters;

-- Allow the trigger (running as SECURITY DEFINER) to insert supporters
-- This policy allows authenticated users (including the trigger) to insert
CREATE POLICY "System can insert supporters"
  ON public.supporters
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant INSERT permission to authenticated role
GRANT INSERT ON public.supporters TO authenticated;

-- Add comment
COMMENT ON POLICY "System can insert supporters" ON public.supporters IS 
  'Allows the handle_new_user() trigger to create supporter records during signup';
