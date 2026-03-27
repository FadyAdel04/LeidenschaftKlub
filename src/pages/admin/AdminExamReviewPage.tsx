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
import AdminSidebar from '../../components/shared/AdminSidebar';
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

export default function AdminExamReviewPage() {
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
        const q = b.questions.nd((x) => x.id === a.question_id);
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
        <p className="font-black text-[#C62828]">Invalid link.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F5F5F0] lg:flex pb-28">
      <AdminSidebar />

      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full">
        <button
          type="button"
          onClick={() => navigate('/admin/exams')}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/50 hover:text-[#C62828] mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to exams
        </button>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader className="w-10 h-10 animate-spin text-[#C62828]" />
          </div>
        ) : error && !bundle ? (
          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-[#C62828] font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        ) : bundle ? (
          <>
            <header className="mb-10">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4A373]">Review submission</p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-[#1A1A1A] uppercase mt-2">
                {bundle.exam.title}
              </h1>
              <p className="text-sm text-[#1A1A1A]/50 mt-2">
                <span className="font-bold text-[#1A1A1A]">{bundle.profile.name}</span>
                <span className="mx-2">·</span>
                {bundle.profile.email}
              </p>
              {bundle.result && (
                <div className="mt-4 flex flex-wrap gap-2 items-center">
                  <span
                    className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                      bundle.result.review_status === 'completed'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {bundle.result.review_status === 'completed' ? 'Completed' : 'Pending review'}
                  </span>
                  {bundle.result.review_status === 'completed' && bundle.result.score != null && (
                    <span className="text-sm font-black text-[#1A1A1A]">nal: {bundle.result.score}%</span>
                  )}
                </div>
              )}
            </header>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-sm font-bold text-[#C62828]">
                {error}
              </div>
            )}

            <div className="space-y-8">
              {bundle.questions.map((q, idx) => {
                const ans = answerByQ.get(q.id);
                const manual = isManualExamQuestion(q);
                const isPendingWriting = manual && ans?.answer_status === 'pending';

                return (
                  <section
                    key={q.id}
                    className={`rounded-3xl border p-6 shadow-sm ${
                      manual ? 'border-amber-200 bg-amber-50/30' : 'border-[#1A1A1A]/10 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/35">
                          Q{idx + 1} · {q.type}
                        </span>
                        {manual && (
                          <span className="ml-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                            Writing
                          </span>
                        )}
                        <p className="font-black text-[#1A1A1A] mt-2 leading-snug">{q.question_text}</p>
                      </div>
                      {ans && !manual && (
                        <span className="shrink-0 text-[10px] font-black uppercase px-3 py-1 rounded-full bg-[#F5F5F0] text-[#1A1A1A]/60">
                          Auto
                        </span>
                      )}
                    </div>

                    {q.content && (
                      <div className="mb-4 text-sm text-[#1A1A1A]/70 whitespace-pre-wrap border-l-2 border-[#1A1A1A]/10 pl-3">
                        {q.content}
                      </div>
                    )}

                    {!manual && (
                      <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-[9px] font-black uppercase text-[#1A1A1A]/35 mb-1">Correct</p>
                          <p className="font-medium text-green-800 bg-green-50/80 rounded-xl px-3 py-2">{correctLabel(q)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-[#1A1A1A]/35 mb-1">Student</p>
                          <p className="font-medium rounded-xl px-3 py-2 bg-[#F5F5F0]">{formatAnswer(ans?.answer)}</p>
                        </div>
                        <div className="sm:col-span-2 flex items-center gap-4 flex-wrap">
                          <p className="text-[10px] font-black uppercase text-[#1A1A1A]/40">
                            Score:{' '}
                            <span className="text-[#1A1A1A]">{ans?.score != null ? `${ans.score}%` : '—'}</span>
                          </p>
                          {ans?.is_correct != null && (
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                                ans.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-50 text-[#C62828]'
                              }`}
                            >
                              {ans.is_correct ? 'Correct' : 'Incorrect'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {manual && ans && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-[9px] font-black uppercase text-[#1A1A1A]/35 mb-1">Student answer</p>
                          <p className="text-sm whitespace-pre-wrap rounded-xl px-4 py-3 bg-white border border-amber-100">
                            {formatAnswer(ans.answer)}
                          </p>
                        </div>

                        {isPendingWriting || ans.answer_status === 'reviewed' ? (
                          <div className="space-y-3">
                            <label className="block">
                              <span className="text-[9px] font-black uppercase text-[#1A1A1A]/40">Score (0–100)</span>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                className="mt-1 w-full max-w-xs rounded-xl border border-[#1A1A1A]/15 px-4 py-2 font-black"
                                value={drafts[ans.id]?.score ?? ''}
                                onChange={(e) =>
                                  setDrafts((d) => ({
                                    ...d,
                                    [ans.id]: { ...d[ans.id], score: e.target.value, feedback: d[ans.id]?.feedback ?? '' },
                                  }))
                                }
                              />
                            </label>
                            <label className="block">
                              <span className="text-[9px] font-black uppercase text-[#1A1A1A]/40">Feedback</span>
                              <textarea
                                className="mt-1 w-full min-h-[100px] rounded-xl border border-[#1A1A1A]/15 px-4 py-3 text-sm"
                                placeholder="Optional feedback for the student…"
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
                            </label>
                            <button
                              type="button"
                              disabled={savingId === ans.id}
                              onClick={() => void saveWriting(ans.id)}
                              className="inline-flex items-center gap-2 bg-[#C62828] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-95 disabled:opacity-50"
                            >
                              {savingId === ans.id ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : (
                                <Edit3 className="w-4 h-4" />
                              )}
                              Save review
                            </button>
                            {ans.answer_status === 'reviewed' && ans.score != null && (
                              <p className="text-[10px] font-black uppercase text-green-700 flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                Saved · {ans.score}%
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-amber-800 font-bold">Pending student answer</p>
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

      <div className="xed bottom-0 left-0 right-0 lg:left-80 border-t border-[#1A1A1A]/10 bg-white/95 backdrop-blur-md px-4 py-4 z-40">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">
              Writing questions reviewed
            </p>
            <p className="text-lg font-black text-[#1A1A1A]">
              {writingProgress.done}/{writingProgress.total || 0}
              {writingQuestions.length > 0 && allWritingReviewed && (
                <CheckCircle className="inline w-5 h-5 text-green-600 ml-2 align-middle" />
              )}
            </p>
            {writingQuestions.length > 0 && !allWritingReviewed && (
              <p className="text-[10px] text-amber-800 font-bold mt-1">
                nal score is released after every writing question is reviewed.
              </p>
            )}
          </div>
          {toast && (
            <span className="text-sm font-black text-green-700 bg-green-50 px-4 py-2 rounded-xl">{toast}</span>
          )}
          <button
            type="button"
            onClick={() => navigate('/admin/exams')}
            className="text-[10px] font-black uppercase tracking-widest text-[#C62828] border border-[#C62828]/30 px-5 py-2 rounded-xl hover:bg-[#C62828]/5"
          >
            Submissions list
          </button>
        </div>
      </div>
    </motion.div>
  );
}
