-- SAFE FIX: Create missing profiles for users without them (CORRECTED VERSION)
-- Fixed: Now properly detects if INSERT succeeded using GET DIAGNOSTICS

SELECT 
  'BEFORE FIX' as status,
  COUNT(*) as users_without_profiles
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

BEGIN;

DO $$
DECLARE
  user_record RECORD;
  new_referral_code TEXT;
  rows_affected INTEGER;
  fixed_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== STARTING SAFE FIX (CORRECTED) ===';
  
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
    RAISE NOTICE '--- Processing: % (%)', user_record.email, user_record.id;
    
    -- Generate unique referral code
    new_referral_code := public.generate_referral_code();
    
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
        10,
        new_referral_code,
        user_record.referrer_id,
        user_record.created_at,
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
      
      -- Use GET DIAGNOSTICS to check if INSERT succeeded
      GET DIAGNOSTICS rows_affected = ROW_COUNT;
      
      IF rows_affected > 0 THEN
        RAISE NOTICE '    ✓ Profile created (type: %)', 
          CASE WHEN user_record.intended_type = 'supporter' THEN 'supporter' ELSE 'member' END;
        fixed_count := fixed_count + 1;
        
        -- If supporter, create supporter record
        IF user_record.intended_type = 'supporter' THEN
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
          
          GET DIAGNOSTICS rows_affected = ROW_COUNT;
          IF rows_affected > 0 THEN
            RAISE NOTICE '    ✓ Supporter record created';
          END IF;
        END IF;
        
        -- Award referrer points
        IF user_record.referrer_id IS NOT NULL THEN
          UPDATE public.profiles 
          SET points = points + 10, updated_at = NOW()
          WHERE id = user_record.referrer_id;
          
          GET DIAGNOSTICS rows_affected = ROW_COUNT;
          IF rows_affected > 0 THEN
            RAISE NOTICE '    ✓ Awarded 10 points to referrer';
            
            INSERT INTO public.activities (
              user_id, type, description, points, created_at
            ) VALUES (
              user_record.referrer_id,
              'referral',
              'Indicou ' || user_record.email,
              10,
              NOW()
            );
          END IF;
        END IF;
        
      ELSE
        RAISE NOTICE '    ⚠ Profile already exists (skipped)';
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '    ✗ Error: %', SQLERRM;
    END;
    
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== COMPLETE: Fixed % users ===', fixed_count;
  
END $$;

SELECT 
  'AFTER FIX' as status,
  COUNT(*) as users_without_profiles
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

COMMIT;
