-- Fix handle_new_user trigger to be more robust and provide better error logging
-- This addresses the "Configuração Pendente" issue where profiles fail to be created

-- Improved generate_referral_code with better collision handling
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  code TEXT;
  attempts INT := 0;
  max_attempts INT := 10;
BEGIN
  LOOP
    -- Generate a random 8-character code
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if it exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = code) THEN
      RETURN code;
    END IF;
    
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      -- If we can't find a unique code after 10 attempts, make it longer
      code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Improved handle_new_user with better error handling and logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_type_value TEXT;
  referrer_id UUID;
  user_display_name TEXT;
  user_bio TEXT;
  user_phone TEXT;
  new_referral_code TEXT;
  retry_count INT := 0;
  max_retries INT := 3;
BEGIN
  -- Get user type from metadata (default to 'member')
  user_type_value := COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'member');
  referrer_id := (NEW.raw_user_meta_data ->> 'referred_by')::UUID;
  user_display_name := COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1));
  user_bio := NEW.raw_user_meta_data ->> 'bio';
  user_phone := NEW.raw_user_meta_data ->> 'phone';
  
  RAISE NOTICE '[handle_new_user] Processing user % with type %', NEW.id, user_type_value;
  
  IF user_type_value = 'member' THEN
    -- Generate referral code with retry logic
    LOOP
      BEGIN
        new_referral_code := public.generate_referral_code();
        
        -- Create profile for member with bio
        INSERT INTO public.profiles (id, display_name, bio, referral_code, referred_by, user_type)
        VALUES (
          NEW.id,
          user_display_name,
          user_bio,
          new_referral_code,
          referrer_id,
          'member'::public.user_type
        );
        
        RAISE NOTICE '[handle_new_user] Created member profile for %', NEW.id;
        EXIT; -- Success, exit loop
        
      EXCEPTION
        WHEN unique_violation THEN
          retry_count := retry_count + 1;
          IF retry_count >= max_retries THEN
            RAISE EXCEPTION '[handle_new_user] Failed to create profile after % retries for user %: %', max_retries, NEW.id, SQLERRM;
          END IF;
          RAISE NOTICE '[handle_new_user] Retrying profile creation (attempt %) for user %', retry_count, NEW.id;
      END;
    END LOOP;
    
    -- Award points for signing up
    INSERT INTO public.activities (user_id, activity_type, points, description)
    VALUES (NEW.id, 'signup', 10, 'Cadastro realizado');
    
    UPDATE public.profiles SET points = points + 10 WHERE id = NEW.id;
    
    -- If referred by someone, create referral record and award points
    IF referrer_id IS NOT NULL THEN
      INSERT INTO public.referrals (referrer_id, referred_id)
      VALUES (referrer_id, NEW.id);
      
      INSERT INTO public.activities (user_id, activity_type, points, description)
      VALUES (referrer_id, 'referral', 20, 'Indicou um novo membro');
      
      UPDATE public.profiles 
      SET points = points + 20 
      WHERE id = referrer_id;
      
      RAISE NOTICE '[handle_new_user] Awarded referral points to %', referrer_id;
    END IF;
    
  ELSIF user_type_value = 'supporter' THEN
    -- Generate referral code with retry logic
    LOOP
      BEGIN
        new_referral_code := public.generate_referral_code();
        
        -- Create profile for supporter so they can vote and participate
        INSERT INTO public.profiles (id, display_name, bio, referral_code, referred_by, user_type)
        VALUES (
          NEW.id,
          user_display_name,
          'Apoiador da comunidade',
          new_referral_code,
          referrer_id,
          'supporter'::public.user_type
        );
        
        RAISE NOTICE '[handle_new_user] Created supporter profile for %', NEW.id;
        EXIT; -- Success, exit loop
        
      EXCEPTION
        WHEN unique_violation THEN
          retry_count := retry_count + 1;
          IF retry_count >= max_retries THEN
            RAISE EXCEPTION '[handle_new_user] Failed to create profile after % retries for user %: %', max_retries, NEW.id, SQLERRM;
          END IF;
          RAISE NOTICE '[handle_new_user] Retrying profile creation (attempt %) for user %', retry_count, NEW.id;
      END;
    END LOOP;
    
    -- Create supporter record with additional info
    INSERT INTO public.supporters (
      auth_user_id,
      name,
      email,
      phone,
      referred_by
    ) VALUES (
      NEW.id,
      user_display_name,
      NEW.email,
      user_phone,
      referrer_id
    );
    
    RAISE NOTICE '[handle_new_user] Created supporter record for %', NEW.id;
    
    -- If referred by someone, award points to referrer
    IF referrer_id IS NOT NULL THEN
      -- Award 10 points for supporter referral
      UPDATE public.profiles 
      SET points = points + 10 
      WHERE id = referrer_id;
      
      -- Log activity
      INSERT INTO public.activities (user_id, activity_type, points, description)
      VALUES (
        referrer_id,
        'supporter_referral',
        10,
        'Convidou ' || user_display_name || ' como apoiador'
      );
      
      RAISE NOTICE '[handle_new_user] Awarded supporter referral points to %', referrer_id;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log detailed error information
    RAISE WARNING '[handle_new_user] ERROR for user % (type: %): % - %', NEW.id, user_type_value, SQLSTATE, SQLERRM;
    RAISE WARNING '[handle_new_user] Error detail: %', SQLERRM;
    RAISE WARNING '[handle_new_user] Error context: user_type=%, referrer_id=%, display_name=%', user_type_value, referrer_id, user_display_name;
    
    -- Don't fail the auth user creation, but log the error
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Handles new user creation for both members and supporters with improved error handling and retry logic for referral code generation.';

-- Diagnostic: Find users who have auth accounts but no profiles
SELECT 
  au.id as auth_user_id,
  au.email,
  au.created_at,
  au.raw_user_meta_data->>'user_type' as intended_type,
  au.raw_user_meta_data->>'display_name' as intended_name,
  CASE 
    WHEN p.id IS NULL THEN 'MISSING PROFILE'
    ELSE 'Has Profile'
  END as profile_status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.created_at > NOW() - INTERVAL '7 days'
ORDER BY au.created_at DESC;
