import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, CheckCircle2, GraduationCap } from 'lucide-react';
import TopNavBar from '../../components/layout/TopNavBar';
import Footer from '../../components/layout/Footer';
import { fetchAllLevels, type Level } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import levelData from '../../data/levels.json';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const ci = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

function normalizeLevelSlug(nameOrSlug: string) {
  return decodeURIComponent(nameOrSlug).trim();
}

// Default hero images for each level
const defaultHeroImages = {
  A1: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1200&h=400&t=crop',
  A2: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&t=crop',
  B1: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&h=400&t=crop',
  B2: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1200&h=400&t=crop',
  C1: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&h=400&t=crop',
  C2: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1200&h=400&t=crop',
};

// (lesson showcase defaults removed; using gallery/hero fallbacks)

export default function LevelDetailsPage() {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signedInLevel, setSignedInLevel] = useState<string | null>(null);
  const currentName = useMemo(() => normalizeLevelSlug(level ?? ''), [level]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const rows = await fetchAllLevels();
        if (cancelled) return;
        setLevels(rows);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load levels');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Get level data from JSON
  const levelJsonData = useMemo(() => {
    const found = levelData.find(l => l.key.toLowerCase() === currentName.toLowerCase());
    return found || levelData.find(l => l.key === 'B1');
  }, [currentName]);

  const selected = useMemo(() => {
    const exact = levels.find(l => l.name.toLowerCase() === currentName.toLowerCase());
    if (exact) return exact;
    return levels.find(l => l.name.toLowerCase() === decodeURIComponent(currentName).toLowerCase());
  }, [levels, currentName]);

  const details = levelJsonData;

  const otherLevels = useMemo(() => {
    const sorted = [...levels].sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [levels]);

  // "current level" marker for signed-in student (from profiles table)
  useEffect(() => {
    let cancelled = false;
    async function loadMyLevel() {
      if (!user || user.role !== 'student') {
        setSignedInLevel(null);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('current_level')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;
      setSignedInLevel((data as { current_level?: string } | null)?.current_level ?? null);
    }
    loadMyLevel();
    return () => { cancelled = true; };
  }, [user?.id, user?.role]);

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0]">
      <TopNavBar />

      <main className="pt-24 sm:pt-28 md:pt-32 pb-24 px-4 sm:px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left Sidebar - Sticky and scrolls with page */}
            <motion.aside variants={ci} className="lg:col-span-3">
              <div className="lg:sticky lg:top-28">
                <div className="bg-white rounded-4xl border border-[#1A1A1A]/10 shadow-xl overflow-hidden">
                  <div className="p-6 border-b border-[#1A1A1A]/10 bg-linear-to-r from-[#F5F5F0]/50 to-transparent">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4A373]">Navigation</p>
                    <p className="mt-2 text-xl font-black tracking-tight text-[#1A1A1A]">Levels</p>
                    <p className="mt-1 text-xs font-bold text-[#1A1A1A]/50">Jump to any level</p>
                  </div>

                  {loading ? (
                    <div className="p-6 space-y-3">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-16 bg-[#F5F5F0] rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 space-y-2">
                      {otherLevels.map((lv) => {
                        const isActive = selected?.id === lv.id;
                        const isMine = signedInLevel && signedInLevel.toLowerCase() === lv.name.toLowerCase();
                        return (
                          <button
                            key={lv.id}
                            onClick={() => navigate(`/levels/${encodeURIComponent(lv.name)}`)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 group ${
                              isActive 
                                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-lg' 
                                : 'bg-[#F5F5F0] border-[#1A1A1A]/10 hover:border-[#C62828]/30 hover:bg-white hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className={`text-sm font-black tracking-tight ${
                                    isActive ? 'text-white' : 'text-[#1A1A1A]'
                                  }`}>
                                    Level {lv.name}
                                  </p>
                                  {isMine && (
                                    <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                                      Current
                                    </span>
                                  )}
                                </div>
                                {!isActive && (
                                  <p className="text-[10px] font-black uppercase tracking-widest text-[#C62828] mt-1">
                                    {levelData.find(l => l.key === lv.name)?.badge || 'Level'}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                                isActive ? 'text-white/60' : 'text-[#1A1A1A]/30'
                              }`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </motion.aside>

            {/* Right Main Content */}
            <motion.section variants={ci} className="lg:col-span-9">
              <div className="space-y-16">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-4xl p-4 text-sm font-bold text-[#C62828]">
                    {error}
                  </div>
                )}

                {/* Overview (code.html style) */}
                <section id="overview" className="scroll-mt-28">
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 lg:col-span-8">
                      <p className="text-[#A06B2B] font-black uppercase tracking-[0.25em] text-[10px]">
                        Course Level Details
                      </p>
                      <h1 className="mt-5 text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-[#1A1A1A] leading-[0.95] uppercase">
                        Level {details?.name ?? selected?.name ?? currentName}:{' '}
                        <span className="text-[#C62828]">{details?.badge ?? 'Level'}</span>
                      </h1>
                      <p className="mt-6 text-base sm:text-lg font-bold text-[#1A1A1A]/60 leading-relaxed max-w-3xl">
                        {details?.summary ?? selected?.description ?? 'CEFR-aligned progression with structured materials, assignments, and exams.'}
                      </p>
                      {signedInLevel && details?.name && signedInLevel.toLowerCase() === details.name.toLowerCase() && (
                        <p className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-full bg-green-50 text-green-700 border border-green-200">
                          Your current level
                        </p>
                      )}
                    </div>

                    <div className="col-span-12 lg:col-span-4 flex flex-col justify-end">
                      <div className="bg-white rounded-4xl border border-[#1A1A1A]/10 shadow-xl p-6 sm:p-7 space-y-4">
                        {[
                          { k: 'Duration', v: details?.duration ?? `${details?.assessment?.passingScore ? '—' : '—'}` },
                          { k: 'Intensity', v: details?.intensity ?? '—' },
                          { k: 'Next Cohort', v: details?.nextCohort ?? '—' },
                        ].map((x) => (
                          <div key={x.k} className="flex items-center justify-between border-b border-[#1A1A1A]/10 last:border-b-0 pb-3 last:pb-0">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/45">{x.k}</span>
                            <span className="text-sm font-black text-[#1A1A1A]/80">{x.v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Who is this for? */}
                <section className="scroll-mt-28">
                  <div className="bg-white rounded-4xl border border-[#1A1A1A]/10 shadow-xl p-8 sm:p-10">
                    <div className="flex flex-col md:flex-row gap-8 md:gap-10">
                      <div className="flex-1">
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1A1A1A]">
                          {details?.whoFor?.title ?? 'Who is this for?'}
                        </h2>
                        <p className="mt-4 text-sm sm:text-base font-bold text-[#1A1A1A]/60 leading-relaxed">
                          {details?.whoFor?.description ?? 'This level is designed for learners who are ready to move beyond basics into real confidence.'}
                        </p>

                        <div className="mt-8 space-y-4">
                          {(details?.whoFor?.bullets?.length ? details.whoFor.bullets : [
                            { title: 'Career Climbers', description: 'Professionals aiming for German-speaking environments.' },
                            { title: 'Academic Pursuits', description: 'Students preparing for academic opportunities.' },
                          ]).map((b) => (
                            <div key={b.title} className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-[#C62828] mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm font-black text-[#1A1A1A]">{b.title}</p>
                                {b.description && (
                                  <p className="mt-1 text-xs font-bold text-[#1A1A1A]/55 leading-relaxed">{b.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="w-full md:w-[320px] bg-[#F5F5F0] border border-[#1A1A1A]/10 rounded-4xl p-7 flex flex-col justify-center text-center">
                        <p className="text-[#C62828] text-3xl font-black mb-3">✓</p>
                        <p className="text-sm font-black text-[#1A1A1A]">{details?.prerequisite?.title ?? 'Prerequisite'}</p>
                        <p className="mt-2 text-xs font-bold text-[#1A1A1A]/55 leading-relaxed">
                          {details?.prerequisite?.description ?? 'Completion of the previous level or equivalent placement test score.'}
                        </p>
                        {details?.prerequisite?.ctaLabel && details?.prerequisite?.ctaHref && (
                          <button
                            onClick={() => navigate(details.prerequisite!.ctaHref!)}
                            className="mt-6 text-[#C62828] text-xs font-black uppercase tracking-widest underline decoration-[#C62828]/30 hover:decoration-[#C62828] transition-all"
                          >
                            {details.prerequisite.ctaLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Curriculum Highlights (Bento) */}
                <section id="curriculum" className="scroll-mt-28">
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-[#1A1A1A] uppercase">
                    Curriculum Highlights
                  </h2>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
                    {(details?.curriculumHighlights ?? []).slice(0, 4).map((c, idx) => {
                      const isBigDark = idx === 0;
                      const isRedBig = idx === 3;
                      if (isBigDark) {
                        return (
                          <div key={c.title} className="md:col-span-2 bg-[#1A1A1A] text-white p-10 rounded-4xl flex flex-col justify-between border border-[#1A1A1A]">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/60">
                                {c.subtitle ?? 'Module 01'}
                              </p>
                              <p className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">{c.title}</p>
                              <p className="mt-4 text-sm font-bold text-white/65 leading-relaxed max-w-xl">{c.description}</p>
                            </div>
                            {c.tags?.length ? (
                              <div className="mt-8 flex flex-wrap gap-2">
                                {c.tags.map((t) => (
                                  <span key={t} className="px-3 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      }
                      if (isRedBig) {
                        return (
                          <div key={c.title} className="md:col-span-2 bg-[#C62828] text-white p-10 rounded-4xl flex flex-col md:flex-row items-center gap-10 overflow-hidden relative border border-[#C62828]">
                            <div className="relative z-10 flex-1">
                              <p className="text-3xl sm:text-4xl font-black tracking-tight">{c.title}</p>
                              <p className="mt-4 text-sm font-bold text-white/75 leading-relaxed">{c.description}</p>
                            </div>
                            <div className="w-40 h-40 bg-white/10 rounded-full shrink-0 flex items-center justify-center">
                              <span className="text-5xl font-black">🎙</span>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-black/10 rounded-full" />
                          </div>
                        );
                      }

                      return (
                        <div key={c.title} className="bg-white rounded-4xl border border-[#1A1A1A]/10 shadow-sm p-8 flex flex-col">
                          <p className="text-3xl font-black text-[#C62828]">◆</p>
                          <p className="mt-4 text-xl font-black tracking-tight text-[#1A1A1A]">{c.title}</p>
                          <p className="mt-3 text-sm font-bold text-[#1A1A1A]/60 leading-relaxed">{c.description}</p>
                          <div className="mt-auto pt-6">
                            <div className="h-20 w-full bg-[#F5F5F0] rounded-3xl border border-dashed border-[#1A1A1A]/20 flex items-center justify-center">
                              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#1A1A1A]/45">
                                {c.tags?.[0] ?? 'Practice'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Gallery + Testimonial */}
                <section className="scroll-mt-28">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    <div className="md:col-span-7 h-[360px] sm:h-[420px] rounded-4xl overflow-hidden relative group border border-[#1A1A1A]/10 shadow-xl bg-white">
                      <img
                        alt={details?.gallery?.alt ?? details?.gallery?.title ?? 'Class experience'}
                        src={
                          details?.gallery?.image
                          || details?.heroImage
                          || defaultHeroImages[details?.key as keyof typeof defaultHeroImages]
                          || defaultHeroImages.B1
                        }
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-7 left-7">
                        <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">
                          {details?.gallery?.eyebrow ?? 'Live Experience'}
                        </p>
                        <p className="text-white text-2xl font-black tracking-tight">
                          {details?.gallery?.title ?? 'Collaborative Learning'}
                        </p>
                      </div>
                    </div>

                    <div className="md:col-span-5 bg-[#A06B2B] text-white p-9 sm:p-10 rounded-4xl border border-[#1A1A1A]/10 shadow-xl flex flex-col justify-center">
                      <p className="text-2xl sm:text-3xl font-black italic leading-tight">
                        “{details?.testimonial?.quote ?? details?.lessonShowcase?.quote?.text ?? 'Learning becomes real when you stop translating.'}”
                      </p>
                      <div className="mt-8 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-black">
                          {details?.testimonial?.initials ?? details?.testimonial?.author?.split(' ').map(s => s[0]).slice(0, 2).join('') ?? 'LK'}
                        </div>
                        <div>
                          <p className="font-black">{details?.testimonial?.author ?? details?.lessonShowcase?.quote?.author ?? 'Student'}</p>
                          <p className="text-xs font-bold text-white/70">
                            {details?.testimonial?.role ?? details?.lessonShowcase?.quote?.role ?? ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Post-level capabilities (code.html outcomes) */}
                <section id="outcomes" className="scroll-mt-28 py-12 border-y border-[#1A1A1A]/10">
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-[#1A1A1A] text-center uppercase">
                    Post-{details?.name ?? currentName} Capabilities
                  </h2>
                  <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {(details?.capabilities ?? []).slice(0, 4).map((cap, idx) => (
                      <div key={cap.title} className="space-y-3">
                        <p className="text-[#C62828] font-black text-4xl opacity-20">{String(idx + 1).padStart(2, '0')}</p>
                        <p className="text-sm font-black text-[#1A1A1A]">{cap.title}</p>
                        <p className="text-xs font-bold text-[#1A1A1A]/60 leading-relaxed">{cap.description}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Enrollment (code.html style) */}
                <section id="enroll" className="scroll-mt-28">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-5">
                      <h2 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none text-[#1A1A1A] uppercase">
                        Ready to Master <span className="text-[#C62828]">{details?.name ?? currentName}?</span>
                      </h2>
                      <p className="mt-5 text-sm sm:text-base font-bold text-[#1A1A1A]/60 leading-relaxed">
                        {details?.readyToMaster?.description ?? 'Join the next cohort. Limited seats for personalized feedback and rapid progress.'}
                      </p>

                      <div className="mt-7 space-y-4">
                        {(details?.readyToMaster?.bullets ?? []).slice(0, 4).map((b) => (
                          <div key={b} className="flex items-center gap-3 text-[#1A1A1A]">
                            <span className="w-9 h-9 rounded-2xl bg-white border border-[#1A1A1A]/10 flex items-center justify-center">
                              <GraduationCap className="w-4 h-4 text-[#C62828]" />
                            </span>
                            <span className="text-sm font-black text-[#1A1A1A]/75">{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-7">
                      <div className="bg-white rounded-4xl border border-[#1A1A1A]/10 shadow-xl p-7 sm:p-10">
                        <form
                          className="space-y-5"
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!user) navigate('/register');
                            else navigate(user.role === 'admin' ? '/admin' : '/student');
                          }}
                        >


                          <button
                            type="submit"
                            className="w-full bg-[#C62828] text-white py-5 rounded-4xl font-black text-sm uppercase tracking-[0.25em] hover:brightness-95 active:scale-[0.98] transition-all shadow-xl shadow-[#C62828]/20"
                          >
                            {user ? (user.role === 'admin' ? 'Go to Admin Dashboard' : 'Go to Student Portal') : 'Request Enrollment'}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </motion.section>
          </div>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
}
