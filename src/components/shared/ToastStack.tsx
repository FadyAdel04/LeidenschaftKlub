import { AnimatePresence, motion } from 'framer-motion';
import { useNotifications } from '../../context/NotificationsContext';

export default function ToastStack() {
  const { toasts, dismissToast } = useNotifications();

  return (
    <div className="xed top-20 right-4 z-130 w-[320px] space-y-3">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 30, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.98 }}
            className="bg-white border border-[#1A1A1A]/10 rounded-2xl p-4 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#C62828]">Notication</p>
                <p className="text-sm font-black text-[#1A1A1A] truncate">{t.title}</p>
                <p className="text-xs font-bold text-[#1A1A1A]/60 mt-1 line-clamp-2">{t.message}</p>
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                className="w-8 h-8 rounded-xl bg-[#F5F5F0] font-black text-[#1A1A1A]/50 hover:text-[#C62828]"
              >
                ✕
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

