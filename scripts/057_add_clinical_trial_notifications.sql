-- Migration: Add clinical_trial_notifications table
-- Track which members were notified about which clinical trials

CREATE TABLE clinical_trial_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nct_id TEXT NOT NULL,
  trial_title TEXT NOT NULL,
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notified_by UUID NOT NULL REFERENCES profiles(id),  -- Admin who sent
  custom_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  -- Future: delivery status, opened, clicked
  UNIQUE(nct_id, member_id)  -- Prevent duplicate notifications
);

-- Indexes
CREATE INDEX idx_ctn_member_id ON clinical_trial_notifications(member_id);
CREATE INDEX idx_ctn_nct_id ON clinical_trial_notifications(nct_id);
CREATE INDEX idx_ctn_sent_at ON clinical_trial_notifications(sent_at DESC);

-- Enable RLS
ALTER TABLE clinical_trial_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can insert/update/delete notifications
CREATE POLICY "Admins can manage trial notifications" ON clinical_trial_notifications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- Members can view their own notifications
CREATE POLICY "Members can view own notifications" ON clinical_trial_notifications FOR SELECT
  USING (auth.uid() = member_id);
