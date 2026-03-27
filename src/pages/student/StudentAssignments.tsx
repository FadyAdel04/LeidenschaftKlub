import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import {
  FiFileText, FiUploadCloud, FiEdit, FiClock,
  FiCheckCircle, FiAlertCircle, FiX, FiLoader,
} from 'react-icons/fi';
import { RiDoubleQuotesR, RiFileEditLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import StudentSidebar from '../../components/shared/StudentSidebar';
import {
  fetchProfile, fetchLevelByName, fetchAssignmentsByLevel,
  fetchSubmissionForAssignment, submitAssignment, uploadSubmissionFile,
  type Profile, type Assignment, type Submission,
} from '../../services/studentService';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const ci = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

function daysUntil(deadline: string | null) {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  return diff;
}
function formatDeadline(deadline: string | null) {
  if (!deadline) return 'No deadline';
  return new Date(deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function StudentAssignments() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [profile,          setProfile]          = useState<Profile | null>(null);
  const [assignments,      setAssignments]      = useState<Assignment[]>([]);
  const [selected,         setSelected]         = useState<Assignment | null>(null);
  const [submission,       setSubmission]       = useState<Submission | null>(null);
  const [answer,           setAnswer]           = useState('');
  const [file,             setFile]             = useState<File | null>(null);
  const [submitting,       setSubmitting]       = useState(false);
  const [submitError,      setSubmitError]      = useState('');
  const [submitSuccess,    setSubmitSuccess]    = useState(false);
  const [loading,          setLoading]          = useState(true);
  const [loadingSubmission,setLoadingSubmission] = useState(false);
  const [error,            setError]            = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      try {
        const prof = await fetchProfile(user!.id);
        if (cancelled) return;
        setProfile(prof);
        const level = await fetchLevelByName(prof.current_level);
        if (cancelled) return;
        const asgns = await fetchAssignmentsByLevel(level.id);
        if (cancelled) return;
        setAssignments(asgns);
        if (asgns.length > 0) setSelected(asgns[0]);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  // load existing submission when selected changes
  useEffect(() => {
    if (!selected || !user) { setSubmission(null); return; }
    setLoadingSubmission(true);
    setSubmitError('');
    setSubmitSuccess(false);
    fetchSubmissionForAssignment(selected.id, user.id)
      .then(sub => { setSubmission(sub); setAnswer(sub?.answer ?? ''); })
      .catch(() => setSubmission(null))
      .finally(() => setLoadingSubmission(false));
  }, [selected, user]);

  const handleSubmit = async () => {
    if (!selected || !user) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      let fileUrl: string | undefined;
      if (file) {
        fileUrl = await uploadSubmissionFile(user.id, file);
      }
      await submitAssignment({ assignmentId: selected.id, studentId: user.id, answer, fileUrl });
      setSubmitSuccess(true);
      const updated = await fetchSubmissionForAssignment(selected.id, user.id);
      setSubmission(updated);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'graded';

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <StudentSidebar profile={profile} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onToggle={() => setSidebarOpen(p => !p)} />

      <main className="pt-14 lg:pt-0 lg:ml-80 min-h-screen p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-[#C62828]/[0.02] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

        {/* Header */}
        <motion.header variants={ci} className="mb-10 lg:mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
          <div className="space-y-3">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase">
              Curated<br /><span className="text-[#C62828]">Tasks.</span>
            </h2>
            <p className="text-[#D4A373] font-black uppercase text-[10px] tracking-[0.5em] italic">Level {profile?.current_level ?? '—'} Assignments</p>
          </div>
          <div className="flex items-center gap-4 bg-white p-3 pr-8 rounded-2xl border border-[#1A1A1A]/5 shadow-xl group">
            <div className="bg-[#C62828] w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-xl shadow-[#C62828]/20 group-hover:rotate-12 transition-transform shrink-0">
              <RiFileEditLine className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xl font-black text-[#1A1A1A] tracking-tighter leading-none">
                {loading ? '—' : assignments.length} Tasks
              </p>
              <p className="text-[9px] text-[#1A1A1A]/30 uppercase tracking-[0.2em] font-black italic">For Level {profile?.current_level ?? '—'}</p>
            </div>
          </div>
        </motion.header>

        {error && (
          <motion.div variants={ci} className="mb-8 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
            <FiAlertCircle className="w-5 h-5 text-[#C62828] shrink-0" />
            <p className="text-sm font-bold text-[#C62828]">{error}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 relative z-10">
          {/* Assignment List */}
          <motion.div variants={ci} className="col-span-1 lg:col-span-4 space-y-4">
            {loading
              ? [1,2,3].map(i => <div key={i} className="h-36 bg-white rounded-[2rem] animate-pulse border border-[#1A1A1A]/5" />)
              : assignments.length === 0
                ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[2rem] border border-[#1A1A1A]/5 p-8">
                    <FiFileText className="w-12 h-12 text-[#1A1A1A]/10 mb-4" />
                    <p className="font-black text-[#1A1A1A]/30 uppercase">No assignments yet.</p>
                  </div>
                )
                : assignments.map(a => {
                    const days = daysUntil(a.deadline);
                    const isActive = selected?.id === a.id;
                    return (
                      <div
                        key={a.id}
                        onClick={() => { setSelected(a); setSubmitSuccess(false); setSubmitError(''); }}
                        className={`p-6 sm:p-8 rounded-[2rem] border cursor-pointer transition-all relative overflow-hidden ${isActive ? 'bg-[#1A1A1A] border-[#1A1A1A] shadow-2xl' : 'bg-white border-[#1A1A1A]/5 hover:shadow-xl hover:bg-[#F5F5F0]/50'}`}
                      >
                        <div className="flex justify-between items-start mb-4 gap-2">
                          <span className={`text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1.5 rounded-full ${isActive ? 'bg-[#C62828] text-white' : 'bg-[#C62828]/5 text-[#C62828]'}`}>
                            {days !== null ? (days < 0 ? 'Overdue' : days === 0 ? 'Due Today' : `${days}d left`) : 'No deadline'}
                          </span>
                          <p className={`text-[10px] font-black uppercase tracking-widest italic ${isActive ? 'text-white/40' : 'text-[#1A1A1A]/30'}`}>
                            {formatDeadline(a.deadline)}
                          </p>
                        </div>
                        <h4 className={`text-base font-black tracking-tight uppercase leading-tight mb-3 line-clamp-2 ${isActive ? 'text-white' : 'text-[#1A1A1A]'}`}>{a.title}</h4>
                        {a.description && (
                          <p className={`text-xs line-clamp-2 italic leading-relaxed ${isActive ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>{a.description}</p>
                        )}
                        <div className={`flex items-center gap-2 mt-4 ${isActive ? 'text-[#D4A373]' : 'text-[#1A1A1A]/20'}`}>
                          <FiClock className="w-4 h-4 shrink-0" />
                          <span className="text-[9px] font-black uppercase tracking-wider italic">Level {profile?.current_level}</span>
                        </div>
                      </div>
                    );
                  })
            }
          </motion.div>

          {/* Submission Workspace */}
          <motion.div variants={ci} className="col-span-1 lg:col-span-8">
            {!selected && !loading ? (
              <div className="bg-white rounded-[2.5rem] p-16 border border-[#1A1A1A]/5 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                <FiEdit className="w-16 h-16 text-[#1A1A1A]/10 mb-6" />
                <p className="font-black text-[#1A1A1A]/30 uppercase tracking-tight text-xl">Select an assignment to get started.</p>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 lg:p-14 shadow-xl border border-[#1A1A1A]/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#C62828]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] -z-0" />

                {loadingSubmission ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => <div key={i} className="h-12 bg-[#F5F5F0] rounded-2xl animate-pulse" />)}
                  </div>
                ) : (
                  <div className="relative z-10 space-y-8">
                    {/* Assignment details */}
                    <div className="flex items-start gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-[#C62828]/10 flex items-center justify-center text-[#C62828] shrink-0">
                        <FiEdit className="w-7 h-7" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] text-[#D4A373] font-black uppercase tracking-[0.5em] mb-1 italic">Workspace</p>
                        <h3 className="text-2xl sm:text-3xl font-black tracking-tighter text-[#1A1A1A] uppercase leading-none">
                          {selected?.title}
                        </h3>
                      </div>
                    </div>

                    {/* Description */}
                    {selected?.description && (
                      <section>
                        <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#1A1A1A]/30 mb-4 border-b border-[#1A1A1A]/5 pb-3">Task Instructions</h4>
                        <div className="bg-[#F5F5F0] p-8 rounded-[2rem] border-l-8 border-[#D4A373] relative">
                          <RiDoubleQuotesR className="text-[#D4A373]/20 text-5xl absolute -top-8 -left-4" />
                          <p className="text-base font-medium text-[#1A1A1A]/70 italic leading-relaxed font-body">{selected.description}</p>
                        </div>
                      </section>
                    )}

                    {/* Already submitted / graded */}
                    {isSubmitted && (
                      <AnimatePresence>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-2xl p-5">
                          <FiCheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                          <div>
                            <p className="font-black text-green-700 text-sm uppercase tracking-wider">
                              {submission?.status === 'graded' ? `Graded: ${submission.grade ?? 0}/100` : 'Submitted Successfully'}
                            </p>
                            <p className="text-xs text-green-600 italic mt-0.5">{submission?.answer && `"${submission.answer.slice(0, 80)}…"`}</p>
                            {submission?.feedback && (
                              <p className="text-xs text-[#1A1A1A]/60 mt-2">
                                <span className="font-black uppercase tracking-wider text-[10px] text-[#C62828]">Admin Feedback:</span> {submission.feedback}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    )}

                    {/* Submit form */}
                    {!isSubmitted && (
                      <section className="space-y-6">
                        <div>
                          <label className="block text-[9px] font-black uppercase tracking-[0.4em] text-[#1A1A1A]/30 ml-4 mb-3 italic">
                            Your Answer
                          </label>
                          <textarea
                            value={answer}
                            onChange={e => setAnswer(e.target.value)}
                            disabled={submitting}
                            className="w-full bg-[#F5F5F0]/50 border border-[#1A1A1A]/5 rounded-[2rem] p-8 text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 focus:ring-4 focus:ring-[#C62828]/5 outline-none text-base font-black shadow-inner min-h-[200px] tracking-tight transition-all resize-none disabled:opacity-60"
                            placeholder="Type your response here…"
                          />
                        </div>

                        {/* File Upload */}
                        <div>
                          <label className="block text-[9px] font-black uppercase tracking-[0.4em] text-[#1A1A1A]/30 ml-4 mb-3 italic">
                            Attach File (optional)
                          </label>
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={e => setFile(e.target.files?.[0] ?? null)}
                          />
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-4 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center cursor-pointer transition-all group/upload ${file ? 'border-[#C62828]/40 bg-[#C62828]/5' : 'border-[#1A1A1A]/10 bg-[#F5F5F0]/30 hover:bg-white hover:border-[#C62828]/40'}`}
                          >
                            {file ? (
                              <div className="flex items-center gap-3">
                                <FiFileText className="w-6 h-6 text-[#C62828]" />
                                <p className="font-black text-[#C62828] text-sm">{file.name}</p>
                                <button
                                  onClick={e => { e.stopPropagation(); setFile(null); }}
                                  className="w-6 h-6 rounded-full bg-[#C62828]/10 flex items-center justify-center hover:bg-[#C62828] hover:text-white transition-all"
                                >
                                  <FiX className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <FiUploadCloud className="w-12 h-12 text-[#1A1A1A]/10 group-hover/upload:text-[#C62828] transition-all mb-4 group-hover/upload:-translate-y-2" />
                                <p className="text-base font-black text-[#1A1A1A] uppercase tracking-tighter">
                                  Drop file or <span className="text-[#C62828]">browse</span>
                                </p>
                                <p className="text-[9px] text-[#1A1A1A]/20 mt-3 uppercase tracking-[0.4em] font-black italic">PDF, DOCX up to 10MB</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Error */}
                        {submitError && (
                          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                            <FiAlertCircle className="w-5 h-5 text-[#C62828] shrink-0" />
                            <p className="text-sm font-bold text-[#C62828]">{submitError}</p>
                          </div>
                        )}

                        {/* Success */}
                        {submitSuccess && (
                          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
                            <FiCheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                            <p className="text-sm font-bold text-green-700">Assignment submitted successfully!</p>
                          </div>
                        )}

                        {/* Action Row */}
                        <div className="flex items-center justify-between pt-6 border-t border-[#1A1A1A]/5">
                          <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-[#C62828] animate-pulse shadow-[0_0_20px_rgba(198,40,40,0.6)]" />
                            <span className="text-[10px] font-black text-[#1A1A1A]/40 uppercase tracking-[0.4em] italic">Auto-save: Active</span>
                          </div>
                          <button
                            onClick={handleSubmit}
                            disabled={submitting || (!answer.trim() && !file)}
                            className="flex items-center gap-3 px-10 py-5 bg-[#C62828] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-[#C62828]/20 hover:-translate-y-1 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                          >
                            {submitting ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiCheckCircle className="w-4 h-4" />}
                            {submitting ? 'Submitting…' : 'Submit'}
                          </button>
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </motion.div>
  );
}
