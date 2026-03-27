import { supabase } from '../lib/supabase';
import type { NotificationPriority, NotificationTargetLevel, NotificationType } from './notificationService';
import { insertNotificationsBatch } from './notificationService';

export type NotificationGroup = {
  announcement_id: string;
  type: NotificationType;
  title: string;
  message: string;
  target_level: NotificationTargetLevel | string | null;
  priority: NotificationPriority | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

function normalizeLevel(value: string): NotificationTargetLevel | string {
  return value;
}

async function fetchStudentRecipientIds(targetLevel: NotificationTargetLevel | 'all'): Promise<string[]> {
  const q = supabase.from('profiles').select('id').eq('role', 'student');
  if (targetLevel !== 'all') q.eq('current_level', targetLevel);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => r.id as string);
}

export async function adminFetchNotificationGroups(): Promise<NotificationGroup[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(
      'announcement_id,type,title,message,target_level,priority,expires_at,is_active,created_at'
    )
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);

  const map = new Map<string, NotificationGroup>();
  for (const row of (data ?? []) as any[]) {
    if (!row.announcement_id) continue;
    if (map.has(row.announcement_id)) continue;
    map.set(row.announcement_id, {
      announcement_id: row.announcement_id,
      type: row.type,
      title: row.title,
      message: row.message,
      target_level: row.target_level ?? null,
      priority: row.priority ?? null,
      expires_at: row.expires_at ?? null,
      is_active: Boolean(row.is_active),
      created_at: row.created_at,
    });
  }
  return Array.from(map.values());
}

export async function adminCreateNotificationGroup(payload: {
  type: NotificationType; // announcement/reminder/alert/event
  title: string;
  message: string;
  targetLevel: NotificationTargetLevel | 'all';
  priority: NotificationPriority;
  expiresAt: string | null;
  isActive: boolean;
}): Promise<string> {
  const { data: authData } = await supabase.auth.getUser();
  const createdBy = authData.user?.id ?? null;
  const announcementId = crypto.randomUUID();

  const recipientIds = await fetchStudentRecipientIds(payload.targetLevel);
  await insertNotificationsBatch(
    recipientIds.map(userId => ({
      userId,
      announcementId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      relatedId: null,
      targetLevel: normalizeLevel(payload.targetLevel),
      priority: payload.priority,
      expiresAt: payload.expiresAt,
      isActive: payload.isActive,
      createdBy,
    }))
  );

  return announcementId;
}

export async function adminUpdateNotificationGroup(payload: {
  announcementId: string;
  type: NotificationType;
  title: string;
  message: string;
  targetLevel: NotificationTargetLevel | 'all';
  priority: NotificationPriority;
  expiresAt: string | null;
  isActive: boolean;
}): Promise<void> {
  // Simplest + correct targeting: delete previous recipient rows and recreate for the new target level.
  const { error: delErr } = await supabase.from('notifications').delete().eq('announcement_id', payload.announcementId);
  if (delErr) throw new Error(delErr.message);

  const { data: authData } = await supabase.auth.getUser();
  const createdBy = authData.user?.id ?? null;

  const recipientIds = await fetchStudentRecipientIds(payload.targetLevel);
  await insertNotificationsBatch(
    recipientIds.map(userId => ({
      userId,
      announcementId: payload.announcementId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      relatedId: null,
      targetLevel: normalizeLevel(payload.targetLevel),
      priority: payload.priority,
      expiresAt: payload.expiresAt,
      isActive: payload.isActive,
      createdBy,
    }))
  );
}

export async function adminDeleteNotificationGroup(announcementId: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('announcement_id', announcementId);
  if (error) throw new Error(error.message);
}

