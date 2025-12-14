-- ============================================================================
-- SOMOSTETRA.ORG - GOLDEN SCHEMA
-- ============================================================================
-- Consolidated database schema extracted from production on 2024-12-12
-- Updated 2024-12-14: Added wishes system (migration 055)
-- This file is the single source of truth for the database structure.
--
-- Contents:
--   1. Extensions
--   2. Enums
--   3. Tables (11 total: profiles, supporters, votes, user_votes, referrals,
--              badges, user_badges, activities, platform_statistics,
--              wish_categories, wishes)
--   4. Indexes
--   5. Functions (25 total)
--   6. Triggers (28 total)
--   7. RLS Policies (41 total)
--   8. Seed Data (badges, wish_categories)
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. ENUMS
-- ============================================================================
CREATE TYPE user_type AS ENUM ('member', 'supporter');
CREATE TYPE gender_type AS ENUM ('feminino', 'masculino', 'nao_binario', 'prefiro_nao_informar');
CREATE TYPE communication_preference AS ENUM ('email', 'whatsapp', 'sms', 'telefone');
CREATE TYPE asia_scale AS ENUM ('A', 'B', 'C', 'D', 'nao_sei');
CREATE TYPE wish_status AS ENUM ('pending', 'approved', 'fulfilled', 'rejected');

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- profiles: User profiles linked to auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  points INTEGER DEFAULT 0 CHECK (points >= 0),
  referral_code TEXT NOT NULL UNIQUE CHECK (length(TRIM(referral_code)) > 0),
  referred_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_type user_type DEFAULT 'member',
  is_admin BOOLEAN DEFAULT FALSE,

  -- Public profile URL slug (somostetra.org/p/username)
  username TEXT UNIQUE CHECK (username IS NULL OR (length(username) <= 100 AND username ~ '^[a-z0-9_]+$')),

  -- Contact information
  phone TEXT,
  gender gender_type,
  preferred_communication communication_preference,

  -- Location (Brazilian addresses)
  city TEXT,
  state TEXT,
  cep TEXT CHECK (cep IS NULL OR cep ~ '^\d{5}-?\d{3}$'),

  -- Personal information
  date_of_birth DATE,

  -- Medical information (for members with spinal cord injury)
  injury_date DATE,
  injury_acquired BOOLEAN,
  asia_scale asia_scale,
  asia_recent_evaluation BOOLEAN,
  injury_level TEXT,

  -- Public profile settings
  pix_key TEXT,
  profile_picture_url TEXT,
  profile_completed BOOLEAN DEFAULT FALSE,
  profile_public BOOLEAN DEFAULT FALSE,
  bio_public BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_referral_profile CHECK (id <> referred_by)
);

-- supporters: Additional data for supporter-type users
CREATE TABLE supporters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  referred_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- votes: Voting topics/petitions
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL CHECK (length(TRIM(title)) > 0),
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'completed')),
  vote_count INTEGER DEFAULT 0 CHECK (vote_count >= 0),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_votes: Tracks which users voted on which votes
CREATE TABLE user_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote_id UUID NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vote_id)
);

-- referrals: Member-to-member referral tracking
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id),
  CONSTRAINT no_self_referral CHECK (referrer_id <> referred_id)
);

