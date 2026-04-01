import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUsers, FiLayers, FiSearch, FiX, 
  FiAlertCircle, FiCheckCircle,
  FiChevronDown 
} from 'react-icons/fi';
import SecretarySidebar from '../../components/shared/SecretarySidebar';
import { 
  adminFetchStudentsInLevel
} from '../../services/secretaryService';
import { fetchAllLevelsPublic, type Level } from '../../services/studentService';
import { fetchAllStudents } from '../../services/adminService';
import { supabase } from '../../lib/supabase';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const ci = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

export default function SecretaryEnrollment() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadInitial() {
      try {
        const [lvls, stds] = await Promise.all([
          fetchAllLevelsPublic(),
          fetchAllStudents()
        ]);
        setLevels(lvls);
        setAllStudents(stds);
        if (lvls.length > 0) setSelectedLevelId(lvls[0].id);
      } catch (err) {
        setError('Failed to load initial data');
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    if (!selectedLevelId) return;
    async function loadEnrolled() {
      setLoading(true);
      try {
        const data = await adminFetchStudentsInLevel(selectedLevelId);
        setEnrolledStudents(data);
      } catch (err) {
        setError('Failed to load enrolled students');
      } finally {
        setLoading(false);
      }
    }
    loadEnrolled();
  }, [selectedLevelId]);

  const handleEnroll = async (studentId: string) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const { error: err } = await supabase
        .from('level_students')
        .upsert({ level_id: selectedLevelId, student_id: studentId });

      if (err) throw err;
      
      const newlyEnrolled = allStudents.find(s => s.id === studentId);
      setEnrolledStudents(prev => [...prev, newlyEnrolled]);
      setSuccess('Student enrolled successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to enroll student');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnenroll = async (studentId: string) => {
    setActionLoading(true);
    setError('');
    try {
      const { error: err } = await supabase
        .from('level_students')
        .delete()
        .eq('level_id', selectedLevelId)
        .eq('student_id', studentId);

      if (err) throw err;
      
      setEnrolledStudents(prev => prev.filter(s => s.id !== studentId));
      setSuccess('Student removed from level');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to unenroll student');
    } finally {
      setActionLoading(false);
    }
  };

  const availableStudents = allStudents.filter(s => 
    !enrolledStudents.some(es => es.id === s.id) &&
    (s.name?.toLowerCase().includes(search.toLowerCase()) || 
     s.email?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex uppercase">
      <SecretarySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onToggle={() => setSidebarOpen(p => !p)} />

      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        <motion.header variants={ci} className="mb-12 space-y-6 relative z-10">
           <h2 className="text-4xl sm:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase">
              Student<br /><span className="text-[#F97316]">Enrollment.</span>
           </h2>
           <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
              <div className="flex-1 max-w-sm space-y-2">
                 <label className="text-[9px] font-black uppercase tracking-[0.3em] text-[#D4A373] ml-1">Target Level</label>
                 <div className="relative">
                    <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/30 w-4 h-4 pointer-events-none" />
                    <select 
                      value={selectedLevelId}
                      onChange={(e) => setSelectedLevelId(e.target.value)}
                      className="w-full bg-white border border-[#1A1A1A]/5 rounded-2xl py-4 pl-6 pr-12 font-black text-sm text-[#1A1A1A] uppercase tracking-wider outline-none shadow-sm appearance-none cursor-pointer"
                    >
                       {levels.map(l => <option key={l.id} value={l.id}>Level {l.name}</option>)}
                    </select>
                 </div>
              </div>
           </div>
        </motion.header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 relative z-10">
           {/* Current Roster */}
           <motion.div variants={ci} className="bg-white rounded-[2.5rem] p-8 border border-[#1A1A1A]/5 shadow-sm min-h-[600px] flex flex-col">
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-[#F5F5F0]">
                 <h3 className="font-black text-lg tracking-tighter text-[#1A1A1A] flex items-center gap-3 italic">
                    <FiUsers className="text-[#D4A373] w-5 h-5" />
                    Enrolled Roster
                 </h3>
                 <span className="bg-[#1A1A1A] text-white px-3 py-1 rounded-full text-[9px] font-black tracking-widest">{enrolledStudents.length} Students</span>
              </div>
              
              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
                 {loading ? (
                   [1,2,3,4,5].map(i => <div key={i} className="h-16 bg-[#F5F5F0] rounded-2xl animate-pulse" />)
                 ) : enrolledStudents.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-[#1A1A1A]/20 py-20 grayscale opacity-40">
                      <FiLayers className="w-16 h-16 mb-4" />
                      <p className="font-black text-sm uppercase tracking-widest">Target level is empty</p>
                   </div>
                 ) : (
                   enrolledStudents.map(s => (
                     <div key={s.id} className="flex items-center justify-between p-4 bg-[#F5F5F0]/50 rounded-2xl border border-transparent hover:border-[#1A1A1A]/5 hover:bg-white transition-all group">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-white border border-[#1A1A1A]/10 flex items-center justify-center text-[#1A1A1A] font-black text-xs uppercase italic drop-shadow-sm">
                              {s.name?.[0] || 'U'}
                           </div>
                           <div className="min-w-0">
                              <p className="font-black text-xs text-[#1A1A1A] tracking-tight uppercase truncate">{s.name}</p>
                              <p className="text-[9px] font-black text-[#1A1A1A]/30 tracking-widest mt-0.5 truncate">{s.email}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => handleUnenroll(s.id)}
                          disabled={actionLoading}
                          className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#DE0002] hover:bg-[#DE0002] hover:text-white transition-all shadow-sm border border-[#DE0002]/10"
                        >
                           <FiX className="w-4 h-4" />
                        </button>
                     </div>
                   ))
                 )}
              </div>
           </motion.div>

           {/* Search & Add */}
           <motion.div variants={ci} className="space-y-6">
              <div className="bg-[#1A1A1A] rounded-[2.5rem] p-8 sm:p-10 text-white relative overflow-hidden group min-h-[600px] flex flex-col">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-[#F97316]/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#F97316]/40 transition-all duration-1000" />
                 
                 <div className="relative z-10 space-y-6 mb-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4A373] italic">Register Student</p>
                    <div className="relative">
                       <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5 focus-within:text-[#F97316]" />
                       <input 
                         type="text" 
                         placeholder="Find student by identity or ID..."
                         value={search}
                         onChange={e => setSearch(e.target.value)}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-8 font-black text-sm text-white focus:ring-4 focus:ring-[#F97316]/20 transition-all outline-none placeholder:text-white/10"
                       />
                    </div>
                 </div>

                 <div className="relative z-10 flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
                    {availableStudents.length === 0 && search && (
                      <div className="text-center py-20 text-white/20">
                         <FiAlertCircle className="w-12 h-12 mx-auto mb-4" />
                         <p className="font-black text-[10px] uppercase tracking-widest leading-relaxed italic">No unassociated students found<br />matching your search criteria</p>
                      </div>
                    )}
                    {availableStudents.length === 0 && !search && (
                      <div className="text-center py-20 text-white/10">
                         <FiSearch className="w-16 h-16 mx-auto mb-4" />
                         <p className="font-black text-[10px] uppercase tracking-widest italic">Enter search details to resolve identity</p>
                      </div>
                    )}
                    {availableStudents.slice(0, 10).map(s => (
                      <div key={s.id} className="flex items-center justify-between p-5 bg-white/5 rounded-[1.5rem] border border-white/5 hover:bg-white/10 transition-all group">
                         <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-[#F97316] flex items-center justify-center text-white font-black italic shadow-lg shadow-[#F97316]/20">
                               {s.name?.[0] || 'U'}
                            </div>
                            <div>
                               <p className="font-black text-xs text-white uppercase tracking-tight">{s.name}</p>
                               <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1 italic">{s.email}</p>
                            </div>
                         </div>
                         <button 
                           onClick={() => handleEnroll(s.id)}
                           disabled={actionLoading}
                           className="bg-[#D4A373] hover:bg-white text-white hover:text-[#1A1A1A] px-5 py-3 rounded-2xl font-black text-[9px] tracking-[0.2em] uppercase transition-all shadow-xl shadow-black/20"
                         >
                            Enroll
                         </button>
                      </div>
                    ))}
                    {availableStudents.length > 10 && (
                      <p className="text-[9px] font-black uppercase text-center text-white/20 py-4 italic">Partial results shown. Refine search for accuracy.</p>
                    )}
                 </div>
              </div>

              {/* Status Indicator */}
              <AnimatePresence>
                 {(error || success) && (
                   <motion.div 
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     className={`p-5 rounded-3xl border flex items-center gap-4 ${error ? 'bg-red-50 border-red-200 text-[#DE0002]' : 'bg-green-50 border-green-200 text-green-600'}`}
                   >
                      {error ? <FiAlertCircle className="w-5 h-5 shrink-0" /> : <FiCheckCircle className="w-5 h-5 shrink-0" />}
                      <p className="font-black text-[10px] uppercase tracking-widest italic leading-tight">{error || success}</p>
                   </motion.div>
                 )}
              </AnimatePresence>
           </motion.div>
        </div>
      </main>
    </motion.div>
  );
}
