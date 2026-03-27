-- ============================================================
-- EXAM REVIEW WORKFLOW
-- Per-question answer_status + score; results.review_status + nullable score.
-- Run after advanced_exam_system_patch.sql
-- ============================================================

-- 1) exam_answers: answer_status + score (per-question 0–100)
alter table public.exam_answers add column if not exists answer_status text default 'pending';
alter table public.exam_answers add column if not exists score numeric(5,2) null;

update public.exam_answers
set score = coalesce(score, admin_grade)
where admin_grade is not null and score is null;

update public.exam_answers
set answer_status = 'reviewed'
where admin_grade is not null and (answer_status is null or answer_status = 'pending');

update public.exam_answers
set
  answer_status = 'auto_graded',
  score = case
    when is_correct is true then 100
    when is_correct is false then 0
    else coalesce(score, 0)
  end
where is_correct is not null
  and (answer_status is null or answer_status = 'pending');

update public.exam_answers set answer_status = 'pending' where answer_status is null;

alter table public.exam_answers drop constraint if exists exam_answers_answer_status_check;
alter table public.exam_answers add constraint exam_answers_answer_status_check
  check (answer_status in ('pending', 'auto_graded', 'reviewed'));

alter table public.exam_answers alter column answer_status set default 'pending';
alter table public.exam_answers alter column answer_status set not null;

-- 2) results: review_status; score nullable while pending_review
alter table public.results add column if not exists review_status text default 'completed';

update public.results set review_status = 'completed' where review_status is null;

alter table public.results drop constraint if exists results_review_status_check;
alter table public.results add constraint results_review_status_check
  check (review_status in ('pending_review', 'completed'));

alter table public.results alter column review_status set default 'completed';
alter table public.results alter column review_status set not null;

alter table public.results alter column score drop not null;

-- 3) Replace batch submit RPC to persist answer_status + score
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

grant execute on function public.submit_exam_answers_graded(uuid, jsonb) to authenticated;
