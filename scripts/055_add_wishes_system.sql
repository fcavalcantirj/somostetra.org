-- Migration 055: Add Wishes System
-- Adds bio_public column, wish_categories table, and wishes table

-- ============================================
-- 1. Add bio_public column to profiles
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio_public BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN profiles.bio_public IS 'Controls whether bio is shown on public profile';

-- ============================================
-- 2. Create wish_categories table (admin-managed)
-- ============================================
CREATE TABLE IF NOT EXISTS wish_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT '📦',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial categories
INSERT INTO wish_categories (name, icon, description) VALUES
  ('Cadeira de Rodas', '🦽', 'Cadeiras de rodas manuais ou motorizadas'),
  ('Medicamento', '💊', 'Medicamentos e remédios'),
  ('Cateter', '🏥', 'Cateteres e materiais de sondagem'),
  ('Equipamento', '🔧', 'Equipamentos e adaptações'),
  ('Outro', '📦', 'Outros itens não categorizados')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 3. Create wish_status enum
-- ============================================
DO $$ BEGIN
  CREATE TYPE wish_status AS ENUM ('pending', 'approved', 'fulfilled', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 4. Create wishes table
-- ============================================
CREATE TABLE IF NOT EXISTS wishes (
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

-- ============================================
-- 5. Create indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_wishes_user_id ON wishes (user_id);
CREATE INDEX IF NOT EXISTS idx_wishes_status ON wishes (status);
CREATE INDEX IF NOT EXISTS idx_wishes_status_created_at ON wishes (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wishes_category_id ON wishes (category_id);
CREATE INDEX IF NOT EXISTS idx_wishes_fulfiller_user_id ON wishes (fulfiller_user_id);

-- CONSTRAINT: Only ONE active wish per member (pending or approved)
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishes_one_active_per_user
  ON wishes (user_id)
  WHERE status IN ('pending', 'approved');

-- CONSTRAINT: Prevent exact duplicate content per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishes_unique_content_per_user
  ON wishes (user_id, md5(content))
  WHERE status != 'rejected';

-- ============================================
-- 6. Enable RLS
-- ============================================
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wish_categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS Policies for wish_categories
-- ============================================
DROP POLICY IF EXISTS "Anyone can view active categories" ON wish_categories;
CREATE POLICY "Anyone can view active categories" ON wish_categories FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage categories" ON wish_categories;
CREATE POLICY "Admins can manage categories" ON wish_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ============================================
-- 8. RLS Policies for wishes
-- ============================================
-- Public can view approved/fulfilled wishes (for home page and public profiles)
DROP POLICY IF EXISTS "Anyone can view approved/fulfilled wishes" ON wishes;
CREATE POLICY "Anyone can view approved/fulfilled wishes" ON wishes FOR SELECT
  USING (status IN ('approved', 'fulfilled'));

-- Users can also view their own wishes (any status)
DROP POLICY IF EXISTS "Users can view own wishes" ON wishes;
CREATE POLICY "Users can view own wishes" ON wishes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own wishes" ON wishes;
CREATE POLICY "Users can create own wishes" ON wishes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pending wishes" ON wishes;
CREATE POLICY "Users can update own pending wishes" ON wishes FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Users can delete own pending wishes" ON wishes;
CREATE POLICY "Users can delete own pending wishes" ON wishes FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Admins can manage all wishes" ON wishes;
CREATE POLICY "Admins can manage all wishes" ON wishes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ============================================
-- 9. Add statistics columns
-- ============================================
ALTER TABLE platform_statistics ADD COLUMN IF NOT EXISTS total_wishes INTEGER DEFAULT 0;
ALTER TABLE platform_statistics ADD COLUMN IF NOT EXISTS total_wishes_fulfilled INTEGER DEFAULT 0;

-- ============================================
-- 10. Create statistics trigger functions
-- ============================================
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

-- ============================================
-- 11. Create triggers
-- ============================================
DROP TRIGGER IF EXISTS on_wish_insert ON wishes;
CREATE TRIGGER on_wish_insert AFTER INSERT ON wishes
  FOR EACH ROW EXECUTE FUNCTION increment_wishes();

DROP TRIGGER IF EXISTS on_wish_delete ON wishes;
CREATE TRIGGER on_wish_delete AFTER DELETE ON wishes
  FOR EACH ROW EXECUTE FUNCTION decrement_wishes();

DROP TRIGGER IF EXISTS on_wish_status_change ON wishes;
CREATE TRIGGER on_wish_status_change AFTER UPDATE ON wishes
  FOR EACH ROW EXECUTE FUNCTION update_wishes_fulfilled();

-- ============================================
-- 12. Initialize statistics if needed
-- ============================================
UPDATE platform_statistics
SET total_wishes = 0, total_wishes_fulfilled = 0
WHERE total_wishes IS NULL OR total_wishes_fulfilled IS NULL;
