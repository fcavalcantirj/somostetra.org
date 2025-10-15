-- Script to fix users who are misclassified
-- IMPORTANT: Run 045_identify_misclassified_users.sql first to review what needs fixing!

-- ============================================================================
-- INSTRUCTIONS:
-- 1. Run script 045 first to identify issues
-- 2. Review the results carefully
-- 3. Uncomment the sections below that you want to run
-- 4. This script is SAFE and IDEMPOTENT - can be run multiple times
-- ============================================================================

-- ============================================================================
-- FIX 1: Convert members with supporter records to supporters
-- ============================================================================
DO $$
DECLARE
  fixed_count INTEGER := 0;
  user_record RECORD;
BEGIN
  RAISE NOTICE '=== FIXING MEMBERS WHO SHOULD BE SUPPORTERS ===';

  FOR user_record IN
    SELECT
      p.id,
      au.email,
      p.display_name,
      s.id as supporter_id
    FROM public.profiles p
    JOIN auth.users au ON au.id = p.id
    JOIN public.supporters s ON s.auth_user_id = p.id
    WHERE p.user_type = 'member'
  LOOP
    BEGIN
      -- Update profile to supporter type
      UPDATE public.profiles
      SET user_type = 'supporter',
          updated_at = NOW()
      WHERE id = user_record.id;

      -- Update auth metadata to match
      UPDATE auth.users
      SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{user_type}',
        '"supporter"'
      )
      WHERE id = user_record.id;

      fixed_count := fixed_count + 1;
      RAISE NOTICE '✓ Fixed: % (%) - converted from member to supporter', user_record.email, user_record.id;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '✗ Failed to fix %: %', user_record.email, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '=== COMPLETE: Fixed % users ===', fixed_count;
END $$;

-- ============================================================================
-- FIX 2: Create missing supporter records for users with user_type='supporter'
-- ============================================================================
DO $$
DECLARE
  created_count INTEGER := 0;
  user_record RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== CREATING MISSING SUPPORTER RECORDS ===';

  FOR user_record IN
    SELECT
      p.id,
      au.email,
      p.display_name,
      p.referred_by
    FROM public.profiles p
    JOIN auth.users au ON au.id = p.id
    LEFT JOIN public.supporters s ON s.auth_user_id = p.id
    WHERE p.user_type = 'supporter'
      AND s.id IS NULL
  LOOP
    BEGIN
      -- Create supporter record
      INSERT INTO public.supporters (
        auth_user_id,
        email,
        name,
        referred_by,
        created_at,
        updated_at
      ) VALUES (
        user_record.id,
        user_record.email,
        user_record.display_name,
        user_record.referred_by,
        NOW(),
        NOW()
      )
      ON CONFLICT (auth_user_id) DO NOTHING;

      created_count := created_count + 1;
      RAISE NOTICE '✓ Created supporter record for: % (%)', user_record.email, user_record.id;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '✗ Failed to create supporter record for %: %', user_record.email, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '=== COMPLETE: Created % supporter records ===', created_count;
END $$;

-- ============================================================================
-- FIX 3: Sync auth.users metadata with profiles.user_type
-- ============================================================================
DO $$
DECLARE
  synced_count INTEGER := 0;
  user_record RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== SYNCING AUTH METADATA WITH PROFILE USER_TYPE ===';

  FOR user_record IN
    SELECT
      au.id,
      au.email,
      p.user_type,
      au.raw_user_meta_data->>'user_type' as metadata_type
    FROM auth.users au
    JOIN public.profiles p ON p.id = au.id
    WHERE (au.raw_user_meta_data->>'user_type')::text != p.user_type::text
       OR au.raw_user_meta_data->>'user_type' IS NULL
  LOOP
    BEGIN
      -- Update auth metadata to match profile
      UPDATE auth.users
      SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{user_type}',
        to_jsonb(user_record.user_type::text)
      )
      WHERE id = user_record.id;

      synced_count := synced_count + 1;
      RAISE NOTICE '✓ Synced: % (%) - metadata now matches user_type=%', user_record.email, user_record.id, user_record.user_type;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '✗ Failed to sync %: %', user_record.email, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '=== COMPLETE: Synced % user metadata ===', synced_count;
END $$;

-- ============================================================================
-- VERIFICATION: Check results after fixes
-- ============================================================================

-- Count remaining issues
SELECT
  'Members with supporter records' as issue,
  COUNT(*) as remaining
FROM public.profiles p
JOIN public.supporters s ON s.auth_user_id = p.id
WHERE p.user_type = 'member'

UNION ALL

SELECT
  'Supporters missing records' as issue,
  COUNT(*) as remaining
FROM public.profiles p
LEFT JOIN public.supporters s ON s.auth_user_id = p.id
WHERE p.user_type = 'supporter' AND s.id IS NULL

UNION ALL

SELECT
  'Metadata mismatches' as issue,
  COUNT(*) as remaining
FROM auth.users au
JOIN public.profiles p ON p.id = au.id
WHERE (au.raw_user_meta_data->>'user_type')::text != p.user_type::text
   OR au.raw_user_meta_data->>'user_type' IS NULL;

-- Show summary of user types
SELECT
  'SUMMARY' as report,
  COUNT(*) FILTER (WHERE p.user_type = 'member') as total_members,
  COUNT(*) FILTER (WHERE p.user_type = 'supporter') as total_supporters,
  COUNT(*) FILTER (WHERE p.user_type = 'supporter' AND s.id IS NOT NULL) as supporters_with_records,
  COUNT(*) FILTER (WHERE p.user_type = 'supporter' AND s.id IS NULL) as supporters_without_records
FROM public.profiles p
LEFT JOIN public.supporters s ON s.auth_user_id = p.id;
