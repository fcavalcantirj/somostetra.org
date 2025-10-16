-- Check current status of "jot singh" user

SELECT
  'PROFILE CHECK' as check_type,
  p.id,
  p.display_name,
  p.user_type,
  p.referral_code,
  p.points,
  p.is_admin,
  p.created_at
FROM public.profiles p
WHERE p.id = '7cb19847-8f84-43db-973a-09fbf3fe6c47';

-- Check if they have a supporter record
SELECT
  'SUPPORTER CHECK' as check_type,
  s.id,
  s.name,
  s.email,
  s.auth_user_id,
  s.created_at
FROM public.supporters s
WHERE s.auth_user_id = '7cb19847-8f84-43db-973a-09fbf3fe6c47';

-- Check auth user metadata
SELECT
  'AUTH USER CHECK' as check_type,
  au.id,
  au.email,
  au.created_at,
  au.raw_user_meta_data->>'user_type' as metadata_user_type,
  au.raw_user_meta_data->>'display_name' as metadata_display_name
FROM auth.users au
WHERE au.id = '7cb19847-8f84-43db-973a-09fbf3fe6c47';
