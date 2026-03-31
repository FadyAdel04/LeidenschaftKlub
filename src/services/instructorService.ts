import { supabase } from '../lib/supabase';
import type { Level, Profile } from './studentService';

// ─── Levels ───────────────────────────────────────────────────────────────────

export async function fetchInstructorLevels(instructorId: string): Promise<Level[]> {
  const { data, error } = await supabase
    .from('levels')
    .select('*, level_students(count), groups(name)')
    .eq('instructor_id', instructorId)
    .order('name', { ascending: true });
  
  if (error) throw new Error(error.message);
  
  return (data ?? []).map((l: any) => ({
    ...l,
    group: l.groups ? { name: l.groups.name } : null,
    student_count: l.level_students?.[0]?.count ?? 0
  })) as Level[];
}

// ─── Students ─────────────────────────────────────────────────────────────────

export async function fetchInstructorStudents(instructorId: string): Promise<Profile[]> {
  // 1. Get all levels assigned to this instructor
  const { data: levels, error: lErr } = await supabase
    .from('levels')
    .select('id')
    .eq('instructor_id', instructorId);
  
  if (lErr) throw new Error(lErr.message);
  const levelIds = (levels ?? []).map(l => l.id);
  
  if (levelIds.length === 0) return [];

  // 2. Get all students in those levels
  const { data, error } = await supabase
    .from('level_students')
    .select('student:profiles!student_id(*)')
    .in('level_id', levelIds);
  
  if (error) throw new Error(error.message);
  const profiles = (data ?? []).map((row: any) => row.student).filter(Boolean) as Profile[];

  // Sign avatar URLs
  return await Promise.all(profiles.map(async (p: any) => {
    if (!p.avatar_url || p.avatar_url.startsWith('http')) return p;
    try {
      const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(p.avatar_url, 60 * 60);
      return { ...p, avatar_url: signed?.signedUrl ?? p.avatar_url };
    } catch {
      return p;
    }
  }));
}

export async function fetchInstructorDashboardStats(instructorId: string) {
  // 1. Get levels
  const levels = await fetchInstructorLevels(instructorId);
  const ids = levels.map(l => l.id);
  if (ids.length === 0) return { levels: 0, students: 0, assignments: 0, avgPerformance: 0 };

  // 2. Get counts
  const { count: studentsCount } = await supabase.from('level_students').select('id', { count: 'exact' }).in('level_id', ids);
  const { count: assignmentsCount } = await supabase.from('assignments').select('id', { count: 'exact' }).in('level_id', ids);
  
  // 3. Get results scores via exams
  const { data: examsData } = await supabase.from('exams').select('id').in('level_id', ids);
  const examIds = (examsData ?? []).map(e => e.id);
  
  let scores: number[] = [];
  if (examIds.length > 0) {
    const { data: resultsData } = await supabase.from('results').select('score').in('exam_id', examIds);
    scores = (resultsData ?? []).map(r => r.score).filter(s => s !== null) as number[];
  }

  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return {
    levels: levels.length,
    students: studentsCount || 0,
    assignments: assignmentsCount || 0,
    avgPerformance: avg
  };
}

// ─── Submissions for Instructors ───────────────────────────────────────────────

export async function fetchInstructorAssignmentSubmissions(instructorId: string) {
  const levels = await fetchInstructorLevels(instructorId);
  const levelIds = levels.map(l => l.id);
  if (levelIds.length === 0) return [];

  // Get assignments for these levels or created by instructor
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, level_id')
    .or(`level_id.in.(${levelIds.join(',')}),instructor_id.eq.${instructorId}`);
  
  const assignmentIds = (assignments ?? []).map(a => a.id);
  if (assignmentIds.length === 0) return [];

  // Get submissions
  const { data: subs, error } = await supabase
    .from('submissions')
    .select('*')
    .in('assignment_id', assignmentIds)
    .order('submitted_at', { ascending: false });

  if (error) throw new Error(error.message);

  // Get profiles
  const studentIds = Array.from(new Set((subs ?? []).map(s => s.student_id)));
  const { data: projs } = await supabase.from('profiles').select('id, name, email').in('id', studentIds);
  
  const profMap = Object.fromEntries((projs ?? []).map(p => [p.id, p]));
  const asgnMap = Object.fromEntries((assignments ?? []).map(a => [a.id, a]));

  // Sign file and audio URLs
  const signedSubs = await Promise.all((subs ?? []).map(async (s: any) => {
    let next = { ...s };
    if (s.file_url && !s.file_url.startsWith('http')) {
      const { data: fSigned } = await supabase.storage.from('submissions').createSignedUrl(s.file_url, 60 * 60);
      next.file_url = fSigned?.signedUrl ?? s.file_url;
    }
    if (s.audio_answer_url && !s.audio_answer_url.startsWith('http')) {
      const { data: aSigned } = await supabase.storage.from('submissions').createSignedUrl(s.audio_answer_url, 60 * 60);
      next.audio_answer_url = aSigned?.signedUrl ?? s.audio_answer_url;
    }
    return next;
  }));

  return signedSubs.map(s => ({
    ...s,
    profiles: profMap[s.student_id],
    assignments: asgnMap[s.assignment_id]
  }));
}

export async function fetchInstructorExamSubmissions(instructorId: string) {
  const levels = await fetchInstructorLevels(instructorId);
  const levelIds = levels.map(l => l.id);
  if (levelIds.length === 0) return [];

  const { data: exams } = await supabase
    .from('exams')
    .select('id, title, level_id')
    .or(`level_id.in.(${levelIds.join(',')}),instructor_id.eq.${instructorId}`);
  
  const examIds = (exams ?? []).map(e => e.id);
  if (examIds.length === 0) return [];

  const { data: results, error } = await supabase
    .from('results')
    .select('*')
    .in('exam_id', examIds)
    .order('taken_at', { ascending: false });

  if (error) throw new Error(error.message);

  const studentIds = Array.from(new Set((results ?? []).map(r => r.student_id)));
  const { data: projs } = await supabase.from('profiles').select('id, name, email').in('id', studentIds);
  
  const profMap = Object.fromEntries((projs ?? []).map(p => [p.id, p]));
  const examMap = Object.fromEntries((exams ?? []).map(e => [e.id, e]));

  return (results ?? []).map(r => ({
    ...r,
    profiles: profMap[r.student_id],
    exams: examMap[r.exam_id]
  }));
}
