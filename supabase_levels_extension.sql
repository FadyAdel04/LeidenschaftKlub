-- ==============================================================================
-- 1. DROP RESTRICTIVE CONSTRAINTS ON groups TABLE
-- Since we now use dynamic levels (e.g. A1.1, B1.2), the old static check
-- constraint 'groups_level_check' (which likely restricts to A1, A2 etc)
-- must be removed.
-- ==============================================================================
ALTER TABLE groups 
DROP CONSTRAINT IF EXISTS groups_level_check;

-- ==============================================================================
-- 2. UPDATE levels TABLE
-- Add parent_level_id and instructor_id for hierarchical structure
-- ==============================================================================
ALTER TABLE levels 
ADD COLUMN IF NOT EXISTS parent_level_id uuid REFERENCES levels(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS instructor_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Ensure description exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='levels' AND column_name='description') THEN
        ALTER TABLE levels ADD COLUMN description text;
    END IF;
END $$;

-- ==============================================================================
-- 3. CREATE level_students TABLE
-- Tracks student assignments to specific (sub)levels and their instructors
-- ==============================================================================
CREATE TABLE IF NOT EXISTS level_students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    level_id uuid NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
    instructor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- A student should ideally only have one active level assignment at a time
    UNIQUE(student_id) 
);

-- ==============================================================================
-- 4. ENABLE RLS
-- ==============================================================================
ALTER TABLE level_students ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 5. POLICIES & SECURITY
-- ==============================================================================

-- Helper for role check
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 'levels' Policies
DROP POLICY IF EXISTS "Admins have full access to levels" ON levels;
CREATE POLICY "Admins have full access to levels" ON levels
    FOR ALL USING ( get_my_role() = 'admin' );

DROP POLICY IF EXISTS "Instructors can view their levels" ON levels;
CREATE POLICY "Instructors can view their levels" ON levels
    FOR SELECT USING ( instructor_id = auth.uid() OR get_my_role() = 'admin' );

DROP POLICY IF EXISTS "Students can view their level" ON levels;
CREATE POLICY "Students can view their level" ON levels
    FOR SELECT USING (
        id IN (SELECT level_id FROM level_students WHERE student_id = auth.uid())
        OR get_my_role() = 'admin'
    );

-- 'level_students' Policies
DROP POLICY IF EXISTS "Admins full access level_students" ON level_students;
CREATE POLICY "Admins full access level_students" ON level_students
    FOR ALL USING ( get_my_role() = 'admin' );

DROP POLICY IF EXISTS "Instructors can view assigned students" ON level_students;
CREATE POLICY "Instructors can view assigned students" ON level_students
    FOR SELECT USING ( instructor_id = auth.uid() OR get_my_role() = 'admin' );

DROP POLICY IF EXISTS "Students can view own entry" ON level_students;
CREATE POLICY "Students can view own entry" ON level_students
    FOR SELECT USING ( student_id = auth.uid() );
