import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiBookOpen, FiFileText, FiHelpCircle, FiUser, FiLogOut, FiX, FiMenu, FiDownload } from 'react-icons/fi';
import { RiDashboardLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import type { Profile } from '../../services/studentService';
import { usePWAInstall } from '../../hooks/usePWAInstall';

const navLinks = [
  { to: '/student',             label: 'Dashboard',   icon: RiDashboardLine },
  { to: '/student/courses',     label: 'My Courses',  icon: FiBookOpen },
  { to: '/student/assignments', label: 'Assignments',  icon: FiFileText },
  { to: '/student/exams',       label: 'Exams',        icon: FiHelpCircle },
  { to: '/student/profile',     label: 'Profile',      icon: FiUser },
];

interface Props {
  profile: Profile | null;
  open: boolean;
  onClose: () => void;
  onToggle: () => void;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('');
}

export default function StudentSidebar({ profile, open, onClose, onToggle }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { deferredPrompt, installApp } = usePWAInstall();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (to: string) =>
    to === '/student' ? location.pathname === '/student' : location.pathname.startsWith(to);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-60 bg-white/80 backdrop-blur-xl border-b border-[#1A1A1A]/5 h-14 flex items-center justify-between px-4">
        <span onClick={() => navigate('/')} className="text-lg font-black text-[#C62828] tracking-tighter cursor-pointer">
          Leidenschaft <span className="text-[#1A1A1A]">Klub</span>
        </span>
        <button onClick={onToggle} className="w-9 h-9 flex items-center justify-center bg-[#F5F5F0] rounded-xl border border-[#1A1A1A]/10">
          {open ? <FiX className="w-5 h-5 text-[#C62828]" /> : <FiMenu className="w-5 h-5 text-[#1A1A1A]" />}
        </button>
      </div>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-70"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`h-screen w-72 lg:w-80 fixed left-0 top-0 bg-white flex flex-col py-8 lg:py-12 border-r border-[#1A1A1A]/5 shadow-2xl z-80 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="px-8 lg:px-12 mb-8 lg:mb-12">
          <span onClick={() => navigate('/')} className="text-2xl lg:text-3xl font-black text-[#C62828] tracking-tighter cursor-pointer block leading-none hover:opacity-80 transition-opacity">
            Leidenschaft<br /><span className="text-[#1A1A1A]">Klub</span>
          </span>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4A373] mt-3 italic">Student Portal</p>
        </div>

        {/* Profile Card */}
        <div className="px-6 lg:px-8 mb-8 lg:mb-10">
          <div className="flex items-center gap-4 p-4 bg-[#F5F5F0] rounded-2xl border border-[#1A1A1A]/5 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#C62828] flex items-center justify-center text-white font-black text-sm shadow-lg shadow-[#C62828]/20 shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                profile ? getInitials(profile.name || profile.email) : '?'
              )}
            </div>
            <div className="min-w-0">
              <p className="font-black text-[#1A1A1A] text-sm truncate">{profile?.name || 'Loading…'}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#D4A373] mt-0.5 italic">
                {profile?.current_level ?? '—'} Level
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1.5 lg:gap-2 px-4 lg:px-6 overflow-y-auto">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${
                isActive(to)
                  ? 'text-[#C62828] bg-[#C62828]/5 shadow-sm'
                  : 'text-[#1A1A1A]/40 hover:text-[#C62828] hover:bg-[#C62828]/5'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* PWA Install */}
        {deferredPrompt && (
          <div className="px-6 lg:px-8 mb-4 relative z-10">
            <button
              onClick={installApp}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#C62828] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-2xl hover:shadow-[#C62828]/20 transition-all border border-[#C62828]/20"
            >
              <FiDownload className="w-4 h-4" />
              <span>Install App</span>
            </button>
          </div>
        )}

        {/* Logout */}
        <div className="px-6 lg:px-8 pt-6 border-t border-[#1A1A1A]/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-6 py-4 text-[#1A1A1A]/30 hover:text-[#C62828] font-black text-[11px] uppercase tracking-[0.3em] transition-all group active:scale-95"
          >
            <FiLogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Logout Portal</span>
          </button>
        </div>
      </aside>
    </>
  );
}
