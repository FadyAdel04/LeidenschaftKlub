import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Users, Plus, Edit2, Trash2, X, Loader2, GraduationCap,
  ChevronDown, ChevronRight, Shield, BookOpen, UserPlus, Search
} from 'lucide-react';
import SecretarySidebar from '../../components/shared/SecretarySidebar';
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

export default function SecretaryGroups() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex uppercase">
      <SecretarySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onToggle={() => setSidebarOpen(p => !p)} />

      <main className="pt-24 sm:pt-28 lg:pt-10 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#F97316]/[0.02] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

        {/* Header */}
        <motion.header variants={ci} className="mb-12 relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-[#1A1A1A] text-white px-4 py-1.5 rounded-full w-fit">
              <Users className="w-3 h-3 text-[#F97316]" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em]">Institutional Groups</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase">
              Group<br /><span className="text-[#F97316]">Architecture.</span>
            </h1>
          </div>
          <button
            onClick={openCreateGroup}
            className="w-full xl:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#1A1A1A] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#F97316] transition-all active:scale-95 shadow-xl shadow-black/20"
          >
            <Plus className="w-4 h-4 shrink-0" /> Initialize Group
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
              {orphanLevels.length} level{orphanLevels.length > 1 ? 's' : ''} unassigned:&nbsp;
              <span className="opacity-70">{orphanLevels.map(l => l.name).join(', ')}</span>
            </p>
          </motion.div>
        )}

        {/* Groups Tree */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-[2rem] animate-pulse shadow-sm border border-[#1A1A1A]/5" />)}
          </div>
        ) : groupsData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-[#1A1A1A]/5 shadow-sm">
            <Users className="w-16 h-16 text-[#1A1A1A]/10 mb-4" />
            <p className="font-black text-[#1A1A1A]/30 uppercase tracking-widest text-sm italic">Academic nexus empty.</p>
            <button onClick={openCreateGroup} className="mt-6 px-10 py-4 bg-[#1A1A1A] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#F97316] transition-all">
              Initialize First Cluster
            </button>
          </div>
        ) : (
          <motion.div variants={cv} className="space-y-5 relative z-10">
            {groupsData.map(group => (
              <motion.div key={group.id} variants={ci} className="bg-white rounded-[2.5rem] border border-[#1A1A1A]/5 shadow-sm hover:shadow-xl transition-all overflow-hidden group/item">
                
                {/* Group Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-6 sm:p-10 gap-6">
                  <button
                    onClick={() => toggleExpand(group.id)}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 flex-1 text-left overflow-hidden min-w-0"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[#F5F5F0] flex items-center justify-center shrink-0 group-hover/item:bg-[#F97316]/5 transition-all">
                      {group.expanded
                        ? <ChevronDown className="w-6 h-6 text-[#F97316]" />
                        : <ChevronRight className="w-6 h-6 text-[#1A1A1A]/20" />
                      }
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-3xl font-black tracking-tighter text-[#1A1A1A] uppercase leading-none mb-2 truncate">
                        {group.name}
                      </h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/30 italic truncate">
                        {group.levels.length} Tiers ·{' '}
                        {group.levels.reduce((sum, l) => sum + (l.student_count ?? 0), 0)} Enrolled
                      </p>
                    </div>
                  </button>

                  <div className="flex justify-between sm:justify-end items-center gap-3 shrink-0 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-none border-[#F5F5F0]">
                    <button onClick={() => openEditGroup(group)} className="w-12 h-12 rounded-2xl bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/20 hover:bg-[#1A1A1A] hover:text-white transition-all shadow-sm">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteGroup(group.id)} className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-[#DE0002]/40 hover:bg-[#DE0002] hover:text-white transition-all shadow-sm">
                      <Trash2 className="w-4 h-4" />
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
                      className="overflow-hidden border-t border-[#F5F5F0]"
                    >
                      <div className="p-6 sm:p-10 bg-[#F5F5F0]/30 min-h-[200px]">
                        {group.levels.length === 0 ? (
                           <div className="flex flex-col items-center justify-center py-10 text-[#1A1A1A]/20">
                              <BookOpen className="w-12 h-12 mb-4 opacity-50" />
                              <p className="text-[9px] font-black uppercase tracking-[0.3em] italic">No curriculum tiers linked to this architecture.</p>
                           </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {group.levels.map(level => (
                              <div key={level.id} className="bg-white rounded-[2rem] p-6 border border-[#1A1A1A]/5 shadow-sm hover:shadow-xl transition-all group/tier relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#F97316]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                
                                <div className="flex items-start justify-between mb-6 relative z-10">
                                  <div>
                                    <h3 className="text-xl font-black tracking-tighter text-[#1A1A1A] uppercase leading-none italic">{level.name}</h3>
                                    <div className="flex items-center gap-2 mt-2">
                                      <GraduationCap className="w-3 h-3 text-[#D4A373]" />
                                      <span className="text-[9px] font-black uppercase tracking-widest text-[#D4A373] italic">{level.student_count ?? 0} Enrolled</span>
                                    </div>
                                  </div>
                                  <button onClick={() => openLevelModal(level)} className="w-9 h-9 rounded-xl bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/20 hover:bg-[#1A1A1A] hover:text-white transition-all shadow-sm"><Edit2 className="w-3 h-3" /></button>
                                </div>

                                <div className="flex items-center gap-2 bg-[#F5F5F0] px-4 py-3 rounded-2xl mb-6 relative z-10 border border-[#1A1A1A]/5">
                                  <Shield className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A] truncate italic">{level.instructor?.name || 'Institutional Lead'}</span>
                                </div>

                                <button onClick={() => openStudentModal(level)} className="w-full flex items-center justify-center gap-3 py-4 bg-[#1A1A1A] text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-[#F97316] transition-all shadow-lg shadow-black/10">
                                  <UserPlus className="w-4 h-4" /> Manage Roster
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

        {/* Create / Edit Group Modal */}
        <AnimatePresence>
          {groupModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setGroupModal(null)} className="absolute inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-lg bg-white rounded-[3rem] p-10 relative z-10 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#F97316]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 space-y-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4A373] italic">Architecture Layer</p>
                    <h3 className="text-4xl font-black text-[#1A1A1A] tracking-tighter uppercase leading-none">
                      {groupModal === 'create' ? 'Initialize' : 'Modify'}<br /><span className="text-[#F97316]">Group.</span>
                    </h3>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-2 italic">Standardized Identity (e.g., A1)</label>
                      <input value={gName} onChange={e => setGName(e.target.value)} className="w-full bg-[#F5F5F0] border-none rounded-2xl p-5 font-black text-sm text-[#1A1A1A] outline-none focus:ring-4 focus:ring-[#F97316]/10" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-2 italic">Context / Description</label>
                      <input value={gDesc} onChange={e => setGDesc(e.target.value)} className="w-full bg-[#F5F5F0] border-none rounded-2xl p-5 font-black text-sm text-[#1A1A1A] outline-none focus:ring-4 focus:ring-[#F97316]/10" />
                    </div>

                    <div className="pt-4 flex gap-4">
                      <button onClick={handleSaveGroup} disabled={saving} className="flex-1 bg-[#1A1A1A] text-white py-5 rounded-2xl font-black tracking-[0.2em] uppercase text-xs shadow-xl hover:shadow-[#F97316]/20 transition-all flex items-center justify-center gap-3">
                         {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <FiCheck className="w-5 h-5" />} Execute
                      </button>
                      <button onClick={() => setGroupModal(null)} className="bg-[#F5F5F0] text-[#1A1A1A] px-8 py-5 rounded-2xl font-black tracking-[0.2em] uppercase text-xs">Cancel</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Level Group Assignment Modal */}
        <AnimatePresence>
          {levelModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLevelModal(null)} className="absolute inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm" />
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-lg bg-white rounded-[3rem] p-10 relative z-10 shadow-2xl overflow-hidden">
                  <div className="relative z-10 space-y-8">
                     <h3 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase leading-none italic">Configure {levelModal.name}.</h3>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-2 italic">Parent Cluster</label>
                           <select value={levelGroupId} onChange={e => setLevelGroupId(e.target.value)} className="w-full bg-[#F5F5F0] border-none rounded-2xl p-5 font-black text-sm text-[#1A1A1A] outline-none appearance-none">
                              <option value="">No Architecture</option>
                              {groupsData.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-2 italic">Lead Instructor</label>
                           <select value={levelInstructorId} onChange={e => setLevelInstructorId(e.target.value)} className="w-full bg-[#F5F5F0] border-none rounded-2xl p-5 font-black text-sm text-[#1A1A1A] outline-none appearance-none">
                              <option value="">Institutional Direct</option>
                              {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                           </select>
                        </div>
                        <div className="pt-4 flex gap-4">
                           <button onClick={handleSaveLevel} disabled={saving} className="flex-1 bg-[#1A1A1A] text-white py-5 rounded-2xl font-black tracking-[0.2em] uppercase text-xs shadow-xl transition-all">Synchronize</button>
                           <button onClick={() => setLevelModal(null)} className="bg-[#F5F5F0] text-[#1A1A1A] px-8 py-5 rounded-2xl font-black tracking-[0.2em] uppercase text-xs">Dismiss</button>
                        </div>
                     </div>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Enrolled Students Modal */}
        <AnimatePresence>
          {studentModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setStudentModal(null)} className="absolute inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm" />
               <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-4xl bg-white rounded-[3rem] p-10 relative z-10 shadow-2xl h-[80vh] flex flex-col overflow-hidden">
                  <div className="flex justify-between items-start mb-8">
                     <div>
                        <h3 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic leading-none">{studentModal.name} Roster.</h3>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#F97316] mt-2 italic">{levelStudents.length} Students Currently Associated</p>
                     </div>
                     <button onClick={() => setStudentModal(null)} className="w-12 h-12 rounded-2xl bg-[#F5F5F0] flex items-center justify-center hover:bg-[#1A1A1A] hover:text-white transition-all shadow-sm"><X className="w-5 h-5" /></button>
                  </div>

                  <div className="relative mb-8">
                     <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#1A1A1A]/20 w-5 h-5" />
                     <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Resolve Identity..." className="w-full bg-[#F5F5F0] border-none rounded-[1.5rem] py-5 pl-16 pr-8 font-black text-sm text-[#1A1A1A] outline-none shadow-sm" />
                  </div>

                  <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-3">
                     {filteredStudents.map(student => {
                        const enrolled = levelStudents.some(s => s.id === student.id);
                        return (
                           <div key={student.id} className={`flex items-center justify-between p-5 rounded-[1.5rem] border transition-all ${enrolled ? 'bg-[#F97316]/5 border-[#F97316]/20' : 'bg-white border-[#1A1A1A]/5 hover:shadow-xl'}`}>
                              <div className="flex items-center gap-5">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-lg ${enrolled ? 'bg-[#F97316] text-white shadow-[#F97316]/20' : 'bg-[#1A1A1A] text-white shadow-black/10'}`}>
                                    {student.name.charAt(0)}
                                 </div>
                                 <div>
                                    <p className="text-xs font-black uppercase text-[#1A1A1A] tracking-tight">{student.name}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 italic mt-1">{student.email}</p>
                                 </div>
                              </div>
                              <button onClick={() => toggleStudent(student)} className={`px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all ${enrolled ? 'bg-red-50 text-[#DE0002] hover:bg-[#DE0002] hover:text-white' : 'bg-[#1A1A1A] text-white hover:bg-[#F97316]'}`}>
                                 {enrolled ? 'Unlink' : 'Execute'}
                              </button>
                           </div>
                        );
                     })}
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}

function FiCheck(props: any) {
  return (
    <svg stroke="currentColor" fill="none" strokeWidth="3" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" {...props}>
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}
