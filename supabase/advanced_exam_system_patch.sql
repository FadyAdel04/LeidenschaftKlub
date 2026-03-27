-- ============================================================
-- ADVANCED EXAM SYSTEM PATCH
-- Adds multi-type questions + exam_answers table.
-- ============================================================

-- 1) Extend questions table with richer structure
alter table if exists public.questions
  add column if not exists audio_url text null;

alter table if exists public.questions
  add column if not exists content text null;

alter table if exists public.questions
  add column if not exists extra_data jsonb null;

-- Keep old correct_answer (text) for backward compatibility.
-- New column stores correct answer as JSON (string/boolean/object).
alter table if exists public.questions
  add column if not exists correct_answer_json jsonb null;

-- Older patches may have enforced A/B/C/D only.
-- Drop it so advanced question types can use JSON-based correctness.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'questions_correct_answer_check'
  ) then
    alter table public.questions drop constraint questions_correct_answer_check;
  end if;
exception
  when others then
    null;
end $$;

-- Expand "type" check constraint to support advanced question types.
-- The constraint name is typically "questions_type_check" for the table DDL in schema.sql.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'questions_type_check'
  ) then
    alter table public.questions drop constraint questions_type_check;
  end if;
exception
  when others then
    null;
end $$;

alter table if exists public.questions
  add constraint questions_type_check
  check (type in ('mcq', 'text', 'paragraph', 'grammar', 'writing', 'listening'));

-- 2) Create exam_answers table (student answers per question)
create table if not exists public.exam_answers (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,

  -- Stores answer as JSON so each question type can persist its own structure.
  answer jsonb,

  -- For auto-gradable questions, set true/false at final submission.
  is_correct boolean null,

  -- For writing questions (manual review), admin can grade later.
  admin_grade numeric(5,2) null,
  admin_feedback text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (student_id, exam_id, question_id)
);

-- Per-question grading (see exam_review_workflow.sql for backfills on existing DBs)
alter table public.exam_answers add column if not exists answer_status text default 'pending';
alter table public.exam_answers add column if not exists score numeric(5,2) null;
alter table public.exam_answers drop constraint if exists exam_answers_answer_status_check;
alter table public.exam_answers add constraint exam_answers_answer_status_check
  check (answer_status in ('pending', 'auto_graded', 'reviewed'));
alter table public.exam_answers alter column answer_status set default 'pending';

-- Final exam outcome (nullable score while writing is pending review)
alter table public.results add column if not exists review_status text default 'completed';
alter table public.results drop constraint if exists results_review_status_check;
alter table public.results add constraint results_review_status_check
  check (review_status in ('pending_review', 'completed'));
alter table public.results alter column review_status set default 'completed';
alter table public.results alter column score drop not null;

create or replace function public.set_exam_answers_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists exam_answers_updated_at on public.exam_answers;
create trigger exam_answers_updated_at
  before update on public.exam_answers
  for each row execute function public.set_exam_answers_updated_at();

-- 3) Enable RLS + policies for exam_answers
alter table public.exam_answers enable row level security;

-- Helper: verifies if current user can access a given exam.
-- SECURITY DEFINER + SET search_path so joins resolve reliably.
-- Level match is case-insensitive / trimmed (profiles vs levels.name often drift).
create or replace function public.can_access_exam(p_exam_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.exams e
    join public.levels l on l.id = e.level_id
    join public.profiles p on p.id = auth.uid()
    where e.id = p_exam_id
      and (
        p.role = 'admin'
        or lower(btrim(p.current_level)) = lower(btrim(l.name))
      )
  );
$$;

