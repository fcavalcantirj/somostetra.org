-- ============================================================================
-- MIGRATION: Add Profile Fields for Public Profiles & Profile Completion
-- ============================================================================
-- Run this in Supabase SQL Editor
-- Date: 2024-12-13
-- ============================================================================

-- ============================================================================
-- 1. CREATE NEW ENUMS
-- ============================================================================

-- Gender enum
CREATE TYPE gender_type AS ENUM ('feminino', 'masculino', 'nao_binario', 'prefiro_nao_informar');

-- Communication preference enum
CREATE TYPE communication_preference AS ENUM ('email', 'whatsapp', 'sms', 'telefone');

-- ASIA scale enum (spinal cord injury classification)
CREATE TYPE asia_scale AS ENUM ('A', 'B', 'C', 'D', 'nao_sei');

-- ============================================================================
-- 2. ADD NEW COLUMNS TO PROFILES TABLE
-- ============================================================================

-- Username for public profile URL (somostetra.org/p/username)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD CONSTRAINT username_format CHECK (
  username IS NULL OR (length(username) <= 100 AND username ~ '^[a-z0-9_]+$')
);

-- Contact information
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender gender_type;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_communication communication_preference;

-- Location (Brazilian addresses)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE profiles ADD CONSTRAINT cep_format CHECK (
  cep IS NULL OR cep ~ '^\d{5}-?\d{3}$'
);

-- Personal information
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Medical information (for members with spinal cord injury)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS injury_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS injury_acquired BOOLEAN;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS asia_scale asia_scale;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS asia_recent_evaluation BOOLEAN;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS injury_level TEXT;

-- Public profile settings
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pix_key TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_public BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- 3. CREATE INDEX FOR USERNAME LOOKUPS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username) WHERE username IS NOT NULL;

-- ============================================================================
-- 4. UPDATE RLS POLICIES (if needed)
-- ============================================================================

-- Users can update their own profile (already exists, but ensure new fields are covered)
-- The existing "Users can update own profile" policy should cover the new fields

-- ============================================================================
-- 5. SUPABASE STORAGE BUCKET FOR PROFILE PICTURES
-- ============================================================================
-- NOTE: Run these in Supabase Dashboard -> Storage -> Create Bucket
-- Or use the SQL below (requires storage schema access)

-- Create the bucket (run in SQL Editor with service role)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-pictures',
  'profile-pictures',
  true,  -- Public bucket so images can be displayed
  2097152,  -- 2MB limit (2 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png'];

-- Storage policies for profile-pictures bucket

-- Allow authenticated users to upload their own profile picture
CREATE POLICY "Users can upload own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own profile picture
CREATE POLICY "Users can update own profile picture"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own profile picture
CREATE POLICY "Users can delete own profile picture"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view profile pictures (public bucket)
CREATE POLICY "Anyone can view profile pictures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- ============================================================================
-- 6. VERIFICATION QUERIES
-- ============================================================================

-- Check enums were created
SELECT typname FROM pg_type WHERE typname IN ('gender_type', 'communication_preference', 'asia_scale');

-- Check new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN (
    'username', 'phone', 'gender', 'preferred_communication',
    'city', 'state', 'cep', 'date_of_birth',
    'injury_date', 'injury_acquired', 'asia_scale', 'asia_recent_evaluation', 'injury_level',
    'pix_key', 'profile_picture_url', 'profile_completed', 'profile_public'
  )
ORDER BY column_name;
