-- Drop existing type if it exists to make script idempotent
DROP TYPE IF EXISTS user_type CASCADE;

-- Add user_type to distinguish members from supporters
CREATE TYPE user_type AS ENUM ('member', 'supporter');

-- Add user_type to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_type user_type DEFAULT 'member';

-- Add auth_user_id to supporters table to link to auth.users
ALTER TABLE public.supporters
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create unique index on auth_user_id
DROP INDEX IF EXISTS supporters_auth_user_id_idx;
CREATE UNIQUE INDEX supporters_auth_user_id_idx ON public.supporters(auth_user_id);

-- Consolidated handle_new_user to handle both members and supporters
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_type_value TEXT;
  referrer_id UUID;
BEGIN
  -- Get user type from metadata (default to 'member')
  user_type_value := COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'member');
  referrer_id := (NEW.raw_user_meta_data ->> 'referred_by')::UUID;
  
  IF user_type_value = 'member' THEN
    -- Create profile for member
    INSERT INTO public.profiles (id, display_name, referral_code, referred_by, user_type)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
      generate_referral_code(),
      referrer_id,
      'member'
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
      COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
      NEW.email,
      NEW.raw_user_meta_data ->> 'phone',
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
        'Convidou ' || COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)) || ' como apoiador'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Drop existing policies to make script idempotent
DROP POLICY IF EXISTS "Supporters can view own data" ON public.supporters;
DROP POLICY IF EXISTS "Admins can view all supporters" ON public.supporters;
DROP POLICY IF EXISTS "Admins can update supporters" ON public.supporters;
DROP POLICY IF EXISTS "Admins can delete supporters" ON public.supporters;

-- RLS policies for supporters table
ALTER TABLE public.supporters ENABLE ROW LEVEL SECURITY;

-- Supporters can read their own data
CREATE POLICY "Supporters can view own data"
  ON public.supporters
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Admins can view all supporters
CREATE POLICY "Admins can view all supporters"
  ON public.supporters
  FOR SELECT
  TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true);

-- Admins can update supporters
CREATE POLICY "Admins can update supporters"
  ON public.supporters
  FOR UPDATE
  TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true);

-- Admins can delete supporters
CREATE POLICY "Admins can delete supporters"
  ON public.supporters
  FOR DELETE
  TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true);

-- Grant permissions
GRANT SELECT ON public.supporters TO authenticated;
GRANT UPDATE, DELETE ON public.supporters TO authenticated;

-- Add indexes for performance
DROP INDEX IF EXISTS supporters_referred_by_idx;
DROP INDEX IF EXISTS supporters_email_idx;
CREATE INDEX supporters_referred_by_idx ON public.supporters(referred_by);
CREATE INDEX supporters_email_idx ON public.supporters(email);

-- Add comments
COMMENT ON COLUMN public.supporters.auth_user_id IS 'Links supporter to auth.users for authentication';
COMMENT ON COLUMN public.profiles.user_type IS 'Distinguishes between members (tetraplégicos) and supporters (apoiadores)';
