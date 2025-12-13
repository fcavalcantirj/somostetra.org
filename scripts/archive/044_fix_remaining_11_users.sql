-- Fix remaining 11 broken users
DO $$
DECLARE
  fixed_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== FIXING REMAINING 11 USERS ===';

  BEGIN
    INSERT INTO public.profiles (id, display_name, user_type, points, referral_code, referred_by, created_at, updated_at)
    VALUES ('14836f3b-e2fa-4857-a5ff-ca13d979cca6', 'Candida', 'member', 10, public.generate_referral_code(), '4e7baf83-faa6-4696-82c8-f175dfef4fa4', '2025-10-12 21:52:38.099252+00', NOW());
    fixed_count := fixed_count + 1;
    RAISE NOTICE 'Fixed: candidamoliveira55@gmail.com';
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Failed candidamoliveira55: %', SQLERRM; END;

  BEGIN
    INSERT INTO public.profiles (id, display_name, user_type, points, referral_code, referred_by, created_at, updated_at)
    VALUES ('43400e53-a00f-460d-a428-802dde6fee73', 'LEONARDO CIMON SIMOES DE ARAUJO', 'supporter', 10, public.generate_referral_code(), '500ef052-55fb-492d-a98c-940c3e4196c0', '2025-10-12 22:39:29.408121+00', NOW());
    INSERT INTO public.supporters (auth_user_id, email, name, referred_by, created_at, updated_at)
    VALUES ('43400e53-a00f-460d-a428-802dde6fee73', 'leonardosimoes@hotmail.com', 'LEONARDO CIMON SIMOES DE ARAUJO', '500ef052-55fb-492d-a98c-940c3e4196c0', '2025-10-12 22:39:29.408121+00', NOW()) ON CONFLICT (auth_user_id) DO NOTHING;
    UPDATE public.profiles SET points = points + 10 WHERE id = '500ef052-55fb-492d-a98c-940c3e4196c0';
    fixed_count := fixed_count + 1;
    RAISE NOTICE 'Fixed: leonardosimoes@hotmail.com';
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Failed leonardosimoes: %', SQLERRM; END;

  BEGIN
    INSERT INTO public.profiles (id, display_name, user_type, points, referral_code, referred_by, created_at, updated_at)
    VALUES ('b1d13965-91e8-4947-af7b-662083aa5396', 'Daise Carla', 'member', 10, public.generate_referral_code(), '500ef052-55fb-492d-a98c-940c3e4196c0', '2025-10-12 22:45:38.650954+00', NOW());
    UPDATE public.profiles SET points = points + 10 WHERE id = '500ef052-55fb-492d-a98c-940c3e4196c0';
    fixed_count := fixed_count + 1;
    RAISE NOTICE 'Fixed: daise.brandao12@gmail.com';
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Failed daise: %', SQLERRM; END;

  BEGIN
    INSERT INTO public.profiles (id, display_name, user_type, points, referral_code, referred_by, created_at, updated_at)
    VALUES ('f9413ae0-243e-4508-a730-041decf2f3e1', 'Paulo', 'member', 10, public.generate_referral_code(), '4e7baf83-faa6-4696-82c8-f175dfef4fa4', '2025-10-12 22:46:05.08104+00', NOW());
    UPDATE public.profiles SET points = points + 10 WHERE id = '4e7baf83-faa6-4696-82c8-f175dfef4fa4';
    fixed_count := fixed_count + 1;
    RAISE NOTICE 'Fixed: tsujimotopaulo@gmail.com';
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Failed tsujimotopaulo: %', SQLERRM; END;

  BEGIN
    INSERT INTO public.profiles (id, display_name, user_type, points, referral_code, referred_by, created_at, updated_at)
    VALUES ('28d580c6-d505-47ef-84ad-1dca83aac675', 'Eliane Borges Vaz', 'supporter', 10, public.generate_referral_code(), '4e7baf83-faa6-4696-82c8-f175dfef4fa4', '2025-10-13 19:31:16.888595+00', NOW());
    INSERT INTO public.supporters (auth_user_id, email, name, referred_by, created_at, updated_at)
    VALUES ('28d580c6-d505-47ef-84ad-1dca83aac675', 'vaz.elianeborges@gmail.com', 'Eliane Borges Vaz', '4e7baf83-faa6-4696-82c8-f175dfef4fa4', '2025-10-13 19:31:16.888595+00', NOW()) ON CONFLICT (auth_user_id) DO NOTHING;
    UPDATE public.profiles SET points = points + 10 WHERE id = '4e7baf83-faa6-4696-82c8-f175dfef4fa4';
    fixed_count := fixed_count + 1;
    RAISE NOTICE 'Fixed: vaz.elianeborges@gmail.com';
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Failed vaz: %', SQLERRM; END;

  BEGIN
    INSERT INTO public.profiles (id, display_name, user_type, points, referral_code, referred_by, created_at, updated_at)
    VALUES ('39ea39d7-4bcb-4d8d-9568-f8059aba7fd1', 'Frederico Lapenda', 'supporter', 10, public.generate_referral_code(), '4e7baf83-faa6-4696-82c8-f175dfef4fa4', '2025-10-14 18:48:01.547599+00', NOW());
    INSERT INTO public.supporters (auth_user_id, email, name, referred_by, created_at, updated_at)
    VALUES ('39ea39d7-4bcb-4d8d-9568-f8059aba7fd1', 'rico@lapenda.net', 'Frederico Lapenda', '4e7baf83-faa6-4696-82c8-f175dfef4fa4', '2025-10-14 18:48:01.547599+00', NOW()) ON CONFLICT (auth_user_id) DO NOTHING;
    UPDATE public.profiles SET points = points + 10 WHERE id = '4e7baf83-faa6-4696-82c8-f175dfef4fa4';
    fixed_count := fixed_count + 1;
    RAISE NOTICE 'Fixed: rico@lapenda.net';
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Failed rico: %', SQLERRM; END;

  BEGIN
    INSERT INTO public.profiles (id, display_name, user_type, points, referral_code, referred_by, created_at, updated_at)
    VALUES ('ee42f60e-9f9a-439a-a431-4d8783656a3c', 'Alfonso', 'supporter', 10, public.generate_referral_code(), '4e7baf83-faa6-4696-82c8-f175dfef4fa4', '2025-10-14 18:55:31.477643+00', NOW());
    INSERT INTO public.supporters (auth_user_id, email, name, referred_by, created_at, updated_at)
    VALUES ('ee42f60e-9f9a-439a-a431-4d8783656a3c', 'aperezsoto@gmail.com', 'Alfonso', '4e7baf83-faa6-4696-82c8-f175dfef4fa4', '2025-10-14 18:55:31.477643+00', NOW()) ON CONFLICT (auth_user_id) DO NOTHING;
    UPDATE public.profiles SET points = points + 10 WHERE id = '4e7baf83-faa6-4696-82c8-f175dfef4fa4';
    fixed_count := fixed_count + 1;
    RAISE NOTICE 'Fixed: aperezsoto@gmail.com';
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Failed aperezsoto: %', SQLERRM; END;

  BEGIN
    INSERT INTO public.profiles (id, display_name, user_type, points, referral_code, referred_by, created_at, updated_at)
    VALUES ('9a83fd80-e02e-4796-86b7-0003c1a4961c', 'Jucieli', 'member', 10, public.generate_referral_code(), '500ef052-55fb-492d-a98c-940c3e4196c0', '2025-10-14 20:18:27.523649+00', NOW());
    UPDATE public.profiles SET points = points + 10 WHERE id = '500ef052-55fb-492d-a98c-940c3e4196c0';
    fixed_count := fixed_count + 1;
    RAISE NOTICE 'Fixed: jucielirodrigues82@gmail.com';
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Failed jucielirodrigues82: %', SQLERRM; END;

  BEGIN
    INSERT INTO public.profiles (id, display_name, user_type, points, referral_code, referred_by, created_at, updated_at)
    VALUES ('5f9d39b7-b6d5-452c-94a0-4bc10e97d508', 'Marcelo', 'supporter', 10, public.generate_referral_code(), '4e7baf83-faa6-4696-82c8-f175dfef4fa4', '2025-10-14 23:46:39.025169+00', NOW());
    INSERT INTO public.supporters (auth_user_id, email, name, referred_by, created_at, updated_at)
    VALUES ('5f9d39b7-b6d5-452c-94a0-4bc10e97d508', 'mviannacruz@yahoo.it', 'Marcelo', '4e7baf83-faa6-4696-82c8-f175dfef4fa4', '2025-10-14 23:46:39.025169+00', NOW()) ON CONFLICT (auth_user_id) DO NOTHING;
    UPDATE public.profiles SET points = points + 10 WHERE id = '4e7baf83-faa6-4696-82c8-f175dfef4fa4';
    fixed_count := fixed_count + 1;
    RAISE NOTICE 'Fixed: mviannacruz@yahoo.it';
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Failed mviannacruz: %', SQLERRM; END;

  BEGIN
    INSERT INTO public.profiles (id, display_name, user_type, points, referral_code, referred_by, created_at, updated_at)
    VALUES ('17e2e44d-ce20-40b5-912f-8ad61c7991e9', 'Victor Wolkers', 'supporter', 10, public.generate_referral_code(), '500ef052-55fb-492d-a98c-940c3e4196c0', '2025-10-15 15:11:50.4334+00', NOW());
    INSERT INTO public.supporters (auth_user_id, email, name, referred_by, created_at, updated_at)
    VALUES ('17e2e44d-ce20-40b5-912f-8ad61c7991e9', 'vicwolk@gmail.com', 'Victor Wolkers', '500ef052-55fb-492d-a98c-940c3e4196c0', '2025-10-15 15:11:50.4334+00', NOW()) ON CONFLICT (auth_user_id) DO NOTHING;
    UPDATE public.profiles SET points = points + 10 WHERE id = '500ef052-55fb-492d-a98c-940c3e4196c0';
    fixed_count := fixed_count + 1;
    RAISE NOTICE 'Fixed: vicwolk@gmail.com';
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Failed vicwolk: %', SQLERRM; END;

  BEGIN
    INSERT INTO public.profiles (id, display_name, user_type, points, referral_code, referred_by, created_at, updated_at)
    VALUES ('475f49cc-31fa-4461-a393-484c23a2be4f', 'Ricardo Pedrosa', 'supporter', 10, public.generate_referral_code(), '500ef052-55fb-492d-a98c-940c3e4196c0', '2025-10-15 15:23:48.538817+00', NOW());
    INSERT INTO public.supporters (auth_user_id, email, name, referred_by, created_at, updated_at)
    VALUES ('475f49cc-31fa-4461-a393-484c23a2be4f', 'ricardo.pedrosa@msn.com', 'Ricardo Pedrosa', '500ef052-55fb-492d-a98c-940c3e4196c0', '2025-10-15 15:23:48.538817+00', NOW()) ON CONFLICT (auth_user_id) DO NOTHING;
    UPDATE public.profiles SET points = points + 10 WHERE id = '500ef052-55fb-492d-a98c-940c3e4196c0';
    fixed_count := fixed_count + 1;
    RAISE NOTICE 'Fixed: ricardo.pedrosa@msn.com';
  EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Failed ricardo: %', SQLERRM; END;

  RAISE NOTICE 'COMPLETE: Fixed % users', fixed_count;
END $$;

SELECT CASE WHEN COUNT(*) = 0 THEN 'SUCCESS! ALL USERS FIXED!' ELSE COUNT(*)::text || ' users still broken' END as result
FROM auth.users au LEFT JOIN public.profiles p ON p.id = au.id WHERE p.id IS NULL;
