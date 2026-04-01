import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiChevronLeft, FiChevronRight, 
  FiCheckCircle, FiXCircle, FiClock, FiActivity 
} from 'react-icons/fi';
import AdminSidebar from '../../components/shared/AdminSidebar';
import { 
  fetchAttendanceForLevel, 
  adminFetchStudentsInLevel,
  markAttendance,
  type AttendanceRecord,
  type StudentWithAttendance
} from '../../services/secretaryService';
import { fetchAllLevelsPublic, type Level } from '../../services/studentService';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const ci = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } };

export default function AdminCalendar() {
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [students, setStudents] = useState<StudentWithAttendance[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());

  // Calendar Helpers
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  useEffect(() => {
    async function loadInitial() {
      try {
        const lvls = await fetchAllLevelsPublic();
        setLevels(lvls);
        if (lvls.length > 0) setSelectedLevelId(lvls[0].id);
      } catch (err) {
        console.error('Failed to load levels');
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  useEffect(() => {
    if (!selectedLevelId) return;
    async function loadData() {
      setLoading(true);
      try {
        const [stdData, attData] = await Promise.all([
          adminFetchStudentsInLevel(selectedLevelId),
          fetchAttendanceForLevel(selectedLevelId)
        ]);
        setStudents(stdData.map(s => ({ ...s, attendance: attData.filter(a => a.student_id === s.id) })) as StudentWithAttendance[]);
        setAttendance(attData);
      } catch (err) {
        console.error('Failed to load attendance');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedLevelId]);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const getAttendanceForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return attendance.filter(a => (a as any).session_date === dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const handleToggleAttendance = async (studentId: string, status: 'present' | 'absent') => {
    if (!selectedDay || !selectedLevelId) return;
    const dateStr = selectedDay.toISOString().split('T')[0];

    // Optimistic Update
    const newRecord: AttendanceRecord = {
      id: Math.random().toString(),
      student_id: studentId,
      level_id: selectedLevelId,
      session_number: 0,
      status,
      created_at: new Date().toISOString()
    };
    (newRecord as any).session_date = dateStr;

    setAttendance(prev => {
      const filtered = prev.filter(a => !(a.student_id === studentId && (a as any).session_date === dateStr));
      return [...filtered, newRecord];
    });

    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const filtered = s.attendance.filter(a => !((a as any).session_date === dateStr));
      return { ...s, attendance: [...filtered, newRecord] };
    }));

    try {
      await markAttendance({
        studentId,
        levelId: selectedLevelId,
        sessionNumber: 0,
        status,
        sessionDate: dateStr
      });
    } catch (err) {
      console.error("Sync error:", err);
    }
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <AdminSidebar />

      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        {/* Header */}
        <motion.header variants={ci} className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
           <div className="space-y-4">
              <h2 className="text-4xl sm:text-6xl font-black tracking-tighter text-[#1A1A1A] uppercase leading-none">
                 Attendance<br /><span className="text-[#F97316]">Calendar.</span>
              </h2>
              <div className="flex items-center gap-4">
                 <select 
                   value={selectedLevelId}
                   onChange={(e) => setSelectedLevelId(e.target.value)}
                   className="bg-white border border-[#1A1A1A]/5 rounded-2xl py-3 pl-5 pr-10 font-black text-[10px] text-[#1A1A1A] uppercase tracking-wider outline-none shadow-sm transition-all cursor-pointer"
                 >
                    {levels.map(l => <option key={l.id} value={l.id}>Level {l.name}</option>)}
                 </select>
              </div>
           </div>

           <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-xl border border-[#1A1A1A]/5">
              <button onClick={() => changeMonth(-1)} className="p-3 text-[#1A1A1A] hover:bg-[#F5F5F0] rounded-xl transition-all"><FiChevronLeft /></button>
              <span className="font-black text-xs uppercase tracking-[0.3em] px-4 min-w-[140px] text-center">{monthName} {currentDate.getFullYear()}</span>
              <button onClick={() => changeMonth(1)} className="p-3 text-[#1A1A1A] hover:bg-[#F5F5F0] rounded-xl transition-all"><FiChevronRight /></button>
           </div>
        </motion.header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
           {/* Calendar Grid */}
           <motion.div variants={ci} className="xl:col-span-2 bg-white rounded-[2.5rem] p-10 border border-[#1A1A1A]/5 shadow-sm">
              <div className="grid grid-cols-7 gap-4 mb-4">
                 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                   <div key={d} className="text-center text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/20 py-2">{d}</div>
                 ))}
              </div>
              
              <div className="grid grid-cols-7 gap-4">
                 {Array.from({ length: firstDayOfMonth(currentDate) }).map((_, i) => (
                   <div key={`empty-${i}`} className="aspect-square bg-transparent" />
                 ))}
                 
                 {Array.from({ length: daysInMonth(currentDate) }).map((_, i) => {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
                    const attForDay = getAttendanceForDate(date);
                    const isSel = selectedDay?.getDate() === date.getDate() && selectedDay?.getMonth() === date.getMonth();
                    
                    return (
                      <button 
                        key={i}
                        onClick={() => setSelectedDay(date)}
                        className={`aspect-square rounded-2xl border-2 transition-all flex flex-col items-center justify-center p-2 group relative ${
                          isSel ? 'border-[#F97316] bg-[#F97316]/5 scale-[1.05] z-10 shadow-lg' : 'border-transparent bg-[#F5F5F0]/50 hover:border-[#1A1A1A]/10'
                        }`}
                      >
                         <span className={`text-sm font-black italic ${isToday(date) ? 'text-[#F97316]' : 'text-[#1A1A1A]'}`}>
                            {i + 1}
                         </span>
                         
                         {attForDay.length > 0 && (
                            <div className="flex gap-1 mt-1">
                               <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm" />
                               {attForDay.some(a => a.status === 'absent') && <div className="w-1.5 h-1.5 rounded-full bg-[#DE0002] shadow-sm" />}
                            </div>
                         )}

                         {isToday(date) && (
                            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#F97316] animate-pulse" />
                         )}
                      </button>
                    );
                 })}
              </div>

              <div className="mt-10 pt-8 border-t border-[#F5F5F0] flex gap-6 italic">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30">Activity Tracked</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#F97316]" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30">Current Day</span>
                 </div>
              </div>
           </motion.div>

           {/* Daily Detail Side Panel */}
           <motion.div variants={ci} className="space-y-6">
              <div className="bg-[#1A1A1A] rounded-[2.5rem] p-8 sm:p-10 text-white relative overflow-hidden group shadow-2xl min-h-[500px] flex flex-col">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-[#F97316]/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#F97316]/40 transition-all duration-1000" />
                 
                 <div className="relative z-10 pb-8 border-b border-white/10 mb-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4A373] italic mb-3 flex items-center gap-2">
                       <FiClock className="w-3 h-3" /> Day Overview
                    </p>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">
                       {selectedDay?.toLocaleDateString('default', { weekday: 'long' })}<br />
                       <span className="text-[#D4A373]">{selectedDay?.toLocaleDateString('default', { day: 'numeric', month: 'short' })}</span>
                    </h3>
                 </div>

                 <div className="relative z-10 flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4 text-white/20 uppercase italic">
                         <FiActivity className="w-12 h-12 animate-pulse" />
                         <p className="text-[9px] font-black tracking-widest">Resolving records...</p>
                      </div>
                    ) : students.length === 0 ? (
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest text-center mt-20">No students in level</p>
                    ) : (
                      students.map(s => {
                        const rec = s.attendance.find((a: any) => (a.session_date === selectedDay?.toISOString().split('T')[0]));
                        return (
                          <div key={s.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#F97316]/20 flex items-center justify-center text-[#F97316] font-black text-xs uppercase italic border border-[#F97316]/20">
                                   {s.name?.[0] || 'U'}
                                </div>
                                <div>
                                   <p className="font-black text-xs text-white uppercase tracking-tight truncate max-w-[120px]">{s.name}</p>
                                   <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1">
                                      {rec ? (rec.status === 'present' ? '✓ Present' : '✗ Absent') : '— Pending'}
                                   </p>
                                </div>
                             </div>
                             
                             <div className="flex gap-2">
                                <button
                                  onClick={() => handleToggleAttendance(s.id, 'present')}
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${rec?.status === 'present' ? 'bg-green-500 text-white' : 'bg-white/5 text-white/20 hover:bg-green-500/20'}`}
                                >
                                   <FiCheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleToggleAttendance(s.id, 'absent')}
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${rec?.status === 'absent' ? 'bg-[#DE0002] text-white' : 'bg-white/5 text-white/20 hover:bg-red-500/20'}`}
                                >
                                   <FiXCircle className="w-4 h-4" />
                                </button>
                             </div>
                          </div>
                        );
                      })
                    )}
                 </div>
              </div>

              {/* Stats Summary */}
              <div className="bg-white rounded-[2rem] p-8 border border-[#1A1A1A]/5 shadow-sm">
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/30 mb-1 leading-none">Day Participation</p>
                       <p className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase leading-none italic">Active.</p>
                    </div>
                    <div className="text-right">
                       <p className="text-2xl font-black text-[#F97316] tracking-tighter leading-none">
                          {attendance.filter((a: any) => a.session_date === selectedDay?.toISOString().split('T')[0] && a.status === 'present').length}
                       </p>
                       <p className="text-[8px] font-black uppercase tracking-widest text-[#1A1A1A]/20 mt-1">Confirmed Presence</p>
                    </div>
                 </div>
              </div>
           </motion.div>
        </div>
      </main>
    </motion.div>
  );
}
