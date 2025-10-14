-- Add diagnostic RPC functions for the admin diagnostics page

-- Function to get auth users without profiles
CREATE OR REPLACE FUNCTION public.get_auth_users_without_profiles()
RETURNS TABLE (
  auth_user_id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  intended_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id as auth_user_id,
    au.email,
    au.created_at,
    au.raw_user_meta_data->>'user_type' as intended_type
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL
  AND au.created_at > NOW() - INTERVAL '30 days'
  ORDER BY au.created_at DESC;
END;
$$;

-- Function to find duplicate referral codes
CREATE OR REPLACE FUNCTION public.find_duplicate_referral_codes()
RETURNS TABLE (
  referral_code TEXT,
  count BIGINT,
  user_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.referral_code,
    COUNT(*)::BIGINT as count,
    ARRAY_AGG(p.id) as user_ids
  FROM public.profiles p
  WHERE p.referral_code IS NOT NULL
  GROUP BY p.referral_code
  HAVING COUNT(*) > 1;
END;
$$;

-- Function to find orphaned referrals
CREATE OR REPLACE FUNCTION public.find_orphaned_referrals()
RETURNS TABLE (
  referral_id UUID,
  referrer_id UUID,
  referred_id UUID,
  created_at TIMESTAMPTZ,
  issue TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id as referral_id,
    r.referrer_id,
    r.referred_id,
    r.created_at,
    CASE 
      WHEN p1.id IS NULL THEN 'Referrer does not exist'
      WHEN p2.id IS NULL THEN 'Referred user does not exist'
      ELSE 'Unknown issue'
    END as issue
  FROM public.referrals r
  LEFT JOIN public.profiles p1 ON r.referrer_id = p1.id
  LEFT JOIN public.profiles p2 ON r.referred_id = p2.id
  WHERE p1.id IS NULL OR p2.id IS NULL;
END;
$$;

COMMENT ON FUNCTION public.get_auth_users_without_profiles() IS 'Returns auth users created in the last 30 days who do not have profiles';
COMMENT ON FUNCTION public.find_duplicate_referral_codes() IS 'Finds referral codes that are used by multiple users';
COMMENT ON FUNCTION public.find_orphaned_referrals() IS 'Finds referral records where either the referrer or referred user does not exist';
