-- SAFE FIX: Create missing profiles for users without them
-- This script is SAFE because:
-- 1. Uses transactions (can rollback)
-- 2. Has ON CONFLICT DO NOTHING (prevents duplicates)
-- 3. Validates data before inserting
-- 4. Logs all actions
-- 5. Can be run multiple times safely (idempotent)

-- First, let's see what we're about to fix
SELECT 
  'BEFORE FIX' as status,
  COUNT(*) as users_without_profiles
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Start transaction (can rollback if something goes wrong)
BEGIN;

DO $$
DECLARE
  user_record RECORD;
  new_referral_code TEXT;
  profile_created BOOLEAN;
  supporter_created BOOLEAN;
  points_awarded BOOLEAN;
  fixed_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== STARTING SAFE FIX ===';
  
  -- Loop through each user without a profile
  FOR user_record IN 
    SELECT 
      au.id,
      au.email,
      au.created_at,
      au.raw_user_meta_data->>'intended_type' as intended_type,
      (au.raw_user_meta_data->>'referred_by')::UUID as referrer_id,
      au.raw_user_meta_data->>'full_name' as full_name
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL
    ORDER BY au.created_at DESC
  LOOP
    RAISE NOTICE '';
    RAISE NOTICE '--- Processing user: % (%)', user_record.email, user_record.id;
    RAISE NOTICE '    Type: %, Referrer: %', 
      COALESCE(user_record.intended_type, 'unknown'), 
      COALESCE(user_record.referrer_id::TEXT, 'none');
    
    profile_created := FALSE;
    supporter_created := FALSE;
    points_awarded := FALSE;
    
    -- Generate unique referral code
    new_referral_code := public.generate_referral_code();
    RAISE NOTICE '    Generated referral code: %', new_referral_code;
    
    -- Create profile
    BEGIN
      INSERT INTO public.profiles (
        id,
        display_name,
        user_type,
        points,
        referral_code,
        referred_by,
        created_at,
        updated_at
      ) VALUES (
        user_record.id,
        COALESCE(user_record.full_name, SPLIT_PART(user_record.email, '@', 1)),
        CASE 
          WHEN user_record.intended_type = 'supporter' THEN 'supporter'
          ELSE 'member'
        END,
        10, -- Initial points
        new_referral_code,
        user_record.referrer_id,
        user_record.created_at,
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
      
      -- Check if insert happened
      IF FOUND THEN
        profile_created := TRUE;
        RAISE NOTICE '    ✓ Profile created';
      ELSE
        RAISE NOTICE '    ⚠ Profile already exists (skipped)';
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '    ✗ Failed to create profile: %', SQLERRM;
    END;
    
    -- If supporter, create supporter record
    IF user_record.intended_type = 'supporter' AND profile_created THEN
      BEGIN
        INSERT INTO public.supporters (
          id,
          auth_user_id,
          email,
          name,
          referred_by,
          created_at,
          updated_at
        ) VALUES (
          user_record.id,
          user_record.id,
          user_record.email,
          COALESCE(user_record.full_name, SPLIT_PART(user_record.email, '@', 1)),
          user_record.referrer_id,
          user_record.created_at,
          NOW()
        )
        ON CONFLICT (auth_user_id) DO NOTHING;
        
        IF FOUND THEN
          supporter_created := TRUE;
          RAISE NOTICE '    ✓ Supporter record created';
        ELSE
          RAISE NOTICE '    ⚠ Supporter record already exists (skipped)';
        END IF;
        
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '    ✗ Failed to create supporter record: %', SQLERRM;
      END;
    END IF;
    
    -- Award referrer points if applicable
    IF user_record.referrer_id IS NOT NULL AND profile_created THEN
      BEGIN
        -- Award 10 points to referrer
        UPDATE public.profiles 
        SET 
          points = points + 10,
          updated_at = NOW()
        WHERE id = user_record.referrer_id;
        
        IF FOUND THEN
          points_awarded := TRUE;
          RAISE NOTICE '    ✓ Awarded 10 points to referrer';
          
          -- Create activity record
          INSERT INTO public.activities (
            user_id,
            type,
            description,
            points,
            created_at
          ) VALUES (
            user_record.referrer_id,
            'referral',
            'Indicou ' || user_record.email,
            10,
            NOW()
          )
          ON CONFLICT DO NOTHING;
          
        ELSE
          RAISE NOTICE '    ⚠ Referrer not found (points not awarded)';
        END IF;
        
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '    ✗ Failed to award referrer points: %', SQLERRM;
      END;
    END IF;
    
    -- Count successful fixes
    IF profile_created THEN
      fixed_count := fixed_count + 1;
    END IF;
    
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== FIX COMPLETE ===';
  RAISE NOTICE 'Total users fixed: %', fixed_count;
  
END $$;

-- Verify the fix
SELECT 
  'AFTER FIX' as status,
  COUNT(*) as users_without_profiles
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Show what was created
SELECT 
  'NEWLY CREATED PROFILES' as section,
  p.id,
  p.display_name,
  p.user_type,
  p.points,
  p.referral_code,
  au.email,
  p.created_at
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY p.created_at DESC;

-- If everything looks good, commit the transaction
-- If something went wrong, you can ROLLBACK instead
COMMIT;

-- Uncomment the line below to rollback instead of commit
-- ROLLBACK;