-- badges: Achievement badge definitions
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE CHECK (length(TRIM(name)) > 0),
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  points_required INTEGER NOT NULL CHECK (points_required > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_badges: Badges earned by users
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- activities: Activity log for point tracking
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  points INTEGER NOT NULL CHECK (points <> 0),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- platform_statistics: Aggregated platform metrics (singleton)
CREATE TABLE platform_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_members INTEGER NOT NULL DEFAULT 0,
  total_supporters INTEGER NOT NULL DEFAULT 0,
  total_votes INTEGER NOT NULL DEFAULT 0,
  total_votes_cast INTEGER DEFAULT 0,
  total_connections INTEGER NOT NULL DEFAULT 0,
  total_badges_earned INTEGER DEFAULT 0,
  total_wishes INTEGER DEFAULT 0,
  total_wishes_fulfilled INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one row in platform_statistics
CREATE UNIQUE INDEX platform_statistics_singleton_idx ON platform_statistics ((TRUE));

-- Insert initial statistics row
INSERT INTO platform_statistics (total_members, total_supporters, total_votes, total_connections)
VALUES (0, 0, 0, 0);

-- wish_categories: Admin-managed wish categories for statistics
CREATE TABLE wish_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT '📦',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- wishes: Member wishes/needs that can be fulfilled by community
CREATE TABLE wishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(TRIM(content)) > 0),
  status wish_status DEFAULT 'pending',
  -- Category assigned by admin when approving (for statistics)
  category_id UUID REFERENCES wish_categories(id) ON DELETE SET NULL,
  -- Fulfiller tracking
  fulfilled_at TIMESTAMPTZ,
  fulfiller_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  fulfiller_name TEXT,
  fulfiller_email TEXT,
  fulfiller_is_member BOOLEAN,
  fulfiller_points_awarded INTEGER DEFAULT 0,
  fulfilled_notes TEXT,
  -- Admin fields
  admin_notes TEXT,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- wish_help_requests table (supporters expressing interest in helping)
CREATE TABLE wish_help_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id UUID NOT NULL REFERENCES wishes(id) ON DELETE CASCADE,
  helper_name TEXT NOT NULL,
  helper_email TEXT NOT NULL,
  helper_phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- clinical_trial_notifications table (track notifications sent to members)
CREATE TABLE clinical_trial_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nct_id TEXT NOT NULL,
  trial_title TEXT NOT NULL,
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notified_by UUID NOT NULL REFERENCES profiles(id),  -- Admin who sent
  custom_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nct_id, member_id)  -- Prevent duplicate notifications
);

-- clinical_trial_searches table (track search queries for analytics/study)
CREATE TABLE clinical_trial_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_conditions TEXT[] NOT NULL,          -- array of condition keywords searched
  query_status TEXT[],                       -- status filters applied (RECRUITING, etc.)
  query_phase TEXT[],                        -- phase filters applied
  query_location_state TEXT,                 -- Brazilian state if selected
  query_distance INTEGER,                    -- distance in miles if location search
  brazil_only BOOLEAN DEFAULT FALSE,         -- if "Apenas Brasil" filter was active
  results_count INTEGER,                     -- number of results returned
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

-- profiles indexes
CREATE INDEX idx_profiles_points ON profiles (points DESC);
CREATE INDEX idx_profiles_referral_code ON profiles (referral_code);
CREATE INDEX idx_profiles_referred_by ON profiles (referred_by);
CREATE INDEX idx_profiles_created_at ON profiles (created_at DESC);
CREATE INDEX idx_profiles_email ON profiles (id);
CREATE INDEX idx_profiles_username ON profiles (username) WHERE username IS NOT NULL;

-- supporters indexes
CREATE INDEX supporters_email_idx ON supporters (email);
CREATE UNIQUE INDEX supporters_email_lower_idx ON supporters (LOWER(email));
CREATE INDEX supporters_referred_by_idx ON supporters (referred_by);
CREATE INDEX idx_supporters_created_at ON supporters (created_at DESC);

-- votes indexes
CREATE INDEX idx_votes_status ON votes (status);
CREATE INDEX idx_votes_category ON votes (category);
CREATE INDEX idx_votes_created_by ON votes (created_by);
CREATE INDEX idx_votes_created_at ON votes (created_at DESC);
CREATE INDEX idx_votes_vote_count ON votes (vote_count DESC);
CREATE INDEX idx_votes_status_created_at ON votes (status, created_at DESC);
CREATE INDEX idx_votes_title_creator ON votes (title, created_by);

-- user_votes indexes
CREATE INDEX idx_user_votes_user_id ON user_votes (user_id);
CREATE INDEX idx_user_votes_vote_id ON user_votes (vote_id);

