-- EMERGENCY FIX: Recreate handle_new_user trigger and fix all broken accounts
-- This script will:
-- 1. Check if the trigger exists
-- 2. Drop and recreate the trigger with proper error handling
-- 3. Create profiles for all users who don't have them
-- 4. Create supporter records for supporters who don't have them

-- ============================================================================
-- PART 1: Check current trigger status
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '=== CHECKING TRIGGER STATUS ===';
  
  -- Check if trigger exists
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE '✓ Trigger exists';
  ELSE
    RAISE NOTICE '❌ Trigger DOES NOT exist - this is the problem!';
  END IF;
  
  -- Check if function exists
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user'
  ) THEN
    RAISE NOTICE '✓ Function exists';
  ELSE
    RAISE NOTICE '❌ Function DOES NOT exist';
  END IF;
END $$;

-- ============================================================================
-- PART 2: Drop and recreate the trigger function with bulletproof logic
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  user_type_val text;
  referrer_id uuid;
  new_referral_code text;
  retry_count int := 0;
  max_retries int := 5;
BEGIN
  RAISE NOTICE '[handle_new_user] Starting for user: % (email: %)', NEW.id, NEW.email;
  
  -- Get user type from metadata
  user_type_val := COALESCE(NEW.raw_user_meta_data->>'user_type', 'supporter');
  RAISE NOTICE '[handle_new_user] User type: %', user_type_val;
  
  -- Get referrer ID from metadata
  referrer_id := (NEW.raw_user_meta_data->>'referred_by')::uuid;
  RAISE NOTICE '[handle_new_user] Referrer ID: %', COALESCE(referrer_id::text, 'none');
  
  -- Generate unique referral code with retry logic
  LOOP
    new_referral_code := public.generate_referral_code();
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code) THEN
      EXIT; -- Code is unique, exit loop
    END IF;
    
    retry_count := retry_count + 1;
    IF retry_count >= max_retries THEN
      RAISE EXCEPTION '[handle_new_user] Failed to generate unique referral code after % attempts', max_retries;
    END IF;
    
    RAISE NOTICE '[handle_new_user] Referral code collision, retry %/%', retry_count, max_retries;
  END LOOP;
  
  RAISE NOTICE '[handle_new_user] Generated referral code: %', new_referral_code;
  
  -- Create profile for ALL users (members and supporters)
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
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      user_type_val,
      10, -- Initial points
      new_referral_code,
      referrer_id,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '[handle_new_user] ✓ Profile created successfully';
  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE '[handle_new_user] Profile already exists, skipping';
    WHEN OTHERS THEN
      RAISE WARNING '[handle_new_user] ❌ Failed to create profile: %', SQLERRM;
      RAISE;
  END;
  
  -- If supporter, also create supporter record
  IF user_type_val = 'supporter' THEN
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
        uuid_generate_v4(),
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        referrer_id,
        NOW(),
        NOW()
      );
      
      RAISE NOTICE '[handle_new_user] ✓ Supporter record created successfully';
    EXCEPTION
      WHEN unique_violation THEN
        RAISE NOTICE '[handle_new_user] Supporter record already exists, skipping';
      WHEN OTHERS THEN
        RAISE WARNING '[handle_new_user] ❌ Failed to create supporter record: %', SQLERRM;
        RAISE;
    END;
  END IF;
  
  -- Award points to referrer if exists
  IF referrer_id IS NOT NULL THEN
    BEGIN
      UPDATE public.profiles 
      SET points = points + 10 
      WHERE id = referrer_id;
      
      RAISE NOTICE '[handle_new_user] ✓ Awarded 10 points to referrer';
      
      -- Create activity record
      INSERT INTO public.activities (
        user_id,
        type,
        description,
        points_earned,
        created_at
      ) VALUES (
        referrer_id,
        'referral',
        'Indicou um novo ' || CASE WHEN user_type_val = 'member' THEN 'membro' ELSE 'apoiador' END,
        10,
        NOW()
      );
      
      RAISE NOTICE '[handle_new_user] ✓ Activity record created';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '[handle_new_user] ❌ Failed to award referrer points: %', SQLERRM;
        -- Don't raise, this is not critical
    END;
  END IF;
  
  RAISE NOTICE '[handle_new_user] ✓ Completed successfully for user: %', NEW.id;
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '[handle_new_user] ❌ CRITICAL ERROR for user %: %', NEW.id, SQLERRM;
    RAISE WARNING '[handle_new_user] Stack trace: %', SQLSTATE;
    -- Return NEW anyway so auth user is created
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Wrap RAISE statement in DO block to fix syntax error
DO $$
BEGIN
  RAISE NOTICE '✓ Trigger recreated successfully';
END $$;

-- ============================================================================
-- PART 3: Fix all broken user accounts
-- ============================================================================

DO $$
DECLARE
  broken_user RECORD;
  new_code text;
  retry_count int;
  max_retries int := 5;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== FIXING BROKEN USER ACCOUNTS ===';
  
  -- Find all auth users without profiles
  FOR broken_user IN
    SELECT 
      au.id,
      au.email,
      au.created_at,
      au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL
    ORDER BY au.created_at DESC
  LOOP
    RAISE NOTICE '';
    RAISE NOTICE 'Fixing user: % (%)', broken_user.email, broken_user.id;
    
    -- Generate unique referral code
    retry_count := 0;
    LOOP
      new_code := public.generate_referral_code();
      
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_code) THEN
        EXIT;
      END IF;
      
      retry_count := retry_count + 1;
      IF retry_count >= max_retries THEN
        RAISE EXCEPTION 'Failed to generate unique code for %', broken_user.email;
      END IF;
    END LOOP;
    
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
        broken_user.id,
        COALESCE(broken_user.raw_user_meta_data->>'full_name', broken_user.email),
        COALESCE(broken_user.raw_user_meta_data->>'user_type', 'supporter'),
        10,
        new_code,
        (broken_user.raw_user_meta_data->>'referred_by')::uuid,
        broken_user.created_at,
        NOW()
      );
      
      RAISE NOTICE '  ✓ Profile created';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '  ❌ Failed to create profile: %', SQLERRM;
        CONTINUE;
    END;
    
    -- Create supporter record if needed
    IF COALESCE(broken_user.raw_user_meta_data->>'user_type', 'supporter') = 'supporter' THEN
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
          uuid_generate_v4(),
          broken_user.id,
          broken_user.email,
          COALESCE(broken_user.raw_user_meta_data->>'full_name', broken_user.email),
          (broken_user.raw_user_meta_data->>'referred_by')::uuid,
          broken_user.created_at,
          NOW()
        );
        
        RAISE NOTICE '  ✓ Supporter record created';
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING '  ❌ Failed to create supporter record: %', SQLERRM;
      END;
    END IF;
    
    -- Award referrer points if applicable
    IF (broken_user.raw_user_meta_data->>'referred_by')::uuid IS NOT NULL THEN
      BEGIN
        UPDATE public.profiles 
        SET points = points + 10 
        WHERE id = (broken_user.raw_user_meta_data->>'referred_by')::uuid;
        
        RAISE NOTICE '  ✓ Awarded referrer points';
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING '  ❌ Failed to award referrer points: %', SQLERRM;
      END;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== FIX COMPLETE ===';
END $$;

-- ============================================================================
-- PART 4: Verify the fix
-- ============================================================================

SELECT 
  'VERIFICATION' as section,
  COUNT(*) as total_auth_users,
  COUNT(p.id) as users_with_profiles,
  COUNT(*) - COUNT(p.id) as users_without_profiles
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id;
