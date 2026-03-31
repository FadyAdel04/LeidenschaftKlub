import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader, ExternalLink, Edit3, Save, X, Inbox } from 'lucide-react';
import AdminSidebar from '../../components/shared/AdminSidebar';
import { fetchAllSubmissions, gradeSubmission, fetchAllExamResults, fetchWritingAnswersForReview, gradeExamAnswer, type Submission, type Result, type ExamAnswer } from '../../services/adminService';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const ci = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

type SubData = Submission & { profiles?: { name: string; email: string }; assignments?: { title: string } };
type ExamResultData = Result & {
  profiles?: { name: string; email: string };
  exams?: { title: string; duration: number };
};

export default function AdminResults() {
  const [submissions, setSubmissions] = useState<SubData[]>([]);
  const [examResults, setExamResults] = useState<ExamResultData[]>([]);
  const [writingAnswers, setWritingAnswers] = useState<ExamAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editGrade, setEditGrade] = useState('');
  const [editFeedback, setEditFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const [writingEditingId, setWritingEditingId] = useState<string | null>(null);
  const [writingGrade, setWritingGrade] = useState('');
  const [writingFeedback, setWritingFeedback] = useState('');
  const [writingSaving, setWritingSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetchAllSubmissions(), fetchAllExamResults(), fetchWritingAnswersForReview()])
      .then(([subs, results, writing]) => {
        setSubmissions(subs);
        setExamResults(results);
        setWritingAnswers(writing);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const passRate = examResults.length
    ? Math.round((examResults.filter(r => r.passed).length / examResults.length) * 100)
    : 0;

  const handleSave = async (id: string) => {
    const numGrade = Number(editGrade);
    if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) {
      setError('Grade must be between 0 and 100');
      return;
    }
    setSaving(true); setError('');
    try {
      await gradeSubmission(id, numGrade, editFeedback);
      setSubmissions(p => p.map(s => s.id === id ? { ...s, grade: numGrade, status: 'graded', feedback: editFeedback || null } : s));
      setSaveMsg('Grade saved successfully.');
      setEditingId(null);
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleWritingSave = async (answerId: string) => {
    const numGrade = Number(writingGrade);
    if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) {
      setError('Grade must be between 0 and 100');
      return;
    }

    setWritingSaving(true);
    setError('');
    try {
      await gradeExamAnswer({ answerId, grade: numGrade, feedback: writingFeedback });
      setWritingAnswers(prev => prev.filter(a => a.id !== answerId));
      setWritingEditingId(null);
      setSaveMsg('Writing grade saved. Exam score updated.');
      setTimeout(() => setSaveMsg(''), 3500);

      // Refresh exam summary (score/pass may have changed)
      const results = await fetchAllExamResults();
      setExamResults(results);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save writing grade');
    } finally {
      setWritingSaving(false);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <AdminSidebar />
      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#F97316]/[0.02] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

        <motion.header variants={ci} className="mb-10 lg:mb-14 relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase mb-3">
            Review<br /><span className="text-[#F97316]">Submissions.</span>
          </h1>
          <p className="text-[#D4A373] font-black uppercase text-[10px] tracking-[0.5em] italic">
            {loading ? '—' : `${submissions.length} Total Submissions`}
          </p>
        </motion.header>

        {saveMsg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 relative z-10">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-xs font-bold text-green-700">{saveMsg}</p>
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 relative z-10">
            <AlertCircle className="w-4 h-4 text-[#F97316] shrink-0" />
            <p className="text-xs font-bold text-[#F97316]">{error}</p>
          </motion.div>
        )}

        <motion.div variants={ci} className="bg-white rounded-[2.5rem] border border-[#1A1A1A]/5 shadow-sm overflow-hidden relative z-10">
          {loading 
            ? <div className="p-10 space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-[#F5F5F0] rounded-2xl animate-pulse" />)}</div>
            : submissions.length === 0
              ? <div className="flex flex-col items-center justify-center py-32 text-center">
                  <Inbox className="w-12 h-12 text-[#1A1A1A]/10 mb-4" />
                  <p className="font-black text-[#1A1A1A]/30 uppercase">No submissions found.</p>
                </div>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1A1A1A]/5 bg-[#F5F5F0]/50">
                        {['Student', 'Assignment', 'file', 'Submitted', 'Status / Grade', 'Action'].map(h => (
                          <th key={h} className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] italic whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map(s => (
                        <tr key={s.id} className="border-b border-[#1A1A1A]/5 hover:bg-[#F5F5F0]/40 transition-all group">
                          <td className="px-8 py-5">
                            <p className="font-black text-sm text-[#1A1A1A] whitespace-nowrap">{s.profiles?.name || 'Unknown'}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/30">{s.profiles?.email}</p>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-xs font-black text-[#1A1A1A]/70 truncate max-w-[200px]">{s.assignments?.title}</p>
                          </td>
                          <td className="px-8 py-5">
                            {s.file_url ? (
                              <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#F97316] hover:underline whitespace-nowrap">
                                <ExternalLink className="w-3.5 h-3.5" /> View Work
                              </a>
                            ) : (
                              <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/25 whitespace-nowrap">
                                Text answer only
                              </span>
                            )}
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-[10px] font-black text-[#1A1A1A]/30 uppercase tracking-widest whitespace-nowrap">
                              {new Date(s.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </p>
                          </td>
                          <td className="px-8 py-5">
                            {editingId === s.id ? (
                              <div className="flex flex-col gap-2">
                                <input type="number" value={editGrade} onChange={e => setEditGrade(e.target.value)} min="0" max="100" placeholder="0-100"
                                  className="w-20 px-3 py-1.5 bg-[#F5F5F0] rounded-xl font-black text-sm text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#F97316]/20 border border-[#F97316]/20" />
                                <textarea
                                  value={editFeedback}
                                  onChange={e => setEditFeedback(e.target.value)}
                                  placeholder="Feedback for student"
                                  rows={2}
                                  className="w-56 px-3 py-2 bg-[#F5F5F0] rounded-xl text-xs font-black text-[#1A1A1A] outline-none focus:ring-2 focus:ring-[#F97316]/20 border border-[#F97316]/20 resize-none"
                                />
                              </div>
                            ) : s.status === 'graded' ? (
                              <div className="space-y-1">
                                <span className="px-3 py-1.5 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-200">
                                  Graded: {s.grade}%
                                </span>
                                {s.feedback && (
                                  <p className="text-[10px] font-black text-[#1A1A1A]/40 max-w-[220px] line-clamp-2 italic">{s.feedback}</p>
                                )}
                              </div>
                            ) : (
                              <span className="px-3 py-1.5 bg-[#F5F5F0] text-[#1A1A1A]/40 text-[10px] font-black uppercase tracking-widest rounded-full border border-[#1A1A1A]/10">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-8 py-5">
                            {editingId === s.id ? (
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleSave(s.id)} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F97316] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg transition-all active:scale-95 disabled:opacity-60">
                                  {saving ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                                </button>
                                <button onClick={() => setEditingId(null)} className="p-1.5 bg-[#F5F5F0] rounded-xl text-[#1A1A1A]/40 hover:text-[#1A1A1A]">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => { setEditingId(s.id); setEditGrade(s.grade?.toString() || ''); setEditFeedback(s.feedback ?? ''); }} className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F5F0] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border border-[#1A1A1A]/5">
                                <Edit3 className="w-3 h-3" /> Grade
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
          }
        </motion.div>

        <motion.div variants={ci} className="mt-8 bg-white rounded-[2.5rem] border border-[#1A1A1A]/5 shadow-sm overflow-hidden relative z-10">
          <div className="px-8 py-6 border-b border-[#1A1A1A]/5">
            <h3 className="font-black text-[#1A1A1A] tracking-tighter uppercase text-lg">Exam Results Tracking</h3>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#1A1A1A]/30 mt-1">{examResults.length} attempts • {passRate}% pass rate</p>
            <div className="mt-3 h-2 bg-[#F5F5F0] rounded-full overflow-hidden">
              <div className="h-full bg-[#F97316] rounded-full" style={{ width: `${passRate}%` }} />
            </div>
          </div>
          {loading ? (
            <div className="p-8 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-[#F5F5F0] rounded-xl animate-pulse" />)}</div>
          ) : examResults.length === 0 ? (
            <div className="p-12 text-center"><p className="font-black text-[#1A1A1A]/30 uppercase">No exam results yet.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1A1A1A]/5 bg-[#F5F5F0]/50">
                    {['Student', 'Exam', 'Score', 'Status', 'Taken'].map(h => (
                      <th key={h} className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] italic whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {examResults.map(r => (
                    <tr key={r.id} className="border-b border-[#1A1A1A]/5 hover:bg-[#F5F5F0]/40 transition-all">
                      <td className="px-8 py-4">
                        <p className="font-black text-sm text-[#1A1A1A]">{r.profiles?.name ?? 'Unknown'}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/30">{r.profiles?.email}</p>
                      </td>
                      <td className="px-8 py-4">
                        <p className="font-black text-sm text-[#1A1A1A]">{r.exams?.title ?? 'Exam'}</p>
                      </td>
                      <td className="px-8 py-4">
                        <p className="font-black text-sm text-[#1A1A1A]">
                          {r.review_status === 'pending_review' || r.score == null ? '—' : `${r.score.toFixed(0)}%`}
                        </p>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${r.passed ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-[#F97316] border border-red-200'}`}>
                          {r.passed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <p className="text-[10px] font-black text-[#1A1A1A]/30 uppercase tracking-widest">
                          {new Date(r.taken_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <motion.div variants={ci} className="mt-10 bg-white rounded-[2.5rem] border border-[#1A1A1A]/5 shadow-sm overflow-hidden relative z-10">
          <div className="px-8 py-6 border-b border-[#1A1A1A]/5">
            <h3 className="font-black text-[#1A1A1A] tracking-tighter uppercase text-lg">Writing Question Review</h3>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#1A1A1A]/30 mt-1">
              {writingAnswers.length} pending reviews
            </p>
          </div>

          {loading ? (
            <div className="p-8 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-[#F5F5F0] rounded-2xl animate-pulse" />)}</div>
          ) : writingAnswers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-black text-[#1A1A1A]/30 uppercase">No writing answers need review.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1A1A1A]/5 bg-[#F5F5F0]/50">
                    {['Student', 'Exam', 'Question', 'Answer', 'Grade', 'Action'].map(h => (
                      <th key={h} className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] italic whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {writingAnswers.map((a) => {
                    const ansText = typeof a.answer === 'string' ? a.answer : a.answer ? JSON.stringify(a.answer) : '';
                    return (
                      <tr key={a.id} className="border-b border-[#1A1A1A]/5 hover:bg-[#F5F5F0]/40 transition-all">
                        <td className="px-6 py-4">
                          <p className="font-black text-sm text-[#1A1A1A]">{a.profiles?.name ?? 'Unknown'}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/30">{a.profiles?.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-black text-sm text-[#1A1A1A]">{a.exams?.title ?? 'Exam'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-black text-sm text-[#1A1A1A] max-w-[240px] line-clamp-2">{a.questions?.question_text ?? 'Question'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-black text-[#1A1A1A]/60 max-w-[260px] line-clamp-3 italic" title={ansText}>
                            {ansText ? `${ansText.slice(0, 120)}${ansText.length > 120 ? '…' : ''}` : '—'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#F5F5F0] text-[#1A1A1A]/40 border border-[#1A1A1A]/10">
                            Pending
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {writingEditingId === a.id ? (
                            <div className="space-y-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={writingGrade}
                                onChange={(e) => setWritingGrade(e.target.value)}
                                placeholder="0-100"
                                className="w-24 px-3 py-1.5 bg-[#F5F5F0] rounded-xl font-black text-sm outline-none border border-[#F97316]/20"
                              />
                              <textarea
                                value={writingFeedback}
                                onChange={(e) => setWritingFeedback(e.target.value)}
                                placeholder="Feedback for student"
                                rows={2}
                                className="w-72 px-3 py-2 bg-[#F5F5F0] rounded-xl text-xs font-black outline-none border border-[#F97316]/20 resize-none"
                              />
                              <div className="flex gap-2 items-center">
                                <button
                                  onClick={() => handleWritingSave(a.id)}
                                  disabled={writingSaving}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F97316] text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
                                >
                                  {writingSaving ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                  Save
                                </button>
                                <button
                                  onClick={() => { setWritingEditingId(null); setWritingGrade(''); setWritingFeedback(''); }}
                                  className="p-1.5 bg-[#F5F5F0] rounded-xl text-[#1A1A1A]/40 hover:text-[#1A1A1A]"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setWritingEditingId(a.id);
                                setWritingGrade('60');
                                setWritingFeedback('');
                                setError('');
                              }}
                              className="px-3 py-1.5 bg-[#F5F5F0] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border border-[#1A1A1A]/5"
                            >
                              Review
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </main>
    </motion.div>
  );
}
