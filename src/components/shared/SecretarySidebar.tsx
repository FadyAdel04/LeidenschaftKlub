import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiGrid, FiLayers, FiCheckSquare, FiLogOut, FiUsers, 
  FiBriefcase, FiX, FiMenu, FiChevronRight, FiHome
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

interface SecretarySidebarProps {
  open: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export default function SecretarySidebar({ open, onClose, onToggle }: SecretarySidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard',  label: 'Dashboard',  icon: FiHome,        path: '/secretary' },
    { id: 'attendance', label: 'Attendance', icon: FiCheckSquare, path: '/secretary/attendance' },
    { id: 'enrollment', label: 'Enrollment', icon: FiUsers,       path: '/secretary/enrollment' },
    { id: 'levels',     label: 'Levels',     icon: FiLayers,      path: '/secretary/levels' },
    { id: 'groups',     label: 'Groups',     icon: FiGrid,        path: '/secretary/groups' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
    
      <button 
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-[60] p-3 bg-white rounded-2xl shadow-xl border border-[#1A1A1A]/5 text-[#1A1A1A]"
      >
        {open ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="lg:hidden fixed inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm z-[50]"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed top-0 left-0 bottom-0 w-80 bg-white border-r border-[#1A1A1A]/5 z-[55] flex flex-col items-stretch overflow-hidden transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-10 pb-6">
           <button 
             onClick={() => { navigate('/'); onClose(); }}
             className="flex items-center gap-4 mb-2 text-left w-full hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
           >
              <div className="w-12 h-12 bg-[#F97316] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#F97316]/20 shrink-0">
                 <FiBriefcase className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                 <h1 className="text-xl font-black text-[#1A1A1A] tracking-tighter uppercase leading-none truncate">Leidenschaft</h1>
                 <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] mt-1.5 italic">Secretary Portal</p>
              </div>
           </button>
        </div>

        <nav className="flex-1 px-6 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => { navigate(item.path); onClose(); }}
                className={`w-full flex items-center justify-between group p-4 rounded-2xl transition-all relative overflow-hidden ${
                  active ? 'bg-[#1A1A1A] text-white' : 'hover:bg-[#F5F5F0] text-[#1A1A1A]/60'
                }`}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <item.icon className={`w-5 h-5 transition-colors ${active ? 'text-[#F97316]' : 'group-hover:text-[#F97316]'}`} />
                  <span className="font-black text-[13px] uppercase tracking-widest">{item.label}</span>
                </div>
                <FiChevronRight className={`w-4 h-4 transition-all ${active ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3 group-hover:opacity-40'}`} />
              </button>
            );
          })}
        </nav>

        <div className="p-8 border-t border-[#1A1A1A]/5 space-y-6">
           <div className="flex items-center gap-4 p-4 bg-[#F5F5F0] rounded-2xl border border-[#1A1A1A]/5">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#1A1A1A]/10 flex items-center justify-center">
                 {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
                 ) : (
                    <span className="text-sm font-black text-[#F97316]">{user?.name?.[0] || 'S'}</span>
                 )}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="font-black text-xs text-[#1A1A1A] tracking-tight truncate uppercase italic">{user?.name || 'Secretary'}</p>
                 <p className="text-[9px] font-black uppercase tracking-widest text-[#D4A373] mt-0.5">Academic Lead</p>
              </div>
           </div>

           <button 
             onClick={handleLogout}
             className="w-full flex items-center justify-center gap-3 bg-[#DE0002]/5 hover:bg-[#DE0002] text-[#DE0002] hover:text-white p-4 rounded-2xl transition-all font-black text-[11px] uppercase tracking-widest border border-[#DE0002]/10"
           >
              <FiLogOut className="w-4 h-4" />
              Sign Out
           </button>
        </div>
      </aside>
    </>
  );
}
