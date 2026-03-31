/**
 * studentService.ts
 * All Supabase data-fetching for the Student area.
 */
import { supabase } from '../lib/supabase';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { uploadFileWithProgress, type UploadMetrics } from '../utils/storageUpload';
// notification inserts for student actions are done via RPC (see `notify_admins`)

// Caching Layer
const STUDENT_CACHE: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

function getCache(key: string) {
  const entry = STUDENT_CACHE[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) { delete STUDENT_CACHE[key]; return null; }
  return entry.data;
}
function setCache(key: string, data: any) { STUDENT_CACHE[key] = { data, timestamp: Date.now() }; }
export function invalidateStudentCache() { Object.keys(STUDENT_CACHE).forEach(k => delete STUDENT_CACHE[k]); }

export interface LevelProgress {
  totalItems: number;
  completedItems: number;
  percentage: number;
  levelName: string;
}

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
  role: 'student' | 'admin' | 'instructor';
  current_level: string;
  group_id?: string | null;
  created_at: string;
  group?: { name: string } | null;
  instructor?: { name: string } | null;
}

export interface Group {
  id: string;
  name: string;
  level: string; // updated to allow dynamic level names
  created_at: string;
  student_count?: number;
}

export interface InstructorGroup {
  id: string;
  instructor_id: string;
  group_id: string;
  assigned_at: string;
}

export interface Level {
  id: string;
  name: string;
  description: string | null;
  parent_level_id?: string | null;
  instructor_id?: string | null;
  instructor?: { name: string } | null;
  student_count?: number;
}

export interface Material {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
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
  audio_url?: string | null;
  level_id: string;
  deadline: string | null;
  created_at: string;
  instructor_id?: string | null;
  instructor?: { name: string } | null;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string | null;
  answer: string | null;
  audio_answer_url?: string | null;
  grade: number | null;
  feedback?: string | null;
  status: 'pending' | 'submitted' | 'graded' | 'returned';
  submitted_at: string;
  assignments?: { title: string } | null;
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
  instructor_id?: string | null;
  instructor?: { name: string } | null;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_text: string;
  // Legacy: 'mcq' | 'text'
  // Advanced: 'paragraph' | 'grammar' | 'writing' | 'listening'
  type: 'mcq' | 'text' | 'paragraph' | 'grammar' | 'writing' | 'listening';
  options: string[] | null;
  // Used by advanced types:
  // - paragraph: paragraph text
  // - grammar: sentence template with blanks (client can interpret)
  content: string | null;
  audio_url?: string | null;
  // Legacy
  correct_answer: string | null;
  // New JSON-based correct answer (preferred for advanced types)
  correct_answer_json?: unknown | null;
  order_index: number;
  extra_data?: unknown | null;
}

export async function fetchAllLevelsPublic(): Promise<Level[]> {
  const { data, error } = await supabase
    .from('levels')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Level[];
}

export type ResultReviewStatus = 'pending_review' | 'completed';

export interface Result {
  id: string;
  student_id: string;
  exam_id: string;
  /** Final percentage (0–100). Null while `review_status` is pending_review. */
  score: number | null;
  passed: boolean;
  review_status: ResultReviewStatus;
  taken_at: string;
  exams?: { title: string; duration: number };
}

export interface SubmitExamPayload {
  examId: string;
  studentId: string;
  // Per-question answers in a JSON-friendly format.
  // - mcq / listening / paragraph: string
  // - grammar: string
  // - writing: string
  answers: Record<string, unknown>;
}

export type ExamAnswerGradingStatus = 'pending' | 'auto_graded' | 'reviewed';

export interface ExamAnswer {
  id: string;
  student_id: string;
  exam_id: string;
  question_id: string;
  answer: unknown | null;
  is_correct: boolean | null;
  /** Per-question score 0–100 (writing graded by admin). */
  score: number | null;
  /** Present after DB migration; inferred in UI when missing. */
  answer_status?: ExamAnswerGradingStatus;
  admin_grade: number | null;
  admin_feedback: string | null;
  created_at: string;
  updated_at: string;
}

export function isManualExamQuestion(q: ExamQuestion): boolean {
  return q.type === 'writing' || q.type === 'text';
}

/** Per-question row + question text for result detail UI */
export interface ExamResultQuestionRow {
  question: ExamQuestion;
  answerRow: ExamAnswer | null;
}

