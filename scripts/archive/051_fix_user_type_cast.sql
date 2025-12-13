-- Fix user_type enum casting in trigger
-- The profiles.user_type column is an ENUM, not text

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
      user_type_val::user_type,  -- FIXED: Cast text to user_type enum
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
        gen_random_uuid(),  -- Using gen_random_uuid() instead of uuid_generate_v4()
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

      -- Create activity record (skip if table doesn't exist)
      BEGIN
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
        WHEN undefined_table THEN
          RAISE NOTICE '[handle_new_user] Activities table does not exist, skipping activity record';
        WHEN OTHERS THEN
          RAISE NOTICE '[handle_new_user] Failed to create activity record: %', SQLERRM;
      END;
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

SELECT '✓ Trigger updated with user_type enum cast fix' as status;
