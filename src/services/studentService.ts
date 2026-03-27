/**
 * studentService.ts
 * All Supabase data-fetching for the Student area.
 */
import { supabase } from '../lib/supabase';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
// notification inserts for student actions are done via RPC (see `notify_admins`)

// ─── Auth User (full metadata from Supabase Auth) ─────────────────────────────

export interface AuthUserInfo {
  id: string;
  email: string;
  emailConfirmedAt: string | null;
  lastSignInAt: string | null;
  createdAt: string;
  provider: string;
  userMetadata: Record<string, unknown>;
}

export async function fetchAuthUser(): Promise<AuthUserInfo> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error(error?.message ?? 'Not authenticated');
  const u: SupabaseAuthUser = data.user;
  return {
    id:               u.id,
    email:            u.email ?? '',
    emailConfirmedAt: u.email_confirmed_at ?? null,
    lastSignInAt:     u.last_sign_in_at    ?? null,
    createdAt:        u.created_at,
    provider:         u.app_metadata?.provider as string ?? 'email',
    userMetadata:     u.user_metadata ?? {},
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url?: string | null;
  role: 'student' | 'admin';
  current_level: string;
  created_at: string;
}

export interface Level {
  id: string;
  name: string;
  description: string | null;
}

export interface Material {
  id: string;
  title: string;
  file_url: string;
  level_id: string;
  created_at: string;
}

function resolveMaterialsPath(fileUrlOrPath: string): string {
  if (!fileUrlOrPath) return '';
  if (!fileUrlOrPath.startsWith('http')) return fileUrlOrPath;

  const publicMarker = '/storage/v1/object/public/materials/';
  const signMarker = '/storage/v1/object/sign/materials/';
  const rawMarker = '/storage/v1/object/materials/';

  if (fileUrlOrPath.includes(publicMarker)) {
    return fileUrlOrPath.split(publicMarker)[1]?.split('?')[0] ?? '';
  }
  if (fileUrlOrPath.includes(signMarker)) {
    return fileUrlOrPath.split(signMarker)[1]?.split('?')[0] ?? '';
  }
  if (fileUrlOrPath.includes(rawMarker)) {
    return fileUrlOrPath.split(rawMarker)[1]?.split('?')[0] ?? '';
  }
  return '';
}

export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  level_id: string;
  deadline: string | null;
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string | null;
  answer: string | null;
  grade: number | null;
  feedback?: string | null;
  status: 'pending' | 'submitted' | 'graded' | 'returned';
  submitted_at: string;
}

function resolveSubmissionsPath(fileUrlOrPath: string): string {
  if (!fileUrlOrPath) return '';
  if (!fileUrlOrPath.startsWith('http')) return fileUrlOrPath;

  const publicMarker = '/storage/v1/object/public/submissions/';
  const signMarker = '/storage/v1/object/sign/submissions/';
  const rawMarker = '/storage/v1/object/submissions/';

  if (fileUrlOrPath.includes(publicMarker)) {
    return fileUrlOrPath.split(publicMarker)[1]?.split('?')[0] ?? '';
  }
  if (fileUrlOrPath.includes(signMarker)) {
    return fileUrlOrPath.split(signMarker)[1]?.split('?')[0] ?? '';
  }
  if (fileUrlOrPath.includes(rawMarker)) {
    return fileUrlOrPath.split(rawMarker)[1]?.split('?')[0] ?? '';
  }
  return '';
}

export interface Exam {
  id: string;
  title: string;
  level_id: string;
  duration: number;
  created_at: string;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_text: string;
  type: 'mcq' | 'text';
  options: string[] | null;
  correct_answer: string;
  order_index: number;
}

export async function fetchAllLevelsPublic(): Promise<Level[]> {
  const { data, error } = await supabase
    .from('levels')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Level[];
}

export interface Result {
  id: string;
  student_id: string;
  exam_id: string;
  score: number;
  passed: boolean;
  taken_at: string;
  exams?: { title: string; duration: number };
}

