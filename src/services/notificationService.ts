import { supabase } from '../lib/supabase';

export type NotificationType =
  | 'material'
  | 'assignment'
  | 'exam'
  | 'review'
  | 'submission'
  | 'announcement'
  | 'reminder'
  | 'alert'
  | 'event';

export type NotificationPriority = 'low' | 'medium' | 'high';

export type NotificationTargetLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'all';

export type AppNotification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_id: string | null;
  is_read: boolean;
  announcement_id?: string | null;
  target_level?: NotificationTargetLevel | string | null;
  priority?: NotificationPriority | null;
  expires_at?: string | null;
  is_active?: boolean | null;
  created_by?: string | null;
  created_at: string;
};

export async function fetchNotifications(userId: string, limit = 30): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  const now = Date.now();
  return (data ?? []).filter((n: any) => {
    const isActive = n.is_active ?? true;
    if (!isActive) return false;
    const exp = n.expires_at ? new Date(n.expires_at).getTime() : null;
    if (exp !== null && exp <= now) return false;
    return true;
  }) as AppNotification[];
}

export async function fetchUnreadCount(userId: string): Promise<number> {
  const nowIso = new Date().toISOString();
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw new Error(error.message);
}

export async function insertNotification(payload: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string | null;
  announcementId?: string;
  targetLevel?: NotificationTargetLevel | string;
  priority?: NotificationPriority;
  expiresAt?: string | null;
  isActive?: boolean;
  createdBy?: string | null;
}): Promise<void> {
  const row: Record<string, unknown> = {
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    related_id: payload.relatedId ?? null,
  };
  if (payload.announcementId) row.announcement_id = payload.announcementId;
  if (payload.targetLevel) row.target_level = payload.targetLevel;
  if (payload.priority) row.priority = payload.priority;
  if (typeof payload.expiresAt !== 'undefined') row.expires_at = payload.expiresAt;
  if (typeof payload.isActive === 'boolean') row.is_active = payload.isActive;
  if (typeof payload.createdBy !== 'undefined') row.created_by = payload.createdBy;

  const { error } = await supabase.from('notifications').insert(row);
  if (error) throw new Error(error.message);
}

export async function insertNotificationsBatch(
  rows: Array<{
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedId?: string | null;
    announcementId?: string;
    targetLevel?: NotificationTargetLevel | string;
    priority?: NotificationPriority;
    expiresAt?: string | null;
    isActive?: boolean;
    createdBy?: string | null;
  }>
): Promise<void> {
  if (!rows.length) return;
  const { error } = await supabase.from('notifications').insert(
    rows.map(r => ({
      user_id: r.userId,
      type: r.type,
      title: r.title,
      message: r.message,
      related_id: r.relatedId ?? null,
      announcement_id: r.announcementId ?? undefined,
      target_level: r.targetLevel ?? undefined,
      priority: r.priority ?? undefined,
      expires_at: typeof r.expiresAt !== 'undefined' ? r.expiresAt : undefined,
      is_active: typeof r.isActive === 'boolean' ? r.isActive : undefined,
      created_by: typeof r.createdBy !== 'undefined' ? r.createdBy : undefined,
    }))
  );
  if (error) throw new Error(error.message);
}

