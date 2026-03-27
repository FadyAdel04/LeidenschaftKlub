import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../../components/shared/AdminSidebar';
import type { NotificationPriority, NotificationTargetLevel, NotificationType } from '../../services/notificationService';
import type { NotificationGroup } from '../../services/adminNotificationService';
import { adminCreateNotificationGroup, adminDeleteNotificationGroup, adminFetchNotificationGroups, adminUpdateNotificationGroup } from '../../services/adminNotificationService';
import { fetchAllLevels, type Level } from '../../services/adminService';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const ci = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

const TYPES: Array<{ value: NotificationType; label: string }> = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'alert', label: 'Alert' },
  { value: 'event', label: 'Event' },
];

const PRIORITIES: Array<{ value: NotificationPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export default function AdminNotifications() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [levels, setLevels] = useState<Level[]>([]);
  const [groups, setGroups] = useState<NotificationGroup[]>([]);

  const [filterLevel, setFilterLevel] = useState<NotificationTargetLevel | 'all'>('all');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetLevel, setTargetLevel] = useState<NotificationTargetLevel | 'all'>('all');
  const [type, setType] = useState<NotificationType>('announcement');
  const [priority, setPriority] = useState<NotificationPriority>('medium');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const preview = useMemo(() => {
    return {
      title: title || 'Notification title',
      message: message || 'Notification message',
      type,
      priority,
      targetLevel,
      expiresAt,
      isActive,
    };
  }, [title, message, type, priority, targetLevel, expiresAt, isActive]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [lvls, fetched] = await Promise.all([fetchAllLevels(), adminFetchNotificationGroups()]);
      setLevels(lvls);
      setGroups(fetched);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(''), 3000);
    return () => window.clearTimeout(t);
  }, [success]);

  const filtered = useMemo(() => {
    return groups.filter(g => {
      if (filterLevel !== 'all') {
        if (g.target_level !== filterLevel) return false;
      }
      if (filterActive === 'active' && !g.is_active) return false;
      if (filterActive === 'inactive' && g.is_active) return false;
      return true;
    });
  }, [groups, filterLevel, filterActive]);

  const startEdit = (g: NotificationGroup) => {
    setEditingId(g.announcement_id);
    setTitle(g.title);
    setMessage(g.message);
    setType(g.type);
    setTargetLevel((g.target_level as any) ?? 'all');
    setPriority((g.priority as any) ?? 'medium');
    setIsActive(Boolean(g.is_active));
    setExpiresAt(g.expires_at ? new Date(g.expires_at).toISOString().slice(0, 16) : null);
  };

  const clearEdit = () => {
    setEditingId(null);
    setTitle('');
    setMessage('');
    setTargetLevel('all');
    setType('announcement');
    setPriority('medium');
    setExpiresAt(null);
    setIsActive(true);
  };

  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!message.trim()) { setError('Message is required.'); return; }
    setSaving(true);
    try {
      const expiresIso = expiresAt ? new Date(expiresAt).toISOString() : null;
      if (editingId) {
        await adminUpdateNotificationGroup({
          announcementId: editingId,
          type,
          title: title.trim(),
          message: message.trim(),
          targetLevel,
          priority,
          expiresAt: expiresIso,
          isActive,
        });
        setSuccess('Notification updated.');
      } else {
        await adminCreateNotificationGroup({
          type,
          title: title.trim(),
          message: message.trim(),
          targetLevel,
          priority,
          expiresAt: expiresIso,
          isActive,
        });
        setSuccess('Notification sent to students.');
      }
      clearEdit();
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <AdminSidebar />
      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        <motion.header variants={ci} className="mb-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase mb-3">
              Notifications<br /><span className="text-[#C62828]">Manager.</span>
            </h1>
            <p className="text-[#D4A373] font-black uppercase text-[10px] tracking-[0.5em] italic">
              Realtime announcements for student levels
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setFilterLevel('all'); setFilterActive('all'); }}
              className="px-4 py-3 rounded-2xl bg-white text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/60 border border-[#1A1A1A]/10 hover:text-[#C62828]"
            >
              Reset filters
            </button>
          </div>
        </motion.header>

        {(error || success) && (
          <AnimatePresence>
            {success && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} variants={ci} className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-green-700">{success}</p>
              </motion.div>
            )}
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} variants={ci} className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-[#C62828]">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative z-10">
          <div className="lg:col-span-5 bg-white rounded-[2.5rem] p-6 sm:p-8 border border-[#1A1A1A]/5 shadow-sm">
            <h3 className="font-black text-[#1A1A1A] tracking-tighter uppercase text-lg mb-6">
              {editingId ? 'Edit notification' : 'Create notification'}
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Title</p>
                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" placeholder="e.g. New materials added" />
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Message</p>
                <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none resize-none" rows={4} placeholder="Short message shown in student bell" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Target level</p>
                  <select value={targetLevel} onChange={e => setTargetLevel(e.target.value as any)} className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none">
                    <option value="all">All levels</option>
                    {levels.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Type</p>
                  <select value={type} onChange={e => setType(e.target.value as NotificationType)} className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none">
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Priority</p>
                  <select value={priority} onChange={e => setPriority(e.target.value as NotificationPriority)} className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none">
                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Expiration (optional)</p>
                  <input
                    type="datetime-local"
                    value={expiresAt ?? ''}
                    onChange={e => setExpiresAt(e.target.value ? e.target.value : null)}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input id="notifActive" type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                <label htmlFor="notifActive" className="text-sm font-black text-[#1A1A1A]/60">
                  Active (shown to students)
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                {editingId ? (
                  <button onClick={clearEdit} className="px-6 py-3 bg-[#F5F5F0] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1A1A1A]/5">
                    Cancel
                  </button>
                ) : null}
                <button onClick={() => void handleSubmit()} disabled={saving} className="px-6 py-3 bg-[#C62828] text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-60">
                  {saving ? 'Saving…' : editingId ? 'Update' : 'Send'}
                </button>
              </div>
            </div>

            <div className="mt-8 bg-[#F5F5F0] rounded-4xl border border-[#1A1A1A]/5 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4A373]">Preview</p>
              <div className="mt-3">
                <p className="text-xs font-black uppercase tracking-widest text-[#C62828]">
                  {type} {priority ? `• ${priority}` : ''}
                </p>
                <h4 className="text-xl font-black text-[#1A1A1A] mt-1">{preview.title}</h4>
                <p className="text-sm text-[#1A1A1A]/60 mt-2 whitespace-pre-wrap">{preview.message}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/30 mt-3">
                  Target: {preview.targetLevel}
                  {preview.expiresAt ? ` • Expires` : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white rounded-[2.5rem] border border-[#1A1A1A]/5 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4A373]">All announcements</p>
                  <h3 className="text-2xl font-black tracking-tight text-[#1A1A1A] mt-1">
                    {loading ? 'Loading…' : `${filtered.length} results`}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  <select value={filterLevel} onChange={e => setFilterLevel(e.target.value as any)} className="px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-xs outline-none">
                    <option value="all">All levels</option>
                    {levels.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                  </select>
                  <select value={filterActive} onChange={e => setFilterActive(e.target.value as any)} className="px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-xs outline-none">
                    <option value="all">All status</option>
                    <option value="active">Active only</option>
                    <option value="inactive">Inactive only</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-[#F5F5F0] rounded-3xl animate-pulse" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="font-black text-[#1A1A1A]/30 uppercase tracking-widest">No notifications yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filtered.slice(0, 50).map(g => (
                    <div key={g.announcement_id} className="bg-[#F5F5F0] rounded-4xl border border-[#1A1A1A]/5 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#C62828]">
                            {g.type} {g.priority ? `• ${g.priority}` : ''} {g.is_active ? '' : '• Inactive'}
                          </p>
                          <p className="text-lg font-black text-[#1A1A1A] mt-1 truncate">{g.title}</p>
                          <p className="text-sm text-[#1A1A1A]/60 mt-2 line-clamp-3 whitespace-pre-wrap">{g.message}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/30 mt-3">
                            Target: {g.target_level ?? 'all'} • {new Date(g.created_at).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => startEdit(g)}
                            className="px-4 py-2 rounded-2xl bg-white text-[#1A1A1A] font-black text-[10px] uppercase tracking-widest border border-[#1A1A1A]/10 hover:bg-[#1A1A1A]/5"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm('Delete this notification for all recipients?')) return;
                              await adminDeleteNotificationGroup(g.announcement_id);
                              await load();
                              setSuccess('Notification deleted.');
                            }}
                            className="px-4 py-2 rounded-2xl bg-white text-[#C62828] font-black text-[10px] uppercase tracking-widest border border-[#C62828]/20 hover:bg-[#C62828]/5"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
}

