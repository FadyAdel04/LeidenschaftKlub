import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FiUsers, FiFileText, FiAward, FiLogOut, FiX, FiMenu, FiGrid } from 'react-icons/fi';
import { RiDashboardLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';

const navLinks = [
  { to: '/instructor',             label: 'Dashboard',   icon: RiDashboardLine, exact: true },
  { to: '/instructor/levels',      label: 'Levels',      icon: FiGrid },
  { to: '/instructor/students',    label: 'Students',    icon: FiUsers },
  { to: '/instructor/assignments', label: 'Level Assignments', icon: FiFileText },
  { to: '/instructor/exams',       label: 'Level Exams',       icon: FiAward },
  { to: '/instructor/profile',     label: 'Profile',     icon: FiUsers },
];

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || 'IN';
}

export default function InstructorSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const instructorName = user?.name || 'Instructor';
  const avatarUrl = user?.avatar_url;

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(to + '/');

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-60 bg-[#1A1A1A] border-b border-white/5 h-14 flex items-center justify-between px-4">
        <span onClick={() => navigate('/')} className="text-lg font-black text-white tracking-tighter cursor-pointer">
          Leidenschaft <span className="text-[#D4A373]">Instructor</span>
        </span>
        <button onClick={() => setOpen(p => !p)} className="w-9 h-9 flex items-center justify-center bg-white/10 rounded-xl border border-white/10">
          {open ? <FiX className="w-5 h-5 text-[#F97316]" /> : <FiMenu className="w-5 h-5 text-white" />}
        </button>
      </div>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 z-70"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`h-screen w-72 lg:w-80 fixed left-0 top-0 bg-[#1A1A1A] flex flex-col py-8 lg:py-12 border-r border-white/5 shadow-2xl z-80 overflow-hidden transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="absolute top-0 left-0 w-full h-1 bg-[#DE0002]" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#DE0002]/5 rounded-full blur-[80px] translate-y-1/2 translate-x-1/2" />

        {/* Logo */}
        <div className="px-8 lg:px-12 mb-8 lg:mb-12 relative z-10">
          <span onClick={() => navigate('/')} className="text-2xl lg:text-3xl font-black text-white tracking-tighter block leading-none cursor-pointer hover:opacity-80 transition-opacity">
            Leidenschaft<br /><span className="text-[#D4A373]">Instructor.</span>
          </span>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4A373] mt-3">Pedagogical Portal</p>
        </div>

        {/* Instructor Profile Card */}
        <div className="px-6 lg:px-8 mb-8 relative z-10">
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="w-11 h-11 rounded-xl bg-[#D4A373] flex items-center justify-center text-[#1A1A1A] font-black text-sm shadow-lg shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={instructorName} className="w-full h-full object-cover" />
              ) : (
                getInitials(instructorName)
              )}
            </div>
            <div className="min-w-0">
              <p className="font-black text-white text-sm truncate capitalize">{instructorName}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#D4A373] mt-0.5 italic">Instructor</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1.5 px-4 lg:px-6 relative z-10 overflow-y-auto">
          {navLinks.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${
                isActive(to, exact)
                  ? 'text-[#DE0002] bg-[#DE0002]/10 border border-[#DE0002]/20 shadow-sm'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-6 lg:px-8 pt-6 border-t border-white/5 relative z-10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-6 py-4 text-white/20 hover:text-[#DE0002] font-black text-[11px] uppercase tracking-[0.3em] transition-all group active:scale-95"
          >
            <FiLogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Portal Exit</span>
          </button>
        </div>
      </aside>
    </>
  );
}