export interface SubmitExamPayload {
  examId: string;
  studentId: string;
  answers: Record<string, string>;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * Fetch the profile row for a user.
 * Uses maybeSingle() to avoid 406 errors when no row exists yet
 * (e.g. users who registered before the DB trigger was added).
 * If no row is found, a default profile is upserted automatically.
 */
export async function fetchProfile(userId: string): Promise<Profile> {
  // 1. Try to fetch existing row
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();                  // ← never throws 406

  if (error) throw new Error(error.message);

  // 2. Row exists — return it
  if (data) {
    const profile = data as Profile;
    // Guard against legacy rows with missing level.
    if (!profile.current_level || !String(profile.current_level).trim()) {
      profile.current_level = 'A1';
    }
    const signedAvatar = await getSignedAvatarUrl(profile.avatar_url);
    if (signedAvatar) profile.avatar_url = signedAvatar;
    return profile;
  }

  // 3. Row missing — pull auth user to build a sane default
  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData?.user;

  const fallback: Omit<Profile, 'created_at'> & { created_at?: string } = {
    id:            userId,
    name:          (authUser?.user_metadata?.name as string) ?? authUser?.email?.split('@')[0] ?? '',
    email:         authUser?.email ?? '',
    phone:         null,
    role:          ((authUser?.user_metadata?.role as string) ?? 'student') as 'student' | 'admin',
    current_level: 'A1',
  };

  // 4. Upsert the default row so future fetches work
  const { data: upserted, error: upsertErr } = await supabase
    .from('profiles')
    .upsert(fallback, { onConflict: 'id' })
    .select()
    .single();

  if (upsertErr) throw new Error(upsertErr.message);
  const profile = upserted as Profile;
  const signedAvatar = await getSignedAvatarUrl(profile.avatar_url);
  if (signedAvatar) profile.avatar_url = signedAvatar;
  return profile;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function uploadProfileImage(userId: string, file: File): Promise<string> {
  const extension = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error: signedError } = await supabase.storage
    .from('avatars')
    .createSignedUrl(path, 60 * 60);
  if (signedError || !data?.signedUrl) throw new Error(signedError?.message ?? 'Could not create avatar URL');

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: path })
    .eq('id', userId);
  if (profileError) throw new Error(profileError.message);

  return data.signedUrl;
}

