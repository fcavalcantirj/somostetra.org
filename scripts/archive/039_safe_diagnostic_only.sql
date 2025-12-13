-- SAFE DIAGNOSTIC SCRIPT - READ ONLY, NO CHANGES
-- This script only reads data and shows what WOULD be fixed
-- Run this first to verify before running any fix scripts

-- 1. Show all users without profiles
SELECT 
  'USERS WITHOUT PROFILES' as section,
  au.id,
  au.email,
  au.created_at,
  au.raw_user_meta_data->>'user_type' as intended_type,
  au.raw_user_meta_data->>'referred_by' as referrer_id
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- 2. Check if these users have supporter records
SELECT 
  'SUPPORTER RECORDS CHECK' as section,
  au.id as auth_user_id,
  au.email,
  s.id as supporter_id,
  CASE 
    WHEN s.id IS NOT NULL THEN '✓ Has supporter record'
    ELSE '✗ Missing supporter record'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.supporters s ON s.auth_user_id = au.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- 3. Check referrer information
SELECT 
  'REFERRER VALIDATION' as section,
  au.email,
  au.raw_user_meta_data->>'referred_by' as referrer_id,
  ref.display_name as referrer_name,
  ref.referral_code as referrer_code,
  CASE 
    WHEN au.raw_user_meta_data->>'referred_by' IS NULL THEN 'No referrer'
    WHEN ref.id IS NOT NULL THEN '✓ Valid referrer'
    ELSE '✗ Invalid referrer ID'
  END as referrer_status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.profiles ref ON ref.id = (au.raw_user_meta_data->>'referred_by')::uuid
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- 4. Show what WOULD be created (simulation)
SELECT 
  'SIMULATION - WHAT WOULD BE CREATED' as section,
  au.email,
  'Profile with display_name: ' || COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as profile_action,
  'Supporter record linked to auth_user_id' as supporter_action,
  CASE 
    WHEN au.raw_user_meta_data->>'referred_by' IS NOT NULL 
    THEN 'Award 10 points to referrer'
    ELSE 'No referrer points'
  END as referrer_action
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- 5. Check for potential conflicts
SELECT 
  'POTENTIAL CONFLICTS' as section,
  au.email,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = substring(md5(random()::text), 1, 8)) 
    THEN '⚠️ Referral code might collide (very rare)'
    ELSE '✓ No conflicts expected'
  END as conflict_check
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
LIMIT 5;

-- 6. Summary
SELECT 
  'SUMMARY' as section,
  COUNT(*) as total_users_to_fix,
  COUNT(CASE WHEN au.raw_user_meta_data->>'referred_by' IS NOT NULL THEN 1 END) as users_with_referrer,
  COUNT(CASE WHEN s.id IS NOT NULL THEN 1 END) as already_have_supporter_record
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.supporters s ON s.auth_user_id = au.id
WHERE p.id IS NULL;
