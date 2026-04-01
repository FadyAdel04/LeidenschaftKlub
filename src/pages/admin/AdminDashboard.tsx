import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FiUsers, FiFileText, FiAward, FiTrendingUp, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import { RiAdminLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/shared/AdminSidebar';
import { fetchDashboardStats, fetchAllLevels, fetchAllStudents, type Level, type Profile } from '../../services/adminService';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
const ci = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function AdminDashboard() {
  const navigate  = useNavigate();
  const [stats,   setStats]   = useState({ students: 0, instructors: 0, materials: 0, assignments: 0, exams: 0, avgScore: 0 });
  const [recent,  setRecent]  = useState<Profile[]>([]);
  const [allStudents, setAllStudents] = useState<Profile[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [s, students, lvls] = await Promise.all([fetchDashboardStats(), fetchAllStudents(), fetchAllLevels()]);
        if (cancelled) return;
        setStats(s);
        setRecent(students.slice(0, 5));
        setAllStudents(students);
        setLevels(lvls);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const levelCounts = levels.map(lv => ({
    level: lv.name,
    count: allStudents.filter(s => s.current_level === lv.name).length,
  }));

  const kpis = [
    { label: 'Total Students',  val: loading ? '—' : stats.students,    icon: FiUsers,    trend: 'Active' },
    { label: 'Instructors',      val: loading ? '—' : stats.instructors, icon: RiAdminLine, trend: 'Staff' },
    { label: 'Assignments',      val: loading ? '—' : stats.assignments, icon: FiFileText, trend: 'Created' },
    { label: 'Exams',            val: loading ? '—' : stats.exams,       icon: FiAward,    trend: 'Available' },
  ];

  function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?';
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <AdminSidebar />

      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#F97316]/2 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

        {/* Header */}
        <motion.header variants={ci} className="mb-10 lg:mb-14 relative z-10">
          <div className="flex items-center gap-3 text-[#F97316] text-[10px] font-black uppercase tracking-[0.5em] mb-3">
            <RiAdminLine className="w-4 h-4" />
            <span>Admin Access</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase">
            Control<br /><span className="text-[#F97316]">Panel.</span>
          </h1>
        </motion.header>

        {error && (
          <motion.div variants={ci} className="mb-8 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
            <FiAlertCircle className="w-5 h-5 text-[#F97316] shrink-0" />
            <p className="text-sm font-bold text-[#F97316]">{error}</p>
          </motion.div>
        )}

        {/* KPI Grid */}
        <motion.div variants={ci} className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 relative z-10">
          {kpis.map((k, i) => (
            <div key={i} className="bg-white rounded-4xl p-6 lg:p-8 border border-[#1A1A1A]/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-default">
              <div className="flex justify-between items-start mb-4 lg:mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/40 group-hover:bg-[#1A1A1A] group-hover:text-white transition-all shadow-inner">
                  <k.icon className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#F97316] italic">{k.trend}</span>
              </div>
              <p className="text-3xl lg:text-4xl font-black tracking-tighter text-[#1A1A1A] leading-none mb-2">{k.val}</p>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#1A1A1A]/30">{k.label}</p>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative z-10">

          {/* Recent Students */}
          <motion.div variants={ci} className="col-span-1 lg:col-span-8 bg-white rounded-[2.5rem] border border-[#1A1A1A]/5 shadow-sm overflow-hidden hover:shadow-2xl transition-all">
            <div className="p-8 lg:p-10 flex items-center justify-between border-b border-[#1A1A1A]/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 flex items-center justify-center text-[#F97316]">
                  <FiUsers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-[#1A1A1A] tracking-tighter uppercase">Recent Students</h3>
                  <p className="text-[9px] font-black text-[#1A1A1A]/30 uppercase tracking-widest">{stats.students} Total</p>
                </div>
              </div>
              <button onClick={() => navigate('/admin/students')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#F97316] hover:underline group">
                View All <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {loading
              ? <div className="p-8 space-y-4">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-[#F5F5F0] rounded-2xl animate-pulse" />)}</div>
              : recent.length === 0
                ? <div className="p-16 text-center"><p className="font-black text-[#1A1A1A]/20 uppercase">No students yet.</p></div>
                : <div className="divide-y divide-[#1A1A1A]/5">
                    {recent.map(s => (
                      <div key={s.id} className="flex items-center gap-5 px-8 py-5 hover:bg-[#F5F5F0]/50 transition-all group">
                        <div className="w-11 h-11 rounded-xl bg-[#F97316] flex items-center justify-center text-white font-black text-sm shrink-0">
                          {getInitials(s.name || s.email)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm text-[#1A1A1A] truncate">{s.name || '—'}</p>
                          <p className="text-[10px] font-black text-[#1A1A1A]/30 uppercase tracking-widest truncate">{s.email}</p>
                        </div>
                        <span className="text-[9px] font-black uppercase px-3 py-1.5 rounded-full bg-[#F97316]/5 text-[#F97316] shrink-0">
                          Level {s.current_level}
                        </span>
                      </div>
                    ))}
                  </div>
            }
          </motion.div>

          {/* Level Distribution */}
          <motion.div variants={ci} className="col-span-1 lg:col-span-4 bg-[#1A1A1A] rounded-[2.5rem] p-8 lg:p-10 text-white relative overflow-hidden group shadow-2xl border border-white/5">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#F97316]/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-[60px] group-hover:bg-[#F97316]/40 transition-all" />
            <div className="relative z-10 mb-8">
              <div className="flex items-center gap-3 mb-2">
                <FiTrendingUp className="w-5 h-5 text-[#F97316]" />
                <h3 className="font-black text-white tracking-tighter uppercase">Level Distribution</h3>
              </div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{stats.students} Students Total</p>
            </div>
            <div className="relative z-10 space-y-5">
              {levels.map(l => {
                const lv = l.name;
                const count = levelCounts.find(l => l.level === lv)?.count ?? 0;
                const pct   = stats.students > 0 ? Math.round((count / stats.students) * 100) : 0;
                return (
                  <div key={lv}>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-black uppercase tracking-widest text-white/60">Level {lv}</span>
                      <span className="text-xs font-black text-[#D4A373]">{loading ? '—' : count}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full bg-[#F97316] rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick links */}
            <div className="relative z-10 mt-10 pt-8 border-t border-white/5 grid grid-cols-2 gap-3">
              {[
                { label: 'Materials',   to: '/admin/materials' },
                { label: 'Assignments', to: '/admin/assignments' },
                { label: 'Exams',       to: '/admin/exams' },
                { label: 'Students',    to: '/admin/students' },
                { label: 'Attendance',  to: '/admin/attendance' },
                { label: 'Calendar',    to: '/admin/calendar' },
              ].map(link => (
                <button
                  key={link.to}
                  onClick={() => navigate(link.to)}
                  className="px-4 py-3 bg-white/5 hover:bg-[#F97316]/20 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all active:scale-95"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Avg Score */}
          <motion.div variants={ci} className="col-span-1 lg:col-span-4 bg-[#F97316] rounded-[2.5rem] p-8 lg:p-10 text-white shadow-2xl relative overflow-hidden group hover:-translate-y-1 transition-all">
            <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:rotate-12 group-hover:opacity-20 transition-all duration-700">
              <FiAward className="text-[120px]" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.5em] mb-3 italic relative z-10">Avg Exam Score</p>
            <p className="text-6xl font-black tracking-tighter relative z-10">{loading ? '—' : `${stats.avgScore}%`}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mt-3 relative z-10">Across all graded submissions</p>
          </motion.div>
        </div>
      </main>
    </motion.div>
  );
}
