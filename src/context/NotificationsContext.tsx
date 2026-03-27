import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '../services/notificationService';

type Toast = { id: string; title: string; message: string; createdAt: number };

type NotificationsContextType = {
  Notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  toasts: Toast[];
  dismissToast: (id: string) => void;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [Notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pollRef = useRef<number | null>(null);

  const unreadCount = useMemo(() => Notifications.filter(n => !n.is_read).length, [Notifications]);

  const dismissToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) {
        setNotifications([]);
        return;
      }

      setLoading(true);
      try {
        const rows = await fetchNotifications(user.id, 50);
        if (!cancelled) setNotifications(rows);
      } catch {
        // Keep previous list if we already had one (avoid "empty bell" stuck state)
        if (!cancelled) setNotifications(prev => (prev.length ? prev : []));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // Poll every 30s to recover from any missed realtime / transient RLS errors.
    if (pollRef.current) window.clearInterval(pollRef.current);
    if (user) {
      pollRef.current = window.setInterval(() => {
        void load();
      }, 30_000);
    }

    return () => {
      cancelled = true;
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`Notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as AppNotification;
          const isVisible = (n.is_active ?? true) && (!n.expires_at || new Date(n.expires_at).getTime() > Date.now());
          if (!isVisible) return;
          setNotifications(prev => [n, ...prev].slice(0, 100));

          const toast: Toast = { id: `t_${n.id}`, title: n.title, message: n.message, createdAt: Date.now() };
          setToasts(prev => [toast, ...prev].slice(0, 3));
          setTimeout(() => dismissToast(toast.id), 5000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as AppNotification;
          const isVisible = (n.is_active ?? true) && (!n.expires_at || new Date(n.expires_at).getTime() > Date.now());
          setNotifications(prev => {
            if (!isVisible) return prev.filter(p => p.id !== n.id);
            const exists = prev.some(p => p.id === n.id);
            if (!exists) return [n, ...prev].slice(0, 100);
            return prev.map(p => (p.id === n.id ? n : p));
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'Notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const old = payload.old as AppNotification | undefined;
          if (!old?.id) return;
          setNotifications(prev => prev.filter(p => p.id !== old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await markNotificationRead(id);
    } catch {
      // optimistic update: keep UI responsive
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await markAllNotificationsRead(user.id);
    } catch {
      // ignore
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        Notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        toasts,
        dismissToast,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextType {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}

