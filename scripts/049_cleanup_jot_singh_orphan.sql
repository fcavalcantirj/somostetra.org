-- Comprehensive cleanup for orphaned user "jot singh"
-- This user has auth record but no profile/supporter record
-- Database is blocking deletion due to foreign key constraints

DO $$
DECLARE
  target_user_id UUID := '7cb19847-8f84-43db-973a-09fbf3fe6c47';
  user_email TEXT := '[REDACTED_EMAIL]';
  deleted_count INTEGER;
BEGIN
  RAISE NOTICE '=== Starting cleanup for orphaned user: % (%) ===', user_email, target_user_id;

  -- Check current state
  RAISE NOTICE 'Checking current state...';

  -- Check profile
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
    RAISE NOTICE 'WARNING: User HAS a profile';
  ELSE
    RAISE NOTICE '✓ User has no profile (expected)';
  END IF;

  -- Check supporter record
  IF EXISTS (SELECT 1 FROM public.supporters WHERE auth_user_id = target_user_id) THEN
    RAISE NOTICE 'WARNING: User HAS a supporter record';
  ELSE
    RAISE NOTICE '✓ User has no supporter record (expected)';
  END IF;

  -- Clean up all possible related records
  RAISE NOTICE '';
  RAISE NOTICE '=== Cleaning up related records ===';

  -- 1. Delete user_votes
  DELETE FROM public.user_votes WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % user_votes records', deleted_count;

  -- 2. Delete user_badges
  DELETE FROM public.user_badges WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % user_badges records', deleted_count;

  -- 3. Delete activities
  DELETE FROM public.activities WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % activities records', deleted_count;

  -- 4. Delete referrals where user is referrer
  DELETE FROM public.referrals WHERE referrer_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % referrals (as referrer)', deleted_count;

  -- 5. Delete referrals where user is referred
  DELETE FROM public.referrals WHERE referred_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % referrals (as referred)', deleted_count;

  -- 6. Update profiles that were referred by this user
  UPDATE public.profiles SET referred_by = NULL WHERE referred_by = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Updated % profiles that were referred by this user', deleted_count;

  -- 7. Delete votes created by user
  DELETE FROM public.votes WHERE created_by = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % votes created by user', deleted_count;

  -- 8. Check supporters table again (in case)
  DELETE FROM public.supporters WHERE auth_user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % supporter records', deleted_count;

  RAISE NOTICE '';
  RAISE NOTICE '=== Cleanup complete ===';
  RAISE NOTICE 'All database records cleaned up.';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEP: Delete auth user via Supabase Dashboard';
  RAISE NOTICE 'User ID: %', target_user_id;
  RAISE NOTICE 'Email: %', user_email;

END $$;

-- Verification: Check if user still has any related records
SELECT
  'VERIFICATION' as check_type,
  (SELECT COUNT(*) FROM public.user_votes WHERE user_id = '7cb19847-8f84-43db-973a-09fbf3fe6c47') as user_votes,
  (SELECT COUNT(*) FROM public.user_badges WHERE user_id = '7cb19847-8f84-43db-973a-09fbf3fe6c47') as user_badges,
  (SELECT COUNT(*) FROM public.activities WHERE user_id = '7cb19847-8f84-43db-973a-09fbf3fe6c47') as activities,
  (SELECT COUNT(*) FROM public.referrals WHERE referrer_id = '7cb19847-8f84-43db-973a-09fbf3fe6c47') as referrals_as_referrer,
  (SELECT COUNT(*) FROM public.referrals WHERE referred_id = '7cb19847-8f84-43db-973a-09fbf3fe6c47') as referrals_as_referred,
  (SELECT COUNT(*) FROM public.votes WHERE created_by = '7cb19847-8f84-43db-973a-09fbf3fe6c47') as votes_created,
  (SELECT COUNT(*) FROM public.supporters WHERE auth_user_id = '7cb19847-8f84-43db-973a-09fbf3fe6c47') as supporter_records,
  (SELECT COUNT(*) FROM public.profiles WHERE id = '7cb19847-8f84-43db-973a-09fbf3fe6c47') as profiles;
