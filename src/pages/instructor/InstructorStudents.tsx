import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchInstructorLevels } from '../../services/instructorService';
import { fetchStudentsInLevel } from '../../services/adminService';
import type { Level, Profile } from '../../services/studentService';
import { Search, Mail, Phone, ChevronRight, GraduationCap } from 'lucide-react';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const ci = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || 'ST';
}

export default function InstructorStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState<(Profile & { levelName: string; levelId: string })[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    try {
      const lData = await fetchInstructorLevels(user.id);
      setLevels(lData);
      
      const allStudents: (Profile & { levelName: string; levelId: string })[] = [];
      for (const level of lData) {
        const sData = await fetchStudentsInLevel(level.id);
        allStudents.push(...sData.map(s => ({ ...s, levelName: level.name, levelId: level.id })));
      }
      setStudents(allStudents);
    } catch (err) {
      console.error('Error loading students:', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = students.filter(s => {
    const nameMatch = s.name?.toLowerCase().includes(search.toLowerCase()) || false;
    const emailMatch = s.email?.toLowerCase().includes(search.toLowerCase()) || false;
    const matchesSearch = nameMatch || emailMatch;
    const matchesLevel = levelFilter === '' || s.levelId === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:ml-80 p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#D4A373]/[0.02] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

      <motion.header variants={ci} className="mb-14 relative z-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase mb-3">
          Student<br /><span className="text-[#F97316]">Roster.</span>
        </h1>
        <p className="text-[#1A1A1A]/40 font-black uppercase text-[10px] tracking-[0.5em] italic">
          {students.length} Enrolled in your levels
        </p>
      </motion.header>

      {/* Filters */}
      <motion.div variants={ci} className="flex flex-col md:flex-row gap-4 mb-10 relative z-10">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/20 w-4 h-4" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#1A1A1A]/5 rounded-2xl font-black text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 outline-none focus:ring-4 focus:ring-[#D4A373]/10 shadow-sm transition-all"
          />
        </div>
        <select
          value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
          className="px-6 py-3.5 bg-white border border-[#1A1A1A]/5 rounded-2xl font-black text-sm text-[#1A1A1A] outline-none hover:bg-[#F5F5F0] transition-colors cursor-pointer text-center"
        >
          <option value="">All Levels</option>
          {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </motion.div>

      {/* List */}
      <motion.div variants={ci} className="grid grid-cols-1 gap-4 relative z-10">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-white/50 backdrop-blur-sm rounded-3xl border border-[#1A1A1A]/5 animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center bg-white rounded-[2.5rem] border border-[#1A1A1A]/5 shadow-sm">
            <GraduationCap className="w-16 h-16 text-[#1A1A1A]/5 mx-auto mb-4" />
            <h3 className="font-black text-[#1A1A1A]/20 uppercase tracking-widest leading-none">No active students</h3>
          </div>
        ) : (
          filtered.map(student => (
            <motion.div
              layout
              key={`${student.id}-${student.levelId}`}
              className="group bg-white rounded-[2rem] p-6 border border-[#1A1A1A]/5 hover:border-[#D4A373]/30 transition-all flex flex-col md:flex-row items-center gap-6 shadow-sm hover:shadow-xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#F5F5F0] flex items-center justify-center text-[#D4A373] text-xl font-black group-hover:bg-[#D4A373] group-hover:text-white transition-all transform group-hover:rotate-6 duration-500 shadow-inner overflow-hidden">
                {student.avatar_url ? (
                  <img src={student.avatar_url} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  getInitials(student.name)
                )}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-xl font-black text-[#1A1A1A] tracking-tight uppercase leading-tight mb-2 group-hover:text-[#D4A373] transition-colors">{student.name}</h4>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 text-[#1A1A1A]/40 text-xs font-black uppercase tracking-[0.2em] italic">
                  <div className="flex items-center gap-2 px-2 py-1 bg-[#F5F5F0]/50 rounded-lg">
                    <Mail className="w-3 h-3 text-[#1A1A1A]/20" /> {student.email}
                  </div>
                  {student.phone && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-[#F5F5F0]/50 rounded-lg">
                      <Phone className="w-3 h-3 text-[#1A1A1A]/20" /> {student.phone}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0 border-t md:border-t-0 pt-4 md:pt-0">
                <div className="flex flex-col items-center md:items-end flex-1 md:flex-none">
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A]/5 rounded-xl border border-[#1A1A1A]/5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#D4A373]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">{student.levelName}</span>
                  </div>
                </div>
                <div className="hidden md:flex w-12 h-12 rounded-full bg-[#F5F5F0] items-center justify-center text-[#1A1A1A]/20 transition-all group-hover:bg-[#1A1A1A] group-hover:text-white group-hover:translate-x-1">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}
