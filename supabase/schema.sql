-- ============================================================
-- LEIDENSCHAFT KLUB — LMS Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ───────────────────────────────────────────────────────────
-- EXTENSIONS
-- ───────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";


-- ============================================================
-- 1. PROFILES  (must come first — other functions reference it)
-- ============================================================
create table if not exists public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  name          text        not null default '',
  email         text        not null default '',
  phone         text,
  role          text        not null default 'student'
                            check (role in ('student', 'admin')),
  current_level text        default 'A1'
                            check (current_level in ('A1', 'A2', 'B1', 'B2')),
  created_at    timestamptz not null default now()
);


-- ───────────────────────────────────────────────────────────
-- HELPER: is_admin()
-- Must be defined AFTER profiles table exists.
-- Returns true when the calling user has role = 'admin'.
-- ───────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id   = auth.uid()
      and role = 'admin'
  );
$$;


-- ───────────────────────────────────────────────────────────
-- TRIGGER: auto-insert profile row on every new sign-up
-- ───────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    nullif(btrim(coalesce(new.raw_user_meta_data->>'phone', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- 2. LEVELS
-- ============================================================
create table if not exists public.levels (
  id          uuid        primary key default uuid_generate_v4(),
  name        text        not null unique
                          check (name in ('A1', 'A2', 'B1', 'B2')),
  description text,
  created_at  timestamptz not null default now()
);

-- Seed default levels
insert into public.levels (name, description) values
  ('A1', 'Absolute Beginner — basic greetings and introductions'),
  ('A2', 'Elementary — everyday expressions and simple sentences'),
  ('B1', 'Intermediate — clear language on familiar topics'),
  ('B2', 'Upper-Intermediate — complex texts and fluent interaction')
on conflict (name) do nothing;


-- ============================================================
-- 3. MATERIALS
-- ============================================================
create table if not exists public.materials (
  id         uuid        primary key default uuid_generate_v4(),
  title      text        not null,
  file_url   text        not null,
  level_id   uuid        not null references public.levels(id) on delete cascade,
  created_at timestamptz not null default now()
);


-- ============================================================
-- 4. ASSIGNMENTS
-- ============================================================
create table if not exists public.assignments (
  id          uuid        primary key default uuid_generate_v4(),
  title       text        not null,
  description text,
  level_id    uuid        not null references public.levels(id) on delete cascade,
  deadline    timestamptz,
  created_at  timestamptz not null default now()
);


-- ============================================================
-- 5. SUBMISSIONS
-- ============================================================
create table if not exists public.submissions (
  id            uuid        primary key default uuid_generate_v4(),
  assignment_id uuid        not null references public.assignments(id) on delete cascade,
  student_id    uuid        not null references public.profiles(id)    on delete cascade,
  file_url      text,
  answer        text,
  grade         numeric(5,2),
  status        text        not null default 'pending'
                            check (status in ('pending', 'submitted', 'graded', 'returned')),
  submitted_at  timestamptz not null default now(),
  unique (assignment_id, student_id)
);


-- ============================================================
-- 6. EXAMS
-- ============================================================
create table if not exists public.exams (
  id         uuid        primary key default uuid_generate_v4(),
  title      text        not null,
  level_id   uuid        not null references public.levels(id) on delete cascade,
  duration   integer     not null default 60,
  created_at timestamptz not null default now()
);


-- ============================================================
-- 7. QUESTIONS
-- ============================================================
create table if not exists public.questions (
  id             uuid    primary key default uuid_generate_v4(),
  exam_id        uuid    not null references public.exams(id) on delete cascade,
  question_text  text    not null,
  type           text    not null default 'mcq'
                         check (type in ('mcq', 'text')),
  options        jsonb,
  correct_answer text    not null,
  order_index    integer not null default 0
);


-- ============================================================
-- 8. RESULTS
-- ============================================================
create table if not exists public.results (
  id         uuid         primary key default uuid_generate_v4(),
  student_id uuid         not null references public.profiles(id) on delete cascade,
  exam_id    uuid         not null references public.exams(id)    on delete cascade,
  score      numeric(5,2) not null default 0,
  passed     boolean      not null default false,
  taken_at   timestamptz  not null default now(),
  unique (student_id, exam_id)
);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.profiles    enable row level security;
alter table public.levels      enable row level security;
alter table public.materials   enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.exams       enable row level security;
alter table public.questions   enable row level security;
alter table public.results     enable row level security;


-- ────────────────────────────────────────────────────────────
-- PROFILES
-- ────────────────────────────────────────────────────────────
drop policy if exists "profiles: student reads own"   on public.profiles;
drop policy if exists "profiles: student updates own" on public.profiles;
drop policy if exists "profiles: admin reads all"     on public.profiles;
drop policy if exists "profiles: admin updates all"   on public.profiles;
drop policy if exists "profiles: service insert"      on public.profiles;

create policy "profiles: student reads own"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "profiles: student updates own"
  on public.profiles for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

create policy "profiles: admin reads all"
  on public.profiles for select
  using ( public.is_admin() );

create policy "profiles: admin updates all"
  on public.profiles for update
  using ( public.is_admin() );

create policy "profiles: service insert"
  on public.profiles for insert
  with check ( true );


-- ────────────────────────────────────────────────────────────
-- LEVELS
-- ────────────────────────────────────────────────────────────
drop policy if exists "levels: all authenticated read" on public.levels;
drop policy if exists "levels: admin full"             on public.levels;

create policy "levels: all authenticated read"
  on public.levels for select
  using ( auth.role() = 'authenticated' );

create policy "levels: admin full"
  on public.levels for all
  using ( public.is_admin() )
  with check ( public.is_admin() );


-- ────────────────────────────────────────────────────────────
-- MATERIALS
-- ────────────────────────────────────────────────────────────
drop policy if exists "materials: student reads" on public.materials;
drop policy if exists "materials: admin full"    on public.materials;

create policy "materials: student reads"
  on public.materials for select
  using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.profiles p
      join public.levels l on l.id = level_id
      where p.id = auth.uid()
        and p.current_level = l.name
    )
  );

create policy "materials: admin full"
  on public.materials for all
  using ( public.is_admin() )
  with check ( public.is_admin() );


-- ────────────────────────────────────────────────────────────
-- ASSIGNMENTS
-- ────────────────────────────────────────────────────────────
drop policy if exists "assignments: student reads" on public.assignments;
drop policy if exists "assignments: admin full"    on public.assignments;

create policy "assignments: student reads"
  on public.assignments for select
  using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.profiles p
      join public.levels l on l.id = level_id
      where p.id = auth.uid()
        and p.current_level = l.name
    )
  );

