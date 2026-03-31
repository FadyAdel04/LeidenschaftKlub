import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchInstructorLevels } from '../../services/instructorService';
import { fetchStudentsInLevel } from '../../services/adminService';
import type { Level, Profile } from '../../services/studentService';
import { Users, GraduationCap, Search, ChevronDown, ChevronUp } from 'lucide-react';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const ci = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function InstructorGroups() {
  const { user } = useAuth();
  const [levels, setLevels] = useState<(Level & { studentsList: Profile[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedLevelId, setExpandedLevelId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadGroups();
  }, [user]);

  async function loadGroups() {
    if (!user) return;
    try {
      const lData = await fetchInstructorLevels(user.id);
      const withStudents = await Promise.all(lData.map(async (l) => {
        const students = await fetchStudentsInLevel(l.id);
        return { ...l, studentsList: students };
      }));
      setLevels(withStudents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = levels.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:ml-80 p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#F97316]/[0.02] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

      <motion.header variants={ci} className="mb-14 relative z-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase mb-3">
          My<br /><span className="text-[#D4A373]">Levels.</span>
        </h1>
        <p className="text-[#1A1A1A]/40 font-black uppercase text-[10px] tracking-[0.5em] italic">
          {levels.length} Assigned Levels
        </p>
      </motion.header>

      {/* Search */}
      <motion.div variants={ci} className="relative z-10 mb-8 max-w-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/20 w-4 h-4" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search level name..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#1A1A1A]/5 rounded-2xl font-black text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 outline-none focus:ring-4 focus:ring-[#D4A373]/10 shadow-sm transition-all"
          />
        </div>
      </motion.div>

      {/* Grid */}
      <motion.div variants={ci} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-white rounded-[2.5rem] p-8 border border-[#1A1A1A]/5 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-32 bg-white rounded-[2.5rem] border border-[#1A1A1A]/5 text-center">
            <Users className="w-16 h-16 text-[#1A1A1A]/10 mx-auto mb-4" />
            <p className="font-black text-[#1A1A1A]/30 uppercase tracking-widest leading-none">No active levels found.</p>
          </div>
        ) : (
          filtered.map(level => {
            const isExpanded = expandedLevelId === level.id;

            return (
              <motion.div
                key={level.id}
                layout
                className="bg-white rounded-[2.5rem] p-8 border border-[#1A1A1A]/5 shadow-sm hover:shadow-xl transition-shadow relative overflow-hidden flex flex-col"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A373]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                
                <div className="flex items-center gap-2 mb-6 px-4 py-1.5 bg-[#F5F5F0] rounded-full w-fit">
                  <GraduationCap className="w-3 h-3 text-[#1A1A1A]/60" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/60">
                    {(level as any).group?.name ? `Group ${(level as any).group.name}` : 'Assigned Level'}
                  </span>
                </div>

                <h3 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase leading-[0.9] mb-6">{level.name}</h3>

                <div 
                  className="mt-auto pt-6 border-t border-[#1A1A1A]/5 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedLevelId(isExpanded ? null : level.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A] font-black text-sm group-hover:bg-[#1A1A1A] group-hover:text-white transition-colors">
                      {level.studentsList.length}
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/40 leading-none">Students Enrolled</p>
                  </div>
                  <div className="bg-[#F5F5F0] p-2 rounded-full">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[#1A1A1A]" /> : <ChevronDown className="w-4 h-4 text-[#1A1A1A]" />}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-6 flex flex-col gap-3 overflow-hidden"
                    >
                      {level.studentsList.length === 0 ? (
                        <p className="text-xs text-[#1A1A1A]/40 font-medium italic">No students enrolled yet.</p>
                      ) : (
                        level.studentsList.map(student => (
                          <div key={student.id} className="flex items-center gap-3 bg-[#F5F5F0]/50 p-3 rounded-2xl border border-[#1A1A1A]/5">
                            <div className="w-8 h-8 rounded-full bg-white border border-[#1A1A1A]/5 flex items-center justify-center overflow-hidden shrink-0">
                              {student.avatar_url ? (
                                <img src={student.avatar_url} alt={student.name} className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-3 h-3 text-[#1A1A1A]/40" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-sm text-[#1A1A1A] truncate">{student.name}</p>
                              <p className="text-[10px] text-[#1A1A1A]/40 truncate">{student.email}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            );
          })
        )}
      </motion.div>
    </motion.div>
  );
}
