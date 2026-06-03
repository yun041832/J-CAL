-- Run in Supabase SQL Editor (Daily month view: Monthly Focus / Next Month)
CREATE TABLE IF NOT EXISTS monthly_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_start date NOT NULL,
  focus text DEFAULT '[]',
  next_month text DEFAULT '[]',
  UNIQUE (user_id, month_start)
);

ALTER TABLE monthly_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS monthly_notes_user_all ON monthly_notes;

CREATE POLICY monthly_notes_user_all ON monthly_notes
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
