-- Simple check of supporter count for user 500ef052-55fb-492d-a98c-940c3e4196c0

-- Count supporters referred by you
SELECT 
  COUNT(*) as actual_supporter_count
FROM supporters
WHERE referred_by = '500ef052-55fb-492d-a98c-940c3e4196c0';

-- List all supporters you've referred
SELECT 
  s.id,
  s.name,
  s.email,
  s.created_at,
  CASE 
    WHEN p.id IS NOT NULL THEN 'Yes - Can vote'
    ELSE 'No - Cannot vote yet'
  END as has_profile
FROM supporters s
LEFT JOIN profiles p ON s.auth_user_id = p.id
WHERE s.referred_by = '500ef052-55fb-492d-a98c-940c3e4196c0'
ORDER BY s.created_at DESC;
