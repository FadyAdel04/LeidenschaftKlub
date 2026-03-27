import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FiFileText, FiPlus, FiX, FiTrash2, FiAlertCircle, FiCheckCircle, FiLoader, FiClock, FiEdit2, FiSave, FiExternalLink } from 'react-icons/fi';
import AdminSidebar from '../../components/shared/AdminSidebar';
import {
  fetchAllAssignments, fetchAllLevels, createAssignment, deleteAssignment, updateAssignment,
  fetchAllSubmissions, gradeSubmission, type Assignment, type Level, type Submission,
} from '../../services/adminService';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const ci = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
type AW = Assignment & { levels?: { name: string } };
type SubData = Submission & { profiles?: { name: string; email: string }; assignments?: { title: string } };

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState<AW[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [levelId, setLevelId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<AW | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLevelId, setEditLevelId] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [updating, setUpdating] = useState(false);
  const [submissions, setSubmissions] = useState<SubData[]>([]);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [grading, setGrading] = useState(false);

  async function load() {
    try {
      const [a, l, subs] = await Promise.all([fetchAllAssignments(), fetchAllLevels(), fetchAllSubmissions()]);
      setAssignments(a); setLevels(l);
      setSubmissions(subs as SubData[]);
      if (l.length && !levelId) setLevelId(l[0].id);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!title.trim()) { setFormError('Title required.'); return; }
    if (!levelId) { setFormError('Choose a level first.'); return; }
    setCreating(true); setFormError('');
    try {
      await createAssignment({ title: title.trim(), description: desc.trim(), levelId, deadline: deadline || null });
      setSuccess('Assignment created!'); setTitle(''); setDesc(''); setDeadline(''); setShowForm(false);
      await load(); setTimeout(() => setSuccess(''), 4000);
    } catch (e: unknown) { setFormError(e instanceof Error ? e.message : 'Failed'); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try { await deleteAssignment(id); setAssignments(p => p.filter(a => a.id !== id)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Delete failed'); }
    finally { setDeleting(null); }
  };

  const openEdit = (a: AW) => {
    setEditing(a);
    setEditTitle(a.title);
    setEditDesc(a.description ?? '');
    setEditLevelId(a.level_id);
    setEditDeadline(a.deadline ? new Date(a.deadline).toISOString().slice(0, 16) : '');
    setFormError('');
  };

  const handleUpdate = async () => {
    if (!editing) return;
    if (!editTitle.trim()) { setFormError('Title required.'); return; }
    if (!editLevelId) { setFormError('Choose a level.'); return; }
    setUpdating(true); setFormError('');
    try {
      await updateAssignment({
        id: editing.id,
        title: editTitle.trim(),
        description: editDesc.trim(),
        levelId: editLevelId,
        deadline: editDeadline || null,
      });
      setSuccess('Assignment updated!');
      setEditing(null);
      await load();
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: unknown) { setFormError(e instanceof Error ? e.message : 'Update failed'); }
    finally { setUpdating(false); }
  };

  const openGrading = (s: SubData) => {
    setGradingId(s.id);
    setGradeInput(s.grade?.toString() || '');
    setFeedbackInput(s.feedback ?? '');
    setError('');
  };

  const handleGradeSave = async (id: string) => {
    const grade = Number(gradeInput);
    if (Number.isNaN(grade) || grade < 0 || grade > 100) {
      setError('Grade must be between 0 and 100.');
      return;
    }
    setGrading(true);
    setError('');
    try {
      await gradeSubmission(id, grade, feedbackInput);
      setSuccess('Review saved.');
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, grade, feedback: feedbackInput, status: 'graded' } : s));
      setGradingId(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Review failed');
    } finally {
      setGrading(false);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <AdminSidebar />
      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        <motion.header variants={ci} className="mb-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase mb-3">Manage<br/><span className="text-[#C62828]">Assignments.</span></h1>
            <p className="text-[#D4A373] font-black uppercase text-[10px] tracking-[0.5em] italic">{loading ? '—' : `${assignments.length} Created`}</p>
          </div>
          <button onClick={() => { setShowForm(p => !p); setFormError(''); }}
            className="flex items-center gap-3 bg-[#1A1A1A] text-white px-7 py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-[#C62828] transition-all active:scale-95 shadow-lg shrink-0">
            <FiPlus className={`w-5 h-5 transition-transform ${showForm ? 'rotate-45' : ''}`} /> New Assignment
          </button>
        </motion.header>

        <AnimatePresence>
          {success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 relative z-10"><FiCheckCircle className="w-4 h-4 text-green-600 shrink-0" /><p className="text-xs font-bold text-green-700">{success}</p></motion.div>}
          {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 relative z-10"><FiAlertCircle className="w-4 h-4 text-[#C62828] shrink-0" /><p className="text-xs font-bold text-[#C62828]">{error}</p></motion.div>}
        </AnimatePresence>

        {/* Create Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[2.5rem] p-8 lg:p-10 border border-[#1A1A1A]/5 shadow-sm mb-8 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-[#1A1A1A] tracking-tighter uppercase text-lg flex items-center gap-3"><FiFileText className="w-5 h-5 text-[#C62828]" /> New Assignment</h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl bg-[#F5F5F0] text-[#1A1A1A]/40 hover:text-[#C62828]"><FiX className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] ml-1 block">Title</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Passive Voice Exercise"
                    className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 outline-none focus:ring-4 focus:ring-[#C62828]/10 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] ml-1 block">Level</label>
                  <select value={levelId} onChange={e => setLevelId(e.target.value)}
                    className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] outline-none appearance-none cursor-pointer">
                    {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] ml-1 block">Deadline (optional)</label>
                  <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)}
                    className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] outline-none focus:ring-4 focus:ring-[#C62828]/10 transition-all" />
                </div>
              </div>
              <div className="space-y-2 mb-6">
                <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] ml-1 block">Description</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe the assignment…" rows={3}
                  className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 outline-none focus:ring-4 focus:ring-[#C62828]/10 resize-none transition-all" />
              </div>
              {formError && <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-6"><FiAlertCircle className="w-4 h-4 text-[#C62828] shrink-0" /><p className="text-xs font-bold text-[#C62828]">{formError}</p></div>}
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowForm(false)} className="px-6 py-3 bg-[#F5F5F0] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-all active:scale-95">Cancel</button>
                <button onClick={handleCreate} disabled={creating}
                  className="flex items-center gap-2 px-8 py-3 bg-[#C62828] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all active:scale-95 disabled:opacity-60">
                  {creating ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiPlus className="w-4 h-4" />} {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        {loading
          ? <div className="space-y-4 relative z-10">{[1,2,3,4].map(i => <div key={i} className="h-28 bg-white rounded-4xl animate-pulse" />)}</div>
          : assignments.length === 0
            ? <div className="flex flex-col items-center py-32 relative z-10"><FiFileText className="w-16 h-16 text-[#1A1A1A]/10 mb-6" /><p className="font-black text-[#1A1A1A]/30 uppercase text-xl">No assignments yet.</p></div>
            : <motion.div variants={cv} className="space-y-4 relative z-10">
                {assignments.map(a => (
                  <motion.div key={a.id} variants={ci} whileHover={{ x: 6 }}
                    className="bg-white rounded-4xl p-6 sm:p-8 border border-[#1A1A1A]/5 shadow-sm hover:shadow-xl transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 group">
                    <div className="w-12 h-12 rounded-2xl bg-[#C62828]/10 flex items-center justify-center text-[#C62828] shrink-0 group-hover:bg-[#C62828] group-hover:text-white transition-all">
                      <FiFileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#D4A373] italic">Level {a.levels?.name ?? '—'}</span>
                        {a.deadline && (
                          <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-[#1A1A1A]/30">
                            <FiClock className="w-3 h-3" /> {new Date(a.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-[#1A1A1A] tracking-tighter uppercase leading-tight group-hover:text-[#C62828] transition-colors truncate">{a.title}</h3>
                      {a.description && <p className="text-xs text-[#1A1A1A]/40 italic line-clamp-1">{a.description}</p>}
                    </div>
                    <button onClick={() => handleDelete(a.id)} disabled={deleting === a.id}
                      className="w-10 h-10 rounded-xl bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/30 hover:bg-red-50 hover:text-[#C62828] transition-all active:scale-95 shrink-0 disabled:opacity-60">
                      {deleting === a.id ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiTrash2 className="w-4 h-4" />}
                    </button>
                    <button onClick={() => openEdit(a)}
                      className="w-10 h-10 rounded-xl bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/30 hover:bg-[#1A1A1A] hover:text-white transition-all active:scale-95 shrink-0">
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
        }

        <motion.div variants={ci} className="mt-8 bg-white rounded-[2.5rem] border border-[#1A1A1A]/5 shadow-sm overflow-hidden relative z-10">
          <div className="px-8 py-6 border-b border-[#1A1A1A]/5">
            <h3 className="font-black text-[#1A1A1A] tracking-tighter uppercase text-lg">Submitted Assignments</h3>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#1A1A1A]/30 mt-1">{submissions.length} submissions</p>
          </div>
          {loading ? (
            <div className="p-8 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-[#F5F5F0] rounded-xl animate-pulse" />)}</div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center"><p className="font-black text-[#1A1A1A]/30 uppercase">No submissions yet.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1A1A1A]/5 bg-[#F5F5F0]/50">
                    {['Student', 'Assignment', 'Student Answer', 'File', 'Review', 'Action'].map(h => (
                      <th key={h} className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] italic whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(s => (
                    <tr key={s.id} className="border-b border-[#1A1A1A]/5 hover:bg-[#F5F5F0]/40 transition-all">
                      <td className="px-8 py-4">
                        <p className="font-black text-sm text-[#1A1A1A]">{s.profiles?.name ?? 'Unknown'}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/30">{s.profiles?.email}</p>
                      </td>
                      <td className="px-8 py-4">
                        <p className="font-black text-sm text-[#1A1A1A]">{s.assignments?.title ?? 'Assignment'}</p>
                      </td>
                      <td className="px-8 py-4">
                        {s.answer ? (
                          <p className="text-xs font-black text-[#1A1A1A]/65 max-w-[260px] line-clamp-3 italic" title={s.answer}>
                            {s.answer}
                          </p>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/25">No text answer</span>
                        )}
                      </td>
                      <td className="px-8 py-4">
                        {s.file_url ? (
                          <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#C62828] hover:underline">
                            <FiExternalLink className="w-3.5 h-3.5" /> Open
                          </a>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/25">Text only</span>
                        )}
                      </td>
                      <td className="px-8 py-4">
                        {gradingId === s.id ? (
                          <div className="space-y-2">
                            <input type="number" min="0" max="100" value={gradeInput} onChange={e => setGradeInput(e.target.value)} placeholder="Grade"
                              className="w-24 px-3 py-1.5 bg-[#F5F5F0] rounded-xl font-black text-sm outline-none border border-[#1A1A1A]/10" />
                            <textarea rows={2} value={feedbackInput} onChange={e => setFeedbackInput(e.target.value)} placeholder="Feedback to student"
                              className="w-56 px-3 py-2 bg-[#F5F5F0] rounded-xl text-xs font-black outline-none border border-[#1A1A1A]/10 resize-none" />
                          </div>
                        ) : (
                          <div>
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${s.status === 'graded' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-[#F5F5F0] text-[#1A1A1A]/40 border border-[#1A1A1A]/10'}`}>
                              {s.status === 'graded' ? `Graded: ${s.grade ?? 0}%` : 'Pending'}
                            </span>
                            {s.feedback && <p className="mt-1 text-[10px] font-black text-[#1A1A1A]/40 max-w-[220px] line-clamp-2 italic">{s.feedback}</p>}
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-4">
                        {gradingId === s.id ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleGradeSave(s.id)} disabled={grading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C62828] text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-60">
                              {grading ? <FiLoader className="w-3 h-3 animate-spin" /> : <FiSave className="w-3 h-3" />} Save
                            </button>
                            <button onClick={() => setGradingId(null)} className="p-1.5 bg-[#F5F5F0] rounded-xl text-[#1A1A1A]/40 hover:text-[#1A1A1A]">
                              <FiX className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => openGrading(s)} className="px-3 py-1.5 bg-[#F5F5F0] rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#1A1A1A]/5 hover:bg-[#1A1A1A] hover:text-white transition-all">
                            Review
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {editing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-110">
              <button className="absolute inset-0 bg-black/60" onClick={() => setEditing(null)} />
              <div className="absolute inset-4 md:inset-10 bg-white rounded-3xl border border-[#1A1A1A]/10 shadow-2xl p-6 md:p-8 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-xl uppercase tracking-tight text-[#1A1A1A]">Edit Assignment</h3>
                  <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-xl bg-[#F5F5F0] text-[#1A1A1A]/50"><FiX className="w-5 h-5 mx-auto" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm outline-none" />
                  <select value={editLevelId} onChange={e => setEditLevelId(e.target.value)} className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm outline-none">
                    {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <input type="datetime-local" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm outline-none" />
                </div>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4} placeholder="Description"
                  className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm outline-none resize-none" />
                {formError && <p className="mt-4 text-xs font-black text-[#C62828]">{formError}</p>}
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setEditing(null)} className="px-6 py-3 bg-[#F5F5F0] rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                  <button onClick={handleUpdate} disabled={updating}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#C62828] text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-60">
                    {updating ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSave className="w-4 h-4" />} Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}