import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, CheckCircle2, GraduationCap } from 'lucide-react';
import { useAutoTranslate } from 'react-autolocalise';
import TopNavBar from '../../components/layout/TopNavBar';
import Footer from '../../components/layout/Footer';

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

interface LevelDetail {
  key: string;
  name: string;
  badge: string;
  headline: string;
  summary: string;
  duration: string;
  intensity: string;
  assessment?: { passingScore: number };
  whoFor?: {
    title: string;
    description: string;
    bullets: { title: string; description?: string }[];
  };
  prerequisite?: {
    title: string;
    description: string;
    ctaLabel?: string;
    ctaHref?: string;
  };
  curriculumHighlights?: { title: string; subtitle?: string; description: string; tags?: string[] }[];
  gallery?: { image?: string; alt?: string; title?: string; eyebrow?: string };
  testimonial?: { quote?: string; initials?: string; author?: string; role?: string };
  capabilities?: { title: string; description: string }[];
  readyToMaster?: { description: string; bullets: string[] };
}

const levelsMetadata = levelData as LevelDetail[];

export default function LevelDetailsPage() {
  const { level } = useParams<{ level: string }>();
  const navigate = useNavigate();
  const { t } = useAutoTranslate();
  const { user } = useAuth();
  const currentLang = localStorage.getItem('selected_language') || 'en';

  const [signedInLevel, setSignedInLevel] = useState<string | null>(null);
  const currentName = useMemo(() => normalizeLevelSlug(level ?? ''), [level]);

  // Get level data from JSON
  const details = useMemo(() => {
    const found = levelsMetadata.find(l => l.key.toLowerCase() === currentName.toLowerCase());
    return found || null;
  }, [currentName]);

  const selected = details;

  const otherLevels = useMemo(() => {
    const sorted = [...levelsMetadata].sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, []);

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
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4A373]">{t('Navigation')}</p>
                    <p className="mt-2 text-xl font-black tracking-tight text-[#1A1A1A]">{t('Levels')}</p>
                    <p className="mt-1 text-xs font-bold text-[#1A1A1A]/50">{t('Jump to any level')}</p>
                  </div>

                  <div className="p-4 space-y-2">
                    {otherLevels.map((lv) => {
                      const isActive = selected?.key === lv.key;
                      const isMine = signedInLevel && signedInLevel.toLowerCase() === lv.name.toLowerCase();
                      const levelMeta = lv;
                      return (
                        <button
                          key={lv.key}
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
                                  {t('Level')} {lv.name}
                                </p>
                                {isMine && (
                                  <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                                    {t('Current')}
                                  </span>
                                )}
                              </div>
                              {!isActive && (
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#C62828] mt-1">
                                  {t(
                                    (lv as any).translations?.[currentLang]?.badge || 
                                    levelMeta?.badge || 
                                    'Level'
                                  )}
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
                </div>
              </div>
            </motion.aside>

            {/* Right Main Content */}
            <motion.section variants={ci} className="lg:col-span-9">
              <div className="space-y-16">
                {/* Overview */}
                <section id="overview" className="scroll-mt-28">
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 lg:col-span-8">
                      <p className="text-[#A06B2B] font-black uppercase tracking-[0.25em] text-[10px]">
                        {t('Course Level Details')}
                      </p>
                      <h1 className="mt-5 text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-[#1A1A1A] leading-[0.95] uppercase">
                        {t('Level')} {details?.name ?? selected?.name ?? currentName}:{' '}
                        <span className="text-[#C62828]">
                          {t(
                            (details as any)?.translations?.[currentLang]?.headline || 
                            details?.headline || 
                            details?.badge || 
                            'Level'
                          )}
                        </span>
                      </h1>
                      <p className="mt-6 text-base sm:text-lg font-bold text-[#1A1A1A]/60 leading-relaxed max-w-3xl">
                        {t(
                          (details as any)?.translations?.[currentLang]?.summary || 
                          details?.summary || 
                          'CEFR-aligned progression with structured materials, assignments, and exams.'
                        )}
                      </p>
                      {signedInLevel && details?.name && signedInLevel.toLowerCase() === details.name.toLowerCase() && (
                        <p className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-full bg-green-50 text-green-700 border border-green-200">
                          {t('Your current level')}
                        </p>
                      )}
                    </div>

                    <div className="col-span-12 lg:col-span-4 flex flex-col justify-end">
                      <div className="bg-white rounded-4xl border border-[#1A1A1A]/10 shadow-xl p-6 sm:p-7 space-y-4">
                        {[
                          { 
                            k: t('Duration'), 
                            v: t((details as any)?.translations?.[currentLang]?.duration || details?.duration || '—') 
                          },
                          { 
                            k: t('Intensity'), 
                            v: t((details as any)?.translations?.[currentLang]?.intensity || details?.intensity || '—') 
                          },
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
                          {t(details?.whoFor?.title ?? 'Who is this for?')}
                        </h2>
                        <p className="mt-4 text-sm sm:text-base font-bold text-[#1A1A1A]/60 leading-relaxed">
                          {t(details?.whoFor?.description ?? 'This level is designed for learners who are ready to move beyond basics into real confidence.')}
                        </p>

                        <div className="mt-8 space-y-4">
                          {(details?.whoFor?.bullets?.length ? details.whoFor.bullets : [
                            { title: t('Goal Orientation'), description: t('Students aiming for clear, measurable progress.') },
                            { title: t('Interactive Learning'), description: t('Those who thrive in communicative environments.') },
                          ]).map((b: { title: string; description?: string }) => (
                            <div key={b.title} className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-[#C62828] mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm font-black text-[#1A1A1A]">{t(b.title)}</p>
                                {b.description && (
                                  <p className="mt-1 text-xs font-bold text-[#1A1A1A]/55 leading-relaxed">{t(b.description)}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="w-full md:w-[320px] bg-[#F5F5F0] border border-[#1A1A1A]/10 rounded-4xl p-7 flex flex-col justify-center text-center">
                        <p className="text-[#C62828] text-3xl font-black mb-3">✓</p>
                        <p className="text-sm font-black text-[#1A1A1A]">{t(details?.prerequisite?.title ?? 'Prerequisite')}</p>
                        <p className="mt-2 text-xs font-bold text-[#1A1A1A]/55 leading-relaxed">
                          {t(details?.prerequisite?.description ?? 'Completion of the previous level or equivalent placement test score.')}
                        </p>
                        {details?.prerequisite?.ctaLabel && details?.prerequisite?.ctaHref && (
                          <button
                            onClick={() => navigate(details.prerequisite!.ctaHref!)}
                            className="mt-6 text-[#C62828] text-xs font-black uppercase tracking-widest underline decoration-[#C62828]/30 hover:decoration-[#C62828] transition-all"
                          >
                            {t(details.prerequisite.ctaLabel)}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Curriculum Highlights */}
                <section id="curriculum" className="scroll-mt-28">
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-[#1A1A1A] uppercase">
                    {t('Curriculum Highlights')}
                  </h2>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
                    {(details?.curriculumHighlights?.length ? details.curriculumHighlights : [
                      { title: t('Core Grammar'), subtitle: t('Module 01'), description: t('Deep dive into structural foundations and sentence patterns.'), tags: [t('Grammar'), t('Structure')] },
                      { title: t('Conversation'), subtitle: t('Module 02'), description: t('Real-world speaking practice with certified instructors.'), tags: [t('Speaking'), t('Interactive')] },
                      { title: t('Exam Prep'), subtitle: t('Module 03'), description: t('Mock tests and strategies to master official exams.'), tags: [t('Exam'), t('Strategy')] }
                    ]).slice(0, 4).map((c, idx) => {
                      const isBigDark = idx === 0;
                      const isRedBig = idx === 3;
                      if (isBigDark) {
                        return (
                          <div key={c.title} className="md:col-span-2 bg-[#1A1A1A] text-white p-10 rounded-4xl flex flex-col justify-between border border-[#1A1A1A]">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/60">
                                {t(c.subtitle ?? 'Module 01')}
                              </p>
                              <p className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">{t(c.title)}</p>
                              <p className="mt-4 text-sm font-bold text-white/65 leading-relaxed max-w-xl">{t(c.description)}</p>
                            </div>
                            {c.tags?.length ? (
                              <div className="mt-8 flex flex-wrap gap-2">
                                {c.tags.map((tag) => (
                                  <span key={tag} className="px-3 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    {t(tag)}
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
                              <p className="text-3xl sm:text-4xl font-black tracking-tight">{t(c.title)}</p>
                              <p className="mt-4 text-sm font-bold text-white/75 leading-relaxed">{t(c.description)}</p>
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
                          <p className="mt-4 text-xl font-black tracking-tight text-[#1A1A1A]">{t(c.title)}</p>
                          <p className="mt-3 text-sm font-bold text-[#1A1A1A]/60 leading-relaxed">{t(c.description)}</p>
                          <div className="mt-auto pt-6">
                            <div className="h-20 w-full bg-[#F5F5F0] rounded-3xl border border-dashed border-[#1A1A1A]/20 flex items-center justify-center">
                              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#1A1A1A]/45">
                                {t(c.tags?.[0] ?? 'Practice')}
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
                        alt={t(details?.gallery?.alt ?? details?.gallery?.title ?? 'Class experience')}
                        src={
                          details?.gallery?.image
                          || defaultHeroImages[details?.key.substring(0, 2) as keyof typeof defaultHeroImages]
                          || defaultHeroImages.B1
                        }
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-7 left-7">
                        <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">
                          {t(details?.gallery?.eyebrow ?? 'Live Experience')}
                        </p>
                        <p className="text-white text-2xl font-black tracking-tight">
                          {t(details?.gallery?.title ?? 'Collaborative Learning')}
                        </p>
                      </div>
                    </div>
                    <div className="md:col-span-5 bg-[#A06B2B] text-white p-9 sm:p-10 rounded-4xl border border-[#1A1A1A]/10 shadow-xl flex flex-col justify-center">
                      <p className="text-2xl sm:text-3xl font-black italic leading-tight">
                        “{t(details?.testimonial?.quote ?? 'Learning becomes real when you stop translating and start thinking.')}”
                      </p>
                      <div className="mt-8 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-black">
                          {t(details?.testimonial?.initials ?? 'LK')}
                        </div>
                        <div>
                          <p className="font-black">{t(details?.testimonial?.author ?? 'Alumni')}</p>
                          <p className="text-xs font-bold text-white/70">
                            {t(details?.testimonial?.role ?? 'Level Completer')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Post-level capabilities */}
                <section id="outcomes" className="scroll-mt-28 py-12 border-y border-[#1A1A1A]/10">
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-[#1A1A1A] text-center uppercase">
                    {t('Post-')} {details?.name ?? currentName} {t('Capabilities')}
                  </h2>
                  <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {(details?.capabilities?.length ? details.capabilities : [
                      { title: t('Independent Interaction'), description: t('Navigate common social and work scenarios without help.') },
                      { title: t('Detailed Expression'), description: t('Articulate complex thoughts and structured opinions.') },
                      { title: t('Extended Reading'), description: t('Understand longer articles and reports on familiar subjects.') },
                      { title: t('Storytelling'), description: t('Recount events and experiences with narrative coherence.') }
                    ]).slice(0, 4).map((cap, idx) => (
                      <div key={cap.title} className="space-y-3">
                        <p className="text-[#C62828] font-black text-4xl opacity-20">{String(idx + 1).padStart(2, '0')}</p>
                        <p className="text-sm font-black text-[#1A1A1A]">{t(cap.title)}</p>
                        <p className="text-xs font-bold text-[#1A1A1A]/60 leading-relaxed">{t(cap.description)}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Enrollment */}
                <section id="enroll" className="scroll-mt-28">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-5">
                      <h2 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none text-[#1A1A1A] uppercase">
                        {t('Ready to Master')} <span className="text-[#C62828]">{details?.name ?? currentName}?</span>
                      </h2>
                      <p className="mt-5 text-sm sm:text-base font-bold text-[#1A1A1A]/60 leading-relaxed">
                        {t(details?.readyToMaster?.description ?? 'Join the next cohort. Limited seats for personalized feedback and rapid progress.')}
                      </p>

                      <div className="mt-7 space-y-4">
                        {(details?.readyToMaster?.bullets?.length ? details.readyToMaster.bullets : [
                          t('Structured CEFR progression'),
                          t('Certified native instructors'),
                          t('Interactive community access')
                        ]).slice(0, 4).map((bullet) => (
                          <div key={bullet} className="flex items-center gap-3 text-[#1A1A1A]">
                            <span className="w-9 h-9 rounded-2xl bg-white border border-[#1A1A1A]/10 flex items-center justify-center">
                              <GraduationCap className="w-4 h-4 text-[#C62828]" />
                            </span>
                            <span className="text-sm font-black text-[#1A1A1A]/75">{t(bullet)}</span>
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
                            {user ? (user.role === 'admin' ? t('Go to Admin Dashboard') : t('Go to Student Portal')) : t('Request Enrollment')}
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
