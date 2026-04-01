import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiCheckCircle, FiXCircle, FiUsers, 
  FiChevronDown, FiActivity, FiAlertCircle
} from 'react-icons/fi';
import AdminSidebar from '../../components/shared/AdminSidebar';
import { 
  adminFetchStudentsInLevel, 
  fetchAttendanceForLevel, 
  markAttendance,
  fetchLevelSessions,
  upsertLevelSession,
  type AttendanceRecord,
  type StudentWithAttendance
} from '../../services/secretaryService';
import { fetchAllLevelsPublic, type Level } from '../../services/studentService';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } } };
const ci = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function AdminAttendance() {
  
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<string>('');
  const [students, setStudents] = useState<StudentWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionDates, setSessionDates] = useState<Record<number, string>>({});

  const sessions = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    async function loadLevels() {
      try {
        const lvls = await fetchAllLevelsPublic();
        setLevels(lvls);
        if (lvls.length > 0) setSelectedLevelId(lvls[0].id);
      } catch (err) {
        setError('Failed to load levels');
      } finally {
        setLoading(false);
      }
    }
    loadLevels();
  }, []);

  useEffect(() => {
    if (!selectedLevelId) return;
    async function loadData() {
      setLoading(true);
      try {
        const [p_students, p_attendance, p_sessions] = await Promise.all([
          adminFetchStudentsInLevel(selectedLevelId),
          fetchAttendanceForLevel(selectedLevelId),
          fetchLevelSessions(selectedLevelId)
        ]);
        
        const mapped = p_students.map(s => ({
          ...s,
          attendance: p_attendance.filter(a => a.student_id === s.id)
        }));
        setStudents(mapped);

        // Load specific level dates from sessions table
        const dates: Record<number, string> = {};
        p_sessions.forEach(s => {
          dates[s.session_number] = s.session_date;
        });
        setSessionDates(dates);
      } catch (err) {
        setError('Failed to load student data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedLevelId]);

  const handleDateChange = async (sessionNum: number, date: string) => {
    setSessionDates(prev => ({ ...prev, [sessionNum]: date }));
    try {
      if (selectedLevelId) {
        await upsertLevelSession(selectedLevelId, sessionNum, date);
      }
    } catch (err) {
      setError('Failed to save session date');
    }
  };

  const toggleAttendance = async (studentId: string, sessionNum: number, currentStatus?: 'present' | 'absent' | null) => {
    let nextStatus: 'present' | 'absent' | null = 'present';
    if (currentStatus === 'present') nextStatus = 'absent';
    else if (currentStatus === 'absent') nextStatus = null;
    
    // Optimistic Update
    const prevStudents = [...students];
    const newStudents = students.map((s: StudentWithAttendance) => {
      if (s.id !== studentId) return s;
      const filtered = s.attendance.filter(a => a.session_number !== sessionNum);
      const newAttendance = nextStatus ? [...filtered, { 
          id: Math.random().toString(), 
          student_id: studentId, 
          level_id: selectedLevelId, 
          session_number: sessionNum, 
          status: nextStatus,
          created_at: new Date().toISOString()
        } as AttendanceRecord] : filtered;
      
      return {
        ...s,
        attendance: newAttendance
      };
    });
    setStudents(newStudents);

    try {
      await markAttendance({
        studentId,
        levelId: selectedLevelId,
        sessionNumber: sessionNum,
        status: nextStatus,
        sessionDate: sessionDates[sessionNum] || new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      setError('Failed to update attendance');
      setStudents(prevStudents);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <AdminSidebar />

      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#F97316]/[0.02] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

        <motion.header variants={ci} className="mb-10 lg:mb-16 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 relative z-10">
          <div className="space-y-4">
             <div className="flex items-center gap-2">
                <span className="bg-[#1A1A1A] text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">Session Tracking</span>
                <span className="bg-[#F97316]/10 text-[#F97316] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-[#F97316]/20">Live Sync</span>
             </div>
             <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase">
                Take<br /><span className="text-[#F97316]">Attendance.</span>
             </h2>
          </div>

          <div className="w-full sm:w-auto relative">
             <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/30 w-4 h-4 pointer-events-none" />
             <select 
               value={selectedLevelId}
               onChange={(e) => setSelectedLevelId(e.target.value)}
               className="w-full sm:w-72 bg-white border border-[#1A1A1A]/5 rounded-2xl py-4 pl-6 pr-12 font-black text-sm text-[#1A1A1A] uppercase tracking-wider outline-none focus:ring-4 focus:ring-[#F97316]/10 shadow-sm transition-all appearance-none cursor-pointer"
             >
                {levels.map(l => (
                  <option key={l.id} value={l.id}>Level {l.name}</option>
                ))}
             </select>
          </div>
        </motion.header>

        {error && (
          <motion.div variants={ci} className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-4 text-[#DE0002]">
             <FiAlertCircle className="w-5 h-5 shrink-0" />
             <p className="font-black text-sm uppercase tracking-tight">{error}</p>
          </motion.div>
        )}

        <motion.div variants={ci} className="bg-white rounded-[2.5rem] border border-[#1A1A1A]/5 shadow-2xl relative z-10 overflow-hidden">
           <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                 <thead>
                    <tr className="border-b border-[#F5F5F0]">
                       <th className="p-8 pb-6 text-[10px] font-black uppercase tracking-[0.4em] text-[#D4A373] italic">Student Details</th>
                       {sessions.map(s => (
                          <th key={s} className="p-8 pb-6 text-center border-l border-[#F5F5F0]">
                             <div className="flex flex-col items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/30">Session {s}</span>
                                <input 
                                  type="date" 
                                  value={sessionDates[s] || ''}
                                  onChange={(e) => handleDateChange(s, e.target.value)}
                                  className="bg-[#F5F5F0] border-none rounded-lg p-2 text-[9px] font-black uppercase tracking-tighter outline-none focus:ring-2 focus:ring-[#F97316] text-[#1A1A1A]/60"
                                />
                             </div>
                          </th>
                       ))}
                       <th className="p-8 pb-6 text-center text-[10px] font-black uppercase tracking-widest text-[#DE0002] italic whitespace-nowrap">Summary</th>
                    </tr>
                 </thead>
                 <tbody>
                    {loading ? (
                      [1,2,3,4,5].map(i => (
                        <tr key={i} className="border-b border-[#F5F5F0]">
                          <td className="p-8"><div className="h-10 w-48 bg-[#F5F5F0] rounded-xl animate-pulse" /></td>
                          {sessions.map(s => <td key={s} className="p-8"><div className="h-8 w-16 mx-auto bg-[#F5F5F0] rounded-xl animate-pulse" /></td>)}
                          <td className="p-8"><div className="h-8 w-24 mx-auto bg-[#F5F5F0] rounded-xl animate-pulse" /></td>
                        </tr>
                      ))
                    ) : students.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-20 text-center">
                           <div className="flex flex-col items-center gap-4 text-[#1A1A1A]/20">
                              <FiUsers className="w-12 h-12" />
                              <p className="font-black uppercase tracking-widest text-sm">No students enrolled in this level</p>
                           </div>
                        </td>
                      </tr>
                    ) : (
                      students.map((student: StudentWithAttendance) => {
                        const absences = student.attendance.filter(a => a.status === 'absent').length;
                        const limitReached = absences >= 2;
                        const exceeded = absences > 2;

                        return (
                          <motion.tr 
                            key={student.id} 
                            className={`border-b border-[#F5F5F0] transition-colors ${exceeded ? 'bg-red-50/50' : limitReached ? 'bg-amber-50/50' : 'hover:bg-[#F5F5F0]/30'}`}
                          >
                             <td className="p-8">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 flex items-center justify-center text-[#F97316] text-[10px] font-black border border-[#F97316]/10 uppercase italic">
                                      {student.name?.[0] || 'S'}
                                   </div>
                                   <div>
                                      <p className="font-black text-[#1A1A1A] uppercase text-sm tracking-tight">{student.name}</p>
                                      <p className="text-[9px] font-black text-[#1A1A1A]/30 uppercase tracking-widest mt-1 italic leading-none">{student.email}</p>
                                   </div>
                                </div>
                             </td>
                             
                             {sessions.map(s => {
                                const record = student.attendance.find(a => a.session_number === s);
                                const status = record?.status;
                                return (
                                  <td key={s} className="p-6 border-l border-[#F5F5F0]">
                                     <button
                                       onClick={() => toggleAttendance(student.id, s, status)}
                                       className={`w-full py-4 rounded-2xl flex items-center justify-center transition-all border ${
                                         status === 'present' 
                                           ? 'bg-green-500 text-white border-green-600 shadow-lg shadow-green-500/20' 
                                           : status === 'absent'
                                             ? 'bg-[#DE0002] text-white border-[#DE0002] shadow-lg shadow-[#DE0002]/20'
                                             : 'bg-[#F5F5F0] text-[#1A1A1A]/20 border-transparent hover:border-[#1A1A1A]/10'
                                       }`}
                                     >
                                        {status === 'present' ? <FiCheckCircle className="w-5 h-5" /> : status === 'absent' ? <FiXCircle className="w-5 h-5" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                                     </button>
                                  </td>
                                );
                             })}

                             <td className="p-8 text-center border-l border-[#F5F5F0]">
                                <div className="space-y-2">
                                   <p className={`font-black uppercase tracking-tighter text-xl ${exceeded ? 'text-[#DE0002]' : limitReached ? 'text-[#D4A373]' : 'text-[#1A1A1A]'}`}>
                                      {absences} <span className="text-[10px] text-[#1A1A1A]/20 uppercase">Absences</span>
                                   </p>
                                   {limitReached && (
                                     <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest flex items-center justify-center gap-1 mx-auto ${exceeded ? 'bg-[#DE0002]/10 text-[#DE0002]' : 'bg-[#D4A373]/10 text-[#D4A373]'}`}>
                                        <FiActivity className="w-2 h-2" />
                                        {exceeded ? 'Limit Exceeded' : 'Limit Reached'}
                                     </div>
                                   )}
                                </div>
                             </td>
                          </motion.tr>
                        );
                      })
                    )}
                 </tbody>
              </table>
           </div>

           <div className="p-8 bg-[#F5F5F0]/50 border-t border-[#F5F5F0] flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/40 italic">Present</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#DE0002]" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/40 italic">Absent</span>
                 </div>
                 <div className="flex items-center gap-2 border-l border-[#1A1A1A]/5 pl-6 ml-2">
                    <FiActivity className="w-3 h-3 text-[#D4A373]" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#D4A373] italic">Max Absences: 2</span>
                 </div>
              </div>

              <div className="flex items-center gap-4">
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/20">Auto-Saving enabled</p>
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
           </div>
        </motion.div>
      </main>
    </motion.div>
  );
}
