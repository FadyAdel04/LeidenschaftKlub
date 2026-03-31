import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Layers, Plus, Edit2, Trash2, X, Save, Loader2, AlertCircle,
  UserPlus, Search, ChevronDown, Users, BookOpen, GraduationCap, Shield
} from 'lucide-react';
import AdminSidebar from '../../components/shared/AdminSidebar';
import {
  fetchAllLevels, fetchAllStudents, fetchAllInstructors, fetchAllGroups,
  createLevel, updateLevel, deleteLevel,
  assignStudentToLevelNew, removeStudentFromLevel, fetchStudentsInLevel,
  type Level, type Profile, type Group
} from '../../services/adminService';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const ci = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

type Modal = 'create' | 'edit' | 'students' | null;

export default function AdminLevels() {
  const [levels, setLevels]           = useState<Level[]>([]);
  const [instructors, setInstructors] = useState<Profile[]>([]);
  const [allStudents, setAllStudents] = useState<Profile[]>([]);
  const [groups, setGroups]           = useState<Group[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState<Modal>(null);
  const [selected, setSelected]       = useState<Level | null>(null);

  // Create / Edit form fields
  const [fName, setFName]               = useState('');
  const [fDesc, setFDesc]               = useState('');
  const [fGroupId, setFGroupId]         = useState('');
  const [fInstructorId, setFInstructorId] = useState('');

  // Student assignment panel
  const [levelStudents, setLevelStudents] = useState<Profile[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  // Filter
  const [filterGroup, setFilterGroup] = useState('all');

  async function load() {
    setLoading(true);
    try {
      const [lvls, stds, insts, grps] = await Promise.all([
        fetchAllLevels(), fetchAllStudents(), fetchAllInstructors(), fetchAllGroups()
      ]);
      setLevels(lvls);
      setAllStudents(stds);
      setInstructors(insts);
      setGroups(grps);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setFName(''); setFDesc(''); setFGroupId(''); setFInstructorId('');
    setError(''); setModal('create');
  }

  function openEdit(lvl: Level) {
    setSelected(lvl);
    setFName(lvl.name);
    setFDesc((lvl as any).description ?? '');
    setFGroupId((lvl as any).group_id ?? '');
    setFInstructorId(lvl.instructor_id ?? '');
    setError(''); setModal('edit');
  }

  async function openStudents(lvl: Level) {
    setSelected(lvl);
    setStudentSearch('');
    setModal('students');
    const enrolled = await fetchStudentsInLevel(lvl.id);
    setLevelStudents(enrolled);
  }

  async function handleCreate() {
    if (!fName.trim()) { setError('Level name is required.'); return; }
    setSaving(true); setError('');
    try {
      await createLevel({ name: fName.trim(), description: fDesc || null, group_id: fGroupId || null, instructor_id: fInstructorId || null });
      setModal(null); await load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleUpdate() {
    if (!selected) return;
    setSaving(true); setError('');
    try {
      await updateLevel(selected.id, { name: fName.trim(), description: fDesc || null, group_id: fGroupId || null, instructor_id: fInstructorId || null });
      setModal(null); setSelected(null); await load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this level? Students will be unenrolled.')) return;
    try { await deleteLevel(id); await load(); }
    catch (e: any) { setError(e.message); }
  }

  async function toggleStudent(student: Profile) {
    if (!selected) return;
    const enrolled = levelStudents.some(s => s.id === student.id);
    try {
      if (enrolled) {
        await removeStudentFromLevel(student.id, selected.id);
        setLevelStudents(p => p.filter(s => s.id !== student.id));
      } else {
        await assignStudentToLevelNew(student.id, selected.id);
        setLevelStudents(p => [...p, student]);
      }
      await load();
    } catch (e: any) { setError(e.message); }
  }

  const displayedLevels = filterGroup === 'all'
    ? levels
    : levels.filter(l => (l as any).group_id === filterGroup);

  const filteredStudents = allStudents.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const groupMap = Object.fromEntries(groups.map(g => [g.id, g.name]));

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <AdminSidebar />

      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#DE0002]/[0.02] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

        {/* Header */}
        <motion.header variants={ci} className="mb-12 relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-[#1A1A1A] text-white px-4 py-1.5 rounded-full w-fit">
              <Layers className="w-3 h-3 text-[#D4A373]" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em]">Curriculum Architecture</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase">
              Academic<br /><span className="text-[#DE0002]">Levels.</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Group Filter */}
            <div className="relative">
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-[#1A1A1A]/30 pointer-events-none" />
              <select
                value={filterGroup}
                onChange={e => setFilterGroup(e.target.value)}
                className="pl-4 pr-10 py-3 bg-white border border-[#1A1A1A]/5 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none min-w-[160px] shadow-sm"
              >
                <option value="all">All Groups</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#DE0002] transition-colors active:scale-95 shadow-xl"
            >
              <Plus className="w-4 h-4" /> New Level
            </button>
          </div>
        </motion.header>

        {error && (
          <motion.div variants={ci} className="mb-8 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
            <AlertCircle className="w-4 h-4 text-[#DE0002] shrink-0" />
            <p className="text-xs font-black text-[#DE0002]">{error}</p>
          </motion.div>
        )}

        {/* Level Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-64 bg-white rounded-[2.5rem] animate-pulse" />)}
          </div>
        ) : displayedLevels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-[#1A1A1A]/5">
            <BookOpen className="w-16 h-16 text-[#1A1A1A]/10 mb-4" />
            <p className="font-black text-[#1A1A1A]/30 uppercase tracking-widest text-sm">No levels found.</p>
            <button onClick={openCreate} className="mt-6 px-6 py-3 bg-[#1A1A1A] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#DE0002] transition-colors">
              Create First Level
            </button>
          </div>
        ) : (
          <motion.div variants={cv} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
            {displayedLevels.map(level => {
              const groupName = (level as any).group_id ? groupMap[(level as any).group_id] : null;
              return (
                <motion.div key={level.id} variants={ci}
                  className="bg-white rounded-[2.5rem] p-8 border border-[#1A1A1A]/5 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#DE0002]/[0.03] rounded-full -translate-y-1/2 translate-x-1/2 blur-[60px] group-hover:bg-[#DE0002]/10 transition-all duration-700" />

                  {/* Level Name + Group badge */}
                  <div className="relative z-10 mb-6">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h2 className="text-4xl font-black tracking-tighter text-[#1A1A1A] uppercase leading-none group-hover:text-[#DE0002] transition-colors">
                        {level.name}
                      </h2>
                      <div className="flex gap-2 mt-1 shrink-0">
                        <button onClick={() => openEdit(level)} className="w-8 h-8 rounded-lg bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/40 hover:bg-[#1A1A1A] hover:text-white transition-all">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(level.id)} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[#DE0002]/60 hover:bg-[#DE0002] hover:text-white transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Parent Group tag */}
                    {groupName ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1A1A1A] text-white rounded-full text-[8px] font-black uppercase tracking-widest">
                        <BookOpen className="w-2.5 h-2.5 text-[#D4A373]" />
                        {groupName}
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F5F5F0] text-[#1A1A1A]/40 rounded-full text-[8px] font-black uppercase tracking-widest">
                        No Group Assigned
                      </div>
                    )}
                  </div>

                  {/* Instructor */}
                  <div className="relative z-10 flex items-center gap-3 bg-[#F5F5F0] p-3 rounded-2xl mb-4">
                    <div className="w-8 h-8 rounded-xl bg-[#D4A373]/20 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-[#D4A373]" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-[#1A1A1A]/30">Instructor</p>
                      <p className="text-[11px] font-black text-[#1A1A1A] uppercase">{level.instructor?.name || 'Unassigned'}</p>
                    </div>
                  </div>

                  {/* Students count + Assign button */}
                  <div className="relative z-10 mt-auto flex items-center justify-between pt-4 border-t border-[#1A1A1A]/5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#DE0002]/10 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-[#DE0002]" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-[#1A1A1A]">{level.student_count ?? 0}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#1A1A1A]/30">Students</p>
                      </div>
                    </div>
                    <button
                      onClick={() => openStudents(level)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#DE0002] transition-colors active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Manage Students
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {(modal === 'create' || modal === 'edit') && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-[#1A1A1A]/5 overflow-hidden"
              >
                <div className="p-8 md:p-10">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                      {modal === 'create' ? 'New' : 'Edit'} <span className="text-[#DE0002]">Level</span>
                    </h2>
                    <button onClick={() => setModal(null)} className="w-10 h-10 rounded-xl bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/40 hover:bg-[#1A1A1A] hover:text-white transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {error && <p className="mb-4 text-xs font-black text-[#DE0002] bg-red-50 p-3 rounded-xl">{error}</p>}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Name */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-1">Level Name *</label>
                      <input value={fName} onChange={e => setFName(e.target.value)} placeholder="e.g. A1.1"
                        className="w-full px-4 py-3.5 bg-[#F5F5F0] rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-[#DE0002]/20 border border-transparent focus:border-[#DE0002]/20" />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-1">Description</label>
                      <input value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Short overview..."
                        className="w-full px-4 py-3.5 bg-[#F5F5F0] rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-[#DE0002]/20 border border-transparent focus:border-[#DE0002]/20" />
                    </div>

                    {/* Parent Group */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-1">Parent Group</label>
                      <select value={fGroupId} onChange={e => setFGroupId(e.target.value)}
                        className="w-full px-4 py-3.5 bg-[#F5F5F0] rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-[#DE0002]/20 border border-transparent focus:border-[#DE0002]/20">
                        <option value="">— No Group —</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>

                    {/* Instructor */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-1">Instructor</label>
                      <select value={fInstructorId} onChange={e => setFInstructorId(e.target.value)}
                        className="w-full px-4 py-3.5 bg-[#F5F5F0] rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-[#DE0002]/20 border border-transparent focus:border-[#DE0002]/20">
                        <option value="">— Unassigned —</option>
                        {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-[#1A1A1A]/5">
                    <button onClick={() => setModal(null)} className="px-6 py-3 bg-[#F5F5F0] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-all">
                      Cancel
                    </button>
                    <button onClick={modal === 'create' ? handleCreate : handleUpdate} disabled={saving}
                      className="flex items-center gap-2 px-8 py-3 bg-[#DE0002] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-[#DE0002]/20 transition-all disabled:opacity-60 active:scale-95">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {modal === 'create' ? 'Create' : 'Save'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Student Assignment Modal ─────────────────────────────────────────── */}
        <AnimatePresence>
          {modal === 'students' && selected && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                className="w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl border border-[#1A1A1A]/5 overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                        Students <span className="text-[#DE0002]">→ {selected.name}</span>
                      </h2>
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 mt-1">
                        {levelStudents.length} enrolled · Toggle to add/remove
                      </p>
                    </div>
                    <button onClick={() => { setModal(null); load(); }} className="w-10 h-10 rounded-xl bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/40 hover:bg-[#1A1A1A] hover:text-white transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Search */}
                  <div className="relative mb-5">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/20" />
                    <input
                      value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                      placeholder="Search by name or email…"
                      className="w-full pl-12 pr-5 py-4 bg-[#F5F5F0] rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-[#DE0002]/10"
                    />
                  </div>

                  {/* Student list */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {filteredStudents.map(student => {
                      const enrolled = levelStudents.some(s => s.id === student.id);
                      return (
                        <div key={student.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${enrolled ? 'bg-[#DE0002]/5 border-[#DE0002]/20' : 'bg-[#F5F5F0] border-transparent hover:bg-white hover:border-[#1A1A1A]/5 hover:shadow-sm'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${enrolled ? 'bg-[#DE0002] text-white' : 'bg-[#1A1A1A]/10 text-[#1A1A1A]'}`}>
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[11px] font-black uppercase text-[#1A1A1A]">{student.name}</p>
                              <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30">{student.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleStudent(student)}
                            className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 ${
                              enrolled
                                ? 'bg-[#DE0002]/10 text-[#DE0002] hover:bg-[#DE0002] hover:text-white'
                                : 'bg-[#1A1A1A] text-white hover:bg-[#DE0002]'
                            }`}
                          >
                            {enrolled ? 'Remove' : 'Enroll'}
                          </button>
                        </div>
                      );
                    })}
                    {filteredStudents.length === 0 && (
                      <div className="text-center py-10">
                        <Users className="w-10 h-10 text-[#1A1A1A]/10 mx-auto mb-2" />
                        <p className="font-black text-[#1A1A1A]/30 text-xs uppercase tracking-widest">No students found</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
