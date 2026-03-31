import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Users, Plus, Edit2, Trash2, X, Save, Loader2, GraduationCap,
  ChevronDown, ChevronRight, Shield, BookOpen, UserPlus, Search
} from 'lucide-react';
import AdminSidebar from '../../components/shared/AdminSidebar';
import {
  fetchAllGroups, createGroup, updateGroup, deleteGroup,
  fetchAllLevels, fetchAllInstructors, fetchAllStudents,
  updateLevel, assignStudentToLevelNew, removeStudentFromLevel, fetchStudentsInLevel,
  type Group, type Level, type Profile,
} from '../../services/adminService';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const ci = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

interface GroupWithLevels extends Group {
  levels: Level[];
  expanded: boolean;
}

export default function AdminGroups() {
  const [groupsData, setGroupsData]   = useState<GroupWithLevels[]>([]);
  const [allLevels, setAllLevels]     = useState<Level[]>([]);
  const [instructors, setInstructors] = useState<Profile[]>([]);
  const [allStudents, setAllStudents] = useState<Profile[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  // Create/Edit group modal
  const [groupModal, setGroupModal]     = useState<'create' | 'edit' | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [gName, setGName]               = useState('');
  const [gDesc, setGDesc]               = useState('');

  // Level assignment modal (assign a level to this group + instructor)
  const [levelModal, setLevelModal]         = useState<Level | null>(null);
  const [levelGroupId, setLevelGroupId]     = useState('');
  const [levelInstructorId, setLevelInstructorId] = useState('');

  // Student assignment modal
  const [studentModal, setStudentModal]   = useState<Level | null>(null);
  const [levelStudents, setLevelStudents] = useState<Profile[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [grps, lvls, insts, stds] = await Promise.all([
        fetchAllGroups(), fetchAllLevels(), fetchAllInstructors(), fetchAllStudents()
      ]);
      setAllLevels(lvls);
      setInstructors(insts);
      setAllStudents(stds);

      // Merge levels into groups
      const merged: GroupWithLevels[] = grps.map(g => ({
        ...g,
        levels: lvls.filter(l => (l as any).group_id === g.id),
        expanded: false,
      }));
      setGroupsData(merged);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function toggleExpand(id: string) {
    setGroupsData(prev => prev.map(g => g.id === id ? { ...g, expanded: !g.expanded } : g));
  }

  // ── Group CRUD ──────────────────────────────────────────────────────────────
  function openCreateGroup() { setGName(''); setGDesc(''); setGroupModal('create'); }
  function openEditGroup(g: Group) { setSelectedGroup(g); setGName(g.name); setGDesc((g as any).description ?? ''); setGroupModal('edit'); }

  async function handleSaveGroup() {
    if (!gName.trim()) { setError('Group name is required.'); return; }
    setSaving(true); setError('');
    try {
      if (groupModal === 'create') {
        await createGroup({ name: gName.trim(), level: '' });
      } else if (selectedGroup) {
        await updateGroup(selectedGroup.id, { name: gName.trim(), level: '' });
      }
      setGroupModal(null); await load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDeleteGroup(id: string) {
    if (!confirm('Delete this group? Levels will be unlinked.')) return;
    try { await deleteGroup(id); await load(); }
    catch (e: any) { setError(e.message); }
  }

  // ── Level assignment to group ────────────────────────────────────────────────
  function openLevelModal(level: Level) {
    setLevelModal(level);
    setLevelGroupId((level as any).group_id ?? '');
    setLevelInstructorId(level.instructor_id ?? '');
  }

  async function handleSaveLevel() {
    if (!levelModal) return;
    setSaving(true); setError('');
    try {
      await updateLevel(levelModal.id, { group_id: levelGroupId || null, instructor_id: levelInstructorId || null });
      setLevelModal(null); await load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  // ── Student assignment to level ──────────────────────────────────────────────
  async function openStudentModal(level: Level) {
    setStudentModal(level);
    setStudentSearch('');
    const enrolled = await fetchStudentsInLevel(level.id);
    setLevelStudents(enrolled);
  }

  async function toggleStudent(student: Profile) {
    if (!studentModal) return;
    const enrolled = levelStudents.some(s => s.id === student.id);
    try {
      if (enrolled) {
        await removeStudentFromLevel(student.id, studentModal.id);
        setLevelStudents(p => p.filter(s => s.id !== student.id));
      } else {
        await assignStudentToLevelNew(student.id, studentModal.id);
        setLevelStudents(p => [...p, student]);
      }
      await load();
    } catch (e: any) { setError(e.message); }
  }

  const filteredStudents = allStudents.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Count orphan levels (not assigned to any group)
  const orphanLevels = allLevels.filter(l => !(l as any).group_id);

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <AdminSidebar />

      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#DE0002]/[0.02] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

        {/* Header */}
        <motion.header variants={ci} className="mb-12 relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-[#1A1A1A] text-white px-4 py-1.5 rounded-full w-fit">
              <Users className="w-3 h-3 text-[#D4A373]" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em]">Group Architecture</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase">
              Group<br /><span className="text-[#DE0002]">Management.</span>
            </h1>
          </div>
          <button
            onClick={openCreateGroup}
            className="flex items-center gap-2 px-6 py-3 bg-[#1A1A1A] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#DE0002] transition-colors active:scale-95 shadow-xl"
          >
            <Plus className="w-4 h-4" /> New Group
          </button>
        </motion.header>

        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-black text-[#DE0002]">
            <X className="w-4 h-4 shrink-0 cursor-pointer" onClick={() => setError('')} /> {error}
          </div>
        )}

        {/* Orphan levels notice */}
        {orphanLevels.length > 0 && (
          <motion.div variants={ci} className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs font-black text-amber-700">
              {orphanLevels.length} level{orphanLevels.length > 1 ? 's' : ''} not assigned to any group:&nbsp;
              <span className="opacity-70">{orphanLevels.map(l => l.name).join(', ')}</span>
            </p>
          </motion.div>
        )}

        {/* Groups Tree */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-[2rem] animate-pulse" />)}
          </div>
        ) : groupsData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-[#1A1A1A]/5">
            <Users className="w-16 h-16 text-[#1A1A1A]/10 mb-4" />
            <p className="font-black text-[#1A1A1A]/30 uppercase tracking-widest text-sm">No groups yet.</p>
            <button onClick={openCreateGroup} className="mt-6 px-6 py-3 bg-[#1A1A1A] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#DE0002] transition-colors">
              Create First Group
            </button>
          </div>
        ) : (
          <motion.div variants={cv} className="space-y-5 relative z-10">
            {groupsData.map(group => (
              <motion.div key={group.id} variants={ci} className="bg-white rounded-[2rem] border border-[#1A1A1A]/5 shadow-sm overflow-hidden">

                {/* Group Row */}
                <div className="flex items-center justify-between p-6 sm:p-8">
                  <button
                    onClick={() => toggleExpand(group.id)}
                    className="flex items-center gap-4 flex-1 text-left group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] flex items-center justify-center shrink-0 group-hover:bg-[#DE0002] transition-colors">
                      {group.expanded
                        ? <ChevronDown className="w-5 h-5 text-white" />
                        : <ChevronRight className="w-5 h-5 text-white" />
                      }
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tighter text-[#1A1A1A] uppercase group-hover:text-[#DE0002] transition-colors">
                        {group.name}
                      </h2>
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 mt-0.5">
                        {group.levels.length} Level{group.levels.length !== 1 ? 's' : ''} ·{' '}
                        {group.levels.reduce((sum, l) => sum + (l.student_count ?? 0), 0)} Students
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => openEditGroup(group)} className="w-9 h-9 rounded-xl bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/40 hover:bg-[#1A1A1A] hover:text-white transition-all">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteGroup(group.id)} className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-[#DE0002]/60 hover:bg-[#DE0002] hover:text-white transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Child Levels */}
                <AnimatePresence>
                  {group.expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-[#1A1A1A]/5"
                    >
                      <div className="p-4 sm:p-6 bg-[#F5F5F0]/50">
                        {group.levels.length === 0 ? (
                          <div className="text-center py-8">
                            <BookOpen className="w-8 h-8 text-[#1A1A1A]/10 mx-auto mb-2" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30">
                              No levels assigned to this group yet.<br />
                              Go to Academic Levels to assign.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {group.levels.map(level => (
                              <div key={level.id} className="bg-white rounded-2xl p-5 border border-[#1A1A1A]/5 shadow-sm hover:shadow-md transition-all group/level relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-[#DE0002]/[0.03] rounded-full -translate-y-1/2 translate-x-1/2 blur-[30px]" />

                                {/* Level name + edit link */}
                                <div className="flex items-start justify-between mb-3 relative z-10">
                                  <div>
                                    <h3 className="text-xl font-black tracking-tighter text-[#1A1A1A] uppercase group-hover/level:text-[#DE0002] transition-colors">
                                      {level.name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <GraduationCap className="w-3 h-3 text-[#1A1A1A]/30" />
                                      <span className="text-[8px] font-black uppercase tracking-widest text-[#1A1A1A]/30">
                                        {level.student_count ?? 0} students
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => openLevelModal(level)}
                                    title="Edit group & instructor"
                                    className="w-7 h-7 rounded-lg bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/30 hover:bg-[#1A1A1A] hover:text-white transition-all"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>

                                {/* Instructor */}
                                <div className="flex items-center gap-2 bg-[#F5F5F0] px-3 py-2 rounded-xl mb-3 relative z-10">
                                  <Shield className="w-3.5 h-3.5 text-[#D4A373] shrink-0" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A] truncate">
                                    {level.instructor?.name || 'No Instructor'}
                                  </span>
                                </div>

                                {/* Assign Students button */}
                                <button
                                  onClick={() => openStudentModal(level)}
                                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1A1A1A] text-white rounded-xl font-black text-[8px] uppercase tracking-widest hover:bg-[#DE0002] transition-colors active:scale-95 relative z-10"
                                >
                                  <UserPlus className="w-3 h-3" /> Manage Students
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── Create / Edit Group Modal ─────────────────────────────────────────── */}
        <AnimatePresence>
          {groupModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-[#1A1A1A]/5 p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black tracking-tighter text-[#1A1A1A] uppercase">
                    {groupModal === 'create' ? 'New' : 'Edit'} <span className="text-[#DE0002]">Group</span>
                  </h2>
                  <button onClick={() => setGroupModal(null)} className="w-10 h-10 rounded-xl bg-[#F5F5F0] flex items-center justify-center hover:bg-[#1A1A1A] hover:text-white transition-all text-[#1A1A1A]/40">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {error && <p className="mb-4 text-xs font-black text-[#DE0002] bg-red-50 p-3 rounded-xl">{error}</p>}

                <div className="space-y-4 mb-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-1">Group Name *</label>
                    <input value={gName} onChange={e => setGName(e.target.value)} placeholder="e.g. A1"
                      className="w-full px-4 py-3.5 bg-[#F5F5F0] rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-[#DE0002]/20 border border-transparent focus:border-[#DE0002]/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-1">Description</label>
                    <input value={gDesc} onChange={e => setGDesc(e.target.value)} placeholder="Short description…"
                      className="w-full px-4 py-3.5 bg-[#F5F5F0] rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-[#DE0002]/20 border border-transparent focus:border-[#DE0002]/20" />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button onClick={() => setGroupModal(null)} className="px-6 py-3 bg-[#F5F5F0] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-all">Cancel</button>
                  <button onClick={handleSaveGroup} disabled={saving}
                    className="flex items-center gap-2 px-8 py-3 bg-[#DE0002] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all disabled:opacity-60 active:scale-95">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {groupModal === 'create' ? 'Create' : 'Save'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Edit Level Group & Instructor Modal ───────────────────────────────── */}
        <AnimatePresence>
          {levelModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-[#1A1A1A]/5 p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black tracking-tighter text-[#1A1A1A] uppercase">
                    Configure <span className="text-[#DE0002]">{levelModal.name}</span>
                  </h2>
                  <button onClick={() => setLevelModal(null)} className="w-10 h-10 rounded-xl bg-[#F5F5F0] flex items-center justify-center hover:bg-[#1A1A1A] hover:text-white transition-all text-[#1A1A1A]/40">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {error && <p className="mb-4 text-xs font-black text-[#DE0002] bg-red-50 p-3 rounded-xl">{error}</p>}

                <div className="space-y-4 mb-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-1">Parent Group</label>
                    <select value={levelGroupId} onChange={e => setLevelGroupId(e.target.value)}
                      className="w-full px-4 py-3.5 bg-[#F5F5F0] rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-[#DE0002]/20 border border-transparent focus:border-[#DE0002]/20">
                      <option value="">— No Group —</option>
                      {groupsData.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-1">Instructor</label>
                    <select value={levelInstructorId} onChange={e => setLevelInstructorId(e.target.value)}
                      className="w-full px-4 py-3.5 bg-[#F5F5F0] rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-[#DE0002]/20 border border-transparent focus:border-[#DE0002]/20">
                      <option value="">— Unassigned —</option>
                      {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button onClick={() => setLevelModal(null)} className="px-6 py-3 bg-[#F5F5F0] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-all">Cancel</button>
                  <button onClick={handleSaveLevel} disabled={saving}
                    className="flex items-center gap-2 px-8 py-3 bg-[#DE0002] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all disabled:opacity-60 active:scale-95">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Student Assignment Modal ──────────────────────────────────────────── */}
        <AnimatePresence>
          {studentModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                className="w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl border border-[#1A1A1A]/5 overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tighter uppercase">
                        Students <span className="text-[#DE0002]">→ {studentModal.name}</span>
                      </h2>
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 mt-1">
                        {levelStudents.length} enrolled · Toggle to add/remove
                      </p>
                    </div>
                    <button onClick={() => { setStudentModal(null); load(); }} className="w-10 h-10 rounded-xl bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/40 hover:bg-[#1A1A1A] hover:text-white transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="relative mb-5">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/20" />
                    <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                      placeholder="Search student…"
                      className="w-full pl-12 pr-5 py-4 bg-[#F5F5F0] rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-[#DE0002]/10" />
                  </div>

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
                            className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 ${enrolled ? 'bg-[#DE0002]/10 text-[#DE0002] hover:bg-[#DE0002] hover:text-white' : 'bg-[#1A1A1A] text-white hover:bg-[#DE0002]'}`}
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
