-- Final check: Show complete user data for jot singh

SELECT
  p.id,
  p.display_name,
  p.user_type as profile_user_type,
  au.raw_user_meta_data->>'user_type' as auth_metadata_type,
  CASE
    WHEN s.id IS NOT NULL THEN 'YES'
    ELSE 'NO'
  END as has_supporter_record,
  p.referral_code,
  p.points,
  p.created_at
FROM auth.users au
JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.supporters s ON s.auth_user_id = au.id
WHERE au.id = '7cb19847-8f84-43db-973a-09fbf3fe6c47';
