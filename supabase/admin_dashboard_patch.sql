-- ============================================================
-- Admin dashboard patch (Supabase)
-- Run this after schema.sql in Supabase SQL Editor
-- ============================================================

-- 1) Storage buckets used by admin/materials and submissions
insert into storage.buckets (id, name, public)
values ('materials', 'materials', false)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do update set public = excluded.public;

-- 2) Storage policies for admin upload/delete and authenticated read
drop policy if exists "materials bucket read authenticated" on storage.objects;
drop policy if exists "materials bucket admin write" on storage.objects;
drop policy if exists "submissions bucket read authenticated" on storage.objects;
drop policy if exists "submissions bucket admin write" on storage.objects;
drop policy if exists "submissions bucket student write own folder" on storage.objects;
drop policy if exists "avatars bucket read authenticated" on storage.objects;
drop policy if exists "avatars bucket owner write" on storage.objects;
drop policy if exists "public-assets bucket read all" on storage.objects;
drop policy if exists "public-assets bucket admin write" on storage.objects;

create policy "materials bucket read authenticated"
  on storage.objects
  for select
  using (bucket_id = 'materials' and auth.role() = 'authenticated');

create policy "materials bucket admin write"
  on storage.objects
  for all
  using (bucket_id = 'materials' and public.is_admin())
  with check (bucket_id = 'materials' and public.is_admin());

create policy "submissions bucket read authenticated"
  on storage.objects
  for select
  using (bucket_id = 'submissions' and auth.role() = 'authenticated');

create policy "submissions bucket admin write"
  on storage.objects
  for all
  using (bucket_id = 'submissions' and public.is_admin())
  with check (bucket_id = 'submissions' and public.is_admin());

create policy "submissions bucket student write own folder"
  on storage.objects
  for all
  using (
    bucket_id = 'submissions'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'submissions'
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "avatars bucket read authenticated"
  on storage.objects
  for select
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "avatars bucket owner write"
  on storage.objects
  for all
  using (bucket_id = 'avatars' and auth.role() = 'authenticated')
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "public-assets bucket read all"
  on storage.objects
  for select
  using (bucket_id = 'public-assets');

create policy "public-assets bucket admin write"
  on storage.objects
  for all
  using (bucket_id = 'public-assets' and public.is_admin())
  with check (bucket_id = 'public-assets' and public.is_admin());

-- 3) Exam hardening for MCQ flow
alter table public.questions
  alter column type set default 'mcq',
  alter column order_index set default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'questions_correct_answer_check'
  ) then
    alter table public.questions
      add constraint questions_correct_answer_check
      check (upper(correct_answer) in ('A', 'B', 'C', 'D'));
  end if;
end $$;

-- 4) Levels and profiles extensibility
alter table public.profiles add column if not exists avatar_url text;
alter table public.submissions add column if not exists feedback text;

alter table public.levels drop constraint if exists levels_name_check;
alter table public.profiles drop constraint if exists profiles_current_level_check;

-- 5) Optional: index for faster lookups
create index if not exists idx_profiles_current_level on public.profiles(current_level);

-- 5.1) Website content tables (landing page)
create table if not exists public.website_spaces (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  category text,
  image_path text not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.website_events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  type text,
  image_path text,
  capacity integer,
  price text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.website_event_bookings (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.website_events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  name text,
  email text,
  seats integer not null default 1,
  created_at timestamptz not null default now()
);

alter table public.website_spaces enable row level security;
alter table public.website_events enable row level security;
alter table public.website_event_bookings enable row level security;

drop policy if exists "website spaces: public read" on public.website_spaces;
drop policy if exists "website spaces: admin full" on public.website_spaces;
create policy "website spaces: public read"
  on public.website_spaces for select
  using (true);
create policy "website spaces: admin full"
  on public.website_spaces for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "website events: public read" on public.website_events;
drop policy if exists "website events: admin full" on public.website_events;
create policy "website events: public read"
  on public.website_events for select
  using (is_active = true);
create policy "website events: admin full"
  on public.website_events for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "website bookings: public insert" on public.website_event_bookings;
drop policy if exists "website bookings: admin read" on public.website_event_bookings;
drop policy if exists "website bookings: owner read" on public.website_event_bookings;
create policy "website bookings: public insert"
  on public.website_event_bookings for insert
  with check (true);
create policy "website bookings: admin read"
  on public.website_event_bookings for select
  using (public.is_admin());
create policy "website bookings: owner read"
  on public.website_event_bookings for select
  using (public.is_admin() or user_id = auth.uid());

-- Ensure PostgREST roles can access bookings table (fix 403 Forbidden)
grant usage on schema public to anon, authenticated;
grant select on public.website_spaces to anon, authenticated;
grant select on public.website_events to anon, authenticated;
grant insert on public.website_event_bookings to anon, authenticated;
grant select on public.website_event_bookings to authenticated;

-- 5.2) Notifications (real-time)
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('material','assignment','exam','review','submission','announcement','reminder','alert','event')),
  title text not null,
  message text not null,
  related_id uuid,
  is_read boolean not null default false,
  announcement_id uuid not null default uuid_generate_v4(),
  target_level text not null default 'all',
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  expires_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_user_read on public.notifications(user_id, is_read);
create index if not exists idx_notifications_announcement on public.notifications(announcement_id);

