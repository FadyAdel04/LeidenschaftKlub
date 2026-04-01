import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiUsers, FiLayers, FiActivity, 
  FiArrowRight, FiCheckSquare 
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import SecretarySidebar from '../../components/shared/SecretarySidebar';
import { useAuth } from '../../context/AuthContext';
import { fetchAllLevelsPublic, type Level } from '../../services/studentService';
import { fetchAllStudents } from '../../services/adminService';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const ci = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function SecretaryDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ students: 0, levels: 0, activeGroups: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [lvls, stds] = await Promise.all([
          fetchAllLevelsPublic(),
          fetchAllStudents()
        ]);
        setStats({
          students: stds.length,
          levels: lvls.length,
          activeGroups: [...new Set(lvls.map((l: Level) => l.name[0]))].length // Rough group estimate
        });
      } catch (err) {
        console.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const cards = [
    { label: 'Enrolled Students', value: stats.students, icon: FiUsers, color: '#F97316', path: '/secretary/enrollment' },
    { label: 'Active Levels',     value: stats.levels,   icon: FiLayers, color: '#D4A373', path: '/secretary/levels' },
    { label: 'Curriculum Groups', value: stats.activeGroups, icon: FiActivity, color: '#C62828', path: '/secretary/groups' },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <SecretarySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onToggle={() => setSidebarOpen(p => !p)} />

      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#F97316]/[0.03] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

        <motion.header variants={ci} className="mb-12 lg:mb-20 space-y-6 relative z-10">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-[#F97316] animate-ping" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4A373] italic">Academic Administration Layer</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-[#1A1A1A] leading-[0.9] uppercase">
             Guten Tag,<br /><span className="text-[#F97316]">{user?.name?.split(' ')[0] || 'Secretary'}.</span>
          </h1>
          <p className="max-w-xl text-[#1A1A1A]/40 font-black text-[13px] uppercase tracking-widest leading-relaxed italic">
             Welcome to the institutional nexus. Monitor attendance, manage curriculum distribution, and synchronize student records with precision.
          </p>
        </motion.header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 relative z-10">
           {cards.map((card, i) => (
             <motion.div 
               key={i} 
               variants={ci}
               onClick={() => navigate(card.path)}
               className="bg-white p-8 rounded-[2.5rem] border border-[#1A1A1A]/5 shadow-sm hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl opacity-5 group-hover:opacity-10 transition-all" style={{ background: card.color }} />
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 relative z-10" style={{ background: `${card.color}15` }}>
                   <card.icon className="w-6 h-6" style={{ color: card.color }} />
                </div>
                <div className="space-y-1 relative z-10">
                   <p className="text-4xl font-black text-[#1A1A1A] tracking-tighter">{loading ? '—' : card.value}</p>
                   <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/30 italic">{card.label}</p>
                </div>
                <div className="mt-8 flex items-center gap-2 text-[#F97316] font-black text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 relative z-10">
                   Enter Management Layer <FiArrowRight className="w-3 h-3" />
                </div>
             </motion.div>
           ))}
        </div>

        {/* Quick Actions */}
        <motion.div variants={ci} className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
           {/* Primary Action */}
           <div 
             onClick={() => navigate('/secretary/attendance')}
             className="bg-[#1A1A1A] rounded-[3rem] p-10 sm:p-12 text-white flex flex-col justify-between min-h-[360px] group cursor-pointer shadow-2xl hover:shadow-[#F97316]/20 transition-all relative overflow-hidden"
           >
              <div className="absolute inset-0 bg-gradient-to-br from-[#F97316]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="relative z-10">
                 <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-10 group-hover:bg-[#F97316] transition-all duration-500 shadow-xl shadow-black/20">
                    <FiCheckSquare className="w-7 h-7 text-white" />
                 </div>
                 <h3 className="text-4xl font-black tracking-tighter uppercase leading-none mb-4">
                    Daily<br /><span className="text-[#F97316]">Attendance</span> Tracking
                 </h3>
                 <p className="text-xs font-black text-white/30 uppercase tracking-[0.2em] max-w-xs leading-relaxed">
                    Instantly synchronize student presence records for active level sessions.
                 </p>
              </div>
              <div className="flex items-center gap-4 relative z-10">
                 <div className="flex-1 h-[1px] bg-white/10" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F97316]">Open Grid</span>
              </div>
           </div>

           {/* Side Actions List */}
           <div className="space-y-4">
              {[
                { label: 'Manage Groups',  icon: FiGrid,     path: '/secretary/groups', desc: 'Distribute students across German alphabet groups' },
                { label: 'Level Hierarchy', icon: FiLayers,   path: '/secretary/levels', desc: 'Monitor active level distributors and instructors' },
                { label: 'Enrollment',     icon: FiUsers,    path: '/secretary/enrollment', desc: 'Securely register new students to institutional levels' }
              ].map((act, i) => (
                <div 
                  key={i}
                  onClick={() => navigate(act.path)}
                  className="bg-white rounded-3xl p-6 border border-[#1A1A1A]/5 hover:border-[#F97316]/30 transition-all cursor-pointer group flex items-center justify-between"
                >
                   <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/20 group-hover:text-[#F97316] group-hover:bg-[#F97316]/5 transition-all">
                         <act.icon className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="font-black text-sm text-[#1A1A1A] uppercase tracking-tight">{act.label}</p>
                         <p className="text-[10px] font-black text-[#1A1A1A]/20 uppercase tracking-widest mt-0.5">{act.desc}</p>
                      </div>
                   </div>
                   <FiArrowRight className="w-4 h-4 text-[#1A1A1A]/10 group-hover:text-[#F97316] group-hover:translate-x-2 transition-all" />
                </div>
              ))}
           </div>
        </motion.div>
      </main>
    </motion.div>
  );
}

// Add simple FiGrid as it was missing from the imports list
function FiGrid(props: any) {
  return (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  );
}
