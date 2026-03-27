import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationsContext';

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function PortalNotifications() {
  const { Notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const latest = useMemo(() => Notifications.slice(0, 10), [Notifications]);
  const selected = useMemo(() => Notifications.find(n => n.id === selectedId) ?? null, [Notifications, selectedId]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest?.('[data-portal-notif="1"]')) return;
      setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  return (
    <div className="fixed top-16 lg:top-6 right-4 lg:right-6 z-[120]" data-portal-notif="1">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-xl border border-[#1A1A1A]/10 shadow-xl flex items-center justify-center hover:-translate-y-0.5 transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-[#1A1A1A]" />
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#C62828] text-white text-[10px] font-black flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#C62828] shadow-[0_0_0_4px_rgba(198,40,40,0.25)]" />
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#C62828] animate-ping opacity-70" />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute right-0 mt-3 w-[360px] bg-white rounded-3xl border border-[#1A1A1A]/10 shadow-2xl overflow-hidden"
          >
            <div className="p-5 border-b border-[#1A1A1A]/5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#D4A373]">Notifications</p>
                <p className="text-lg font-black tracking-tight text-[#1A1A1A]">Updates</p>
              </div>
              <button
                onClick={() => void markAllAsRead()}
                className="px-3 py-2 rounded-2xl bg-[#1A1A1A] text-white font-black text-[10px] uppercase tracking-widest"
              >
                Mark all
              </button>
            </div>

            {!latest.length ? (
              <div className="p-10 text-center">
                <p className="font-black text-[#1A1A1A]/30 uppercase tracking-widest text-xs">No Notifications yet.</p>
              </div>
            ) : (
              <div className="max-h-[420px] overflow-y-auto">
                {latest.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      setSelectedId(n.id);
                      void markAsRead(n.id);
                    }}
                    className={`w-full text-left p-5 border-b border-[#1A1A1A]/5 hover:bg-[#F5F5F0]/50 transition-all ${n.is_read ? 'opacity-70' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#C62828]">
                          {n.type}
                          {n.priority ? ` • ${n.priority}` : ''}
                        </p>
                        <p className="text-sm font-black text-[#1A1A1A] truncate">{n.title}</p>
                        <p className="text-xs font-bold text-[#1A1A1A]/60 mt-1 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/30 mt-3">
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                      {!n.is_read && <span className="w-2.5 h-2.5 rounded-full bg-[#C62828] shrink-0 mt-1" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {selected && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/60" onClick={() => setSelectedId(null)} />
          <div className="relative w-full max-w-xl bg-white rounded-3xl border border-[#1A1A1A]/10 shadow-2xl overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-[#1A1A1A]/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#C62828]">
                {selected.type}
                {selected.priority ? ` • ${selected.priority}` : ''}
              </p>
              <h3 className="text-2xl font-black tracking-tight text-[#1A1A1A] mt-2">{selected.title}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/35 mt-2">
                {new Date(selected.created_at).toLocaleString()}
              </p>
              {selected.target_level && (
                <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/35 mt-2">
                  Target: {selected.target_level}
                </p>
              )}
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-sm font-bold text-[#1A1A1A]/70 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              {selected.expires_at && (
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/35">
                  Expires: {new Date(selected.expires_at).toLocaleString()}
                </p>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setSelectedId(null)} className="px-5 py-3 rounded-2xl bg-[#F5F5F0] font-black text-xs uppercase tracking-widest">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

