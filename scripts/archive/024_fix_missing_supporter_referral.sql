-- Fix missing supporter referral for user 500ef052-55fb-492d-a98c-940c3e4196c0
-- Missing supporter: 6282eb7a-1b61-4f37-8a36-7d20487a932f

-- First, check the current state of this supporter
SELECT 
  s.id,
  s.auth_user_id,
  s.name,
  s.email,
  s.referred_by,
  s.created_at,
  p.display_name as referrer_name
FROM supporters s
LEFT JOIN profiles p ON s.referred_by = p.id
WHERE s.auth_user_id = '6282eb7a-1b61-4f37-8a36-7d20487a932f';

-- Update the supporter to link them to you
UPDATE supporters
SET referred_by = '500ef052-55fb-492d-a98c-940c3e4196c0'
WHERE auth_user_id = '6282eb7a-1b61-4f37-8a36-7d20487a932f'
AND referred_by IS NULL;

-- Award you 10 points for this referral
UPDATE profiles
SET points = points + 10
WHERE id = '500ef052-55fb-492d-a98c-940c3e4196c0';

-- Create an activity record for the referral
INSERT INTO activities (user_id, type, description, points_earned)
SELECT 
  '500ef052-55fb-492d-a98c-940c3e4196c0',
  'referral',
  'Convidou ' || s.name || ' como apoiador',
  10
FROM supporters s
WHERE s.auth_user_id = '6282eb7a-1b61-4f37-8a36-7d20487a932f';

-- Verify the fix
SELECT 
  'Fixed!' as status,
  COUNT(*) as total_supporters
FROM supporters
WHERE referred_by = '500ef052-55fb-492d-a98c-940c3e4196c0';
