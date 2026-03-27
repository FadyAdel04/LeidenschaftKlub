import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Users, Search, Edit2, Save, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import AdminSidebar from '../../components/shared/AdminSidebar';
import { fetchAllStudents, fetchAllLevels, updateStudentLevel, type Profile, type Level } from '../../services/adminService';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const ci = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?';
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminStudents() {
  const [students,  setStudents]  = useState<Profile[]>([]);
  const [levels,    setLevels]    = useState<Level[]>([]);
  const [ltered,  setltered]  = useState<Profile[]>([]);
  const [search,    setSearch]    = useState('');
  const [levellter, setLevellter] = useState('');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  // Inline level edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLevel, setEditLevel] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [saveMsg,   setSaveMsg]   = useState('');

  useEffect(() => {
    Promise.all([fetchAllStudents(), fetchAllLevels()])
      .then(([studentsData, levelsData]) => {
        setStudents(studentsData);
        setltered(studentsData);
        setLevels(levelsData);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let list = students;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name?.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    }
    if (levellter) list = list.filter(s => s.current_level === levellter);
    setltered(list);
  }, [search, levellter, students]);

  const handleSaveLevel = async (studentId: string) => {
    setSaving(true);
    setSaveMsg('');
    try {
      await updateStudentLevel(studentId, editLevel);
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, current_level: editLevel } : s));
      setSaveMsg('Level updated.');
      setEditingId(null);
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <AdminSidebar />

      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#C62828]/[0.02] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

        {/* Header */}
        <motion.header variants={ci} className="mb-10 lg:mb-14 relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase mb-3">
            Student<br /><span className="text-[#C62828]">Registry.</span>
          </h1>
          <p className="text-[#D4A373] font-black uppercase text-[10px] tracking-[0.5em] italic">
            {loading ? '—' : `${students.length} Registered Students`}
          </p>
        </motion.header>

        {/* Success */}
        {saveMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 relative z-10">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-xs font-bold text-green-700">{saveMsg}</p>
          </motion.div>
        )}
        {error && (
          <motion.div variants={ci} className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 relative z-10">
            <AlertCircle className="w-4 h-4 text-[#C62828] shrink-0" />
            <p className="text-xs font-bold text-[#C62828]">{error}</p>
          </motion.div>
        )}

        {/* lters */}
        <motion.div variants={ci} className="flex flex-col sm:flex-row gap-4 mb-8 relative z-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/20 w-4 h-4" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#1A1A1A]/5 rounded-2xl font-black text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 outline-none focus:ring-4 focus:ring-[#C62828]/10 shadow-sm transition-all"
            />
          </div>
          <select
            value={levellter} onChange={e => setLevellter(e.target.value)}
            className="px-5 py-3.5 bg-white border border-[#1A1A1A]/5 rounded-2xl font-black text-sm text-[#1A1A1A] outline-none focus:ring-4 focus:ring-[#C62828]/10 shadow-sm appearance-none cursor-pointer"
          >
            <option value="">All Levels</option>
            {levels.map(lv => <option key={lv.id} value={lv.name}>{lv.name}</option>)}
          </select>
        </motion.div>

        {/* Table */}
        <motion.div variants={ci} className="bg-white rounded-[2.5rem] border border-[#1A1A1A]/5 shadow-sm overflow-hidden relative z-10">
          {loading
            ? <div className="p-10 space-y-4">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-[#F5F5F0] rounded-2xl animate-pulse" />)}</div>
            : ltered.length === 0
              ? <div className="flex flex-col items-center justify-center py-32 text-center">
                  <Users className="w-12 h-12 text-[#1A1A1A]/10 mb-4" />
                  <p className="font-black text-[#1A1A1A]/30 uppercase">No students found.</p>
                </div>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1A1A1A]/5 bg-[#F5F5F0]/50">
                        {['Student', 'Email', 'Level', 'Joined', 'Actions'].map(h => (
                          <th key={h} className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] italic whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ltered.map(s => (
                        <tr key={s.id} className="border-b border-[#1A1A1A]/5 hover:bg-[#F5F5F0]/40 transition-all group">
                          {/* Name */}
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-[#C62828] flex items-center justify-center text-white font-black text-sm shrink-0">
                                {getInitials(s.name || s.email)}
                              </div>
                              <p className="font-black text-sm text-[#1A1A1A] whitespace-nowrap">{s.name || '—'}</p>
                            </div>
                          </td>
                          {/* Email */}
                          <td className="px-8 py-5">
                            <p className="text-xs font-black text-[#1A1A1A]/40 truncate max-w-[200px]">{s.email}</p>
                          </td>
                          {/* Level — editable inline */}
                          <td className="px-8 py-5">
                            {editingId === s.id ? (
                              <select
                                value={editLevel}
                                onChange={e => setEditLevel(e.target.value)}
                                className="px-4 py-2 bg-[#F5F5F0] rounded-xl font-black text-sm text-[#C62828] outline-none focus:ring-2 focus:ring-[#C62828]/20 border border-[#C62828]/20"
                              >
                                {levels.map(lv => <option key={lv.id} value={lv.name}>{lv.name}</option>)}
                              </select>
                            ) : (
                              <span className="px-4 py-1.5 bg-[#C62828]/5 text-[#C62828] text-[10px] font-black uppercase tracking-widest rounded-full border border-[#C62828]/10">
                                Level {s.current_level}
                              </span>
                            )}
                          </td>
                          {/* Joined */}
                          <td className="px-8 py-5">
                            <p className="text-[10px] font-black text-[#1A1A1A]/30 uppercase tracking-wider whitespace-nowrap">{formatDate(s.created_at)}</p>
                          </td>
                          {/* Actions */}
                          <td className="px-8 py-5">
                            {editingId === s.id ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleSaveLevel(s.id)}
                                  disabled={saving}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-[#C62828] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all active:scale-95 disabled:opacity-60"
                                >
                                  {saving ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-2 bg-[#F5F5F0] rounded-xl text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setEditingId(s.id); setEditLevel(s.current_level); }}
                                className="flex items-center gap-2 px-4 py-2 bg-[#F5F5F0] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border border-[#1A1A1A]/5"
                              >
                                <Edit2 className="w-3 h-3" /> Level
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
          }
          {/* Footer */}
          <div className="px-8 py-5 bg-[#F5F5F0]/30 border-t border-[#1A1A1A]/5">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#1A1A1A]/20 italic">
              Showing {ltered.length} of {students.length} students
            </p>
          </div>
        </motion.div>
      </main>
    </motion.div>
  );
}