create policy "assignments: admin full"
  on public.assignments for all
  using ( public.is_admin() )
  with check ( public.is_admin() );


-- ────────────────────────────────────────────────────────────
-- SUBMISSIONS
-- ────────────────────────────────────────────────────────────
drop policy if exists "submissions: student reads own"   on public.submissions;
drop policy if exists "submissions: student inserts own" on public.submissions;
drop policy if exists "submissions: student updates own" on public.submissions;
drop policy if exists "submissions: admin full"          on public.submissions;

create policy "submissions: student reads own"
  on public.submissions for select
  using ( auth.uid() = student_id );

create policy "submissions: student inserts own"
  on public.submissions for insert
  with check ( auth.uid() = student_id );

create policy "submissions: student updates own"
  on public.submissions for update
  using ( auth.uid() = student_id and status = 'pending' )
  with check ( auth.uid() = student_id );

create policy "submissions: admin full"
  on public.submissions for all
  using ( public.is_admin() )
  with check ( public.is_admin() );


-- ────────────────────────────────────────────────────────────
-- EXAMS
-- ────────────────────────────────────────────────────────────
drop policy if exists "exams: student reads" on public.exams;
drop policy if exists "exams: admin full"    on public.exams;

create policy "exams: student reads"
  on public.exams for select
  using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.profiles p
      join public.levels l on l.id = level_id
      where p.id = auth.uid()
        and p.current_level = l.name
    )
  );

create policy "exams: admin full"
  on public.exams for all
  using ( public.is_admin() )
  with check ( public.is_admin() );


-- ────────────────────────────────────────────────────────────
-- QUESTIONS
-- ────────────────────────────────────────────────────────────
drop policy if exists "questions: student reads" on public.questions;
drop policy if exists "questions: admin full"    on public.questions;

create policy "questions: student reads"
  on public.questions for select
  using (
    auth.role() = 'authenticated'
    and exists (
      select 1
      from public.exams    e
      join public.levels   l on l.id  = e.level_id
      join public.profiles p on p.id  = auth.uid()
      where e.id = exam_id
        and p.current_level = l.name
    )
  );

create policy "questions: admin full"
  on public.questions for all
  using ( public.is_admin() )
  with check ( public.is_admin() );


-- ────────────────────────────────────────────────────────────
-- RESULTS
-- ────────────────────────────────────────────────────────────
drop policy if exists "results: student reads own"   on public.results;
drop policy if exists "results: student inserts own" on public.results;
drop policy if exists "results: admin full"          on public.results;

create policy "results: student reads own"
  on public.results for select
  using ( auth.uid() = student_id );

create policy "results: student inserts own"
  on public.results for insert
  with check ( auth.uid() = student_id );

create policy "results: admin full"
  on public.results for all
  using ( public.is_admin() )
  with check ( public.is_admin() );


-- ============================================================
-- STORAGE BUCKETS (uncomment to create)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('materials',   'materials',   false) on conflict do nothing;
-- insert into storage.buckets (id, name, public) values ('submissions', 'submissions', false) on conflict do nothing;

-- ============================================================
-- DONE ✅
-- ============================================================
