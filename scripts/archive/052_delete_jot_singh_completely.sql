-- Delete "jot singh" user completely
-- This user has a profile with user_type='supporter' but NO supporter record
-- Cannot be deleted via admin UI because they don't show up anywhere

DO $$
DECLARE
  target_user_id UUID := '7cb19847-8f84-43db-973a-09fbf3fe6c47';
  user_email TEXT := '[REDACTED_EMAIL]';
BEGIN
  RAISE NOTICE 'Deleting user: % (%)', user_email, target_user_id;

  -- Delete all related records (same as deleteUser function)
  DELETE FROM public.user_badges WHERE user_id = target_user_id;
  DELETE FROM public.user_votes WHERE user_id = target_user_id;
  DELETE FROM public.activities WHERE user_id = target_user_id;
  DELETE FROM public.referrals WHERE referrer_id = target_user_id;
  DELETE FROM public.referrals WHERE referred_id = target_user_id;
  UPDATE public.profiles SET referred_by = NULL WHERE referred_by = target_user_id;
  DELETE FROM public.votes WHERE created_by = target_user_id;
  DELETE FROM public.supporters WHERE auth_user_id = target_user_id;

  -- Delete profile
  DELETE FROM public.profiles WHERE id = target_user_id;

  RAISE NOTICE 'User profile and related records deleted.';
  RAISE NOTICE '';
  RAISE NOTICE 'FINAL STEP: Delete auth user from Supabase Dashboard:';
  RAISE NOTICE 'Go to Authentication > Users > Search: %', user_email;
  RAISE NOTICE 'Then delete the user.';
  RAISE NOTICE '';
  RAISE NOTICE 'OR run this via service role client:';
  RAISE NOTICE 'auth.admin.deleteUser(''%'')', target_user_id;

END $$;

-- Verification
SELECT
  'VERIFICATION' as status,
  (SELECT COUNT(*) FROM public.profiles WHERE id = '7cb19847-8f84-43db-973a-09fbf3fe6c47') as profiles,
  (SELECT COUNT(*) FROM public.supporters WHERE auth_user_id = '7cb19847-8f84-43db-973a-09fbf3fe6c47') as supporters,
  'Auth user must be deleted manually' as note;
