import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  Loader,
  AlertCircle,
  Edit3,
} from 'lucide-react';
import InstructorSidebar from '../../components/shared/InstructorSidebar';
import {
  fetchExamReviewBundle,
  gradeExamAnswer,
  type ExamAnswer,
  type ExamReviewBundle,
} from '../../services/adminService';
import { isManualExamQuestion, type ExamQuestion } from '../../services/studentService';

function formatAnswer(a: unknown): string {
  if (a === null || a === undefined) return '—';
  if (typeof a === 'string') return a;
  if (typeof a === 'boolean') return a ? 'True' : 'False';
  try {
    return JSON.stringify(a);
  } catch {
    return String(a);
  }
}

function correctLabel(q: ExamQuestion): string {
  const j = q.correct_answer_json ?? q.correct_answer;
  return formatAnswer(j);
}

export default function InstructorExamReviewPage() {
  const { examId, studentId } = useParams<{ examId: string; studentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bundle, setBundle] = useState<ExamReviewBundle | null>(null);

  const [drafts, setDrafts] = useState<Record<string, { score: string; feedback: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    if (!examId || !studentId) return;
    setLoading(true);
    setError('');
    try {
      const b = await fetchExamReviewBundle(examId, studentId);
      setBundle(b);
      const next: Record<string, { score: string; feedback: string }> = {};
      for (const a of b.answers) {
        const q = b.questions.find((x: ExamQuestion) => x.id === a.question_id);
        if (q && isManualExamQuestion(q)) {
          next[a.id] = {
            score: a.score != null ? String(a.score) : '',
            feedback: a.admin_feedback ?? '',
          };
        }
      }
      setDrafts(next);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [examId, studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const answerByQ = useMemo(() => {
    const m = new Map<string, ExamAnswer>();
    if (!bundle) return m;
    for (const a of bundle.answers) m.set(a.question_id, a);
    return m;
  }, [bundle]);

  const writingQuestions = useMemo(() => {
    if (!bundle) return [];
    return bundle.questions.filter((q) => isManualExamQuestion(q));
  }, [bundle]);

  const writingProgress = useMemo(() => {
    let done = 0;
    for (const q of writingQuestions) {
      const a = answerByQ.get(q.id);
      if (a?.answer_status === 'reviewed') done++;
    }
    return { done, total: writingQuestions.length };
  }, [writingQuestions, answerByQ]);

  const allWritingReviewed =
    writingQuestions.length === 0 || writingProgress.done >= writingProgress.total;

  async function saveWriting(answerId: string) {
    const d = drafts[answerId];
    if (!d) return;
    const n = Number(d.score);
    if (Number.isNaN(n) || n < 0 || n > 100) {
      setError('Score must be between 0 and 100.');
      return;
    }
    setSavingId(answerId);
    setError('');
    try {
      await gradeExamAnswer({ answerId, grade: n, feedback: d.feedback.trim() || undefined });
      setToast('Review saved');
      setTimeout(() => setToast(''), 3500);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSavingId(null);
    }
  }

  if (!examId || !studentId) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-6">
        <p className="font-black text-[#F97316]">Invalid link.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F5F5F0] lg:flex pb-28">
      <InstructorSidebar />

      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full relative z-10">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#F97316]/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        <button
          type="button"
          onClick={() => navigate('/instructor/exams')}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/50 hover:text-[#F97316] mb-8 relative z-10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to exams
        </button>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader className="w-10 h-10 animate-spin text-[#F97316]" />
          </div>
        ) : error && !bundle ? (
          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-[#F97316] font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        ) : bundle ? (
          <>
            <header className="mb-10 relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4A373]">Review terminal</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-[#1A1A1A] uppercase mt-2">
                {bundle.exam.title}
              </h1>
              <p className="text-sm text-[#1A1A1A]/50 mt-4 font-black uppercase tracking-widest">
                Candidate: <span className="text-[#1A1A1A]">{bundle.profile.name}</span>
                <span className="mx-2 text-[#F97316]">/</span>
                {bundle.profile.email}
              </p>
              {bundle.result && (
                <div className="mt-6 flex flex-wrap gap-2 items-center">
                  <span
                    className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full border ${
                      bundle.result.review_status === 'completed'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {bundle.result.review_status === 'completed' ? 'Grading Finalized' : 'Evaluation In Progress'}
                  </span>
                  {bundle.result.review_status === 'completed' && bundle.result.score != null && (
                    <span className="text-sm font-black text-[#1A1A1A] bg-white px-4 py-2 rounded-xl border border-[#1A1A1A]/5 shadow-sm">Global Score: {bundle.result.score}%</span>
                  )}
                </div>
              )}
            </header>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-sm font-bold text-[#F97316]">
                {error}
              </div>
            )}

            <div className="space-y-8 relative z-10">
              {bundle.questions.map((q, idx) => {
                const ans = answerByQ.get(q.id);
                const manual = isManualExamQuestion(q);
                const isPendingWriting = manual && ans?.answer_status === 'pending';

                return (
                  <section
                    key={q.id}
                    className={`rounded-[2.5rem] border p-8 sm:p-10 shadow-sm transition-all hover:shadow-xl ${
                      manual ? 'border-[#F97316]/20 bg-white' : 'border-[#1A1A1A]/5 bg-white/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <span className="w-8 h-8 rounded-lg bg-[#1A1A1A] text-white flex items-center justify-center text-[10px] font-black">
                             {idx + 1}
                           </span>
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#1A1A1A]/40">
                             {q.type}
                           </span>
                           {manual && (
                             <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-[#F97316]/5 text-[#F97316] border border-[#F97316]/10">
                               Writing Section
                             </span>
                           )}
                        </div>
                        <p className="text-xl font-black text-[#1A1A1A] leading-tight tracking-tight">{q.question_text}</p>
                      </div>
                      {ans && !manual && (
                        <span className="shrink-0 text-[10px] font-black uppercase px-4 py-2 rounded-full bg-[#1A1A1A] text-white shadow-lg">
                          Auto Match
                        </span>
                      )}
                    </div>

                    {q.content && (
                      <div className="mb-6 p-6 rounded-2xl bg-[#F5F5F0] text-sm text-[#1A1A1A]/70 whitespace-pre-wrap border border-[#1A1A1A]/5 italic">
                        {q.content}
                      </div>
                    )}

                    {!manual && (
                      <div className="grid sm:grid-cols-2 gap-6 text-sm">
                        <div className="space-y-2">
                          <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/35 ml-2">Benchmark Answer</p>
                          <p className="font-black text-green-700 bg-green-50 border border-green-100 rounded-2xl px-5 py-4">{correctLabel(q)}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/35 ml-2">Candidate Input</p>
                          <p className="font-black rounded-2xl px-5 py-4 bg-white border border-[#1A1A1A]/5 shadow-sm">{formatAnswer(ans?.answer)}</p>
                        </div>
                        <div className="sm:col-span-2 flex items-center gap-6 pt-4 border-t border-[#1A1A1A]/5">
                          <div className="flex items-center gap-2">
                             <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Weighting Score:</p>
                             <span className="text-lg font-black text-[#1A1A1A] tracking-tighter">{ans?.score != null ? `${ans.score}%` : '---'}</span>
                          </div>
                          {ans?.is_correct != null && (
                            <span
                              className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-sm ${
                                ans.is_correct ? 'bg-green-50 text-green-700' : 'bg-red-50 text-[#F97316]'
                              }`}
                            >
                              {ans.is_correct ? 'Precision Validated' : 'Deviation Detected'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {manual && ans && (
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-[#F97316] ml-2">Manuscript Submission</p>
                          <div className="text-base leading-relaxed whitespace-pre-wrap rounded-3xl p-8 bg-[#F5F5F0] border border-[#1A1A1A]/5 font-medium shadow-inner text-[#1A1A1A]">
                            {formatAnswer(ans.answer)}
                          </div>
                        </div>

                        {isPendingWriting || ans.answer_status === 'reviewed' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[#1A1A1A]/5">
                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40 ml-4 italic">Assign Grade (0-100)</label>
                               <input
                                 type="number"
                                 min={0}
                                 max={100}
                                 className="w-full rounded-2xl border border-[#1A1A1A]/10 bg-white px-6 py-4 font-black text-2xl text-[#1A1A1A] focus:border-[#F97316] outline-none transition-colors"
                                 value={drafts[ans.id]?.score ?? ''}
                                 onChange={(e) =>
                                   setDrafts((d) => ({
                                     ...d,
                                     [ans.id]: { ...d[ans.id], score: e.target.value, feedback: d[ans.id]?.feedback ?? '' },
                                   }))
                                 }
                               />
                            </div>
                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40 ml-4 italic">Quality Feedback</label>
                               <textarea
                                 className="w-full min-h-[120px] rounded-2xl border border-[#1A1A1A]/10 bg-white px-6 py-4 text-sm font-medium focus:border-[#F97316] outline-none transition-colors resize-none"
                                 placeholder="Provide professional feedback..."
                                 value={drafts[ans.id]?.feedback ?? ''}
                                 onChange={(e) =>
                                   setDrafts((d) => ({
                                     ...d,
                                     [ans.id]: {
                                       score: d[ans.id]?.score ?? '',
                                       feedback: e.target.value,
                                     },
                                   }))
                                 }
                               />
                            </div>
                            <div className="md:col-span-2 flex items-center justify-between">
                               <button
                                 type="button"
                                 disabled={savingId === ans.id}
                                 onClick={() => void saveWriting(ans.id)}
                                 className="inline-flex items-center gap-3 bg-[#1A1A1A] text-white px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#F97316] shadow-xl transition-all disabled:opacity-50 active:scale-95"
                               >
                                 {savingId === ans.id ? (
                                   <Loader className="w-4 h-4 animate-spin" />
                                 ) : (
                                   <Edit3 className="w-4 h-4" />
                                 )}
                                 Commit Evaluation
                               </button>
                               {ans.answer_status === 'reviewed' && ans.score != null && (
                                 <p className="text-[10px] font-black uppercase tracking-widest text-green-700 flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100">
                                   <CheckCircle className="w-4 h-4" />
                                   Persisted: {ans.score}%
                                 </p>
                               )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100 flex items-center gap-3 text-amber-800">
                             <AlertCircle className="w-5 h-5" />
                             <p className="text-sm font-black uppercase tracking-tighter">Candidate awaiting submission for this segment.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </>
        ) : null}
      </main>

      <div className="fixed bottom-0 left-0 right-0 lg:left-80 border-t border-[#1A1A1A]/5 bg-white/80 backdrop-blur-2xl px-8 py-6 z-[60] shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-10">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]/30 mb-1">Reviewed Scope</p>
              <div className="flex items-center gap-3">
                 <p className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase leading-none">
                   {writingProgress.done}<span className="text-[#F97316]/30 px-1">/</span>{writingProgress.total || 0}
                 </p>
                 {writingQuestions.length > 0 && allWritingReviewed && (
                   <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-200">
                      <CheckCircle className="w-3.5 h-3.5" />
                   </div>
                 )}
              </div>
            </div>
            {writingQuestions.length > 0 && !allWritingReviewed && (
              <p className="max-w-[240px] text-[10px] text-[#F97316] font-black leading-relaxed italic uppercase tracking-widest bg-red-50 p-3 rounded-xl border border-red-100 shadow-sm">
                Complete all writing segments to release final outcome.
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
             {toast && (
               <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="text-[9px] font-black uppercase tracking-[0.2em] text-green-700 bg-green-50 px-6 py-3 rounded-2xl border border-green-200 shadow-sm">{toast}</motion.span>
             )}
             <button
               type="button"
               onClick={() => navigate('/instructor/exams')}
               className="px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#F5F5F0] text-[#1A1A1A]/40 hover:bg-[#1A1A1A] hover:text-white transition-all border border-[#1A1A1A]/5"
             >
               Exit Terminal
             </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
