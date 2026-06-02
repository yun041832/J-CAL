-- Run in Supabase SQL Editor (project: j-cal, ref: kwiwsjvuvmwtfboxtfij)
ALTER TABLE daily_sections
ADD COLUMN IF NOT EXISTS repeat_group_id uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS repeat_origin_date date DEFAULT NULL;