-- Autosave one answer: runs as definer so RLS on exam_answers cannot block valid students.
create or replace function public.upsert_student_exam_answer(
  p_exam_id uuid,
  p_question_id uuid,
  p_answer jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.can_access_exam(p_exam_id) then
    raise exception 'Exam not accessible';
  end if;

  if exists (
    select 1 from public.results r
    where r.exam_id = p_exam_id and r.student_id = v_uid
  ) then
    raise exception 'Exam already submitted';
  end if;

  insert into public.exam_answers (student_id, exam_id, question_id, answer, is_correct)
  values (v_uid, p_exam_id, p_question_id, p_answer, null)
  on conflict (student_id, exam_id, question_id)
  do update set
    answer = excluded.answer,
    updated_at = now();
end;
$$;

-- Batch upsert graded rows before results insert (answer_status + score; see exam_review_workflow.sql for DB columns).
create or replace function public.submit_exam_answers_graded(
  p_exam_id uuid,
  p_rows jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  r jsonb;
  v_correct boolean;
  v_ans_status text;
  v_qscore numeric;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.can_access_exam(p_exam_id) then
    raise exception 'Exam not accessible';
  end if;

  if exists (
    select 1 from public.results r2
    where r2.exam_id = p_exam_id and r2.student_id = v_uid
  ) then
    raise exception 'Exam already submitted';
  end if;

  for r in select * from jsonb_array_elements(p_rows)
  loop
    if not (r ? 'is_correct') or jsonb_typeof(r -> 'is_correct') = 'null' then
      v_correct := null;
    else
      v_correct := (r ->> 'is_correct')::boolean;
    end if;

    v_ans_status := coalesce(r ->> 'answer_status', 'pending');
    if r ? 'score' and jsonb_typeof(r -> 'score') != 'null' then
      v_qscore := (r ->> 'score')::numeric;
    else
      v_qscore := null;
    end if;

    insert into public.exam_answers (
      student_id,
      exam_id,
      question_id,
      answer,
      is_correct,
      answer_status,
      score,
      admin_grade
    )
    values (
      v_uid,
      p_exam_id,
      (r ->> 'question_id')::uuid,
      r -> 'answer',
      v_correct,
      v_ans_status,
      v_qscore,
      case when v_ans_status = 'reviewed' then v_qscore else null end
    )
    on conflict (student_id, exam_id, question_id)
    do update set
      answer = excluded.answer,
      is_correct = excluded.is_correct,
      answer_status = excluded.answer_status,
      score = excluded.score,
      admin_grade = excluded.admin_grade,
      updated_at = now();
  end loop;
end;
$$;

grant execute on function public.upsert_student_exam_answer(uuid, uuid, jsonb) to authenticated;
grant execute on function public.submit_exam_answers_graded(uuid, jsonb) to authenticated;

-- Drop existing policies (safe to re-run)
do $$
begin
  -- no-op if they don't exist
  execute 'drop policy if exists "exam_answers: student reads own" on public.exam_answers';
  execute 'drop policy if exists "exam_answers: student writes own" on public.exam_answers';
  execute 'drop policy if exists "exam_answers: student updates own" on public.exam_answers';
  execute 'drop policy if exists "exam_answers: admin full" on public.exam_answers';
exception
  when others then
    null;
end $$;

-- Students can read their own answers IF they can access the exam by level.
create policy "exam_answers: student reads own"
  on public.exam_answers for select
  using (
    auth.uid() = student_id
    and public.can_access_exam(exam_id)
  );

-- Students can insert answers only while they have NOT taken/submitted the exam yet.
create policy "exam_answers: student writes own"
  on public.exam_answers for insert
  with check (
    auth.uid() = student_id
    and public.can_access_exam(exam_id)
    and not exists (
      select 1
      from public.results r
      where r.exam_id = exam_id
        and r.student_id = student_id
    )
  );

-- Students can update their answers only while the exam hasn't been submitted yet.
create policy "exam_answers: student updates own"
  on public.exam_answers for update
  using (
    auth.uid() = student_id
    and public.can_access_exam(exam_id)
    and not exists (
      select 1
      from public.results r
      where r.exam_id = exam_id
        and r.student_id = student_id
    )
  )
  with check (
    auth.uid() = student_id
    and public.can_access_exam(exam_id)
    and not exists (
      select 1
      from public.results r
      where r.exam_id = exam_id
        and r.student_id = student_id
    )
  );

-- Admin can read/update/insert all answers (for grading).
create policy "exam_answers: admin full"
  on public.exam_answers for all
  using (public.is_admin())
  with check (public.is_admin());

-- Helpful indexes
create index if not exists exam_answers_exam_student_q
  on public.exam_answers (exam_id, student_id, question_id);

create index if not exists exam_answers_student
  on public.exam_answers (student_id, exam_id);

