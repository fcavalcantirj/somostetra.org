-- Fix supporters who don't have profiles (causing "Configuração Pendente" message)
-- This happens when the handle_new_user() trigger fails silently

-- First, let's see which supporters are missing profiles
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM public.supporters s
  LEFT JOIN public.profiles p ON s.auth_user_id = p.id
  WHERE p.id IS NULL;
  
  RAISE NOTICE 'Found % supporters without profiles', missing_count;
END $$;

-- Create profiles for supporters who are missing them
DO $$
DECLARE
  supporter_record RECORD;
  new_referral_code TEXT;
BEGIN
  FOR supporter_record IN 
    SELECT 
      s.auth_user_id, 
      s.name, 
      s.email,
      s.referred_by,
      s.created_at
    FROM public.supporters s
    LEFT JOIN public.profiles p ON s.auth_user_id = p.id
    WHERE p.id IS NULL
  LOOP
    -- Generate a unique referral code
    new_referral_code := public.generate_referral_code();
    
    -- Create profile for supporter
    INSERT INTO public.profiles (
      id, 
      display_name, 
      bio, 
      referral_code, 
      referred_by, 
      user_type,
      created_at,
      updated_at
    )
    VALUES (
      supporter_record.auth_user_id,
      supporter_record.name,
      'Apoiador da comunidade',
      new_referral_code,
      supporter_record.referred_by,
      'supporter'::public.user_type,
      supporter_record.created_at,
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created profile for supporter: % (email: %)', 
      supporter_record.name, 
      supporter_record.email;
  END LOOP;
END $$;

-- Verify the fix
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM public.supporters s
  LEFT JOIN public.profiles p ON s.auth_user_id = p.id
  WHERE p.id IS NULL;
  
  IF remaining_count = 0 THEN
    RAISE NOTICE 'SUCCESS: All supporters now have profiles';
  ELSE
    RAISE WARNING 'WARNING: Still % supporters without profiles', remaining_count;
  END IF;
END $$;
