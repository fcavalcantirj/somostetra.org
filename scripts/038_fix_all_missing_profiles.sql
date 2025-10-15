-- Fix all users who have auth accounts but no profiles
-- This creates profiles and supporter records for all broken signups

DO $$
DECLARE
  user_record RECORD;
  new_referral_code TEXT;
  referrer_id UUID;
  retry_count INT;
  users_fixed INT := 0;
  users_failed INT := 0;
BEGIN
  RAISE NOTICE '=== FIXING ALL USERS WITHOUT PROFILES ===';
  RAISE NOTICE '';
  
  -- Loop through all auth users without profiles
  FOR user_record IN 
    SELECT 
      au.id,
      au.email,
      au.raw_user_meta_data->>'full_name' as full_name,
      au.raw_user_meta_data->>'user_type' as user_type,
      au.raw_user_meta_data->>'referred_by' as referred_by,
      au.created_at
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL
    ORDER BY au.created_at DESC
  LOOP
    BEGIN
      RAISE NOTICE '→ Fixing user: % (%) - Type: %', 
        user_record.email, 
        user_record.id,
        COALESCE(user_record.user_type, 'member');
      
      -- Generate unique referral code with retry logic
      retry_count := 0;
      LOOP
        new_referral_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || user_record.id::TEXT) FROM 1 FOR 8));
        
        -- Check if code exists
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code) THEN
          EXIT; -- Code is unique, exit loop
        END IF;
        
        retry_count := retry_count + 1;
        IF retry_count >= 5 THEN
          RAISE EXCEPTION 'Failed to generate unique referral code after 5 attempts';
        END IF;
      END LOOP;
      
      RAISE NOTICE '  ✓ Generated referral code: %', new_referral_code;
      
      -- Get referrer ID if provided
      referrer_id := NULL;
      IF user_record.referred_by IS NOT NULL AND user_record.referred_by != '' THEN
        BEGIN
          referrer_id := user_record.referred_by::UUID;
          RAISE NOTICE '  ✓ Referrer ID: %', referrer_id;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE '  ⚠ Invalid referrer ID format: %', user_record.referred_by;
        END;
      END IF;
      
      -- Create profile
      INSERT INTO public.profiles (
        id,
        display_name,
        bio,
        points,
        referral_code,
        referred_by,
        user_type,
        created_at,
        updated_at
      ) VALUES (
        user_record.id,
        COALESCE(user_record.full_name, SPLIT_PART(user_record.email, '@', 1)),
        '',
        10, -- Initial points
        new_referral_code,
        referrer_id,
        COALESCE(user_record.user_type, 'member'),
        user_record.created_at,
        NOW()
      );
      
      RAISE NOTICE '  ✓ Profile created';
      
      -- If supporter, create supporter record
      IF COALESCE(user_record.user_type, 'member') = 'supporter' THEN
        INSERT INTO public.supporters (
          id,
          email,
          name,
          referred_by,
          auth_user_id,
          created_at,
          updated_at
        ) VALUES (
          user_record.id,
          user_record.email,
          COALESCE(user_record.full_name, SPLIT_PART(user_record.email, '@', 1)),
          referrer_id,
          user_record.id,
          user_record.created_at,
          NOW()
        );
        
        RAISE NOTICE '  ✓ Supporter record created';
      END IF;
      
      -- Award points to referrer if exists
      IF referrer_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET points = points + 10 
        WHERE id = referrer_id;
        
        RAISE NOTICE '  ✓ Awarded 10 points to referrer';
        
        -- Create activity record
        INSERT INTO public.activities (user_id, activity_type, points_earned, description)
        VALUES (
          referrer_id,
          'referral',
          10,
          'Indicou ' || COALESCE(user_record.full_name, user_record.email)
        );
        
        RAISE NOTICE '  ✓ Activity record created';
      END IF;
      
      users_fixed := users_fixed + 1;
      RAISE NOTICE '  ✅ User fixed successfully';
      RAISE NOTICE '';
      
    EXCEPTION WHEN OTHERS THEN
      users_failed := users_failed + 1;
      RAISE NOTICE '  ❌ ERROR: %', SQLERRM;
      RAISE NOTICE '';
    END;
  END LOOP;
  
  RAISE NOTICE '=== RECOVERY COMPLETE ===';
  RAISE NOTICE 'Users fixed: %', users_fixed;
  RAISE NOTICE 'Users failed: %', users_failed;
  RAISE NOTICE '';
END $$;

-- Verify the fix
SELECT 
  'AFTER FIX' as status,
  COUNT(*) as total_auth_users,
  COUNT(p.id) as users_with_profiles,
  COUNT(*) - COUNT(p.id) as users_without_profiles
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id;