-- referrals indexes
CREATE INDEX idx_referrals_referrer_id ON referrals (referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals (referred_id);
CREATE INDEX idx_referrals_created_at ON referrals (created_at DESC);

-- badges indexes
CREATE INDEX idx_badges_name ON badges (name);
CREATE INDEX idx_badges_points_required ON badges (points_required);

-- user_badges indexes
CREATE INDEX idx_user_badges_user_id ON user_badges (user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges (badge_id);
CREATE INDEX idx_user_badges_earned_at ON user_badges (earned_at DESC);

-- activities indexes
CREATE INDEX idx_activities_user_id ON activities (user_id);
CREATE INDEX idx_activities_activity_type ON activities (activity_type);
CREATE INDEX idx_activities_created_at ON activities (created_at DESC);
CREATE INDEX idx_activities_user_type ON activities (user_id, activity_type);

-- wishes indexes
CREATE INDEX idx_wishes_user_id ON wishes (user_id);
CREATE INDEX idx_wishes_status ON wishes (status);
CREATE INDEX idx_wishes_status_created_at ON wishes (status, created_at DESC);
CREATE INDEX idx_wishes_category_id ON wishes (category_id);
CREATE INDEX idx_wishes_fulfiller_user_id ON wishes (fulfiller_user_id);

-- CONSTRAINT: Only ONE active wish per member (pending or approved)
CREATE UNIQUE INDEX idx_wishes_one_active_per_user
  ON wishes (user_id)
  WHERE status IN ('pending', 'approved');

-- CONSTRAINT: Prevent exact duplicate content per user
CREATE UNIQUE INDEX idx_wishes_unique_content_per_user
  ON wishes (user_id, md5(content))
  WHERE status != 'rejected';

-- wish_help_requests indexes
CREATE INDEX idx_wish_help_requests_wish_id ON wish_help_requests(wish_id);
CREATE INDEX idx_wish_help_requests_status ON wish_help_requests(status);
CREATE INDEX idx_wish_help_requests_created_at ON wish_help_requests(created_at DESC);

-- clinical_trial_notifications indexes
CREATE INDEX idx_ctn_member_id ON clinical_trial_notifications(member_id);
CREATE INDEX idx_ctn_nct_id ON clinical_trial_notifications(nct_id);
CREATE INDEX idx_ctn_sent_at ON clinical_trial_notifications(sent_at DESC);

-- clinical_trial_searches indexes
CREATE INDEX idx_clinical_searches_user ON clinical_trial_searches(user_id);
CREATE INDEX idx_clinical_searches_date ON clinical_trial_searches(created_at DESC);

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

-- Generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  code TEXT;
  attempts INT := 0;
  max_attempts INT := 10;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = code) THEN
      RETURN code;
    END IF;
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Check if user is admin
CREATE OR REPLACE FUNCTION check_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN (SELECT is_admin FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- Increment user points
CREATE OR REPLACE FUNCTION increment_user_points(user_id UUID, points_to_add INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  UPDATE public.profiles
  SET points = points + points_to_add, updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Check and award badges based on points
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_points INTEGER;
  v_badge RECORD;
BEGIN
  SELECT points INTO v_user_points FROM public.profiles WHERE id = p_user_id;
  IF v_user_points IS NULL THEN RETURN; END IF;

  FOR v_badge IN
    SELECT b.id, b.name, b.points_required
    FROM public.badges b
    WHERE b.points_required <= v_user_points
      AND NOT EXISTS (
        SELECT 1 FROM public.user_badges ub
        WHERE ub.user_id = p_user_id AND ub.badge_id = b.id
      )
    ORDER BY b.points_required ASC
  LOOP
    INSERT INTO public.user_badges (user_id, badge_id)
    VALUES (p_user_id, v_badge.id)
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END LOOP;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in check_and_award_badges for user %: %', p_user_id, SQLERRM;
END;
$$;

-- Trigger function for badge checking on points update
CREATE OR REPLACE FUNCTION trigger_check_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.points > OLD.points THEN
    PERFORM public.check_and_award_badges(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Handle new user signup (called from auth.users trigger)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  user_type_val TEXT;
  referrer_id UUID;
  new_referral_code TEXT;
  retry_count INT := 0;
  max_retries INT := 5;
BEGIN
  RAISE NOTICE '[handle_new_user] Starting for user: % (email: %)', NEW.id, NEW.email;

  user_type_val := COALESCE(NEW.raw_user_meta_data->>'user_type', 'supporter');
  referrer_id := (NEW.raw_user_meta_data->>'referred_by')::UUID;

  -- Generate unique referral code
  LOOP
    new_referral_code := public.generate_referral_code();
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code) THEN
      EXIT;
    END IF;
    retry_count := retry_count + 1;
    IF retry_count >= max_retries THEN
      RAISE EXCEPTION '[handle_new_user] Failed to generate unique referral code';
    END IF;
  END LOOP;

  -- Create profile for ALL users
  BEGIN
    INSERT INTO public.profiles (
      id, display_name, user_type, points, referral_code, referred_by, created_at, updated_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      user_type_val::user_type,
      10,
      new_referral_code,
      referrer_id,
      NOW(),
      NOW()
    );
  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE '[handle_new_user] Profile already exists, skipping';
    WHEN OTHERS THEN
      RAISE WARNING '[handle_new_user] Failed to create profile: %', SQLERRM;
      RAISE;
  END;

  -- If supporter, also create supporter record
  IF user_type_val = 'supporter' THEN
    BEGIN
      INSERT INTO public.supporters (
        id, auth_user_id, email, name, referred_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        referrer_id,
        NOW(),
        NOW()
      );
    EXCEPTION
      WHEN unique_violation THEN
        RAISE NOTICE '[handle_new_user] Supporter record already exists';
      WHEN OTHERS THEN
        RAISE WARNING '[handle_new_user] Failed to create supporter: %', SQLERRM;
    END;
  END IF;

  -- Award points to referrer
  IF referrer_id IS NOT NULL THEN
    UPDATE public.profiles SET points = points + 10 WHERE id = referrer_id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '[handle_new_user] CRITICAL ERROR: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Update vote count when user votes
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.votes SET vote_count = vote_count + 1 WHERE id = NEW.vote_id;
    INSERT INTO public.activities (user_id, activity_type, points, description)
    VALUES (NEW.user_id, 'vote', 5, 'Votou em uma pauta');
    UPDATE public.profiles SET points = points + 5 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.votes SET vote_count = vote_count - 1 WHERE id = OLD.vote_id;
    INSERT INTO public.activities (user_id, activity_type, points, description)
    VALUES (OLD.user_id, 'vote_removed', -5, 'Removeu voto de uma pauta');
    UPDATE public.profiles SET points = points - 5 WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Normalize supporter email to lowercase
CREATE OR REPLACE FUNCTION normalize_supporter_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.email = LOWER(TRIM(NEW.email));
  RETURN NEW;
END;
$$;

-- Statistics increment/decrement functions
CREATE OR REPLACE FUNCTION increment_members()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.user_type = 'member' THEN
    UPDATE platform_statistics SET total_members = total_members + 1 WHERE TRUE;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_members()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.user_type = 'member' THEN
    UPDATE platform_statistics SET total_members = GREATEST(0, total_members - 1) WHERE TRUE;
  END IF;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION increment_supporters()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE platform_statistics SET total_supporters = total_supporters + 1 WHERE TRUE;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_supporters()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE platform_statistics SET total_supporters = GREATEST(0, total_supporters - 1) WHERE TRUE;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION increment_votes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE platform_statistics SET total_votes = total_votes + 1 WHERE TRUE;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_votes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE platform_statistics SET total_votes = GREATEST(0, total_votes - 1) WHERE TRUE;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION increment_votes_cast()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.platform_statistics SET total_votes_cast = total_votes_cast + 1 WHERE TRUE;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_votes_cast()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.platform_statistics SET total_votes_cast = GREATEST(0, total_votes_cast - 1) WHERE TRUE;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION increment_connections()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE platform_statistics SET total_connections = total_connections + 1 WHERE TRUE;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_connections()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE platform_statistics SET total_connections = GREATEST(0, total_connections - 1) WHERE TRUE;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION increment_badges_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.platform_statistics SET total_badges_earned = total_badges_earned + 1 WHERE TRUE;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_badges_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.platform_statistics SET total_badges_earned = GREATEST(0, total_badges_earned - 1) WHERE TRUE;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION update_statistics_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE platform_statistics SET last_updated = NOW() WHERE TRUE;
  RETURN NEW;
END;
$$;

-- Wishes statistics functions
CREATE OR REPLACE FUNCTION increment_wishes()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE platform_statistics SET total_wishes = total_wishes + 1, last_updated = NOW() WHERE TRUE;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_wishes()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE platform_statistics SET total_wishes = GREATEST(0, total_wishes - 1), last_updated = NOW() WHERE TRUE;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION update_wishes_fulfilled()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'fulfilled' AND (OLD.status IS NULL OR OLD.status != 'fulfilled') THEN
    UPDATE platform_statistics SET total_wishes_fulfilled = total_wishes_fulfilled + 1, last_updated = NOW() WHERE TRUE;
  ELSIF OLD.status = 'fulfilled' AND NEW.status != 'fulfilled' THEN
    UPDATE platform_statistics SET total_wishes_fulfilled = GREATEST(0, total_wishes_fulfilled - 1), last_updated = NOW() WHERE TRUE;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Auth trigger (runs on auth.users insert)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Profile triggers
CREATE TRIGGER on_profile_insert
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION increment_members();

CREATE TRIGGER on_profile_delete
  AFTER DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION decrement_members();

CREATE TRIGGER on_points_change_check_badges
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_check_badges();

CREATE TRIGGER on_members_change
  AFTER INSERT OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_statistics_timestamp();

-- Supporter triggers
CREATE TRIGGER on_supporter_insert
  AFTER INSERT ON supporters
  FOR EACH ROW EXECUTE FUNCTION increment_supporters();

CREATE TRIGGER on_supporter_delete
  AFTER DELETE ON supporters
  FOR EACH ROW EXECUTE FUNCTION decrement_supporters();

CREATE TRIGGER normalize_supporter_email_trigger
  BEFORE INSERT OR UPDATE ON supporters
  FOR EACH ROW EXECUTE FUNCTION normalize_supporter_email();

CREATE TRIGGER on_supporters_change
  AFTER INSERT OR DELETE ON supporters
  FOR EACH ROW EXECUTE FUNCTION update_statistics_timestamp();

-- Vote triggers
CREATE TRIGGER on_vote_insert
  AFTER INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION increment_votes();

CREATE TRIGGER on_vote_delete
  AFTER DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION decrement_votes();

CREATE TRIGGER on_votes_change
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_statistics_timestamp();

-- User vote triggers
CREATE TRIGGER on_user_vote_change
  AFTER INSERT OR DELETE ON user_votes
  FOR EACH ROW EXECUTE FUNCTION update_vote_count();

CREATE TRIGGER trigger_increment_votes_cast
  AFTER INSERT ON user_votes
  FOR EACH ROW EXECUTE FUNCTION increment_votes_cast();

CREATE TRIGGER trigger_decrement_votes_cast
  AFTER DELETE ON user_votes
  FOR EACH ROW EXECUTE FUNCTION decrement_votes_cast();

-- Referral triggers
CREATE TRIGGER on_referral_insert
  AFTER INSERT ON referrals
  FOR EACH ROW EXECUTE FUNCTION increment_connections();

CREATE TRIGGER on_referral_delete
  AFTER DELETE ON referrals
  FOR EACH ROW EXECUTE FUNCTION decrement_connections();

CREATE TRIGGER on_referrals_change
  AFTER INSERT OR DELETE ON referrals
  FOR EACH ROW EXECUTE FUNCTION update_statistics_timestamp();

-- Badge triggers
CREATE TRIGGER increment_badges_count_trigger
  AFTER INSERT ON user_badges
  FOR EACH ROW EXECUTE FUNCTION increment_badges_count();

CREATE TRIGGER decrement_badges_count_trigger
  AFTER DELETE ON user_badges
  FOR EACH ROW EXECUTE FUNCTION decrement_badges_count();

-- Wishes triggers
CREATE TRIGGER on_wish_insert
  AFTER INSERT ON wishes
  FOR EACH ROW EXECUTE FUNCTION increment_wishes();

CREATE TRIGGER on_wish_delete
  AFTER DELETE ON wishes
  FOR EACH ROW EXECUTE FUNCTION decrement_wishes();

CREATE TRIGGER on_wish_status_change
  AFTER UPDATE ON wishes
  FOR EACH ROW EXECUTE FUNCTION update_wishes_fulfilled();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE supporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE wish_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wish_help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_trial_notifications ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON profiles FOR UPDATE
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = TRUE);

-- supporters policies
CREATE POLICY "Everyone can view supporters count" ON supporters FOR SELECT USING (TRUE);
CREATE POLICY "Supporters can view own data" ON supporters FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());
CREATE POLICY "Admins can view all supporters" ON supporters FOR SELECT TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = TRUE);
CREATE POLICY "System can insert supporters" ON supporters FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Admins can update supporters" ON supporters FOR UPDATE TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = TRUE);
CREATE POLICY "Admins can delete supporters" ON supporters FOR DELETE TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = TRUE);

