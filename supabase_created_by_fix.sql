-- ==============================================================================
-- 1. ADD created_by COLUMN TO assignments AND exams
-- ==============================================================================

-- Add created_by to assignments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'created_by') THEN
        ALTER TABLE assignments ADD COLUMN created_by uuid REFERENCES profiles(id);
    END IF;
END $$;

-- Add created_by to exams
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exams' AND column_name = 'created_by') THEN
        ALTER TABLE exams ADD COLUMN created_by uuid REFERENCES profiles(id);
    END IF;
END $$;

-- ==============================================================================
-- 2. UPDATE RLS POLICIES FOR created_by
-- ==============================================================================

CREATE OR REPLACE FUNCTION get_my_id()
RETURNS uuid AS $$
  SELECT auth.uid();
$$ LANGUAGE sql STABLE;

-- Ensure instructors can only edit their own assignments (optional, but good practice)
-- For now, we allow any instructor or admin to manage, but track the creator.

-- Update existing assignments/exams to have a creator if they are null (optional)
-- UPDATE assignments SET created_by = (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1) WHERE created_by IS NULL;
-- UPDATE exams SET created_by = (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1) WHERE created_by IS NULL;
