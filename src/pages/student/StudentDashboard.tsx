import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FiBookOpen, FiFileText, FiArrowRight, FiChevronRight, FiCalendar, FiActivity, FiClock, FiAward } from 'react-icons/fi';
import { RiFlashlightLine, RiMedalLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import StudentSidebar from '../../components/shared/StudentSidebar';
import MaterialPreviewModal from '../../components/shared/MaterialPreviewModal';
import {
  fetchProfile, fetchLevelByName, fetchMyAssignedMaterials,
  fetchAssignmentsByLevel, fetchExamsByLevel, fetchResultsByStudent, fetchSubmissionsByStudent,
  type Profile, type Material, type Assignment, type Exam, type Result, type Submission,
} from '../../services/studentService';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
const ci = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

function formatDeadline(deadline: string | null) {
  if (!deadline) return 'No deadline';
  return new Date(deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [profile,     setProfile]     = useState<Profile | null>(null);
  const [materials,   setMaterials]   = useState<Material[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams,       setExams]       = useState<Exam[]>([]);
  const [results,     setResults]     = useState<Result[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

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
        const [mats, asgns, exs, ress, subs] = await Promise.all([
          fetchMyAssignedMaterials(user!.id),
          fetchAssignmentsByLevel(level.id),
          fetchExamsByLevel(level.id),
          fetchResultsByStudent(user!.id),
          fetchSubmissionsByStudent(user!.id),
        ]);
        if (cancelled) return;
        setMaterials(mats);
        setAssignments(asgns);
        setExams(exs);
        setResults(ress);
        setSubmissions(subs);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const latestResult = results[0] ?? null;
  const latestPendingReview = latestResult?.review_status === 'pending_review';
  const latestReviewed = submissions
    .filter(s => s.status === 'graded')
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0] ?? null;
  const pendingAssignments = assignments.slice(0, 3);
  const upcomingExam = exams[0] ?? null;
  const greekName = profile?.name?.split(' ')[0] ?? user?.name?.split(' ')[0] ?? 'Student';

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <StudentSidebar
        profile={profile}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarOpen(p => !p)}
      />

      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#C62828]/2 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 text-sm font-bold text-[#C62828]">{error}</div>
        )}

        {/* Header */}
        <header className="mb-10 lg:mb-16 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 relative z-10">
          <motion.div variants={ci} className="space-y-3">
            {loading
              ? <div className="h-14 w-64 bg-[#1A1A1A]/5 rounded-2xl animate-pulse" />
              : <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase">
                  Guten Tag,<br /><span className="text-[#C62828]">{greekName}.</span>
                </h2>
            }
            <p className="text-[#D4A373] font-black uppercase text-[10px] sm:text-xs tracking-[0.3em] italic">
              {profile?.current_level ?? '—'} Level • {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </motion.div>

          {/* Streak card (static flavour) */}
          <motion.div variants={ci} className="flex gap-4 items-center">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#1A1A1A]/5 shadow-xl flex items-center gap-4 group hover:-translate-y-2 transition-transform cursor-pointer">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#D4A373]/10 flex items-center justify-center text-[#D4A373] group-hover:bg-[#D4A373] group-hover:text-white transition-all shrink-0">
                <RiFlashlightLine className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="pr-2">
                <p className="text-lg sm:text-xl font-black text-[#1A1A1A]">{results.length} Exams</p>
                <p className="text-[9px] text-[#1A1A1A]/30 uppercase tracking-widest font-black">Completed</p>
              </div>
            </div>
          </motion.div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 relative z-10">

          {/* Current Level Hero */}
          <motion.div variants={ci} className="col-span-1 md:col-span-12 lg:col-span-8 bg-[#1A1A1A] rounded-[2.5rem] p-8 sm:p-10 lg:p-14 text-white relative overflow-hidden shadow-2xl border border-white/5 group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C62828]/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#C62828]/40 transition-all duration-1000" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="space-y-3">
                    <span className="text-[#C62828] text-[10px] font-black uppercase tracking-[0.4em]">Current Enrollment</span>
                    {loading
                      ? <div className="h-12 w-72 bg-white/10 rounded-xl animate-pulse" />
                      : <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-none">
                          Level {profile?.current_level ?? '—'}<br />
                          <span className="text-[#C62828]">Programme.</span>
                        </h3>
                    }
                  </div>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center shrink-0">
                    <FiActivity className="w-6 h-6 text-[#D4A373]" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/5">
                  {[
                    { icon: FiClock, label: 'Materials', val: loading ? '—' : String(materials.length) },
                    { icon: FiBookOpen, label: 'Tasks',  val: loading ? '—' : String(assignments.length) },
                    { icon: FiAward, label: 'Exams',     val: loading ? '—' : String(exams.length) },
                  ].map((s, i) => (
                    <div key={i} className="space-y-2">
                      <s.icon className="w-4 h-4 text-white/20" />
                      <p className="text-2xl sm:text-3xl font-black tracking-tight">{s.val}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#D4A373]">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-10 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => navigate('/student/courses')}
                    className="bg-[#C62828] text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover:shadow-[0_20px_40px_rgba(198,40,40,0.4)] hover:-translate-y-1 transition-all active:scale-95 shadow-xl"
                  >
                    View Materials
                  </button>
                  <p className="text-white/20 text-[10px] font-black uppercase tracking-widest italic">
                    {materials[0]?.title ?? 'No materials yet'}
                  </p>
                </div>
                <FiChevronRight className="w-8 h-8 text-white/10 hidden sm:block" />
              </div>
            </div>
          </motion.div>

          {/* Latest Result */}
          <motion.div variants={ci} className="col-span-1 md:col-span-12 lg:col-span-4 bg-white rounded-[2.5rem] p-8 sm:p-10 lg:p-12 border border-[#1A1A1A]/5 shadow-sm space-y-8 group hover:shadow-2xl transition-all">
            <div className="flex justify-between items-start">
              <h4 className="text-lg font-black tracking-tight uppercase">Latest Result</h4>
              <RiMedalLine className="w-7 h-7 text-[#C62828] group-hover:scale-110 transition-transform" />
            </div>
            {loading
              ? <div className="h-20 bg-[#F5F5F0] rounded-2xl animate-pulse" />
              : latestResult
                ? <>
                    <div className="space-y-4">
                      {latestPendingReview ? (
                        <>
                          <p className="text-sm font-black text-amber-900 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                            Your latest exam is under review — final score will appear when writing sections are graded.
                          </p>
                          <p className="text-xs font-black text-[#1A1A1A]/40 uppercase tracking-widest italic">
                            {latestResult.exams?.title ?? 'Exam'}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black text-[#1A1A1A] tracking-tighter">
                              {(latestResult.score ?? 0).toFixed(0)}%
                            </span>
                            <span className="text-lg font-black text-[#1A1A1A]/20">/100</span>
                          </div>
                          <p className="text-xs font-black text-[#1A1A1A]/40 uppercase tracking-widest italic">
                            {latestResult.exams?.title ?? 'Exam'}
                          </p>
                          <div className="h-2 w-full bg-[#F5F5F0] rounded-full overflow-hidden shadow-inner">
                            <div
                              className="h-full bg-[#C62828] rounded-full shadow-[0_0_12px_rgba(198,40,40,0.4)] transition-all duration-1000"
                              style={{ width: `${latestResult.score ?? 0}%` }}
                            />
                          </div>
                          <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${latestResult.passed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-[#C62828]'}`}>
                            {latestResult.passed ? '✓ Passed' : '✗ Failed'}
                          </span>
                        </>
                      )}
                    </div>
                  </>
                : <p className="text-sm text-[#1A1A1A]/30 font-black italic">No exams taken yet.</p>
            }
            <button onClick={() => navigate('/student/results')} className="w-full flex items-center justify-between group/btn pt-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A] group-hover/btn:text-[#C62828] transition-colors">View All Results</span>
              <FiArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform text-[#C62828]" />
            </button>
          </motion.div>

          {/* Upcoming Assignments */}
          <motion.div variants={ci} className="col-span-1 md:col-span-6 lg:col-span-5 bg-white rounded-[2.5rem] p-8 lg:p-12 border border-[#1A1A1A]/5 shadow-sm hover:shadow-2xl transition-all group">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-lg font-black uppercase tracking-tight">Assignments</h4>
              <FiFileText className="text-[#C62828] w-5 h-5" />
            </div>
            {loading
              ? <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-14 bg-[#F5F5F0] rounded-2xl animate-pulse" />)}</div>
              : pendingAssignments.length === 0
                ? <p className="text-sm text-[#1A1A1A]/30 font-black italic">No assignments yet.</p>
                : <div className="space-y-4">
                    {pendingAssignments.map(a => (
                      <div
                        key={a.id}
                        onClick={() => navigate('/student/assignments')}
                        className="flex items-center justify-between p-4 bg-[#F5F5F0] rounded-2xl hover:bg-[#C62828]/5 cursor-pointer transition-all group/item"
                      >
                        <div className="min-w-0">
                          <p className="font-black text-sm text-[#1A1A1A] truncate group-hover/item:text-[#C62828] transition-colors">{a.title}</p>
                          <p className="text-[10px] font-black text-[#1A1A1A]/30 uppercase tracking-wider mt-0.5">Due {formatDeadline(a.deadline)}</p>
                        </div>
                        <FiArrowRight className="w-4 h-4 text-[#1A1A1A]/20 group-hover/item:text-[#C62828] group-hover/item:translate-x-1 transition-all shrink-0 ml-3" />
                      </div>
                    ))}
                  </div>
            }
            <button onClick={() => navigate('/student/assignments')} className="mt-6 w-full flex items-center justify-between group/btn">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A] group-hover/btn:text-[#C62828] transition-colors">All Assignments</span>
              <FiArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform text-[#C62828]" />
            </button>
          </motion.div>

          {/* Upcoming Exam */}
          <motion.div variants={ci} className="col-span-1 md:col-span-6 lg:col-span-3 bg-[#D4A373] rounded-[2.5rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden group hover:-translate-y-2 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-all" />
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center text-white mb-8 relative z-10">
              <FiCalendar className="w-6 h-6" />
            </div>
            <div className="space-y-3 relative z-10">
              <h4 className="text-xl font-black text-white uppercase leading-tight">
                {loading ? 'Loading…' : upcomingExam ? upcomingExam.title : 'No Exams Yet.'}
              </h4>
              {upcomingExam && (
                <p className="text-white/60 font-black text-[10px] uppercase tracking-[0.3em] italic">
                  {upcomingExam.duration} min
                </p>
              )}
            </div>
            <button
              onClick={() => navigate('/student/exams')}
              className="mt-6 relative z-10 text-white text-[10px] font-black uppercase tracking-widest border-b-2 border-white/20 pb-1 hover:border-white transition-all"
            >
              View Exams
            </button>
          </motion.div>

          {/* Materials preview */}
          <motion.div variants={ci} className="col-span-1 md:col-span-12 lg:col-span-4 bg-white rounded-[2.5rem] p-8 lg:p-12 border border-[#1A1A1A]/5 shadow-sm hover:shadow-2xl transition-all group">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-lg font-black uppercase tracking-tight">Recent Materials</h4>
              <FiBookOpen className="text-[#C62828] w-5 h-5" />
            </div>
            {loading
              ? <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-14 bg-[#F5F5F0] rounded-2xl animate-pulse" />)}</div>
              : materials.length === 0
                ? <p className="text-sm text-[#1A1A1A]/30 font-black italic">No materials uploaded yet.</p>
                : <div className="space-y-3">
                    {materials.slice(0, 4).map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => { setSelectedMaterial(m); setPreviewOpen(true); }}
                        className="flex items-center gap-4 p-4 bg-[#F5F5F0] rounded-2xl hover:bg-[#C62828]/5 cursor-pointer transition-all group/item"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#C62828]/10 flex items-center justify-center shrink-0">
                          <FiBookOpen className="w-4 h-4 text-[#C62828]" />
                        </div>
                        <p className="font-black text-sm text-[#1A1A1A] truncate group-hover/item:text-[#C62828] transition-colors">{m.title}</p>
                      </button>
                    ))}
                  </div>
            }
            <button onClick={() => navigate('/student/courses')} className="mt-6 w-full flex items-center justify-between group/btn">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A] group-hover/btn:text-[#C62828] transition-colors">All Materials</span>
              <FiArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform text-[#C62828]" />
            </button>
          </motion.div>

          {/* Latest review */}
          <motion.div variants={ci} className="col-span-1 md:col-span-12 lg:col-span-8 bg-white rounded-[2.5rem] p-8 lg:p-12 border border-[#1A1A1A]/5 shadow-sm hover:shadow-2xl transition-all">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">Latest Assignment Review</h4>
              <FiFileText className="text-[#C62828] w-5 h-5" />
            </div>
            {latestReviewed ? (
              <div className="space-y-3">
                <p className="text-sm font-black text-[#1A1A1A]">Grade: <span className="text-[#C62828]">{latestReviewed.grade ?? 0}%</span></p>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/35">
                  Reviewed {new Date(latestReviewed.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-sm text-[#1A1A1A]/70 italic">{latestReviewed.feedback || 'No feedback yet.'}</p>
                <button onClick={() => navigate('/student/assignments')} className="text-[10px] font-black uppercase tracking-widest text-[#C62828] hover:underline">
                  Open assignments
                </button>
              </div>
            ) : (
              <p className="text-sm text-[#1A1A1A]/40 font-black italic">No reviewed assignments yet.</p>
            )}
          </motion.div>
        </div>
      </main>

      <MaterialPreviewModal
        open={previewOpen}
        material={selectedMaterial}
        onClose={() => { setPreviewOpen(false); setSelectedMaterial(null); }}
      />
    </motion.div>
  );
}