-- votes policies
CREATE POLICY "Users can view all votes" ON votes FOR SELECT USING (TRUE);
CREATE POLICY "Only admins can create votes" ON votes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "Admins can update votes" ON votes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "Admins can delete votes" ON votes FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- user_votes policies
CREATE POLICY "Users can view all user votes" ON user_votes FOR SELECT USING (TRUE);
CREATE POLICY "Users can insert own votes" ON user_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON user_votes FOR DELETE USING (auth.uid() = user_id);

-- referrals policies
CREATE POLICY "Users can view all referrals" ON referrals FOR SELECT USING (TRUE);
CREATE POLICY "Users can insert referrals" ON referrals FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- badges policies
CREATE POLICY "Everyone can view badges" ON badges FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage badges" ON badges FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- user_badges policies
CREATE POLICY "Users can view all user badges" ON user_badges FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage user badges" ON user_badges FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- activities policies
CREATE POLICY "Users can view own activities" ON activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all activities" ON activities FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "Users can insert own activities" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- platform_statistics policies
CREATE POLICY "Anyone can view statistics" ON platform_statistics FOR SELECT USING (TRUE);

-- wish_categories policies
CREATE POLICY "Anyone can view active categories" ON wish_categories FOR SELECT
  USING (is_active = TRUE);