alter table public.notifications enable row level security;

-- Helper RPC: insert a notification for ALL admins (student -> admins)
-- This avoids needing to SELECT admin ids from profiles (blocked by RLS for students).
create or replace function public.notify_admins(
  p_type text,
  p_title text,
  p_message text,
  p_related_id uuid default null,
  p_priority text default 'medium'
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.notifications (user_id, type, title, message, related_id, priority, is_active)
  select p.id, p_type, p_title, p_message, p_related_id, p_priority, true
  from public.profiles p
  where p.role = 'admin';
end;
$$;

revoke all on function public.notify_admins(text,text,text,uuid,text) from public;
grant execute on function public.notify_admins(text,text,text,uuid,text) to authenticated;

-- Extend notifications schema for admin announcements + student level filtering
alter table public.notifications add column if not exists announcement_id uuid not null default uuid_generate_v4();
alter table public.notifications add column if not exists target_level text not null default 'all';
alter table public.notifications add column if not exists priority text not null default 'medium';
alter table public.notifications add column if not exists expires_at timestamptz;
alter table public.notifications add column if not exists is_active boolean not null default true;
alter table public.notifications add column if not exists created_by uuid references public.profiles(id);

-- Widen type allowed values
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Drop any existing CHECK constraints related to notifications.type
DO $$
DECLARE
  con_name text;
BEGIN
  FOR con_name IN
    SELECT con.conname
    FROM pg_constraint con
    WHERE con.conrelid = 'public.notifications'::regclass
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%type in%'
  LOOP
    EXECUTE format('ALTER TABLE public.notifications DROP CONSTRAINT %I', con_name);
  END LOOP;
END $$;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type in ('material','assignment','exam','review','submission','announcement','reminder','alert','event'));

drop policy if exists "notifications: read own" on public.notifications;
drop policy if exists "notifications: admin read all" on public.notifications;
drop policy if exists "notifications: insert system" on public.notifications;
drop policy if exists "notifications: update own" on public.notifications;

create policy "notifications: read own"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications: admin read all"
  on public.notifications for select
  using (public.is_admin());

create policy "notifications: insert system"
  on public.notifications for insert
  with check (
    public.is_admin()
    or (
      auth.role() = 'authenticated'
      and type in ('submission','event')
      and (
        exists (select 1 from public.submissions s where s.id = related_id and s.student_id = auth.uid())
        or exists (select 1 from public.results r where r.id = related_id and r.student_id = auth.uid())
        or exists (
          select 1
          from public.website_event_bookings b
          where b.id = related_id
            and b.user_id = auth.uid()
        )
      )
      and exists (select 1 from public.profiles p where p.id = user_id and p.role = 'admin')
    )
  );

create policy "notifications: update own"
  on public.notifications for update
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "notifications: admin delete all" on public.notifications;
create policy "notifications: admin delete all"
  on public.notifications
  for delete
  using (public.is_admin());

-- 6) Optional: safer profile insert policy (replace broad insert policy)
drop policy if exists "profiles: service insert" on public.profiles;
drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own"
  on public.profiles
  for insert
  with check (auth.uid() = id or public.is_admin());

-- ============================================================
-- DONE
-- ============================================================
