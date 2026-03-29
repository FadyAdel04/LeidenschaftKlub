/**
 * adminService.ts
 * All Supabase queries for the Admin area.
 */
import { supabase } from '../lib/supabase';
import type {
  Profile,
  Level,
  Material,
  Assignment,
  Exam,
  Submission,
  ExamQuestion,
  Result,
  ExamAnswer as ExamAnswerCore,
} from './studentService';
import { normalizeExamResultRow } from './studentService';
import { insertNotificationsBatch, insertNotification } from './notificationService';
import { uploadFileWithProgress, type UploadMetrics } from '../utils/storageUpload';

export type { Profile, Level, Material, Assignment, Exam, Submission, ExamQuestion, Result };

export type ExamAnswer = ExamAnswerCore & {
  profiles?: { name: string; email: string };
  exams?: { title: string };
  questions?: { question_text: string; type: string; extra_data: unknown | null };
};

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

// ─── Students ─────────────────────────────────────────────────────────────────

export async function fetchAllStudents(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Profile[];
}

export async function updateStudentLevel(studentId: string, newLevel: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ current_level: newLevel })
    .eq('id', studentId);
  if (error) throw new Error(error.message);
}

// ─── Levels ───────────────────────────────────────────────────────────────────

export async function fetchAllLevels(): Promise<Level[]> {
  const { data, error } = await supabase
    .from('levels')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Level[];
}

export async function createLevel(payload: { name: string; description?: string | null }): Promise<void> {
  const { error } = await supabase.from('levels').insert({
    name: payload.name,
    description: payload.description || null,
  });
  if (error) throw new Error(error.message);
}

