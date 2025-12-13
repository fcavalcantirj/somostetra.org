-- Fix the handle_new_user trigger to default to "member" instead of "supporter"
-- This ensures that users without explicit user_type are created as members

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
  
  -- Default to "member" instead of "supporter" when user_type is not set
  user_type_val := COALESCE(NEW.raw_user_meta_data->>'user_type', 'member');
  RAISE NOTICE '[handle_new_user] User type: %', user_type_val;
  
  -- Get referrer ID from metadata
  referrer_id := (NEW.raw_user_meta_data->>'referred_by')::uuid;
  RAISE NOTICE '[handle_new_user] Referrer ID: %', COALESCE(referrer_id::text, 'none');
  
  -- Generate unique referral code with retry logic
  LOOP
    new_referral_code := public.generate_referral_code();
    
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code) THEN
      EXIT;
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
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', NEW.email),
      user_type_val,
      10,
      new_referral_code,
      referrer_id,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '[handle_new_user] ✓ Profile created successfully';
  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE '[handle_new_user] Profile already exists, skipping';
      RETURN NEW;
    WHEN OTHERS THEN
      RAISE WARNING '[handle_new_user] ❌ Failed to create profile: %', SQLERRM;
      RETURN NEW;
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
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', NEW.email),
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
    END;
  END IF;
  
  -- Award points to referrer if exists
  IF referrer_id IS NOT NULL THEN
    BEGIN
      UPDATE public.profiles 
      SET points = points + 10 
      WHERE id = referrer_id;
      
      RAISE NOTICE '[handle_new_user] ✓ Awarded 10 points to referrer';
      
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
    END;
  END IF;
  
  RAISE NOTICE '[handle_new_user] ✓ Completed successfully for user: %', NEW.id;
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '[handle_new_user] ❌ CRITICAL ERROR for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verification
SELECT 'Trigger recreated with correct default user_type (member)' as status;
