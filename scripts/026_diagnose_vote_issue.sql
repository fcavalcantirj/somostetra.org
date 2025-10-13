-- Diagnostic script to check why user 'bac28b48-5189-4278-82e0-e5418a7f5433' cannot vote

-- Check if user has a profile
SELECT 
  'User Profile Check' as check_type,
  id,
  display_name,
  user_type,
  is_admin,
  created_at
FROM profiles
WHERE id = 'bac28b48-5189-4278-82e0-e5418a7f5433';

-- Check if user exists in auth.users
SELECT 
  'Auth User Check' as check_type,
  id,
  email,
  created_at,
  raw_user_meta_data->>'user_type' as metadata_user_type
FROM auth.users
WHERE id = 'bac28b48-5189-4278-82e0-e5418a7f5433';

-- Check user's existing votes
SELECT 
  'Existing Votes Check' as check_type,
  uv.id,
  uv.vote_id,
  v.title as vote_title,
  uv.created_at
FROM user_votes uv
JOIN votes v ON v.id = uv.vote_id
WHERE uv.user_id = 'bac28b48-5189-4278-82e0-e5418a7f5433';

-- Check active votes
SELECT 
  'Active Votes Check' as check_type,
  id,
  title,
  status,
  created_at
FROM votes
WHERE status = 'active'
ORDER BY created_at DESC;

-- Check RLS policies on user_votes table
SELECT 
  'RLS Policies Check' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_votes';

-- Check constraints on user_votes table
SELECT 
  'Constraints Check' as check_type,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'user_votes'::regclass;
