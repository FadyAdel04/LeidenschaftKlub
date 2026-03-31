import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Award, BarChart2, CheckCircle, ChevronDown, ChevronUp, Clock, XCircle, AlertCircle } from 'lucide-react';
import StudentSidebar from '../../components/shared/StudentSidebar';
import { useAuth } from '../../context/AuthContext';
import {
  fetchProfile,
  fetchResultsByStudent,
  fetchStudentExamResultDetail,
  isManualExamQuestion,
  type Profile,
  type Result,
  type ExamResultQuestionRow,
} from '../../services/studentService';

function fmtAnswer(a: unknown): string {
  if (a === null || a === undefined) return '—';
  if (typeof a === 'string') return a;
  if (typeof a === 'boolean') return a ? 'True' : 'False';
  try {
    return JSON.stringify(a);
  } catch {
    return String(a);
  }
}

export default function StudentResults() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, { rows: ExamResultQuestionRow[] }>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    let cancelled = false;
    async function load() {
      try {
        const [p, r] = await Promise.all([fetchProfile(userId), fetchResultsByStudent(userId)]);
        if (cancelled) return;
        setProfile(p);
        setResults(r);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load results');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const completedResults = useMemo(() => results.filter((r) => r.review_status === 'completed'), [results]);

  const stats = useMemo(() => {
    const total = results.length;
    const passed = completedResults.filter((r) => r.passed).length;
    const avg = completedResults.length
      ? Math.round(
          completedResults.reduce((sum, r) => sum + (r.score ?? 0), 0) / completedResults.length
        )
      : 0;
    return { total, passed, avg, progress: completedResults.length ? Math.round((passed / completedResults.length) * 100) : 0 };
  }, [results, completedResults]);

  async function toggleExpand(r: Result) {
    if (expanded === r.id) {
      setExpanded(null);
      return;
    }
    setExpanded(r.id);
    if (detailCache[r.id]) return;
    if (!user) return;
    setDetailLoading(r.id);
    try {
      const { rows } = await fetchStudentExamResultDetail(user.id, r.exam_id);
      setDetailCache((c) => ({ ...c, [r.id]: { rows } }));
    } catch {
      setError('Could not load exam detail.');
    } finally {
      setDetailLoading(null);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <StudentSidebar profile={profile} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onToggle={() => setSidebarOpen((p) => !p)} />

      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        <header className="mb-10">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4A373]">Exam Analytics</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] uppercase leading-none mt-2">
            My <span className="text-[#F97316]">Results.</span>
          </h1>
        </header>

        {error && <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50 text-sm font-bold text-[#F97316]">{error}</div>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Exams Taken', value: loading ? '—' : stats.total, icon: BarChart2 },
            { label: 'Passed', value: loading ? '—' : stats.passed, icon: CheckCircle },
            { label: 'Average', value: loading ? '—' : `${stats.avg}%`, icon: Award },
            { label: 'Progress', value: loading ? '—' : `${stats.progress}%`, icon: Clock },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-5 shadow-sm">
              <s.icon className="w-5 h-5 text-[#F97316] mb-3" />
              <p className="text-3xl font-black tracking-tighter text-[#1A1A1A]">{s.value}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/35 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-[#1A1A1A]/10 p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black uppercase text-[#1A1A1A]">Visual Progress</h3>
            <span className="text-xs font-black text-[#F97316]">{stats.progress}%</span>
          </div>
          <div className="h-3 bg-[#F5F5F0] rounded-full overflow-hidden">
            <div className="h-full bg-[#F97316] rounded-full transition-all duration-700" style={{ width: `${stats.progress}%` }} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/35 mt-3">Based on graded (completed) exams only</p>
        </div>

        <section className="bg-white rounded-3xl border border-[#1A1A1A]/10 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#1A1A1A]/10">
            <h3 className="font-black uppercase tracking-tight text-[#1A1A1A]">Exam History</h3>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-[#F5F5F0] animate-pulse" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center text-[#1A1A1A]/40 font-black uppercase">No exam results yet.</div>
          ) : (
            <div className="divide-y divide-[#1A1A1A]/10">
              {results.map((r) => {
                const pending = r.review_status === 'pending_review';

                return (
                  <div key={r.id} className="px-6 py-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-black text-[#1A1A1A] truncate">{r.exams?.title ?? 'Exam'}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/35">
                          {new Date(r.taken_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                            pending ? 'bg-amber-50 text-amber-900' : 'bg-green-50 text-green-800'
                          }`}
                        >
                          {pending ? 'Pending review' : 'Completed'}
                        </span>
                        {!pending && r.score != null && (
                          <p className="text-xl font-black tracking-tighter text-[#1A1A1A]">{r.score.toFixed(0)}%</p>
                        )}
                        {!pending && (
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              r.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-[#F97316]'
                            }`}
                          >
                            {r.passed ? <CheckCircle className="inline w-3 h-3 mr-1" /> : <XCircle className="inline w-3 h-3 mr-1" />}
                            {r.passed ? 'Pass' : 'Fail'}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => void toggleExpand(r)}
                          className="p-2 rounded-xl bg-[#F5F5F0] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors"
                          aria-expanded={expanded === r.id}
                        >
                          {expanded === r.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {pending && (
                      <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3 items-start">
                        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-black text-amber-950 text-sm">Your exam is under review</p>
                          <p className="text-xs text-amber-900/80 mt-1">
                            Writing sections are graded by your instructor. Your Final score will appear here when the review is
                            finished. Auto-graded sections may be shown below.
                          </p>
                        </div>
                      </div>
                    )}

                    {expanded === r.id && (
                      <div className="mt-4 border-t border-[#1A1A1A]/10 pt-4 space-y-4">
                        {detailLoading === r.id ? (
                          <p className="text-sm font-bold text-[#1A1A1A]/40">Loading detail…</p>
                        ) : detailCache[r.id] ? (
                          detailCache[r.id].rows.map(({ question: q, answerRow: ans }) => {
                            const manual = isManualExamQuestion(q);
                            const st = ans?.answer_status ?? 'pending';
                            const showWritingPending = manual && st === 'pending';

                            if (pending && manual && st === 'pending') {
                              return (
                                <div key={q.id} className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
                                  <p className="text-[9px] font-black uppercase text-amber-900/70">Writing · pending review</p>
                                  <p className="font-black text-[#1A1A1A] mt-1">{q.question_text}</p>
                                </div>
                              );
                            }

                            if (manual && ans) {
                              return (
                                <div key={q.id} className="rounded-2xl border border-[#1A1A1A]/10 p-4 space-y-2">
                                  <p className="text-[9px] font-black uppercase text-[#1A1A1A]/35">Writing</p>
                                  <p className="font-black text-[#1A1A1A]">{q.question_text}</p>
                                  <p className="text-sm text-[#1A1A1A]/70 whitespace-pre-wrap">{fmtAnswer(ans.answer)}</p>
                                  {showWritingPending ? (
                                    <p className="text-xs font-bold text-amber-800">Pending review</p>
                                  ) : (
                                    <>
                                      <p className="text-sm">
                                        <span className="font-black text-[#1A1A1A]">Score: </span>
                                        {ans.score != null ? `${ans.score}%` : '—'}
                                      </p>
                                      {ans.admin_feedback && (
                                        <div className="rounded-xl bg-[#F5F5F0] p-3 text-sm">
                                          <span className="text-[9px] font-black uppercase text-[#1A1A1A]/40">Instructor feedback</span>
                                          <p className="mt-1 whitespace-pre-wrap">{ans.admin_feedback}</p>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              );
                            }

                            return (
                              <div key={q.id} className="rounded-2xl border border-[#1A1A1A]/10 p-4 space-y-1">
                                <p className="text-[9px] font-black uppercase text-[#1A1A1A]/35">{q.type}</p>
                                <p className="font-bold text-[#1A1A1A]">{q.question_text}</p>
                                <p className="text-xs text-[#1A1A1A]/60">
                                  Your answer: <span className="text-[#1A1A1A]">{fmtAnswer(ans?.answer)}</span>
                                </p>
                                {ans?.score != null && (
                                  <p className="text-[10px] font-black uppercase text-[#1A1A1A]/50">
                                    Points: {ans.score}% {ans.is_correct === true ? '· Correct' : ans.is_correct === false ? '· Incorrect' : ''}
                                  </p>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm text-[#1A1A1A]/40">No detail.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </motion.div>
  );
}
