import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { FiAward, FiBarChart2, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import StudentSidebar from '../../components/shared/StudentSidebar';
import { useAuth } from '../../context/AuthContext';
import { fetchProfile, fetchResultsByStudent, type Profile, type Result } from '../../services/studentService';

export default function StudentResults() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    let cancelled = false;
    async function load() {
      try {
        const [p, r] = await Promise.all([
          fetchProfile(userId),
          fetchResultsByStudent(userId),
        ]);
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
    return () => { cancelled = true; };
  }, [user]);

  const stats = useMemo(() => {
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const avg = total ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / total) : 0;
    return { total, passed, avg, progress: total ? Math.round((passed / total) * 100) : 0 };
  }, [results]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <StudentSidebar profile={profile} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onToggle={() => setSidebarOpen(p => !p)} />

      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        <header className="mb-10">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4A373]">Exam Analytics</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] uppercase leading-none mt-2">
            My <span className="text-[#C62828]">Results.</span>
          </h1>
        </header>

        {error && <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50 text-sm font-bold text-[#C62828]">{error}</div>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Exams Taken', value: loading ? '—' : stats.total, icon: FiBarChart2 },
            { label: 'Passed', value: loading ? '—' : stats.passed, icon: FiCheckCircle },
            { label: 'Average', value: loading ? '—' : `${stats.avg}%`, icon: FiAward },
            { label: 'Progress', value: loading ? '—' : `${stats.progress}%`, icon: FiClock },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-5 shadow-sm">
              <s.icon className="w-5 h-5 text-[#C62828] mb-3" />
              <p className="text-3xl font-black tracking-tighter text-[#1A1A1A]">{s.value}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/35 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-[#1A1A1A]/10 p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black uppercase text-[#1A1A1A]">Visual Progress</h3>
            <span className="text-xs font-black text-[#C62828]">{stats.progress}%</span>
          </div>
          <div className="h-3 bg-[#F5F5F0] rounded-full overflow-hidden">
            <div className="h-full bg-[#C62828] rounded-full transition-all duration-700" style={{ width: `${stats.progress}%` }} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/35 mt-3">Pass-rate progress based on completed exams</p>
        </div>

        <section className="bg-white rounded-3xl border border-[#1A1A1A]/10 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#1A1A1A]/10">
            <h3 className="font-black uppercase tracking-tight text-[#1A1A1A]">Exam History</h3>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-[#F5F5F0] animate-pulse" />)}</div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center text-[#1A1A1A]/40 font-black uppercase">No exam results yet.</div>
          ) : (
            <div className="divide-y divide-[#1A1A1A]/10">
              {results.map((r) => (
                <div key={r.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-black text-[#1A1A1A] truncate">{r.exams?.title ?? 'Exam'}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/35">
                      {new Date(r.taken_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <p className="text-xl font-black tracking-tighter text-[#1A1A1A]">{r.score.toFixed(0)}%</p>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${r.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-[#C62828]'}`}>
                      {r.passed ? <FiCheckCircle className="inline w-3 h-3 mr-1" /> : <FiXCircle className="inline w-3 h-3 mr-1" />}
                      {r.passed ? 'Pass' : 'Fail'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </motion.div>
  );
}
