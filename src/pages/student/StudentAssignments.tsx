import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import {
  LetterText, UploadCloud, Edit, Clock, Mic, StopCircle,
  CheckCircle, AlertCircle, X, Loader,
  FileText,
} from 'lucide-react';
import { Quote, LucideEdit } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import StudentSidebar from '../../components/shared/StudentSidebar';
import {
  fetchProfile, fetchLevelByName, fetchAssignmentsByLevel,
  fetchSubmissionForAssignment, submitAssignment, uploadSubmissionFile, uploadSubmissionAudio,
  type Profile, type Assignment, type Submission,
} from '../../services/studentService';
import { formatBytes, MAX_UPLOAD_BYTES, type UploadMetrics } from '../../utils/storageUpload';

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

  const [profile,          setprofile]          = useState<Profile | null>(null);
  const [assignments,      setAssignments]      = useState<Assignment[]>([]);
  const [selected,         setSelected]         = useState<Assignment | null>(null);
  const [submission,       setSubmission]       = useState<Submission | null>(null);
  const [answer,           setAnswer]           = usePersistentState(`assignment_answer_${selected?.id ?? 'temp'}`, '');
  const [file,             setFile]             = useState<File | null>(null);
  const [submitting,       setSubmitting]       = useState(false);
  const [uploadMetrics,    setUploadMetrics]    = useState<UploadMetrics | null>(null);
  const [submitError,      setSubmitError]      = useState('');
  const [submitSuccess,    setSubmitSuccess]    = useState(false);
  const [loading,          setLoading]          = useState(true);
  const [loadingSubmission,setLoadingSubmission] = useState(false);
  const [error,            setError]            = useState('');
  const leInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('');

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
        setprofile(prof);
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

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, [audioPreviewUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      setRecording(true);
      setRecordingSeconds(0);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl(URL.createObjectURL(blob));
      };
      recorder.start();
      timerRef.current = window.setInterval(() => setRecordingSeconds((prev) => prev + 1), 1000);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Microphone access is required for recording.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleSubmit = async () => {
    if (!selected || !user) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      let leUrl: string | undefined;
      let audioAnswerUrl: string | undefined;
      if (file) {
        if (file.size > MAX_UPLOAD_BYTES) throw new Error('Attached file exceeds 200MB.');
        leUrl = await uploadSubmissionFile(user.id, file, setUploadMetrics);
      }
      if (audioBlob) {
        const ext = audioBlob.type.includes('wav') ? 'wav' : 'webm';
        const audioFile = new File([audioBlob], `answer_${Date.now()}.${ext}`, { type: audioBlob.type || 'audio/webm' });
        audioAnswerUrl = await uploadSubmissionAudio(user.id, audioFile, setUploadMetrics);
      }
      await submitAssignment({ assignmentId: selected.id, studentId: user.id, answer, fileUrl: leUrl, audioAnswerUrl });
      setSubmitSuccess(true);
      const updated = await fetchSubmissionForAssignment(selected.id, user.id);
      setSubmission(updated);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setSubmitting(false);
      setUploadMetrics(null);
    }
  };

  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'graded';

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <StudentSidebar profile={profile} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onToggle={() => setSidebarOpen(p => !p)} />

      <main className="pt-14 lg:pt-0 lg:ml-80 min-h-screen p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-[#F97316]/[0.02] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

        {/* Header */}
        <motion.header variants={ci} className="mb-10 lg:mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
          <div className="space-y-3">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase">
              Curated<br /><span className="text-[#F97316]">Tasks.</span>
            </h2>
            <p className="text-[#D4A373] font-black uppercase text-[10px] tracking-[0.5em] italic">Level {profile?.current_level ?? '—'} Assignments</p>
          </div>
          <div className="flex items-center gap-4 bg-white p-3 pr-8 rounded-2xl border border-[#1A1A1A]/5 shadow-xl group">
            <div className="bg-[#F97316] w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-xl shadow-[#F97316]/20 group-hover:rotate-12 transition-transform shrink-0">
              <LucideEdit className="w-6 h-6" />
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
            <AlertCircle className="w-5 h-5 text-[#F97316] shrink-0" />
            <p className="text-sm font-bold text-[#F97316]">{error}</p>
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
                    <LetterText className="w-12 h-12 text-[#1A1A1A]/10 mb-4" />
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
                          <span className={`text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1.5 rounded-full ${isActive ? 'bg-[#F97316] text-white' : 'bg-[#F97316]/5 text-[#F97316]'}`}>
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
                          <Clock className="w-4 h-4 shrink-0" />
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
                <Edit className="w-16 h-16 text-[#1A1A1A]/10 mb-6" />
                <p className="font-black text-[#1A1A1A]/30 uppercase tracking-tight text-xl">Select an assignment to get started.</p>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 lg:p-14 shadow-xl border border-[#1A1A1A]/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#F97316]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] -z-0" />

                {loadingSubmission ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => <div key={i} className="h-12 bg-[#F5F5F0] rounded-2xl animate-pulse" />)}
                  </div>
                ) : (
                  <div className="relative z-10 space-y-8">
                    {/* Assignment details */}
                    <div className="flex items-start gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-[#F97316]/10 flex items-center justify-center text-[#F97316] shrink-0">
                        <Edit className="w-7 h-7" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] text-[#D4A373] font-black uppercase tracking-[0.5em] mb-1 italic">Workspace</p>
                        <h3 className="text-2xl sm:text-3xl font-black tracking-tighter text-[#1A1A1A] uppercase leading-none">
                          {selected?.title}
                        </h3>
                      </div>
                    </div>

                    {/* Assignment audio (listening task) */}
                    {selected?.audio_url && (
                      <div className="mt-2 rounded-2xl border border-[#1A1A1A]/10 bg-white p-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#D4A373] mb-2">
                          Assignment Audio
                        </p>
                        <audio src={selected.audio_url} controls className="w-full" />
                      </div>
                    )}

                    {/* Description */}
                    {selected?.description && (
                      <section>
                        <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-[#1A1A1A]/30 mb-4 border-b border-[#1A1A1A]/5 pb-3">Task Instructions</h4>
                        <div className="bg-[#F5F5F0] p-8 rounded-[2rem] border-l-8 border-[#D4A373] relative">
                          <Quote className="text-[#D4A373]/20 text-5xl absolute -top-8 -left-4" />
                          <p className="text-base font-medium text-[#1A1A1A]/70 italic leading-relaxed font-body">{selected.description}</p>
                        </div>
                      </section>
                    )}

                    {/* Already submitted / graded */}
                    {isSubmitted && (
                      <AnimatePresence>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-2xl p-5">
                          <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                          <div>
                            <p className="font-black text-green-700 text-sm uppercase tracking-wider">
                              {submission?.status === 'graded' ? `Graded: ${submission.grade ?? 0}/100` : 'Submitted Successfully'}
                            </p>
                            <p className="text-xs text-green-600 italic mt-0.5">{submission?.answer && `"${submission.answer.slice(0, 80)}…"`}</p>
                            {submission?.feedback && (
                              <p className="text-xs text-[#1A1A1A]/60 mt-2">
                                <span className="font-black uppercase tracking-wider text-[10px] text-[#F97316]">Admin Feedback:</span> {submission.feedback}
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
                            className="w-full bg-[#F5F5F0]/50 border border-[#1A1A1A]/5 rounded-[2rem] p-8 text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 focus:ring-4 focus:ring-[#F97316]/5 outline-none text-base font-black shadow-inner min-h-[200px] tracking-tight transition-all resize-none disabled:opacity-60"
                            placeholder="Type your response here…"
                          />
                        </div>

                        {/* file Upload */}
                        <div>
                          <label className="block text-[9px] font-black uppercase tracking-[0.4em] text-[#1A1A1A]/30 ml-4 mb-3 italic">
                            Attach file (optional)
                          </label>
                          <input
                            type="file"
                            ref={leInputRef}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={e => setFile(e.target.files?.[0] ?? null)}
                          />
                          <div
                            onClick={() => leInputRef.current?.click()}
                            className={`border-4 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center cursor-pointer transition-all group/upload ${file ? 'border-[#F97316]/40 bg-[#F97316]/5' : 'border-[#1A1A1A]/10 bg-[#F5F5F0]/30 hover:bg-white hover:border-[#F97316]/40'}`}
                          >
                            {file ? (
                              <div className="flex items-center gap-3">
                                <FileText className="w-6 h-6 text-[#F97316]" />
                                <p className="font-black text-[#F97316] text-sm">{file.name}</p>
                                <button
                                  onClick={e => { e.stopPropagation(); setFile(null); }}
                                  className="w-6 h-6 rounded-full bg-[#F97316]/10 flex items-center justify-center hover:bg-[#F97316] hover:text-white transition-all"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <UploadCloud className="w-12 h-12 text-[#1A1A1A]/10 group-hover/upload:text-[#F97316] transition-all mb-4 group-hover/upload:-translate-y-2" />
                                <p className="text-base font-black text-[#1A1A1A] uppercase tracking-tighter">
                                  Drop file or <span className="text-[#F97316]">browse</span>
                                </p>
                                <p className="text-[9px] text-[#1A1A1A]/20 mt-3 uppercase tracking-[0.4em] font-black italic">PDF, DOCX up to 10MB</p>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="rounded-[2rem] border border-[#1A1A1A]/10 p-6 bg-[#F5F5F0]/30">
                          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#1A1A1A]/30 ml-1 mb-3 italic">Audio Answer (optional)</p>
                          <div className="flex flex-wrap items-center gap-3">
                            {!recording ? (
                              <button type="button" onClick={startRecording} disabled={submitting}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1A1A] text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-60">
                                <Mic className="w-4 h-4" /> Record
                              </button>
                            ) : (
                              <button type="button" onClick={stopRecording}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F97316] text-white text-[10px] font-black uppercase tracking-widest">
                                <StopCircle className="w-4 h-4" /> Stop ({recordingSeconds}s)
                              </button>
                            )}
                            {audioBlob && (
                              <button type="button" onClick={() => { setAudioBlob(null); if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl); setAudioPreviewUrl(''); }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#1A1A1A] text-[10px] font-black uppercase tracking-widest border border-[#1A1A1A]/10">
                                <X className="w-4 h-4" /> Remove
                              </button>
                            )}
                          </div>
                          {audioPreviewUrl && (
                            <div className="mt-3">
                              <audio src={audioPreviewUrl} controls className="w-full" />
                            </div>
                          )}
                        </div>

                        {uploadMetrics?.status === 'uploading' && (
                          <div className="rounded-2xl border border-[#1A1A1A]/10 bg-[#F5F5F0] p-4">
                            <div className="h-2 rounded-full bg-white overflow-hidden">
                              <div className="h-full bg-[#F97316]" style={{ width: `${uploadMetrics.progress}%` }} />
                            </div>
                            <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-[#1A1A1A]/50">
                              {uploadMetrics.progress}% - {formatBytes(uploadMetrics.uploadedBytes)} / {formatBytes(uploadMetrics.totalBytes)}
                              {uploadMetrics.etaSeconds !== null ? ` - ETA ${uploadMetrics.etaSeconds}s` : ''}
                            </p>
                          </div>
                        )}

                        {/* Error */}
                        {submitError && (
                          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                            <AlertCircle className="w-5 h-5 text-[#F97316] shrink-0" />
                            <p className="text-sm font-bold text-[#F97316]">{submitError}</p>
                          </div>
                        )}

                        {/* Success */}
                        {submitSuccess && (
                          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
                            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                            <p className="text-sm font-bold text-green-700">Assignment submitted successfully!</p>
                          </div>
                        )}

                        {/* Action Row */}
                        <div className="flex items-center justify-between pt-6 border-t border-[#1A1A1A]/5">
                          <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-[#F97316] animate-pulse shadow-[0_0_20px_rgba(198,40,40,0.6)]" />
                            <span className="text-[10px] font-black text-[#1A1A1A]/40 uppercase tracking-[0.4em] italic">Auto-save: Active</span>
                          </div>
                          <button
                            onClick={handleSubmit}
                            disabled={submitting || (!answer.trim() && !file && !audioBlob)}
                            className="flex items-center gap-3 px-10 py-5 bg-[#F97316] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-[#F97316]/20 hover:-translate-y-1 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                          >
                            {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
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
