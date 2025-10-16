-- Delete orphaned auth user "jot singh" who has no profile or supporter record
-- This user was left behind when supporter was deleted before the fix

DO $$
DECLARE
  user_id UUID := '7cb19847-8f84-43db-973a-09fbf3fe6c47';
  user_email TEXT := '[REDACTED_EMAIL]';
BEGIN
  RAISE NOTICE 'Checking for orphaned user: % (%)', user_email, user_id;

  -- Verify user has no profile
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    RAISE EXCEPTION 'User % has a profile - cannot delete', user_email;
  END IF;

  -- Verify user has no supporter record
  IF EXISTS (SELECT 1 FROM public.supporters WHERE auth_user_id = user_id) THEN
    RAISE EXCEPTION 'User % has a supporter record - cannot delete', user_email;
  END IF;

  RAISE NOTICE 'User is orphaned (no profile, no supporter record)';
  RAISE NOTICE 'Safe to delete from auth.users';
  RAISE NOTICE 'User will be deleted via Supabase Dashboard or service role client';

END $$;

-- NOTE: This script only verifies safety.
-- The actual deletion must be done via:
-- 1. Supabase Dashboard > Authentication > Users > Delete user
-- 2. OR via service role client: auth.admin.deleteUser('7cb19847-8f84-43db-973a-09fbf3fe6c47')