CREATE POLICY "Admins can manage categories" ON wish_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- wishes policies
CREATE POLICY "Anyone can view approved/fulfilled wishes" ON wishes FOR SELECT
  USING (status IN ('approved', 'fulfilled'));
CREATE POLICY "Users can view own wishes" ON wishes FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create own wishes" ON wishes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending wishes" ON wishes FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Users can delete own pending wishes" ON wishes FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins can manage all wishes" ON wishes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- wish_help_requests policies
CREATE POLICY "Anyone can submit help requests" ON wish_help_requests FOR INSERT
  WITH CHECK (TRUE);
CREATE POLICY "Admins can manage help requests" ON wish_help_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- clinical_trial_notifications policies
CREATE POLICY "Admins can manage trial notifications" ON clinical_trial_notifications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "Members can view own notifications" ON clinical_trial_notifications FOR SELECT
  USING (auth.uid() = member_id);

-- clinical_trial_searches policies
ALTER TABLE clinical_trial_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own searches" ON clinical_trial_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own searches" ON clinical_trial_searches FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all searches" ON clinical_trial_searches FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ============================================================================
-- 8. SEED DATA
-- ============================================================================

-- Insert default badges
INSERT INTO badges (name, description, icon, points_required) VALUES
  ('Primeiro Passo', 'Completou o cadastro na plataforma', '🎯', 1),
  ('Engajado', 'Alcançou 50 pontos de engajamento', '⭐', 50),
  ('Influenciador', 'Indicou 5 ou mais pessoas', '🌟', 100),
  ('Ativista', 'Votou em 10 ou mais pautas', '🗳️', 150),
  ('Líder Comunitário', 'Alcançou 500 pontos e é muito ativo', '👑', 500)
ON CONFLICT (name) DO NOTHING;

-- Insert default wish categories
INSERT INTO wish_categories (name, icon, description) VALUES
  ('Cadeira de Rodas', '🦽', 'Cadeiras de rodas manuais ou motorizadas'),
  ('Medicamento', '💊', 'Medicamentos e remédios'),
  ('Cateter', '🏥', 'Cateteres e materiais de sondagem'),
  ('Equipamento', '🔧', 'Equipamentos e adaptações'),
  ('Outro', '📦', 'Outros itens não categorizados')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- END OF GOLDEN SCHEMA
-- ============================================================================
