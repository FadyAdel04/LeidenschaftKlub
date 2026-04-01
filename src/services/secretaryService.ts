import { supabase } from '../lib/supabase';
import type { Profile } from './studentService';

export interface LevelSession {
  id: string;
  level_id: string;
  session_number: number;
  session_date: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  level_id: string;
  session_number: number;
  status: 'present' | 'absent';
  created_at: string;
}

export interface StudentWithAttendance extends Profile {
  attendance: AttendanceRecord[];
}

export async function adminFetchStudentsInLevel(levelId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('level_students')
    .select('student_id, profiles(*)')
    .eq('level_id', levelId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((d: any) => d.profiles) as Profile[];
}

export async function fetchAttendanceForLevel(levelId: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('level_id', levelId);
  if (error) throw new Error(error.message);
  return (data ?? []) as AttendanceRecord[];
}

export async function markAttendance(payload: {
  studentId: string;
  levelId: string;
  sessionNumber: number;
  status: 'present' | 'absent' | null;
  sessionDate?: string;
}): Promise<void> {
  if (payload.status === null) {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('student_id', payload.studentId)
      .eq('level_id', payload.levelId)
      .eq('session_number', payload.sessionNumber);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase
    .from('attendance')
    .upsert({
      student_id: payload.studentId,
      level_id: payload.levelId,
      session_number: payload.sessionNumber,
      status: payload.status,
      session_date: payload.sessionDate,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'student_id,level_id,session_number' });

  if (error) throw new Error(error.message);
}

export async function bulkMarkPresent(levelId: string, sessionNumber: number, studentIds: string[]): Promise<void> {
  const rows = studentIds.map(id => ({
    student_id: id,
    level_id: levelId,
    session_number: sessionNumber,
    status: 'present',
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('attendance')
    .upsert(rows, { onConflict: 'student_id,level_id,session_number' });

  if (error) throw new Error(error.message);
}
export async function fetchLevelSessions(levelId: string): Promise<LevelSession[]> {
  const { data, error } = await supabase
    .from('level_sessions')
    .select('*')
    .eq('level_id', levelId)
    .order('session_number', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as LevelSession[];
}

export async function upsertLevelSession(levelId: string, sessionNumber: number, date: string | null): Promise<void> {
  if (!date) {
    const { error } = await supabase
      .from('level_sessions')
      .delete()
      .eq('level_id', levelId)
      .eq('session_number', sessionNumber);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase
    .from('level_sessions')
    .upsert({
      level_id: levelId,
      session_number: sessionNumber,
      session_date: date,
      updated_at: new Date().toISOString()
    }, { onConflict: 'level_id,session_number' });
  
  if (error) throw new Error(error.message);
}