export async function updateLevel(id: string, payload: { name: string; description?: string | null }): Promise<void> {
  const { error } = await supabase
    .from('levels')
    .update({ name: payload.name, description: payload.description || null })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteLevel(id: string): Promise<void> {
  const { error } = await supabase.from('levels').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Materials ────────────────────────────────────────────────────────────────

export async function fetchAllMaterials(): Promise<(Material & { levels?: { name: string } })[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*, levels(name)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const materials = (data ?? []) as (Material & { levels?: { name: string } })[];
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

export async function uploadMaterial(payload: {
  title: string;
  levelId: string;
  description?: string;
  type?: string;
  file: File;
  onProgress?: (metrics: UploadMetrics) => void;
}): Promise<void> {
  if (!payload.levelId) {
    throw new Error('Please choose a level before uploading material.');
  }

  // 1. Upload file to storage
  const path = `materials/${Date.now()}_${payload.file.name}`;
  await uploadFileWithProgress({
    bucket: 'materials',
    path,
    file: payload.file,
    upsert: true,
    onProgress: payload.onProgress,
  });

  // 2. Insert row in DB (store storage path, not public URL)
  const { data: created, error: dbError } = await supabase
    .from('materials')
    .insert({
      title: payload.title,
      file_url: path,
      level_id: payload.levelId,
      description: payload.description || null,
      type: payload.type || 'file',
    })
    .select('id, level_id')
    .single();
  if (dbError) {
    await supabase.storage.from('materials').remove([path]);
    throw new Error(dbError.message);
  }

  // 3. Notify all students in this level
  try {
    const { data: authData } = await supabase.auth.getUser();
    const createdBy = authData.user?.id ?? null;
    const { data: lvl } = await supabase.from('levels').select('name').eq('id', payload.levelId).maybeSingle();
    const levelName = lvl?.name as string | undefined;
    if (levelName) {
      const { data: students } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'student')
        .eq('current_level', levelName);
      const ids = (students ?? []).map(s => (s as { id: string }).id);
      await insertNotificationsBatch(
        ids.map(uid => ({
          userId: uid,
          type: 'announcement',
          title: 'New material available',
          message: `Material: ${payload.title}`,
          relatedId: created?.id ?? null,
          priority: 'medium',
          isActive: true,
          createdBy,
        }))
      );
    }
  } catch {
    // never block uploads on notification failures
  }
}

export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchStudentsByLevel(levelId: string): Promise<Profile[]> {
  const { data: levelData, error: levelError } = await supabase
    .from('levels')
    .select('name')
    .eq('id', levelId)
    .single();
  
  if (levelError) throw new Error(levelError.message);

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .eq('current_level', levelData.name)
    .order('name', { ascending: true });
  
  if (error) throw new Error(error.message);
  return (data ?? []) as Profile[];
}

export async function syncMaterialAssignments(payload: {
  materialId: string;
  studentIds: string[];
  availableFrom: string;
  visible: boolean;
}): Promise<void> {
  // 1. Clear existing assignments for this material to allow unassigning
  const { error: delError } = await supabase
    .from('material_assignments')
    .delete()
    .eq('material_id', payload.materialId);
  
  if (delError) throw new Error(delError.message);

  // 2. Insert new assignments if any students are selected
  if (payload.studentIds.length === 0) return;

  const assignments = payload.studentIds.map(studentId => ({
    material_id: payload.materialId,
    student_id: studentId,
    available_from: payload.availableFrom,
    visible: payload.visible,
  }));

  const { error: insError } = await supabase
    .from('material_assignments')
    .insert(assignments);
  
  if (insError) throw new Error(insError.message);
}

export async function fetchMaterialAssignments(materialId: string) {
  const { data, error } = await supabase
    .from('material_assignments')
    .select('student_id')
    .eq('material_id', materialId);
  
  if (error) throw new Error(error.message);
  return (data ?? []).map(a => a.student_id);
}

export async function updateMaterial(payload: {
  id: string;
  title: string;
  levelId: string;
  description?: string;
  type?: string;
  file?: File | null;
  onProgress?: (metrics: UploadMetrics) => void;
}): Promise<void> {
  let nextPath: string | null = null;
  if (payload.file) {
    nextPath = `materials/${Date.now()}_${payload.file.name}`;
    await uploadFileWithProgress({
      bucket: 'materials',
      path: nextPath,
      file: payload.file,
      upsert: true,
      onProgress: payload.onProgress,
    });
  }

  const updates: { title: string; level_id: string; file_url?: string; description?: string; type?: string } = {
    title: payload.title,
    level_id: payload.levelId,
    description: payload.description,
    type: payload.type,
  };
  if (nextPath) updates.file_url = nextPath;

  const { error } = await supabase.from('materials').update(updates).eq('id', payload.id);
  if (error) throw new Error(error.message);
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export async function fetchAllAssignments(): Promise<(Assignment & { levels?: { name: string } })[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*, levels(name)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as (Assignment & { levels?: { name: string } })[];
  const hydrated = await Promise.all(rows.map(async (row) => {
    if (!row.audio_url) return row;
    const path = resolveMaterialsPath(row.audio_url);
    if (!path) return row;
    const { data: signedData } = await supabase.storage.from('materials').createSignedUrl(path, 60 * 60);
    if (!signedData?.signedUrl) return row;
    return { ...row, audio_url: signedData.signedUrl };
  }));
  return hydrated;
}

export async function createAssignment(payload: {
  title: string;
  description: string;
  levelId: string;
  deadline: string | null;
  audioUrl?: string | null;
}): Promise<void> {
  if (!payload.levelId) {
    throw new Error('Please choose a level before creating assignment.');
  }

  const { data: created, error } = await supabase
    .from('assignments')
    .insert({
    title:       payload.title,
    description: payload.description || null,
    audio_url: payload.audioUrl || null,
    level_id:    payload.levelId,
    deadline:    payload.deadline || null,
    })
    .select('id, level_id')
    .single();
  if (error) throw new Error(error.message);

  try {
    const { data: authData } = await supabase.auth.getUser();
    const createdBy = authData.user?.id ?? null;
    const { data: lvl } = await supabase.from('levels').select('name').eq('id', payload.levelId).maybeSingle();
    const levelName = lvl?.name as string | undefined;
    if (levelName) {
      const { data: students } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'student')
        .eq('current_level', levelName);
      const ids = (students ?? []).map(s => (s as { id: string }).id);
      await insertNotificationsBatch(
        ids.map(uid => ({
          userId: uid,
          type: 'announcement',
          title: 'New assignment available',
          message: `Assignment: ${payload.title}`,
          relatedId: created?.id ?? null,
          priority: 'medium',
          isActive: true,
          createdBy,
        }))
      );
    }
  } catch {
    // ignore
  }
}

export async function deleteAssignment(id: string): Promise<void> {
  const { error } = await supabase.from('assignments').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updateAssignment(payload: {
  id: string;
  title: string;
  description: string;
  audioUrl?: string | null;
  levelId: string;
  deadline: string | null;
}): Promise<void> {
  const { error } = await supabase
    .from('assignments')
    .update({
      title: payload.title,
      description: payload.description || null,
      audio_url: payload.audioUrl || null,
      level_id: payload.levelId,
      deadline: payload.deadline || null,
    })
    .eq('id', payload.id);
  if (error) throw new Error(error.message);
}

// ─── Exams ────────────────────────────────────────────────────────────────────

export async function fetchAllExams(): Promise<(Exam & { levels?: { name: string } })[]> {
  const { data, error } = await supabase
    .from('exams')
    .select('*, levels(name)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as (Exam & { levels?: { name: string } })[];
}

export async function createExam(payload: {
  title: string;
  levelId: string;
  duration: number;
}): Promise<void> {
  if (!payload.levelId) {
    throw new Error('Please choose a level before creating exam.');
  }

  const { data: created, error } = await supabase
    .from('exams')
    .insert({
    title:    payload.title,
    level_id: payload.levelId,
    duration: payload.duration,
    })
    .select('id, level_id')
    .single();
  if (error) throw new Error(error.message);

  try {
    const { data: authData } = await supabase.auth.getUser();
    const createdBy = authData.user?.id ?? null;
    const { data: lvl } = await supabase.from('levels').select('name').eq('id', payload.levelId).maybeSingle();
    const levelName = lvl?.name as string | undefined;
    if (levelName) {
      const { data: students } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'student')
        .eq('current_level', levelName);
      const ids = (students ?? []).map(s => (s as { id: string }).id);
      await insertNotificationsBatch(
        ids.map(uid => ({
          userId: uid,
          type: 'announcement',
          title: 'New exam available',
          message: `Exam: ${payload.title}`,
          relatedId: created?.id ?? null,
          priority: 'medium',
          isActive: true,
          createdBy,
        }))
      );
    }
  } catch {
    // ignore
  }
}

export async function deleteExam(id: string): Promise<void> {
  const { error } = await supabase.from('exams').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updateExam(payload: {
  id: string;
  title: string;
  levelId: string;
  duration: number;
}): Promise<void> {
  const { error } = await supabase
    .from('exams')
    .update({ title: payload.title, level_id: payload.levelId, duration: payload.duration })
    .eq('id', payload.id);
  if (error) throw new Error(error.message);
}

export async function fetchQuestionsByExamAdmin(examId: string): Promise<ExamQuestion[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('exam_id', examId)
    .order('order_index', { ascending: true });
  if (error) throw new Error(error.message);
  const mapped = (data ?? []).map((q) => ({
    ...q,
    options: Array.isArray(q.options) ? (q.options as string[]) : null,
  })) as ExamQuestion[];
  const hydrated = await Promise.all(mapped.map(async (q) => {
    if (!q.audio_url) return q;
    const path = resolveMaterialsPath(q.audio_url);
    if (!path) return q;
    const { data: signedData } = await supabase.storage.from('materials').createSignedUrl(path, 60 * 60);
    if (!signedData?.signedUrl) return q;
    return { ...q, audio_url: signedData.signedUrl };
  }));
  return hydrated;
}

export async function createExamQuestion(payload: {
  examId: string;
  questionText: string;
  // Legacy fields (mcq):
  options?: string[] | null;
  correctAnswer?: string | null;
  orderIndex: number;
  // Advanced fields:
  qType?: 'mcq' | 'text' | 'paragraph' | 'grammar' | 'writing' | 'listening';
  content?: string | null;
  audioUrl?: string | null;
  extraData?: unknown | null;
  correctAnswerJson?: unknown | null;
}): Promise<void> {
  const { error } = await supabase.from('questions').insert({
    exam_id: payload.examId,
    question_text: payload.questionText,
    type: payload.qType ?? 'mcq',
    options: payload.options ?? null,
    content: payload.content ?? null,
    audio_url: payload.audioUrl || null,
    extra_data: payload.extraData ?? null,
    correct_answer: (payload.correctAnswer ?? '') as string,
    correct_answer_json: payload.correctAnswerJson ?? null,
    order_index: payload.orderIndex,
  });
  if (error) throw new Error(error.message);
}

export async function bulkCreateExamQuestions(payload: {
  examId: string;
  questions: Array<{ questionText: string; options: string[]; correctAnswer: string; audioUrl?: string | null }>;
}): Promise<void> {
  const rows = payload.questions.map((q, idx) => ({
    exam_id: payload.examId,
    question_text: q.questionText,
    type: 'mcq',
    options: q.options,
    audio_url: q.audioUrl || null,
    correct_answer: q.correctAnswer,
    order_index: idx + 1,
  }));

  const { error } = await supabase.from('questions').insert(rows);
  if (error) throw new Error(error.message);
}

export async function uploadMaterialAsset(file: File, onProgress?: (metrics: UploadMetrics) => void): Promise<string> {
  const path = `materials/${Date.now()}_${file.name}`;
  return uploadFileWithProgress({
    bucket: 'materials',
    path,
    file,
    upsert: true,
    onProgress,
  });
}

export async function deleteExamQuestion(questionId: string): Promise<void> {
  const { error } = await supabase.from('questions').delete().eq('id', questionId);
  if (error) throw new Error(error.message);
}

// ─── Submissions (for grading) ────────────────────────────────────────────────

export async function fetchAllSubmissions(): Promise<(Submission & {
  profiles?: { name: string; email: string };
  assignments?: { title: string };
})[]> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*, profiles(name, email), assignments(title)')
    .order('submitted_at', { ascending: false });
  if (error) throw new Error(error.message);
  const submissions = (data ?? []) as (Submission & {
    profiles?: { name: string; email: string };
    assignments?: { title: string };
  })[];

  const hydrated = await Promise.all(submissions.map(async (submission) => {
    let next = { ...submission };
    if (submission.file_url) {
      const path = resolveSubmissionsPath(submission.file_url);
      if (path) {
        const { data: signedData, error: signedError } = await supabase.storage.from('submissions').createSignedUrl(path, 60 * 60);
        if (!signedError && signedData?.signedUrl) next = { ...next, file_url: signedData.signedUrl };
      }
    }
    if (submission.audio_answer_url) {
      const audioPath = resolveSubmissionsPath(submission.audio_answer_url);
      if (audioPath) {
        const { data: audioSignedData, error: audioSignedError } = await supabase.storage.from('submissions').createSignedUrl(audioPath, 60 * 60);
        if (!audioSignedError && audioSignedData?.signedUrl) next = { ...next, audio_answer_url: audioSignedData.signedUrl };
      }
    }
    return next;
  }));

  return hydrated;
}

export async function gradeSubmission(id: string, grade: number, feedback?: string): Promise<void> {
  const { error } = await supabase
    .from('submissions')
    .update({ grade, status: 'graded', feedback: feedback || null })
    .eq('id', id);
  if (error) throw new Error(error.message);

  // Notify that student
  try {
    const { data: authData } = await supabase.auth.getUser();
    const createdBy = authData.user?.id ?? null;
    const { data: sub } = await supabase
      .from('submissions')
      .select('student_id, assignment_id, assignments(title)')
      .eq('id', id)
      .maybeSingle();
    const studentId = (sub as { student_id?: string } | null)?.student_id;
    if (studentId) {
      const assignmentTitle = (sub as { assignments?: { title?: string } } | null)?.assignments?.title ?? 'Assignment';
      await insertNotification({
        userId: studentId,
        type: 'alert',
        title: 'Assignment reviewed',
        message: `${assignmentTitle} — graded ${grade}/100${feedback ? ' (feedback added)' : ''}`,
        relatedId: id,
        priority: 'high',
        isActive: true,
        createdBy,
      });
    }
  } catch {
    // ignore
  }
}

export async function fetchAllExamResults(): Promise<(Result & {
  profiles?: { name: string; email: string };
  exams?: { title: string; duration: number };
})[]> {
  const { data, error } = await supabase
    .from('results')
    .select('*, profiles(name, email), exams(title, duration)')
    .order('taken_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalizeExamResultRow(row)) as never[];
}

/** All exam submissions (for admin review queue / listings). */
export async function fetchAllExamSubmissions(): Promise<
  (Result & {
    profiles?: { name: string; email: string };
    exams?: { title: string; duration: number };
  })[]
> {
  return fetchAllExamResults();
}

export type ExamReviewBundle = {
  exam: Exam & { levels?: { name: string } | null };
  profile: Profile;
  questions: ExamQuestion[];
  answers: ExamAnswer[];
  result: Result | null;
};

export async function fetchExamReviewBundle(examId: string, studentId: string): Promise<ExamReviewBundle> {
  const [examRes, profileRes, questions, ansRes, resultRes] = await Promise.all([
    supabase.from('exams').select('*, levels(name)').eq('id', examId).single(),
    supabase.from('profiles').select('id, name, email, role, current_level').eq('id', studentId).single(),
    fetchQuestionsByExamAdmin(examId),
    supabase.from('exam_answers').select('*').eq('exam_id', examId).eq('student_id', studentId),
    supabase.from('results').select('*').eq('exam_id', examId).eq('student_id', studentId).maybeSingle(),
  ]);
  if (examRes.error) throw new Error(examRes.error.message);
  if (profileRes.error) throw new Error(profileRes.error.message);
  if (ansRes.error) throw new Error(ansRes.error.message);
  if (resultRes.error) throw new Error(resultRes.error.message);

  return {
    exam: examRes.data as Exam & { levels?: { name: string } },
    profile: profileRes.data as Profile,
    questions,
    answers: (ansRes.data ?? []) as ExamAnswer[],
    result: resultRes.data ? normalizeExamResultRow(resultRes.data) : null,
  };
}

// ─── Writing Question Review ──────────────────────────────────────────────

export async function fetchWritingAnswersForReview(): Promise<ExamAnswer[]> {
  const { data: qRows, error: qErr } = await supabase
    .from('questions')
    .select('id')
    .in('type', ['writing', 'text']);
  if (qErr) throw new Error(qErr.message);

  const ids = (qRows ?? []).map((r) => (r as { id: string }).id);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('exam_answers')
    .select('*, profiles(name, email), exams(title), questions(question_text, type, extra_data)')
    .eq('answer_status', 'pending')
    .in('question_id', ids);

  if (error) throw new Error(error.message);
  return (data ?? []) as ExamAnswer[];
}

/** Recompute final result when all manual questions are reviewed; otherwise keep pending_review. */
export async function recomputeExamResultStatus(studentId: string, examId: string): Promise<void> {
  const { data: qs, error: qErr } = await supabase
    .from('questions')
    .select('id, type')
    .eq('exam_id', examId)
    .order('order_index', { ascending: true });
  if (qErr) throw new Error(qErr.message);

  const { data: ans, error: aErr } = await supabase
    .from('exam_answers')
    .select('question_id, answer_status, score')
    .eq('student_id', studentId)
    .eq('exam_id', examId);
  if (aErr) throw new Error(aErr.message);

  const questions = (qs ?? []) as Array<{ id: string; type: string }>;
  const answers = (ans ?? []) as Array<{
    question_id: string;
    answer_status: string | null;
    score: number | null;
  }>;
  const ansMap = new Map(answers.map((a) => [a.question_id, a]));

  const manual = questions.filter((q) => q.type === 'writing' || q.type === 'text');
  for (const q of manual) {
    const row = ansMap.get(q.id);
    if (!row || row.answer_status !== 'reviewed' || row.score == null) {
      await supabase
        .from('results')
        .update({ review_status: 'pending_review' })
        .eq('student_id', studentId)
        .eq('exam_id', examId);
      return;
    }
  }

  let sum = 0;
  let n = 0;
  for (const q of questions) {
    const row = ansMap.get(q.id);
    if (!row || row.score == null) continue;
    sum += Number(row.score);
    n++;
  }
  const total = n > 0 ? Math.round(sum / n) : 0;
  const passed = total >= 60;
  const { error: resErr } = await supabase
    .from('results')
    .update({ score: total, passed, review_status: 'completed' })
    .eq('student_id', studentId)
    .eq('exam_id', examId);
  if (resErr) throw new Error(resErr.message);
}

export async function gradeExamAnswer(payload: {
  answerId: string;
  grade: number;
  feedback?: string;
}): Promise<void> {
  const { error: updateErr } = await supabase
    .from('exam_answers')
    .update({
      score: payload.grade,
      admin_grade: payload.grade,
      admin_feedback: payload.feedback || null,
      answer_status: 'reviewed',
    })
    .eq('id', payload.answerId);

  if (updateErr) throw new Error(updateErr.message);

  const { data: row } = await supabase.from('exam_answers').select('student_id, exam_id').eq('id', payload.answerId).maybeSingle();
  if (!row) return;

  await recomputeExamResultStatus(row.student_id as string, row.exam_id as string);
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function fetchDashboardStats() {
  const [students, materials, assignments, exams, submissions] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'student'),
    supabase.from('materials').select('id', { count: 'exact' }),
    supabase.from('assignments').select('id', { count: 'exact' }),
    supabase.from('exams').select('id', { count: 'exact' }),
    supabase.from('submissions').select('id, grade', { count: 'exact' }),
  ]);

  const grades = (submissions.data ?? []).map(s => s.grade).filter(Boolean) as number[];
  const avgScore = grades.length ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : 0;

  return {
    students:    students.count    ?? 0,
    materials:   materials.count   ?? 0,
    assignments: assignments.count ?? 0,
    exams:       exams.count       ?? 0,
    avgScore,
  };
}
