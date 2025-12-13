-- Comprehensive diagnostic for user creation issues
-- This script checks for Victor/Vitor, Isis Mariana, and all recent signups

-- 1. Find Victor/Vitor who signed up today (check auth.users)
SELECT 
  'VICTOR/VITOR SEARCH' as diagnostic_section,
  au.id as auth_user_id,
  au.email,
  au.created_at as auth_created_at,
  au.raw_user_meta_data->>'intended_type' as intended_type,
  au.raw_user_meta_data->>'referred_by' as referred_by_metadata,
  p.id as profile_id,
  p.display_name as profile_name,
  s.id as supporter_id,
  s.name as supporter_name,
  CASE 
    WHEN p.id IS NULL AND s.id IS NULL THEN '❌ NO RECORDS CREATED'
    WHEN p.id IS NULL THEN '⚠️ MISSING PROFILE'
    WHEN s.id IS NULL THEN '⚠️ MISSING SUPPORTER'
    ELSE '✅ HAS BOTH'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.supporters s ON s.auth_user_id = au.id
WHERE 
  au.created_at::date = CURRENT_DATE
  AND (
    LOWER(au.email) LIKE '%victor%' 
    OR LOWER(au.email) LIKE '%vitor%'
    OR LOWER(au.raw_user_meta_data->>'full_name') LIKE '%victor%'
    OR LOWER(au.raw_user_meta_data->>'full_name') LIKE '%vitor%'
  )
ORDER BY au.created_at DESC;

-- 2. Check Isis Mariana specifically
SELECT 
  'ISIS MARIANA ANALYSIS' as diagnostic_section,
  au.id as auth_user_id,
  au.email,
  au.created_at as auth_created_at,
  au.raw_user_meta_data->>'intended_type' as intended_type,
  p.id as profile_id,
  p.display_name as profile_name,
  p.user_type as profile_user_type,
  s.id as supporter_id,
  s.name as supporter_name,
  s.auth_user_id as supporter_auth_id,
  CASE 
    WHEN p.id IS NOT NULL AND s.id IS NOT NULL THEN '⚠️ DUPLICATE: Has both profile and supporter'
    WHEN p.id IS NOT NULL AND s.id IS NULL THEN '✅ Member only (correct)'
    WHEN p.id IS NULL AND s.id IS NOT NULL THEN '⚠️ Supporter only (missing profile)'
    ELSE '❌ No records'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.supporters s ON s.auth_user_id = au.id
WHERE au.email = 'isismariana92@hotmail.com'
   OR au.id = 'ff8dc799-f69c-4d75-a3a1-5d45417be369';

-- 3. All users created today with their status
SELECT 
  'ALL USERS TODAY' as diagnostic_section,
  au.id as auth_user_id,
  au.email,
  au.created_at,
  au.raw_user_meta_data->>'intended_type' as intended_type,
  au.raw_user_meta_data->>'referred_by' as referrer_id,
  p.id as profile_id,
  s.id as supporter_id,
  CASE 
    WHEN p.id IS NULL AND s.id IS NULL THEN '❌ TRIGGER FAILED'
    WHEN p.id IS NULL THEN '⚠️ NO PROFILE'
    WHEN s.id IS NULL AND au.raw_user_meta_data->>'intended_type' = 'supporter' THEN '⚠️ NO SUPPORTER'
    ELSE '✅ OK'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.supporters s ON s.auth_user_id = au.id
WHERE au.created_at::date = CURRENT_DATE
ORDER BY au.created_at DESC;

-- 4. Check for users with duplicate records (both profile and supporter)
SELECT 
  'DUPLICATE RECORDS' as diagnostic_section,
  au.id as auth_user_id,
  au.email,
  p.display_name as profile_name,
  p.user_type as profile_type,
  s.name as supporter_name,
  au.created_at
FROM auth.users au
JOIN public.profiles p ON p.id = au.id
JOIN public.supporters s ON s.auth_user_id = au.id
WHERE p.user_type = 'supporter'
ORDER BY au.created_at DESC
LIMIT 20;

-- 5. Check the current handle_new_user function
SELECT 
  'TRIGGER FUNCTION CHECK' as diagnostic_section,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'handle_new_user';

-- 6. Check if trigger is enabled
SELECT 
  'TRIGGER STATUS' as diagnostic_section,
  tgname as trigger_name,
  tgenabled as is_enabled,
  CASE tgenabled
    WHEN 'O' THEN '✅ Enabled'
    WHEN 'D' THEN '❌ Disabled'
    WHEN 'R' THEN '⚠️ Replica only'
    WHEN 'A' THEN '⚠️ Always'
  END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