export async function getSignedAvatarUrl(fileUrlOrPath: string | null | undefined): Promise<string | null> {
  if (!fileUrlOrPath) return null;

  const rawMarker = '/storage/v1/object/avatars/';
  const signMarker = '/storage/v1/object/sign/avatars/';
  const publicMarker = '/storage/v1/object/public/avatars/';

  let path = fileUrlOrPath;
  if (fileUrlOrPath.startsWith('http')) {
    if (fileUrlOrPath.includes(signMarker)) path = fileUrlOrPath.split(signMarker)[1]?.split('?')[0] ?? '';
    else if (fileUrlOrPath.includes(publicMarker)) path = fileUrlOrPath.split(publicMarker)[1]?.split('?')[0] ?? '';
    else if (fileUrlOrPath.includes(rawMarker)) path = fileUrlOrPath.split(rawMarker)[1]?.split('?')[0] ?? '';
  }
  if (!path) return null;

  const { data, error } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

// ─── Level ────────────────────────────────────────────────────────────────────

export async function fetchLevelByName(levelName: string): Promise<Level> {
  const requestedRaw = String(levelName ?? '').trim();
  const requestedUpper = requestedRaw.toUpperCase();
  const cefrToken = requestedUpper.match(/\b(A1|A2|B1|B2|C1|C2)\b/)?.[1] ?? null;

  // Build multiple candidates to handle values like:
  // "B1", "b1", "Level B1", "B1 - Intermediate", etc.
  const candidates = Array.from(new Set([
    requestedRaw,
    requestedUpper,
    requestedRaw.replace(/^level\s+/i, '').trim(),
    cefrToken ?? '',
  ].filter(Boolean)));

  // 1) Try exact / case-insensitive matches first.
  for (const candidate of candidates) {
    const { data, error } = await supabase
      .from('levels')
      .select('*')
      .ilike('name', candidate)
      .limit(1);
    if (error) throw new Error(error.message);
    if (data?.[0]) return data[0] as Level;
  }

  // 2) Try prefix matching (e.g. "B1%" for "B1 - Intermediate")
  if (cefrToken) {
    const { data, error } = await supabase
      .from('levels')
      .select('*')
      .ilike('name', `${cefrToken}%`)
      .limit(1);
    if (error) throw new Error(error.message);
    if (data?.[0]) return data[0] as Level;
  }

  // 3) Fallback: first available level so student portal never hard-crashes.
  const { data: fallback, error: fallbackError } = await supabase
    .from('levels')
    .select('*')
    .order('name', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (fallbackError) throw new Error(fallbackError.message);
  if (!fallback) throw new Error('No levels found. Please create at least one level in admin.');
  return fallback as Level;
}

// ─── Materials ────────────────────────────────────────────────────────────────

export async function fetchMaterialsByLevel(levelId: string): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('level_id', levelId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const materials = (data ?? []) as Material[];
  const hydrated = await Promise.all(materials.map(async (material) => {
    const path = resolveMaterialsPath(material.file_url);
    if (!path) return material;

    const { data: signedData, error: signedError } = await supabase.storage
      .from('materials')
      .createSignedUrl(path, 60 * 60);

    if (signedError || !signedData?.signedUrl) return material;
    return { ...material, file_url: signedData.signedUrl };
  }));

  return hydrated;
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export async function fetchAssignmentsByLevel(levelId: string): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('level_id', levelId)
    .order('deadline', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Assignment[];
}

// ─── Submissions ──────────────────────────────────────────────────────────────

export async function fetchSubmissionsByStudent(studentId: string): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('student_id', studentId);
  if (error) throw new Error(error.message);

  const submissions = (data ?? []) as Submission[];
  const hydrated = await Promise.all(submissions.map(async (submission) => {
    if (!submission.file_url) return submission;
    const path = resolveSubmissionsPath(submission.file_url);
    if (!path) return submission;
    const { data: signedData, error: signedError } = await supabase.storage.from('submissions').createSignedUrl(path, 60 * 60);
    if (signedError || !signedData?.signedUrl) return submission;
    return { ...submission, file_url: signedData.signedUrl };
  }));

  return hydrated;
}

export async function fetchSubmissionForAssignment(
  assignmentId: string,
  studentId: string
): Promise<Submission | null> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('student_id', studentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const submission = data as Submission;
  if (!submission.file_url) return submission;
  const path = resolveSubmissionsPath(submission.file_url);
  if (!path) return submission;
  const { data: signedData, error: signedError } = await supabase.storage.from('submissions').createSignedUrl(path, 60 * 60);
  if (signedError || !signedData?.signedUrl) return submission;
  return { ...submission, file_url: signedData.signedUrl };
}

export async function submitAssignment(payload: {
  assignmentId: string;
  studentId: string;
  answer: string;
  fileUrl?: string;
}): Promise<void> {
  const { error } = await supabase
    .from('submissions')
    .upsert(
    {
      assignment_id: payload.assignmentId,
      student_id:    payload.studentId,
      answer:        payload.answer,
      file_url:      payload.fileUrl ?? null,
      status:        'submitted',
    },
    { onConflict: 'assignment_id,student_id' }
  );
  if (error) throw new Error(error.message);

  // Notify admins about a new submission (student is allowed only for type=submission via RLS)
  try {
    const { data: a } = await supabase.from('assignments').select('title').eq('id', payload.assignmentId).maybeSingle();
    const assignmentTitle = (a as { title?: string } | null)?.title ?? 'Assignment';
    const { data: createdSub, error: subErr } = await supabase
      .from('submissions')
      .select('id')
      .eq('assignment_id', payload.assignmentId)
      .eq('student_id', payload.studentId)
      .single();
    if (subErr) return;

    const submissionId = (createdSub as { id: string }).id;
    // Use RPC to notify all admins (students can't select admin ids due to RLS on profiles)
    await supabase.rpc('notify_admins', {
      p_type: 'event',
      p_title: 'New assignment submission',
      p_message: `${assignmentTitle} — submitted for review`,
      p_related_id: submissionId,
      p_priority: 'medium',
    });
  } catch {
    // ignore
  }
}

export async function uploadSubmissionFile(
  studentId: string,
  file: File
): Promise<string> {
  const path = `${studentId}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage
    .from('submissions')
    .upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  return path;
}

// ─── Exams ────────────────────────────────────────────────────────────────────

export async function fetchExamsByLevel(levelId: string): Promise<Exam[]> {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('level_id', levelId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Exam[];
}

export async function fetchExamById(examId: string): Promise<Exam> {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('id', examId)
    .single();
  if (error) throw new Error(error.message);
  return data as Exam;
}

export async function fetchQuestionsByExam(examId: string): Promise<ExamQuestion[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', examId)
    .order('order_index', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((q) => ({
    ...q,
    options: Array.isArray(q.options) ? (q.options as string[]) : null,
  })) as ExamQuestion[];
}

export async function fetchResultForExam(studentId: string, examId: string): Promise<Result | null> {
  const { data, error } = await supabase
    .from('results')
    .select('*, exams(title, duration)')
    .eq('student_id', studentId)
    .eq('exam_id', examId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Result | null;
}

export async function submitExamAndGrade(payload: SubmitExamPayload): Promise<{ score: number; passed: boolean }> {
  const questions = await fetchQuestionsByExam(payload.examId);
  if (questions.length === 0) {
    throw new Error('This exam has no questions yet.');
  }

  let correctCount = 0;
  for (const question of questions) {
    const userAnswer = (payload.answers[question.id] ?? '').trim().toLowerCase();
    const expected = (question.correct_answer ?? '').trim().toLowerCase();
    if (userAnswer && expected && userAnswer === expected) {
      correctCount += 1;
    }
  }

  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= 60;

  const { error } = await supabase
    .from('results')
    .upsert(
      {
        student_id: payload.studentId,
        exam_id: payload.examId,
        score,
        passed,
      },
      { onConflict: 'student_id,exam_id' }
    );

  if (error) throw new Error(error.message);

  // Notify admins about exam completion (student -> admin)
  try {
    const { data: ex } = await supabase
      .from('exams')
      .select('title')
      .eq('id', payload.examId)
      .maybeSingle();

    const { data: res } = await supabase
      .from('results')
      .select('id')
      .eq('student_id', payload.studentId)
      .eq('exam_id', payload.examId)
      .maybeSingle();

    const examTitle = (ex as { title?: string } | null)?.title ?? 'Exam';
    const resultId = (res as { id?: string } | null)?.id;
    if (resultId) {
      await supabase.rpc('notify_admins', {
        p_type: 'event',
        p_title: 'New exam submission',
        p_message: `${examTitle} — score ${score}/100 (${passed ? 'passed' : 'not passed'})`,
        p_related_id: resultId,
        p_priority: 'medium',
      });
    }
  } catch {
    // Notifications must never block exam submission.
  }

  return { score, passed };
}

// ─── Results ──────────────────────────────────────────────────────────────────

export async function fetchResultsByStudent(studentId: string): Promise<Result[]> {
  const { data, error } = await supabase
    .from('results')
    .select('*, exams(title, duration)')
    .eq('student_id', studentId)
    .order('taken_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Result[];
}
