-- Fix handle_new_user to properly handle bio field and improve error handling
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
BEGIN
  -- Get user type from metadata (default to 'member')
  user_type_value := COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'member');
  referrer_id := (NEW.raw_user_meta_data ->> 'referred_by')::UUID;
  user_display_name := COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1));
  user_bio := NEW.raw_user_meta_data ->> 'bio';
  user_phone := NEW.raw_user_meta_data ->> 'phone';
  
  IF user_type_value = 'member' THEN
    -- Create profile for member with bio
    INSERT INTO public.profiles (id, display_name, bio, referral_code, referred_by, user_type)
    VALUES (
      NEW.id,
      user_display_name,
      user_bio,
      public.generate_referral_code(),
      referrer_id,
      'member'::public.user_type
    );
    
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
    END IF;
    
  ELSIF user_type_value = 'supporter' THEN
    -- Create supporter record
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
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Handles new user creation for both members and supporters, including bio field and proper error handling';
