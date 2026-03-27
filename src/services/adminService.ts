/**
 * adminService.ts
 * All Supabase queries for the Admin area.
 */
import { supabase } from '../lib/supabase';
import type { Profile, Level, Material, Assignment, Exam, Submission, ExamQuestion, Result } from './studentService';
import { insertNotificationsBatch, insertNotification } from './notificationService';

export type { Profile, Level, Material, Assignment, Exam, Submission, ExamQuestion, Result };

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
  file: File;
}): Promise<void> {
  if (!payload.levelId) {
    throw new Error('Please choose a level before uploading material.');
  }

  // 1. Upload file to storage
  const path = `materials/${Date.now()}_${payload.file.name}`;
  const { error: storageError } = await supabase.storage
    .from('materials')
    .upload(path, payload.file, { upsert: true });
  if (storageError) throw new Error(storageError.message);

  // 2. Insert row in DB (store storage path, not public URL)
  const { data: created, error: dbError } = await supabase
    .from('materials')
    .insert({
    title:    payload.title,
    file_url: path,
    level_id: payload.levelId,
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

export async function updateMaterial(payload: {
  id: string;
  title: string;
  levelId: string;
  file?: File | null;
}): Promise<void> {
  let nextPath: string | null = null;
  if (payload.file) {
    nextPath = `materials/${Date.now()}_${payload.file.name}`;
    const { error: uploadError } = await supabase.storage.from('materials').upload(nextPath, payload.file, { upsert: true });
    if (uploadError) throw new Error(uploadError.message);
  }

  const updates: { title: string; level_id: string; file_url?: string } = {
    title: payload.title,
    level_id: payload.levelId,
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
  return (data ?? []) as (Assignment & { levels?: { name: string } })[];
}

export async function createAssignment(payload: {
  title: string;
  description: string;
  levelId: string;
  deadline: string | null;
}): Promise<void> {
  if (!payload.levelId) {
    throw new Error('Please choose a level before creating assignment.');
  }

  const { data: created, error } = await supabase
    .from('assignments')
    .insert({
    title:       payload.title,
    description: payload.description || null,
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
  levelId: string;
  deadline: string | null;
}): Promise<void> {
  const { error } = await supabase
    .from('assignments')
    .update({
      title: payload.title,
      description: payload.description || null,
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
  return (data ?? []).map((q) => ({
    ...q,
    options: Array.isArray(q.options) ? (q.options as string[]) : null,
  })) as ExamQuestion[];
}

export async function createExamQuestion(payload: {
  examId: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  orderIndex: number;
}): Promise<void> {
  const { error } = await supabase.from('questions').insert({
    exam_id: payload.examId,
    question_text: payload.questionText,
    type: 'mcq',
    options: payload.options,
    correct_answer: payload.correctAnswer,
    order_index: payload.orderIndex,
  });
  if (error) throw new Error(error.message);
}

export async function bulkCreateExamQuestions(payload: {
  examId: string;
  questions: Array<{ questionText: string; options: string[]; correctAnswer: string }>;
}): Promise<void> {
  const rows = payload.questions.map((q, idx) => ({
    exam_id: payload.examId,
    question_text: q.questionText,
    type: 'mcq',
    options: q.options,
    correct_answer: q.correctAnswer,
    order_index: idx + 1,
  }));

  const { error } = await supabase.from('questions').insert(rows);
  if (error) throw new Error(error.message);
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
    if (!submission.file_url) return submission;
    const path = resolveSubmissionsPath(submission.file_url);
    if (!path) return submission;
    const { data: signedData, error: signedError } = await supabase.storage.from('submissions').createSignedUrl(path, 60 * 60);
    if (signedError || !signedData?.signedUrl) return submission;
    return { ...submission, file_url: signedData.signedUrl };
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
  return (data ?? []) as never[];
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
