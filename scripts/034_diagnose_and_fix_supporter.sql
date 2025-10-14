-- Diagnose and fix the specific supporter who signed up with ref=4E94B416
-- This will show us exactly what's missing and create the necessary records

-- First, let's find all auth users who don't have profiles
SELECT 
  au.id as auth_user_id,
  au.email,
  au.created_at,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.raw_user_meta_data->>'referred_by' as referred_by,
  CASE 
    WHEN p.id IS NOT NULL THEN 'Has Profile'
    ELSE 'Missing Profile'
  END as profile_status,
  CASE 
    WHEN s.id IS NOT NULL THEN 'Has Supporter Record'
    ELSE 'Missing Supporter Record'
  END as supporter_status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.supporters s ON s.auth_user_id = au.id
WHERE au.created_at > '2025-10-13'  -- Today's signups
ORDER BY au.created_at DESC;

-- Now let's check the referral code 4E94B416 to see who it belongs to
-- Fixed ambiguous column references by adding table alias prefix
SELECT 
  p.id,
  p.display_name,
  p.referral_code,
  au.email
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.referral_code = '4E94B416';

-- Check if there are any supporters without profiles
-- Fixed column name from full_name to name
SELECT 
  s.id as supporter_id,
  s.auth_user_id,
  s.email,
  s.name,
  s.referred_by,
  p.id as profile_id
FROM public.supporters s
LEFT JOIN public.profiles p ON p.id = s.auth_user_id
WHERE p.id IS NULL
  AND s.created_at > '2025-10-13';

-- Fix: Create missing profiles for supporters who don't have them
-- This uses the same logic as the handle_new_user trigger
DO $$
DECLARE
  supporter_record RECORD;
  new_referral_code TEXT;
  attempt INT;
  max_attempts INT := 3;
BEGIN
  -- Loop through all supporters without profiles
  FOR supporter_record IN 
    SELECT 
      s.id as supporter_id,
      s.auth_user_id,
      s.email,
      s.name,
      s.referred_by
    FROM public.supporters s
    LEFT JOIN public.profiles p ON p.id = s.auth_user_id
    WHERE p.id IS NULL
      AND s.created_at > '2025-10-13'
  LOOP
    RAISE NOTICE '[fix_supporter] Processing supporter: % (auth_user_id: %)', 
      supporter_record.name, supporter_record.auth_user_id;
    
    -- Generate a unique referral code with retry logic
    attempt := 0;
    LOOP
      attempt := attempt + 1;
      new_referral_code := public.generate_referral_code();
      
      -- Check if code already exists
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code) THEN
        EXIT; -- Code is unique, exit loop
      END IF;
      
      IF attempt >= max_attempts THEN
        RAISE EXCEPTION 'Failed to generate unique referral code after % attempts', max_attempts;
      END IF;
      
      RAISE NOTICE '[fix_supporter] Referral code collision, retrying... (attempt %/%)', attempt, max_attempts;
    END LOOP;
    
    RAISE NOTICE '[fix_supporter] Generated unique referral code: %', new_referral_code;
    
    -- Create the profile
    -- Fixed column names: full_name -> display_name, removed email (not in profiles table)
    BEGIN
      INSERT INTO public.profiles (
        id,
        display_name,
        referral_code,
        points,
        user_type
      ) VALUES (
        supporter_record.auth_user_id,
        supporter_record.name,
        new_referral_code,
        10, -- Initial points for supporters
        'supporter'
      );
      
      RAISE NOTICE '[fix_supporter] Created profile for supporter: %', supporter_record.name;
      
      -- Award initial badge if they have 10+ points
      PERFORM public.check_and_award_badges(supporter_record.auth_user_id);
      
      RAISE NOTICE '[fix_supporter] Checked and awarded badges for: %', supporter_record.name;
      
      -- If they have a referrer, award referrer points
      IF supporter_record.referred_by IS NOT NULL THEN
        UPDATE public.profiles 
        SET points = points + 10 
        WHERE id = supporter_record.referred_by;
        
        RAISE NOTICE '[fix_supporter] Awarded 10 points to referrer: %', supporter_record.referred_by;
        
        -- Create activity record
        INSERT INTO public.activities (user_id, activity_type, points_earned, description)
        VALUES (
          supporter_record.referred_by,
          'referral',
          10,
          'Indicou ' || supporter_record.name
        );
        
        RAISE NOTICE '[fix_supporter] Created activity record for referrer';
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '[fix_supporter] Error creating profile for %: %', 
          supporter_record.name, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '[fix_supporter] Completed processing all supporters without profiles';
END $$;

-- Verify the fix
-- Fixed column name from full_name to display_name
SELECT 
  au.email,
  au.raw_user_meta_data->>'full_name' as full_name,
  CASE 
    WHEN p.id IS NOT NULL THEN '✓ Has Profile'
    ELSE '✗ Missing Profile'
  END as profile_status,
  CASE 
    WHEN s.id IS NOT NULL THEN '✓ Has Supporter Record'
    ELSE '✗ Missing Supporter Record'
  END as supporter_status,
  p.points,
  p.referral_code,
  p.display_name
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.supporters s ON s.auth_user_id = au.id
WHERE au.created_at > '2025-10-13'
ORDER BY au.created_at DESC;
