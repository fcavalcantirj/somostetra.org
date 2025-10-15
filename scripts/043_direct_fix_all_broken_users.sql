-- Direct SQL fix for all users without profiles
-- This script is safe, idempotent, and can be run multiple times

-- Step 1: Show what we're about to fix
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'user_type' as user_type,
  au.raw_user_meta_data->>'referred_by' as referred_by,
  au.raw_user_meta_data->>'display_name' as display_name,
  CASE 
    WHEN p.id IS NULL THEN '❌ NO PROFILE'
    ELSE '✅ HAS PROFILE'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- Step 2: Fix all broken users in one transaction
DO $$
DECLARE
  user_record RECORD;
  new_referral_code TEXT;
  user_type_value user_type; -- Changed from TEXT to user_type enum
  referrer_id_value UUID;
  display_name_value TEXT;
  rows_inserted INTEGER := 0;
  supporters_created INTEGER := 0;
BEGIN
  -- Loop through all users without profiles
  FOR user_record IN 
    SELECT 
      au.id,
      au.email,
      au.raw_user_meta_data->>'user_type' as metadata_user_type,
      (au.raw_user_meta_data->>'referred_by')::UUID as referred_by,
      au.raw_user_meta_data->>'display_name' as display_name,
      au.created_at
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL
  LOOP
    -- Cast text to user_type enum
    -- Determine user type (supporter or member)
    user_type_value := COALESCE(user_record.metadata_user_type, 'member')::user_type;
    referrer_id_value := user_record.referred_by;
    display_name_value := COALESCE(user_record.display_name, split_part(user_record.email, '@', 1));
    
    -- Generate unique referral code
    new_referral_code := upper(substring(md5(random()::text || user_record.id::text) from 1 for 8));
    
    -- Check if code exists and regenerate if needed (max 3 attempts)
    FOR i IN 1..3 LOOP
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code) THEN
        EXIT;
      END IF;
      new_referral_code := upper(substring(md5(random()::text || user_record.id::text || i::text) from 1 for 8));
    END LOOP;
    
    RAISE NOTICE '[FIX] Creating profile for % (%) as %', user_record.email, user_record.id, user_type_value;
    
    -- Insert profile
    INSERT INTO public.profiles (
      id,
      display_name,
      user_type,
      referral_code,
      referred_by,
      points,
      created_at,
      updated_at
    ) VALUES (
      user_record.id,
      display_name_value,
      user_type_value,
      new_referral_code,
      referrer_id_value,
      10, -- Initial points for signing up
      user_record.created_at,
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    GET DIAGNOSTICS rows_inserted = ROW_COUNT;
    
    IF rows_inserted > 0 THEN
      RAISE NOTICE '[FIX] ✓ Profile created for %', user_record.email;
      
      -- Cast enum to text for comparison
      -- If supporter, create supporter record
      IF user_type_value::text = 'supporter' THEN
        INSERT INTO public.supporters (
          auth_user_id,
          email,
          name,
          referred_by,
          created_at,
          updated_at
        ) VALUES (
          user_record.id,
          user_record.email,
          display_name_value,
          referrer_id_value,
          user_record.created_at,
          NOW()
        )
        ON CONFLICT (auth_user_id) DO NOTHING;
        
        GET DIAGNOSTICS supporters_created = ROW_COUNT;
        IF supporters_created > 0 THEN
          RAISE NOTICE '[FIX] ✓ Supporter record created for %', user_record.email;
        END IF;
      END IF;
      
      -- Cast enum to text for comparison
      -- Award points to referrer if exists
      IF referrer_id_value IS NOT NULL THEN
        UPDATE public.profiles 
        SET points = points + CASE WHEN user_type_value::text = 'supporter' THEN 10 ELSE 20 END
        WHERE id = referrer_id_value AND TRUE;
        
        RAISE NOTICE '[FIX] ✓ Awarded points to referrer for %', user_record.email;
      END IF;
      
      -- Log activity
      INSERT INTO public.activities (
        user_id,
        activity_type,
        points,
        description,
        created_at
      ) VALUES (
        user_record.id,
        'signup',
        10,
        'Usuário cadastrado (recuperado automaticamente)',
        user_record.created_at
      )
      ON CONFLICT DO NOTHING;
      
    ELSE
      RAISE NOTICE '[FIX] ⚠ Profile already exists for %', user_record.email;
    END IF;
    
  END LOOP;
  
  RAISE NOTICE '[FIX] ========================================';
  RAISE NOTICE '[FIX] Fix complete!';
  RAISE NOTICE '[FIX] ========================================';
  
END $$;

-- Step 3: Verify the fix
SELECT 
  'AFTER FIX' as status,
  COUNT(*) as users_without_profiles
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Step 4: Show all fixed users
SELECT 
  au.email,
  p.display_name,
  p.user_type,
  p.referral_code,
  CASE 
    WHEN s.id IS NOT NULL THEN '✅ Has Supporter Record'
    ELSE '❌ No Supporter Record'
  END as supporter_status,
  p.points,
  p.created_at
FROM auth.users au
JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.supporters s ON s.auth_user_id = au.id
WHERE au.created_at >= NOW() - INTERVAL '7 days'
ORDER BY au.created_at DESC;
