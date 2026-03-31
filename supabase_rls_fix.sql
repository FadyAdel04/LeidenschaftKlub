-- ==============================================================================
-- 1. FIX RLS FOR assignments, exams, and questions
-- Allow instructors to create and manage these items.
-- ==============================================================================

-- Helper for role check (ensure it exists)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Enable RLS on core tables
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Assignments Policies
DROP POLICY IF EXISTS "Admins manage assignments" ON assignments;
CREATE POLICY "Admins manage assignments" ON assignments
    FOR ALL USING ( get_my_role() = 'admin' );

DROP POLICY IF EXISTS "Instructors manage assignments" ON assignments;
CREATE POLICY "Instructors manage assignments" ON assignments
    FOR ALL USING ( get_my_role() = 'instructor' );

DROP POLICY IF EXISTS "Everyone can view assignments" ON assignments;
CREATE POLICY "Everyone can view assignments" ON assignments
    FOR SELECT USING ( true );

-- Exams Policies
DROP POLICY IF EXISTS "Admins manage exams" ON exams;
CREATE POLICY "Admins manage exams" ON exams
    FOR ALL USING ( get_my_role() = 'admin' );

DROP POLICY IF EXISTS "Instructors manage exams" ON exams;
CREATE POLICY "Instructors manage exams" ON exams
    FOR ALL USING ( get_my_role() = 'instructor' );

DROP POLICY IF EXISTS "Everyone can view exams" ON exams;
CREATE POLICY "Everyone can view exams" ON exams
    FOR SELECT USING ( true );

-- Questions Policies
DROP POLICY IF EXISTS "Admins manage questions" ON questions;
CREATE POLICY "Admins manage questions" ON questions
    FOR ALL USING ( get_my_role() = 'admin' );

DROP POLICY IF EXISTS "Instructors manage questions" ON questions;
CREATE POLICY "Instructors manage questions" ON questions
    FOR ALL USING ( get_my_role() = 'instructor' );

DROP POLICY IF EXISTS "Everyone can view questions" ON questions;
CREATE POLICY "Everyone can view questions" ON questions
    FOR SELECT USING ( true );

-- Results (instructors should view results)
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Instructors can view results" ON results;
CREATE POLICY "Instructors can view results" ON results
    FOR SELECT USING ( get_my_role() = 'instructor' OR get_my_role() = 'admin' );
