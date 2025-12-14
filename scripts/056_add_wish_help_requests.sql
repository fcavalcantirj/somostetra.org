-- Migration: Add wish_help_requests table
-- This allows supporters/visitors to express interest in helping fulfill a wish

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

-- Indexes
CREATE INDEX idx_wish_help_requests_wish_id ON wish_help_requests(wish_id);
CREATE INDEX idx_wish_help_requests_status ON wish_help_requests(status);
CREATE INDEX idx_wish_help_requests_created_at ON wish_help_requests(created_at DESC);

-- Enable RLS
ALTER TABLE wish_help_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can create a help request (public form - no auth required)
CREATE POLICY "Anyone can submit help requests" ON wish_help_requests FOR INSERT
  WITH CHECK (true);

-- Admins can view and manage all help requests
CREATE POLICY "Admins can manage help requests" ON wish_help_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
