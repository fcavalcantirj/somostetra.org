-- Diagnostic query to check supporter referrals for user 500ef052-55fb-492d-a98c-940c3e4196c0

-- 1. Check user's current profile data
SELECT 
  id,
  display_name,
  user_type,
  points,
  referral_code,
  (SELECT COUNT(*) FROM supporters WHERE referred_by = '500ef052-55fb-492d-a98c-940c3e4196c0') as supporter_count,
  (SELECT COUNT(*) FROM profiles WHERE referred_by = '500ef052-55fb-492d-a98c-940c3e4196c0' AND user_type = 'member') as member_count
FROM profiles 
WHERE id = '500ef052-55fb-492d-a98c-940c3e4196c0';

-- 2. List all supporters referred by this user
SELECT 
  s.id,
  s.name,
  s.email,
  s.auth_user_id,
  s.referred_by,
  s.created_at,
  p.id as profile_id,
  p.display_name as profile_name
FROM supporters s
LEFT JOIN profiles p ON p.id = s.auth_user_id
WHERE s.referred_by = '500ef052-55fb-492d-a98c-940c3e4196c0'
ORDER BY s.created_at DESC;

-- 3. Check if there are supporters without profiles (the voting issue)
SELECT 
  s.id,
  s.name,
  s.email,
  s.auth_user_id,
  s.created_at,
  CASE WHEN p.id IS NULL THEN 'NO PROFILE' ELSE 'HAS PROFILE' END as profile_status
FROM supporters s
LEFT JOIN profiles p ON p.id = s.auth_user_id
WHERE s.referred_by = '500ef052-55fb-492d-a98c-940c3e4196c0';

-- 4. Check activities for supporter referrals
SELECT 
  a.id,
  a.user_id,
  a.activity_type,
  a.description,
  a.points,
  a.created_at
FROM activities a
WHERE a.user_id = '500ef052-55fb-492d-a98c-940c3e4196c0'
  AND a.description LIKE '%apoiador%'
ORDER BY a.created_at DESC;
