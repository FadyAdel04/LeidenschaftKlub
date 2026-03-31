import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { BookOpen, Search, AlertCircle, PlayCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import StudentSidebar from '../../components/shared/StudentSidebar';
import MaterialPreviewModal from '../../components/shared/MaterialPreviewModal';
import {
  fetchProfile, fetchMyAssignedMaterials,
  type Profile, type Material,
} from '../../services/studentService';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } } };
const ci = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function StudentCourses() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile,   setProfile]   = useState<Profile | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filtered,  setFiltered]  = useState<Material[]>([]);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

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
        setProfile(prof);
        const mats = await fetchMyAssignedMaterials(user!.id);
        if (cancelled) return;
        setMaterials(mats);
        setFiltered(mats);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load materials');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(materials.filter(m => m.title.toLowerCase().includes(q)));
  }, [search, materials]);

  const getType = (url: string) => {
    const clean = url.split('?')[0].toLowerCase();
    if (clean.endsWith('.pdf')) return 'PDF';
    if (clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.ogg') || clean.endsWith('.mov')) return 'Video';
    if (clean.endsWith('.mp3') || clean.endsWith('.wav') || clean.endsWith('.m4a')) return 'Audio';
    return 'file';
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <StudentSidebar profile={profile} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onToggle={() => setSidebarOpen(p => !p)} />

      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#F97316]/[0.02] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

        {/* Header */}
        <motion.header variants={ci} className="mb-10 lg:mb-16 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 relative z-10">
          <div className="space-y-3">
            <span className="text-[#F97316] font-black tracking-[0.5em] text-[10px] uppercase italic">
              Level {profile?.current_level ?? '—'} Curriculum
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase">
              My<br /><span className="text-[#F97316]">Materials.</span>
            </h1>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/20 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search materials…"
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#1A1A1A]/5 rounded-2xl font-black text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 outline-none focus:ring-4 focus:ring-[#F97316]/10 shadow-sm transition-all"
            />
          </div>
        </motion.header>

        {/* Error */}
        {error && (
          <motion.div variants={ci} className="mb-8 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
            <AlertCircle className="w-5 h-5 text-[#F97316] shrink-0" />
            <p className="text-sm font-bold text-[#F97316]">{error}</p>
          </motion.div>
        )}

        {/* Stats strip */}
        <motion.div variants={ci} className="grid grid-cols-3 gap-4 mb-10 relative z-10">
          {[
            { label: 'Total Materials', val: loading ? '—' : materials.length },
            { label: 'Level',           val: profile?.current_level ?? '—' },
            { label: 'Shown',           val: loading ? '—' : filtered.length },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-[#1A1A1A]/5 shadow-sm text-center">
              <p className="text-2xl font-black text-[#1A1A1A] tracking-tighter">{s.val}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Materials Grid */}
        <div className="relative z-10">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map((i: number) => (
                <div key={i} className="h-52 bg-white rounded-[2rem] border border-[#1A1A1A]/5 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 rounded-3xl bg-[#F5F5F0] flex items-center justify-center mb-6">
                <BookOpen className="w-10 h-10 text-[#1A1A1A]/20" />
              </div>
              <p className="text-xl font-black text-[#1A1A1A]/30 uppercase tracking-tight">
                {search ? 'No materials match your search.' : 'No materials uploaded yet.'}
              </p>
              <p className="text-sm text-[#1A1A1A]/20 font-medium mt-2 italic">
                {search ? 'Try a different keyword.' : 'Check back soon!'}
              </p>
            </div>
          ) : (
            <motion.div variants={cv} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((m: Material, i: number) => (
                <motion.div
                  key={m.id}
                  variants={ci}
                  whileHover={{ y: -6 }}
                  className="bg-white rounded-[2rem] p-8 border border-[#1A1A1A]/5 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#F97316]/[0.03] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-[#F97316]/10 transition-all" />
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-[#F97316]/10 flex items-center justify-center mb-6 group-hover:bg-[#F97316] transition-all">
                      <BookOpen className="w-7 h-7 text-[#F97316] group-hover:text-white transition-colors" />
                    </div>

                    {/* Material number */}
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] mb-2 italic">
                      Material {String(i + 1).padStart(2, '0')}
                    </p>

                    {/* Title */}
                    <h3 className="text-lg font-black text-[#1A1A1A] tracking-tighter uppercase leading-tight mb-4 group-hover:text-[#F97316] transition-colors line-clamp-2">
                      {m.title}
                    </h3>

                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/20 mb-6">
                      {new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>

                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#F5F5F0] text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/60 mb-4">
                      {getType(m.file_url)}
                    </span>

                    <button
                      type="button"
                      onClick={() => { setSelectedMaterial(m); setPreviewOpen(true); }}
                      className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#F97316] transition-all shadow-md active:scale-95"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Preview Material
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <MaterialPreviewModal
        open={previewOpen}
        material={selectedMaterial ? {
          ...selectedMaterial,
          watermarkText: `${profile?.name ?? 'Student'} ${profile?.email ?? ''}`.trim(),
        } : null}
        onClose={() => { setPreviewOpen(false); setSelectedMaterial(null); }}
      />
    </motion.div>
  );
}
