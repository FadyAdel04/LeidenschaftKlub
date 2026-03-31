-- ==============================================================================
-- 1. UPDATE profiles TABLE
-- Add role column: (student | admin | instructor)
-- ==============================================================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('student', 'admin', 'instructor')) DEFAULT 'student';

-- ==============================================================================
-- 2. CREATE groups TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    level text NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: Depending on your exact requirements, you might want to link groups back to a school or center.

-- ==============================================================================
-- 3. CREATE instructor_groups TABLE
-- Maps instructors to groups (many-to-many if one group has multiple instructors, or one-to-many)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS instructor_groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    assigned_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Ensure an instructor isn't assigned to the same group twice
    UNIQUE(instructor_id, group_id)
);

-- ==============================================================================
-- 4. UPDATE students (profiles) TABLE
-- Add group_id to profiles to assign a student to a group
-- Assuming a student belongs to only one group. If they can belong to multiple, 
-- use a junction table like student_groups.
-- ==============================================================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE SET NULL;

-- ==============================================================================
-- 5. CREATE group_assignments TABLE (Optional but requested)
-- Links assignments to groups so entire groups get the same assignment
-- ==============================================================================
CREATE TABLE IF NOT EXISTS group_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    assigned_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(group_id, assignment_id)
);

-- Link Exams to Groups (Bonus for Exame visibility)
CREATE TABLE IF NOT EXISTS group_exams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    assigned_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(group_id, exam_id)
);

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_exams ENABLE ROW LEVEL SECURITY;
-- (Assuming profiles and other tables already have RLS enabled)

-- ==============================================================================
-- RLS POLICIES
-- ==============================================================================

-- Admin function to easily check if user is admin (you might already have this)
-- CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
--    SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
-- $$ LANGUAGE sql SECURITY DEFINER;

-- Instructor function to easily check if user is an instructor
CREATE OR REPLACE FUNCTION is_instructor() RETURNS boolean AS $$
   SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'instructor');
$$ LANGUAGE sql SECURITY DEFINER;


-- ------------------------------------------------------------------------------
-- 'groups' Policies
-- ------------------------------------------------------------------------------
-- Admins can do anything
CREATE POLICY "Admins have full access to groups" ON groups
    FOR ALL USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

-- Instructors can VIEW groups they are assigned to
CREATE POLICY "Instructors can view their assigned groups" ON groups
    FOR SELECT USING (
        id IN (SELECT group_id FROM instructor_groups WHERE instructor_id = auth.uid())
    );

-- Students can VIEW the group they belong to
CREATE POLICY "Students can view their own group" ON groups
    FOR SELECT USING (
        id = (SELECT group_id FROM profiles WHERE id = auth.uid())
    );

-- ------------------------------------------------------------------------------
-- 'instructor_groups' Policies
-- ------------------------------------------------------------------------------
-- Admins can do anything
CREATE POLICY "Admins have full access to instructor_groups" ON instructor_groups
    FOR ALL USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

-- Instructors can VIEW their own group assignments
CREATE POLICY "Instructors can view own group assignments" ON instructor_groups
    FOR SELECT USING ( instructor_id = auth.uid() );


-- ------------------------------------------------------------------------------
-- 'profiles' Policies (Updates to existing)
-- Ensure instructors can view students in their groups
-- ------------------------------------------------------------------------------
-- (Warning: ensure these don't conflict with existing policies)
CREATE POLICY "Instructors can view students in their groups" ON profiles
    FOR SELECT USING (
        role = 'student' AND group_id IN (
            SELECT group_id FROM instructor_groups WHERE instructor_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- 'group_assignments' Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins full access group_assignments" ON group_assignments
    FOR ALL USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Instructors can view group_assignments for their groups" ON group_assignments
    FOR SELECT USING (
        group_id IN (SELECT group_id FROM instructor_groups WHERE instructor_id = auth.uid())
    );

CREATE POLICY "Students can view group_assignments for their group" ON group_assignments
    FOR SELECT USING (
        group_id = (SELECT group_id FROM profiles WHERE id = auth.uid())
    );

-- ------------------------------------------------------------------------------
-- 'group_exams' Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins full access group_exams" ON group_exams
    FOR ALL USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Instructors can view group_exams for their groups" ON group_exams
    FOR SELECT USING (
        group_id IN (SELECT group_id FROM instructor_groups WHERE instructor_id = auth.uid())
    );

CREATE POLICY "Students can view group_exams for their group" ON group_exams
    FOR SELECT USING (
        group_id = (SELECT group_id FROM profiles WHERE id = auth.uid())
    );
