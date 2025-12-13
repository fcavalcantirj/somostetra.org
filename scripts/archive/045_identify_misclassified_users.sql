-- Script to identify members who might actually be supporters
-- Cross-reference profiles.user_type with actual referral patterns and supporter records

-- ============================================================================
-- PART 1: Members who have supporter records (definitely should be supporters)
-- ============================================================================
SELECT
  'CRITICAL: Member with Supporter Record' as issue_type,
  p.id,
  au.email,
  p.display_name,
  p.user_type as profile_user_type,
  'supporter' as should_be_user_type,
  p.referral_code,
  p.created_at,
  s.id as supporter_record_id
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
JOIN public.supporters s ON s.auth_user_id = p.id
WHERE p.user_type = 'member'
ORDER BY p.created_at DESC;

-- ============================================================================
-- PART 2: Check if any supporters have member user_type
-- ============================================================================
SELECT
  'Supporter Record but Member Type' as issue_type,
  s.id as supporter_id,
  s.email,
  s.name,
  s.auth_user_id,
  p.user_type as profile_user_type,
  'supporter' as should_be_user_type,
  s.created_at
FROM public.supporters s
LEFT JOIN public.profiles p ON p.id = s.auth_user_id
WHERE p.user_type = 'member' OR p.user_type IS NULL
ORDER BY s.created_at DESC;

-- ============================================================================
-- PART 3: Check auth.users metadata vs profiles.user_type mismatch
-- ============================================================================
SELECT
  'Metadata Mismatch' as issue_type,
  au.id,
  au.email,
  au.raw_user_meta_data->>'user_type' as auth_metadata_type,
  p.user_type as profile_user_type,
  CASE
    WHEN au.raw_user_meta_data->>'user_type' = 'supporter' THEN 'supporter'
    WHEN au.raw_user_meta_data->>'user_type' = 'member' THEN 'member'
    ELSE 'unknown'
  END as should_be_user_type,
  au.created_at
FROM auth.users au
JOIN public.profiles p ON p.id = au.id
WHERE (au.raw_user_meta_data->>'user_type')::text != p.user_type::text
ORDER BY au.created_at DESC;

-- ============================================================================
-- PART 4: Supporters without supporter records (missing data integrity)
-- ============================================================================
SELECT
  'Supporter Profile Missing Supporter Record' as issue_type,
  p.id,
  au.email,
  p.display_name,
  p.user_type,
  'needs supporter record' as action_needed,
  p.created_at
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
LEFT JOIN public.supporters s ON s.auth_user_id = p.id
WHERE p.user_type = 'supporter'
  AND s.id IS NULL
ORDER BY p.created_at DESC;

-- ============================================================================
-- SUMMARY: Count of each issue type
-- ============================================================================
WITH issues AS (
  SELECT 'Members with Supporter Records' as issue, COUNT(*) as count
  FROM public.profiles p
  JOIN public.supporters s ON s.auth_user_id = p.id
  WHERE p.user_type = 'member'

  UNION ALL

  SELECT 'Auth Metadata Mismatches' as issue, COUNT(*) as count
  FROM auth.users au
  JOIN public.profiles p ON p.id = au.id
  WHERE (au.raw_user_meta_data->>'user_type')::text != p.user_type::text

  UNION ALL

  SELECT 'Supporters Missing Records' as issue, COUNT(*) as count
  FROM public.profiles p
  LEFT JOIN public.supporters s ON s.auth_user_id = p.id
  WHERE p.user_type = 'supporter' AND s.id IS NULL
)
SELECT * FROM issues WHERE count > 0
ORDER BY count DESC;

-- ============================================================================
-- DETAILED: All users with their complete classification info
-- ============================================================================
SELECT
  au.email,
  p.display_name,
  p.user_type as profile_type,
  au.raw_user_meta_data->>'user_type' as metadata_type,
  CASE WHEN s.id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_supporter_record,
  CASE
    WHEN p.user_type = 'member' AND s.id IS NOT NULL THEN '❌ WRONG: Member with supporter record'
    WHEN p.user_type = 'supporter' AND s.id IS NULL THEN '⚠️ Missing supporter record'
    WHEN (au.raw_user_meta_data->>'user_type')::text != p.user_type::text THEN '⚠️ Metadata mismatch'
    ELSE '✅ OK'
  END as status,
  p.referral_code,
  p.created_at
FROM auth.users au
JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.supporters s ON s.auth_user_id = p.id
ORDER BY
  CASE
    WHEN p.user_type = 'member' AND s.id IS NOT NULL THEN 1
    WHEN p.user_type = 'supporter' AND s.id IS NULL THEN 2
    WHEN (au.raw_user_meta_data->>'user_type')::text != p.user_type::text THEN 3
    ELSE 4
  END,
  p.created_at DESC;
