-- Removed supporter_count column references since it doesn't exist in the schema
-- The count is calculated dynamically, not stored

-- Show the actual count of supporters referred by you
SELECT 
  p.id,
  p.display_name,
  (SELECT COUNT(*) FROM supporters WHERE referred_by = p.id) as actual_supporter_count
FROM profiles p
WHERE p.id = '500ef052-55fb-492d-a98c-940c3e4196c0';

-- Show all supporters with creation dates (ordered by most recent)
SELECT 
  s.id,
  s.name,
  s.email,
  s.created_at,
  s.auth_user_id,
  p.display_name as profile_name,
  CASE 
    WHEN p.id IS NULL THEN 'NO PROFILE - CANNOT VOTE'
    ELSE 'HAS PROFILE - CAN VOTE'
  END as vote_status
FROM supporters s
LEFT JOIN profiles p ON p.id = s.auth_user_id
WHERE s.referred_by = '500ef052-55fb-492d-a98c-940c3e4196c0'
ORDER BY s.created_at DESC;

-- Check if any supporters exist without referral attribution
SELECT 
  COUNT(*) as supporters_without_referral
FROM supporters
WHERE referred_by IS NULL;
