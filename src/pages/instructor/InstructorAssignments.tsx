import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  fetchAssignmentsForInstructor, createAssignment, deleteAssignment, updateAssignment, gradeSubmission,
  uploadMaterialAsset, type Assignment, type Level 
} from '../../services/adminService';
import { fetchInstructorLevels, fetchInstructorAssignmentSubmissions } from '../../services/instructorService';
import { FileText, Calendar, ExternalLink, Plus, X, Loader2, Trash2, Edit2, CheckCircle, AlertCircle, Award, Mic, Download } from 'lucide-react';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const ci = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function InstructorAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<(Assignment & { groups: { name: string }[] })[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [tab, setTab] = useState<'assignments' | 'submissions'>('assignments');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [subLoading, setSubLoading] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states (Assignment)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [levelId, setLevelId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Grading states
  const [showGrading, setShowGrading] = useState(false);
  const [activeSub, setActiveSub] = useState<any | null>(null);
  const [gradeInput, setGradeInput] = useState<number>(0);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [gradingLoad, setGradingLoad] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    try {
      const [aData, lData] = await Promise.all([
        fetchAssignmentsForInstructor(user.id),
        fetchInstructorLevels(user.id)
      ]);
      setAssignments(aData);
      setLevels(lData);
      if (lData.length > 0) setLevelId(lData[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const loadSubmissions = async () => {
    if (!user) return;
    setSubLoading(true);
    try {
      const data = await fetchInstructorAssignmentSubmissions(user.id!);
      setSubmissions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSubLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'submissions') loadSubmissions();
  }, [tab]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!levelId) return setError('Choose a curriculum level');
    setSubmitting(true);
    try {
      let finalAudioUrl = audioUrl;
      if (audioFile) {
        finalAudioUrl = await uploadMaterialAsset(audioFile);
      }

      if (editingId) {
        await updateAssignment({ id: editingId, title, description, levelId, deadline: deadline || null, audioUrl: finalAudioUrl });
        setSuccess('Assignment updated.');
      } else {
        await createAssignment({ title, description, levelId, deadline: deadline || null, audioUrl: finalAudioUrl });
        setSuccess('Assignment published.');
      }
      setShowModal(false);
      setDeadline('');
      setAudioFile(null);
      setAudioUrl(null);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await deleteAssignment(id);
      setAssignments(prev => prev.filter(a => a.id !== id));
      setSuccess('Assignment removed.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openGrading = (sub: any) => {
    setActiveSub(sub);
    setGradeInput(sub.grade || 0);
    setFeedbackInput(sub.feedback || '');
    setShowGrading(true);
  };

  const handleGrade = async () => {
    if (!activeSub) return;
    setGradingLoad(true);
    try {
      await gradeSubmission(activeSub.id, gradeInput, feedbackInput);
      setSuccess('Grade recorded.');
      setShowGrading(false);
      loadSubmissions();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGradingLoad(false);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:ml-80 p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#D4A373]/[0.02] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

      {/* Alerts */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-5 relative z-[1001]">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-xs font-black uppercase tracking-wider text-green-700">{success}</p>
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-5 relative z-[1001]">
            <AlertCircle className="w-5 h-5 text-[#D4A373] shrink-0" />
            <p className="text-xs font-black uppercase tracking-wider text-[#D4A373]">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header variants={ci} className="mb-14 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-8">
        <div>
           <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase mb-3">
             Manage<br /><span className="text-[#D4A373]">Assignments.</span>
           </h1>
           <p className="text-[#1A1A1A]/40 font-black uppercase text-[10px] tracking-[0.5em] italic">
             Cohorts Oversight
           </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-white rounded-2xl p-1 border border-[#1A1A1A]/5 shadow-sm">
            <button 
              onClick={() => setTab('assignments')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'assignments' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]'}`}
            >
              Tasks
            </button>
            <button 
              onClick={() => setTab('submissions')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'submissions' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]'}`}
            >
              Submissions
            </button>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-8 py-4 bg-[#1A1A1A] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-2xl hover:bg-[#D4A373] transition-all flex items-center gap-3 active:scale-95 group shadow-xl"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            Publish New
          </button>
        </div>
      </motion.header>

      {tab === 'assignments' ? (
        <motion.div variants={ci} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {loading ? (
            [1, 2].map(i => (
              <div key={i} className="h-64 bg-white rounded-[2.5rem] p-8 border border-[#1A1A1A]/5 animate-pulse" />
            ))
          ) : assignments.length === 0 ? (
            <div className="col-span-full py-32 bg-white rounded-[3rem] border border-[#1A1A1A]/5 text-center flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-[#F5F5F0] rounded-full flex items-center justify-center mb-6">
                <FileText className="w-8 h-8 text-[#1A1A1A]/10" />
              </div>
              <p className="font-black text-[#1A1A1A]/30 uppercase tracking-widest text-sm">No active tasks distributed yet.</p>
            </div>
          ) : (
            assignments.map(a => (
              <div key={a.id} className="bg-white rounded-[2.5rem] p-10 border border-[#1A1A1A]/5 shadow-sm hover:shadow-2xl transition-all group overflow-hidden flex flex-col relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A373]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="w-12 h-12 bg-[#F5F5F0] rounded-2xl flex items-center justify-center text-[#D4A373] group-hover:bg-[#D4A373] group-hover:text-white transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { 
                      setEditingId(a.id); 
                      setTitle(a.title || ''); 
                      setDescription(a.description || ''); 
                      setLevelId(a.level_id || ''); 
                      setDeadline(a.deadline ? a.deadline.split('T')[0] : ''); 
                      setAudioUrl(a.audio_url || null);
                      setAudioFile(null);
                      setShowModal(true); 
                    }} className="w-8 h-8 rounded-lg bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/20 hover:bg-[#1A1A1A] hover:text-white transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(a.id)} className="w-8 h-8 rounded-lg bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/20 hover:bg-red-50 hover:text-[#D4A373] transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <h3 className="text-2xl font-black text-[#1A1A1A] tracking-tighter uppercase mb-2 relative z-10">{a.title}</h3>
                <p className="text-[10px] text-[#1A1A1A]/40 font-bold uppercase tracking-widest mb-8 line-clamp-2 relative z-10">{a.description}</p>

                <div className="space-y-4 mt-auto relative z-10">
                  <div className="flex flex-wrap gap-2">
                    {a.groups && a.groups.length > 0 ? a.groups.map(g => (
                      <span key={g.name} className="px-3 py-1 bg-[#F5F5F0] text-[#1A1A1A]/60 text-[8px] font-black uppercase tracking-widest rounded-full border border-[#1A1A1A]/5">
                        {g.name}
                      </span>
                    )) : (
                      <span className="px-3 py-1 bg-[#F5F5F0] text-[#1A1A1A]/30 text-[8px] font-black uppercase tracking-widest rounded-full italic">All Cohorts</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px] font-black text-[#1A1A1A]/30 uppercase tracking-[0.2em] mb-8">
                    <Calendar className="w-3.5 h-3.5" />
                    {a.deadline ? `Due: ${new Date(a.deadline).toLocaleDateString()}` : 'No Deadline'}
                  </div>
                  
                  <button onClick={() => setTab('submissions')} className="w-full flex items-center justify-center gap-3 py-4 bg-[#1A1A1A] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#D4A373] transition-colors shadow-lg active:scale-95">
                    View Submissions
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </motion.div>
      ) : (
        <motion.div variants={ci} className="bg-white rounded-[2.5rem] border border-[#1A1A1A]/5 shadow-sm overflow-hidden relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1A1A1A]/5 bg-[#F5F5F0]/50">
                  {['Student', 'Assignment', 'Status', 'Performance', 'Submitted'].map(h => (
                    <th key={h} className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] italic">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subLoading ? (
                  [1, 2, 3].map(i => (
                    <tr key={i} className="animate-pulse border-b border-[#1A1A1A]/5 h-20 bg-[#F5F5F0]/20" />
                  ))
                ) : submissions.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-20 text-center font-black text-[#1A1A1A]/20 uppercase text-xs tracking-widest">No matching submissions.</td></tr>
                ) : (
                  submissions.map(s => (
                    <tr key={s.id} className="border-b border-[#1A1A1A]/5 hover:bg-[#F5F5F0]/40 transition-all group">
                      <td className="px-8 py-6">
                        <p className="font-black text-sm uppercase tracking-tighter text-[#1A1A1A]">{s.profiles?.name}</p>
                        <p className="text-[10px] font-bold text-[#1A1A1A]/30 uppercase tracking-widest">{s.profiles?.email}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-black text-xs uppercase text-[#1A1A1A]/70">{s.assignments?.title}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${s.status === 'graded' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          {s.grade !== null ? (
                            <span className="font-black text-sm text-[#1A1A1A]">{s.grade}%</span>
                          ) : (
                            <span className="text-[10px] font-black text-[#1A1A1A]/20 uppercase italic">Pending</span>
                          )}
                          <button onClick={() => openGrading(s)} className="opacity-0 group-hover:opacity-100 p-2 bg-[#1A1A1A] text-white rounded-lg transition-all"><Award className="w-3 h-3" /></button>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-[10px] font-black text-[#1A1A1A]/40 uppercase tracking-widest">
                          {new Date(s.submitted_at).toLocaleDateString('en-GB')}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Creation Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1A1A1A]/20 backdrop-blur-xl">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl border border-[#1A1A1A]/5 overflow-hidden">
                <div className="p-10 border-b border-[#1A1A1A]/5 flex items-center justify-between">
                   <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase">New <span className="text-[#D4A373]">Task.</span></h2>
                   <button onClick={() => setShowModal(false)} className="p-3 bg-[#F5F5F0] rounded-full text-[#1A1A1A]/20 hover:text-[#D4A373] transition-colors"><X className="w-5 h-5" /></button>
                </div>
                
                <form onSubmit={handleCreate} className="p-10 space-y-6">
                   {error && <p className="text-[10px] font-black uppercase text-[#D4A373] bg-red-50 p-4 rounded-xl">{error}</p>}
                   
                   <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-4">Assignment Identity</label>
                      <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Grammar Workshop Week 3" className="w-full px-6 py-4 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] outline-none focus:ring-4 focus:ring-[#D4A373]/10" />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-4">Instructional Content</label>
                      <textarea rows={3} required value={description} onChange={e => setDescription(e.target.value)} placeholder="Explain the assignment objectives..." className="w-full px-6 py-4 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] outline-none focus:ring-4 focus:ring-[#D4A373]/10" />
                   </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[8px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-4">Target Node</label>
                         <select required value={levelId} onChange={e => setLevelId(e.target.value)} className="w-full px-6 py-4 bg-[#F5F5F0] rounded-2xl font-black text-xs uppercase tracking-widest text-[#1A1A1A] outline-none appearance-none cursor-pointer">
                            {levels.map(l => <option key={l.id} value={l.id}>Level {l.name}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[8px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-4">Submission Lock</label>
                         <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full px-6 py-4 bg-[#F5F5F0] rounded-2xl font-black text-xs text-[#1A1A1A] outline-none" />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-4">Audio / Resource File</label>
                      <div className="flex items-center gap-4 p-4 bg-[#F5F5F0] rounded-2xl border border-dashed border-[#1A1A1A]/10">
                        <input type="file" onChange={e => setAudioFile(e.target.files?.[0] || null)} className="hidden" id="task-file" />
                        <label htmlFor="task-file" className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm cursor-pointer hover:bg-[#1A1A1A] hover:text-white transition-all">
                          <Mic className="w-3.5 h-3.5" /> {audioFile ? audioFile.name : 'Choose File'}
                        </label>
                        {audioUrl && <span className="text-[8px] font-black text-[#D4A373] uppercase tracking-widest">Existing File Attached</span>}
                      </div>
                   </div>

                   <button disabled={submitting} type="submit" className="w-full py-5 bg-[#1A1A1A] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:shadow-2xl hover:bg-[#D4A373] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mt-4">
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingId ? <><CheckCircle className="w-4 h-4" /> Save Changes</> : <><Plus className="w-4 h-4" /> Deploy Task</>}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Grading Modal */}
      <AnimatePresence>
        {showGrading && activeSub && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#1A1A1A]/40 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl">
               <div className="p-8 border-b border-[#1A1A1A]/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-[#D4A373] mb-1">Grading Terminal</p>
                    <h3 className="text-xl font-black text-[#1A1A1A] uppercase tracking-tighter">{activeSub.profiles?.name}</h3>
                  </div>
                  <button onClick={() => setShowGrading(false)} className="p-3 bg-[#F5F5F0] rounded-full text-[#1A1A1A]/20 hover:text-[#D4A373]"><X className="w-5 h-5" /></button>
               </div>
               
               <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  {/* Task Reference */}
                  <div className="p-6 bg-[#1A1A1A]/5 rounded-[2rem] border border-[#1A1A1A]/5">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#1A1A1A]/30 mb-2">Reference: {activeSub.assignments?.title}</p>
                    <p className="text-[11px] font-medium text-[#1A1A1A]/60 italic mb-3">"{activeSub.assignments?.description}"</p>
                    {activeSub.assignments?.audio_url && (
                      <a href={activeSub.assignments.audio_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg text-[8px] font-black uppercase tracking-widest text-[#D4A373] shadow-sm border border-[#D4A373]/10">
                        <Mic className="w-3 h-3" /> Task Resource
                      </a>
                    )}
                  </div>

                  <div className="bg-[#F5F5F0] p-6 rounded-2xl">
                     <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/40 mb-3 italic">Student Response</p>
                     <div className="text-sm font-medium text-[#1A1A1A] whitespace-pre-wrap max-h-60 overflow-y-auto pr-4 custom-scrollbar">
                       {activeSub.answer || "No text provided."}
                     </div>
                     {(activeSub.file_url || activeSub.audio_answer_url) && (
                       <div className="flex gap-4 mt-4 py-4 border-t border-[#1A1A1A]/5">
                         {activeSub.file_url && (
                           <a href={activeSub.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-[#1A1A1A]/5 hover:bg-[#1A1A1A] hover:text-white transition-all shadow-sm">
                             <Download className="w-3 h-3" /> Get File
                           </a>
                         )}
                         {activeSub.audio_answer_url && (
                           <a href={activeSub.audio_answer_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#D4A373] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#1A1A1A] transition-all shadow-lg active:scale-95">
                             <Mic className="w-3 h-3" /> Play Audio
                           </a>
                         )}
                       </div>
                     )}
                   </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/40 ml-4">Grade (0-100)</label>
                       <input type="number" min="0" max="100" value={gradeInput} onChange={e => setGradeInput(parseInt(e.target.value))} className="w-full px-6 py-4 bg-[#F5F5F0] rounded-2xl font-black text-xl text-[#1A1A1A] outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/40 ml-4">Feedback Directive</label>
                       <textarea value={feedbackInput} onChange={e => setFeedbackInput(e.target.value)} placeholder="Critique or Guidance..." className="w-full px-6 py-4 bg-[#F5F5F0] rounded-2xl font-black text-xs text-[#1A1A1A] outline-none resize-none h-[5.5rem]" />
                    </div>
                  </div>

                  <button onClick={handleGrade} disabled={gradingLoad} className="w-full py-5 bg-[#1A1A1A] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#D4A373] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                    {gradingLoad ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Finalize Grade & Notify'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