// ─── profile ──────────────────────────────────────────────────────────────────

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
    const profile = data as any;
    const signedAvatar = await getSignedAvatarUrl(profile.avatar_url);
    if (signedAvatar) profile.avatar_url = signedAvatar;

    // ── NEW: resolve level / group / instructor from level_students join table ─
    const { data: enrollment } = await supabase
      .from('level_students')
      .select('level_id, assigned_at, levels(id, name, instructor_id, group_id, groups(id, name))')
      .eq('student_id', userId)
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (enrollment?.levels) {
      const lvl = enrollment.levels as any;

      // Current level name e.g. "A1.1"
      profile.current_level = lvl.name ?? profile.current_level ?? '';

      // Parent group e.g. "A1"
      profile.group = lvl.groups ? { id: lvl.groups.id, name: lvl.groups.name } : null;

      // Instructor name
      profile.level_id = lvl.id;
      if (lvl.instructor_id) {
        const { data: inst } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('id', lvl.instructor_id)
          .maybeSingle();
        profile.instructor = inst ? { id: inst.id, name: inst.name } : null;
      } else {
        profile.instructor = null;
      }
    } else {
      // Student not yet assigned to any level
      profile.current_level = profile.current_level ?? null;
      profile.group         = null;
      profile.instructor    = null;
      profile.level_id      = null;
    }

    return profile as Profile;
  }

  // 3. Row missing — pull auth user to build a sane default
  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData?.user;

  const fallback: Omit<Profile, 'created_at'> & { created_at?: string } = {
    id:            userId,
    name:          (authUser?.user_metadata?.name as string) ?? authUser?.email?.split('@')[0] ?? '',
    email:         authUser?.email ?? '',
    phone:         null,
    role:          ((authUser?.user_metadata?.role as string) ?? 'student') as 'student' | 'admin' | 'instructor',
    current_level: 'A1',
    group_id:      null,
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

export async function fetchMyAssignedMaterials(studentId: string): Promise<Material[]> {
  const cacheKey = `materials_${studentId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('material_assignments')
    .select(`
      material_id,
      available_from,
      materials (*)
    `)
    .eq('student_id', studentId)
    .eq('visible', true)
    .lte('available_from', new Date().toISOString())
    .order('available_from', { ascending: false });

  if (error) throw new Error(error.message);

  const raw = (data ?? []) as unknown as Array<{ materials: Material }>;
  const materials = raw.map(row => row.materials).filter(Boolean);
  const hydrated = await Promise.all(materials.map(async (material) => {
    const path = resolveMaterialsPath(material.file_url);
    if (!path) return material;

    const { data: signedData, error: signedError } = await supabase.storage
      .from('materials')
      .createSignedUrl(path, 60 * 60);

    if (signedError || !signedData?.signedUrl) return material;
    return { ...material, file_url: signedData.signedUrl };
  }));

  setCache(cacheKey, hydrated);
  return hydrated;
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export async function fetchAssignmentsByLevel(levelId: string): Promise<Assignment[]> {
  const cacheKey = `assignments_${levelId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('level_id', levelId)
    .order('deadline', { ascending: true });
  if (error) throw new Error(error.message);
  const assignments = (data ?? []) as Assignment[];
  const hydrated = await Promise.all(assignments.map(async (assignment) => {
    if (!assignment.audio_url) return assignment;
    const path = resolveMaterialsPath(assignment.audio_url);
    if (!path) return assignment;
    const { data: signedData, error: signedError } = await supabase.storage.from('materials').createSignedUrl(path, 15 * 60);
    if (signedError || !signedData?.signedUrl) return assignment;
    return { ...assignment, audio_url: signedData.signedUrl };
  }));
  setCache(cacheKey, hydrated);
  return hydrated;
}

// ─── Submissions ──────────────────────────────────────────────────────────────

export async function fetchSubmissionsByStudent(studentId: string): Promise<Submission[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*, assignments(title)')
    .eq('student_id', studentId);
  if (error) throw new Error(error.message);

  const submissions = (data ?? []) as Submission[];
  const hydrated = await Promise.all(submissions.map(async (submission) => {
    if (!submission.file_url) return submission;
    const path = resolveSubmissionsPath(submission.file_url);
    if (!path) return submission;
    const { data: signedData, error: signedError } = await supabase.storage.from('submissions').createSignedUrl(path, 60 * 60);
    if (signedError || !signedData?.signedUrl) return submission;
    const fileHydrated = { ...submission, file_url: signedData.signedUrl };
    if (!submission.audio_answer_url) return fileHydrated;
    const audioPath = resolveSubmissionsPath(submission.audio_answer_url);
    if (!audioPath) return fileHydrated;
    const { data: audioSignedData, error: audioSignedError } = await supabase.storage.from('submissions').createSignedUrl(audioPath, 60 * 60);
    if (audioSignedError || !audioSignedData?.signedUrl) return fileHydrated;
    return { ...fileHydrated, audio_answer_url: audioSignedData.signedUrl };
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
  const next: Submission = { ...submission };
  if (submission.file_url) {
    const path = resolveSubmissionsPath(submission.file_url);
    if (path) {
      const { data: signedData } = await supabase.storage.from('submissions').createSignedUrl(path, 60 * 60);
      if (signedData?.signedUrl) next.file_url = signedData.signedUrl;
    }
  }
  if (submission.audio_answer_url) {
    const audioPath = resolveSubmissionsPath(submission.audio_answer_url);
    if (audioPath) {
      const { data: signedAudioData } = await supabase.storage.from('submissions').createSignedUrl(audioPath, 60 * 60);
      if (signedAudioData?.signedUrl) next.audio_answer_url = signedAudioData.signedUrl;
    }
  }
  return next;
}

export async function submitAssignment(payload: {
  assignmentId: string;
  studentId: string;
  answer: string;
  fileUrl?: string;
  audioAnswerUrl?: string;
}): Promise<void> {
  invalidateStudentCache();
  const { error } = await supabase
    .from('submissions')
    .upsert(
    {
      assignment_id: payload.assignmentId,
      student_id:    payload.studentId,
      answer:        payload.answer,
      file_url:      payload.fileUrl ?? null,
      audio_answer_url: payload.audioAnswerUrl ?? null,
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
  file: File,
  onProgress?: (metrics: UploadMetrics) => void
): Promise<string> {
  const path = `${studentId}/${Date.now()}_${file.name}`;
  return uploadFileWithProgress({
    bucket: 'submissions',
    path,
    file,
    upsert: true,
    onProgress,
  });
}

export async function uploadSubmissionAudio(
  studentId: string,
  file: File,
  onProgress?: (metrics: UploadMetrics) => void
): Promise<string> {
  const path = `${studentId}/${Date.now()}_${file.name}`;
  return uploadFileWithProgress({
    bucket: 'submissions',
    path,
    file,
    upsert: true,
    onProgress,
  });
}

// ─── Exams ────────────────────────────────────────────────────────────────────

export async function fetchExamsByLevel(levelId: string): Promise<Exam[]> {
  const cacheKey = `exams_${levelId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('level_id', levelId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  const res = (data ?? []) as Exam[];
  setCache(cacheKey, res);
  return res;
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
  const mapped = (data ?? []).map((q: any) => ({
    ...q,
    options: Array.isArray(q.options) ? (q.options as string[]) : null,
    content: q.content ?? null,
    correct_answer: q.correct_answer ?? null,
    correct_answer_json: q.correct_answer_json ?? null,
    extra_data: q.extra_data ?? null,
  })) as ExamQuestion[];

  const hydrated = await Promise.all(mapped.map(async (q) => {
    if (!q.audio_url) return q;
    const path = resolveMaterialsPath(q.audio_url);
    if (!path) return q;
    const { data: signedData } = await supabase.storage.from('materials').createSignedUrl(path, 15 * 60);
    if (!signedData?.signedUrl) return q;
    return { ...q, audio_url: signedData.signedUrl };
  }));

  return hydrated;
}

export async function fetchExamAnswers(
  studentId: string,
  examId: string
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from('exam_answers')
    .select('question_id, answer')
    .eq('student_id', studentId)
    .eq('exam_id', examId);

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const map: Record<string, unknown> = {};
  for (const r of rows as Array<{ question_id: string; answer: unknown }>) {
    map[r.question_id] = r.answer;
  }
  return map;
}

export async function upsertExamAnswer(payload: {
  studentId: string;
  examId: string;
  questionId: string;
  answer: unknown;
}): Promise<void> {
  // SECURITY DEFINER RPC: writes as DB role, avoids RLS false negatives (level string mismatch, upsert quirks).
  const { error } = await supabase.rpc('upsert_student_exam_answer', {
    p_exam_id: payload.examId,
    p_question_id: payload.questionId,
    p_answer: (payload.answer ?? null) as never,
  });
  if (error) throw new Error(error.message);
}

export async function fetchResultForExam(studentId: string, examId: string): Promise<Result | null> {
  const { data, error } = await supabase
    .from('results')
    .select('*, exams(title, duration)')
    .eq('student_id', studentId)
    .eq('exam_id', examId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeExamResultRow(data) : null;
}

export function normalizeExamResultRow(data: unknown): Result {
  const r = data as Record<string, unknown>;
  const rs = (r.review_status as ResultReviewStatus | undefined) ?? 'completed';
  const sc = r.score;
  return {
    ...(r as unknown as Result),
    review_status: rs,
    score: sc === undefined || sc === null ? (rs === 'pending_review' ? null : 0) : Number(sc),
    passed: Boolean(r.passed),
  };
}

export async function submitExamAndGrade(
  payload: SubmitExamPayload
): Promise<{ score: number | null; passed: boolean; pendingReview: boolean }> {
  invalidateStudentCache();
  const questions = await fetchQuestionsByExam(payload.examId);
  if (questions.length === 0) {
    throw new Error('This exam has no questions yet.');
  }

  const existing = await fetchResultForExam(payload.studentId, payload.examId);
  if (existing) {
    throw new Error('This exam was already submitted.');
  }

  const computeIsCorrect = (question: ExamQuestion, answer: unknown): boolean | null => {
    // Writing is manual review.
    if (question.type === 'writing' || question.type === 'text') return null;

    // Normalize "answer" into primitives depending on expected type.
    const expectedJson = (question.correct_answer_json ?? null) as unknown;
    const expectedLegacy = question.correct_answer ?? null;
    const expected = expectedJson ?? expectedLegacy;

    const toLower = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '');

    switch (question.type) {
      case 'mcq': {
        const user = toLower(answer);
        const exp = toLower(expected);
        if (!user || !exp) return false;
        return user === exp;
      }
      case 'paragraph': {
        const subtype = (question.extra_data as any)?.subtype ?? (question.extra_data as any)?.question_subtype ?? 'mcq';
        const isTrueFalse = String(subtype).toLowerCase().includes('true');

        if (isTrueFalse) {
          // Answer can be boolean or a string.
          const expectedBool =
            typeof expected === 'boolean'
              ? expected
              : typeof expected === 'string'
                ? expected.trim().toLowerCase() === 'true'
                : null;

          if (expectedBool === null) return false;

          const userBool =
            typeof answer === 'boolean'
              ? answer
              : typeof answer === 'string'
                ? answer.trim().toLowerCase() === 'true'
                : null;

          if (userBool === null) return false;
          return userBool === expectedBool;
        }

        const user = toLower(answer);
        const exp = toLower(expected);
        if (!user || !exp) return false;
        return user === exp;
      }
      case 'grammar': {
        // Single blank drag/drop: correct answer is the chosen word.
        const user = toLower(answer);
        const exp = toLower(expected);
        if (!user || !exp) return false;
        return user === exp;
      }
      case 'listening': {
        const user = toLower(answer);
        const exp = toLower(expected);
        if (!user || !exp) return false;
        return user === exp;
      }
      default:
        return false;
    }
  };

  const hasWriting = questions.some((q) => isManualExamQuestion(q));

  const p_rows = questions.map((q) => {
    const raw = payload.answers[q.id];
    const answer = raw === undefined ? null : raw;
    if (isManualExamQuestion(q)) {
      return {
        question_id: q.id,
        answer,
        is_correct: null as boolean | null,
        answer_status: 'pending',
        score: null as number | null,
      };
    }
    const is_correct = computeIsCorrect(q, answer);
    const ok = is_correct === true;
    return {
      question_id: q.id,
      answer,
      is_correct,
      answer_status: 'auto_graded',
      score: ok ? 100 : 0,
    };
  });

  const { error: answersErr } = await supabase.rpc('submit_exam_answers_graded', {
    p_exam_id: payload.examId,
    p_rows: p_rows,
  });
  if (answersErr) throw new Error(answersErr.message);

  const autoQs = questions.filter((q) => !isManualExamQuestion(q));
  const autoCorrect = autoQs.filter((q) => computeIsCorrect(q, payload.answers[q.id]) === true).length;
  const finalScore =
    !hasWriting && autoQs.length > 0
      ? Math.round((autoCorrect / autoQs.length) * 100)
      : hasWriting
        ? null
        : 0;
  const passed = finalScore !== null && finalScore >= 60;

  const { error: resultsErr } = await supabase.from('results').insert({
    student_id: payload.studentId,
    exam_id: payload.examId,
    score: finalScore,
    passed: passed,
    review_status: hasWriting ? 'pending_review' : 'completed',
  });
  if (resultsErr) throw new Error(resultsErr.message);

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
      const msg = hasWriting
        ? `${examTitle} — submitted (writing sections pending manual review)`
        : `${examTitle} — score ${finalScore}/100 (${passed ? 'passed' : 'not passed'})`;
      await supabase.rpc('notify_admins', {
        p_type: 'event',
        p_title: hasWriting ? 'Exam needs writing review' : 'New exam submission',
        p_message: msg,
        p_related_id: resultId,
        p_priority: hasWriting ? 'high' : 'medium',
      });
    }
  } catch {
    // Notifications must never block exam submission.
  }

  return {
    score: finalScore,
    passed,
    pendingReview: hasWriting,
  };
}

// ─── Results ──────────────────────────────────────────────────────────────────

export async function fetchResultsByStudent(studentId: string): Promise<Result[]> {
  const { data, error } = await supabase
    .from('results')
    .select('*, exams(title, duration)')
    .eq('student_id', studentId)
    .order('taken_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalizeExamResultRow(row));
}

/** Questions + saved answers for a submitted exam (student owns rows via RLS). */
export async function fetchStudentExamResultDetail(
  studentId: string,
  examId: string
): Promise<{ result: Result | null; rows: ExamResultQuestionRow[] }> {
  const [questions, ansRes, result] = await Promise.all([
    fetchQuestionsByExam(examId),
    supabase.from('exam_answers').select('*').eq('student_id', studentId).eq('exam_id', examId),
    fetchResultForExam(studentId, examId),
  ]);
  if (ansRes.error) throw new Error(ansRes.error.message);
  const list = (ansRes.data ?? []).map((row) => {
    const a = row as ExamAnswer;
    const inferred: ExamAnswerGradingStatus =
      a.answer_status ??
      (a.is_correct != null ? 'auto_graded' : 'pending');
    return { ...a, answer_status: inferred };
  });
  const byQ = new Map(list.map((a) => [a.question_id, a]));
  const rows: ExamResultQuestionRow[] = questions.map((q) => ({
    question: q,
    answerRow: byQ.get(q.id) ?? null,
  }));
  return { result, rows };
}
export async function fetchLevelProgress(studentId: string): Promise<LevelProgress | null> {
  try {
    // 1. Get student's current level
    const { data: mapping } = await supabase
      .from('level_students')
      .select('level_id, levels(name)')
      .eq('student_id', studentId)
      .maybeSingle();
    
    if (!mapping?.level_id) return null;
    const levelId = mapping.level_id;
    const levelName = (mapping.levels as any)?.name || 'Unknown Level';

    // 2. Total Assignments in this level
    const { count: totalAsgn } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('level_id', levelId);

    // 3. Completed Assignments (submissions)
    const { count: completedAsgn } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .in('assignment_id', (await supabase.from('assignments').select('id').eq('level_id', levelId)).data?.map(a => a.id) || []);

    // 4. Total Exams in this level
    const { count: totalExams } = await supabase
      .from('exams')
      .select('*', { count: 'exact', head: true })
      .eq('level_id', levelId);

    // 5. Completed Exams (results)
    const { count: completedExams } = await supabase
      .from('results')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .in('exam_id', (await supabase.from('exams').select('id').eq('level_id', levelId)).data?.map(e => e.id) || []);

    const total = (totalAsgn || 0) + (totalExams || 0);
    const completed = (completedAsgn || 0) + (completedExams || 0);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      totalItems: total,
      completedItems: completed,
      percentage,
      levelName
    };
  } catch (err) {
    console.error('Error fetching progress:', err);
    return null;
  }
}
