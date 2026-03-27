import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { HelpCircle, Clock, AlertCircle, ArrowRight, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import StudentSidebar from '../../components/shared/StudentSidebar';
import {
  fetchProfile, fetchLevelByName, fetchExamsByLevel, fetchResultsByStudent,
  type Profile, type Exam, type Result,
} from '../../services/studentService';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const ci = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function StudentExams() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [profile,   setprofile]   = useState<Profile | null>(null);
  const [exams,     setExams]     = useState<Exam[]>([]);
  const [results,   setResults]   = useState<Result[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

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
        const [exs, ress] = await Promise.all([
          fetchExamsByLevel(level.id),
          fetchResultsByStudent(user!.id),
        ]);
        if (cancelled) return;
        setExams(exs);
        setResults(ress);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load exams');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  // map examId → result for easy lookup
  const resultMap = Object.fromEntries(results.map(r => [r.exam_id, r]));

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <StudentSidebar profile={profile} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onToggle={() => setSidebarOpen(p => !p)} />

      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#C62828]/[0.02] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

        {/* Header */}
        <motion.header variants={ci} className="mb-10 lg:mb-16 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 relative z-10">
          <div className="space-y-3">
            <span className="text-[#C62828] font-black tracking-[0.5em] text-[10px] uppercase italic">
              Level {profile?.current_level ?? '—'} Assessments
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase">
              My<br /><span className="text-[#C62828]">Exams.</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 bg-white p-4 pr-8 rounded-2xl border border-[#1A1A1A]/5 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-[#C62828]/10 flex items-center justify-center text-[#C62828] shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xl font-black text-[#1A1A1A] tracking-tighter leading-none">
                {loading ? '—' : exams.length} Exams
              </p>
              <p className="text-[9px] text-[#1A1A1A]/30 uppercase tracking-widest font-black italic">{results.length} Completed</p>
            </div>
          </div>
        </motion.header>

        {error && (
          <motion.div variants={ci} className="mb-8 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
            <AlertCircle className="w-5 h-5 text-[#C62828] shrink-0" />
            <p className="text-sm font-bold text-[#C62828]">{error}</p>
          </motion.div>
        )}

        {/* Exams Grid */}
        <div className="relative z-10">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="h-64 bg-white rounded-[2rem] border border-[#1A1A1A]/5 animate-pulse" />)}
            </div>
          ) : exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 rounded-3xl bg-[#F5F5F0] flex items-center justify-center mb-6">
                <HelpCircle className="w-10 h-10 text-[#1A1A1A]/20" />
              </div>
              <p className="text-xl font-black text-[#1A1A1A]/30 uppercase tracking-tight">No exams yet.</p>
              <p className="text-sm text-[#1A1A1A]/20 font-medium mt-2 italic">Check back when your instructor adds exams.</p>
            </div>
          ) : (
            <motion.div variants={cv} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map(exam => {
                const result = resultMap[exam.id];
                const taken  = !!result;
                const pendingReview = taken && result.review_status === 'pending_review';

                return (
                  <motion.div
                    key={exam.id}
                    variants={ci}
                    whileHover={{ y: -6 }}
                    className={`rounded-[2rem] p-8 border relative overflow-hidden shadow-sm hover:shadow-2xl transition-all group ${taken ? 'bg-[#1A1A1A] border-[#1A1A1A]' : 'bg-white border-[#1A1A1A]/5'}`}
                  >
                    <div className={`absolute top-0 right-0 w-40 h-40 rounded-full -translate-y-1/2 translate-x-1/2 blur-[60px] transition-all ${taken ? 'bg-[#C62828]/20 group-hover:bg-[#C62828]/40' : 'bg-[#C62828]/[0.04] group-hover:bg-[#C62828]/10'}`} />

                    <div className="relative z-10 space-y-6">
                      {/* Status badge */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1.5 rounded-full ${
                          taken
                            ? pendingReview
                              ? 'bg-amber-500/20 text-amber-200'
                              : result.passed
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-[#C62828]/20 text-[#C62828]'
                            : 'bg-[#C62828]/5 text-[#C62828]'
                        }`}>
                          {taken
                            ? pendingReview
                              ? 'Pending review'
                              : result.passed
                                ? '✓ Passed'
                                : '✗ Failed'
                            : 'Not Taken'}
                        </span>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${taken ? 'bg-white/10' : 'bg-[#C62828]/10'}`}>
                          <HelpCircle className={`w-5 h-5 ${taken ? 'text-[#D4A373]' : 'text-[#C62828]'}`} />
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className={`text-xl font-black tracking-tighter uppercase leading-tight ${taken ? 'text-white' : 'text-[#1A1A1A]'}`}>
                        {exam.title}
                      </h3>

                      {/* Meta */}
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 ${taken ? 'text-white/30' : 'text-[#1A1A1A]/30'}`}>
                          <Clock className="w-4 h-4 shrink-0" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{exam.duration} min</span>
                        </div>
                        {taken && !pendingReview && result.score != null && (
                          <div className="flex items-center gap-2 text-[#D4A373]">
                            <span className="text-[10px] font-black uppercase tracking-widest">{result.score.toFixed(0)}%</span>
                          </div>
                        )}
                      </div>

                      {/* Score bar if taken */}
                      {taken && !pendingReview && result.score != null && (
                        <div className="space-y-1">
                          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${result.passed ? 'bg-green-400' : 'bg-[#C62828]'}`}
                              style={{ width: `${result.score}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Action */}
                      {taken ? (
                        <button
                          onClick={() => navigate('/student/results')}
                          className="flex items-center gap-2 text-[#D4A373] text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors group/btn"
                        >
                          View Result
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/student/exams/${exam.id}`)}
                          className="flex items-center gap-2 bg-[#C62828] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 group/btn"
                        >
                          <Play className="w-4 h-4 group-hover/btn:scale-125 transition-transform" />
                          Start Exam
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </main>
    </motion.div>
  );
}
