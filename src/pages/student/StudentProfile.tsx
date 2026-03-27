import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  FiUser, FiMail, FiPhone, FiShield, FiCalendar,
  FiEdit2, FiSave, FiX, FiAlertCircle, FiCheckCircle,
  FiLoader, FiBookOpen, FiAward, FiKey, FiWifi, FiUploadCloud,
} from 'react-icons/fi';
import { RiMedalLine, RiFlashlightLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import StudentSidebar from '../../components/shared/StudentSidebar';
import {
  fetchProfile,
  fetchAuthUser,
  fetchResultsByStudent,
  updateProfile,
  uploadProfileImage,
  getSignedAvatarUrl,
  fetchAllLevelsPublic,
  type Profile,
  type AuthUserInfo,
  type Level,
} from '../../services/studentService';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } } };
const ci = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const FALLBACK_LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?';
}
function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function levelColor(level: string) {
  const map: Record<string, string> = { A1: '#6B7280', A2: '#D4A373', B1: '#C62828', B2: '#1A1A1A' };
  return map[level] ?? '#1A1A1A';
}
function levelLabel(level: string) {
  const map: Record<string, string> = { A1: 'Absolute Beginner', A2: 'Elementary', B1: 'Intermediate', B2: 'Upper-Intermediate' };
  return map[level] ?? level;
}

export default function StudentProfile() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [authInfo, setAuthInfo] = useState<AuthUserInfo | null>(null);
  const [results,  setResults]  = useState<{ score: number; passed: boolean; exam_id: string; taken_at: string; exams?: { title: string } }[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [levels,   setLevels]   = useState<Level[]>([]);

  // Edit state
  const [editing,   setEditing]   = useState(false);
  const [editName,  setEditName]  = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [saveMsg,   setSaveMsg]   = useState('');
  const [saveErr,   setSaveErr]   = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      try {
        // Fetch all in parallel — fetchProfile auto-creates row if missing
        const [prof, auth, ress, lvls] = await Promise.all([
          fetchProfile(user!.id),
          fetchAuthUser(),
          fetchResultsByStudent(user!.id),
          fetchAllLevelsPublic(),
        ]);
        if (cancelled) return;
        const avatarSigned = await getSignedAvatarUrl(prof.avatar_url);
        setProfile(prof);
        if (avatarSigned) {
          setProfile({ ...prof, avatar_url: avatarSigned });
        }
        setAuthInfo(auth);
        setLevels(lvls);
        setResults(ress as typeof results);
        setEditName(prof.name);
        setEditPhone(prof.phone ?? '');
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true); setSaveErr(''); setSaveMsg('');
    try {
      await updateProfile(user.id, { name: editName.trim(), phone: editPhone.trim() || null });
      setProfile(p => p ? { ...p, name: editName.trim(), phone: editPhone.trim() || null } : p);
      setSaveMsg('Profile updated successfully.');
      setEditing(false);
    } catch (e: unknown) {
      setSaveErr(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user || !profile) return;
    setUploadingAvatar(true);
    setSaveErr('');
    setSaveMsg('');
    try {
      const signedUrl = await uploadProfileImage(user.id, file);
      setProfile(prev => (prev ? { ...prev, avatar_url: signedUrl } : prev));
      setSaveMsg('Profile image updated.');
    } catch (e: unknown) {
      setSaveErr(e instanceof Error ? e.message : 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const passRate = results.length ? Math.round((results.filter(r => r.passed).length / results.length) * 100) : 0;
  const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
  const currentLevel = profile?.current_level ?? 'A1';
  const levelNames = (levels.length ? levels.map(l => l.name) : [...FALLBACK_LEVELS]) as string[];

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

        {/* Header */}
        <motion.header variants={ci} className="mb-10 lg:mb-14 relative z-10">
          <span className="text-[#C62828] font-black tracking-[0.5em] text-[10px] uppercase italic block mb-3">Institutional Identity</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase">
            My<br /><span className="text-[#C62828]">Profile.</span>
          </h1>
        </motion.header>

        {error && (
          <motion.div variants={ci} className="mb-8 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
            <FiAlertCircle className="w-5 h-5 text-[#C62828] shrink-0" />
            <p className="text-sm font-bold text-[#C62828]">{error}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative z-10">

          {/* ── Left: Avatar + Level Card ─────────────────────────────── */}
          <motion.div variants={ci} className="col-span-1 lg:col-span-4">
            <div className="bg-[#1A1A1A] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5 group flex flex-col items-center text-center h-full">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#C62828]/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px] group-hover:bg-[#C62828]/40 transition-all duration-1000" />

              {/* Avatar */}
              <div className="relative z-10 w-28 h-28 rounded-4xl bg-[#C62828] flex items-center justify-center text-white font-black text-4xl shadow-2xl shadow-[#C62828]/30 mb-6 group-hover:scale-105 transition-transform">
                {loading
                  ? <FiUser className="w-12 h-12 text-white/40 animate-pulse" />
                  : profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-4xl" />
                    : getInitials(profile?.name || profile?.email || '?')
                }
              </div>
              <label className="relative z-10 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest cursor-pointer mb-5">
                {uploadingAvatar ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiUploadCloud className="w-3.5 h-3.5" />}
                {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) void handleAvatarUpload(file);
                    e.currentTarget.value = '';
                  }}
                />
              </label>

              {/* Name + email */}
              <div className="relative z-10 space-y-2 mb-6 w-full">
                {loading
                  ? <div className="h-7 w-40 bg-white/10 rounded-xl animate-pulse mx-auto" />
                  : <h2 className="text-2xl font-black tracking-tighter uppercase">{profile?.name || 'Unnamed'}</h2>
                }
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 italic truncate px-2">
                  {authInfo?.email || profile?.email || user?.email}
                </p>
              </div>

              {/* Level badge */}
              {!loading && (
                <div className="relative z-10 inline-flex items-center gap-3 px-6 py-3 rounded-2xl border bg-white/5 backdrop-blur-md mb-8"
                  style={{ borderColor: `${levelColor(currentLevel)}50` }}>
                  <RiMedalLine className="w-5 h-5 shrink-0" style={{ color: levelColor(currentLevel) }} />
                  <div className="text-left">
                    <p className="font-black text-lg tracking-tighter" style={{ color: levelColor(currentLevel) }}>
                      Level {currentLevel}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{levelLabel(currentLevel)}</p>
                  </div>
                </div>
              )}

              {/* Level progress track */}
              <div className="relative z-10 w-full space-y-3">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 text-left mb-2">Level Pathway</p>
                <div className="flex items-center gap-1.5">
                  {levelNames.map((lv, i) => {
                    const current = levelNames.indexOf(currentLevel);
                    const safeCurrent = current === -1 ? 0 : current;
                    const done    = i < safeCurrent;
                    const active  = i === safeCurrent;
                    return (
                      <div key={lv} className="flex-1 flex flex-col items-center gap-1.5">
                        <div className={`h-2 w-full rounded-full transition-all ${done ? 'bg-[#C62828]' : active ? 'bg-[#C62828]/60 animate-pulse' : 'bg-white/10'}`} />
                        <span className={`text-[8px] font-black uppercase tracking-wider ${active ? 'text-[#D4A373]' : done ? 'text-[#C62828]/60' : 'text-white/20'}`}>{lv}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Auth provider chip */}
              {authInfo && (
                <div className="relative z-10 mt-8 w-full flex items-center gap-3 bg-white/5 rounded-2xl px-5 py-3 border border-white/5">
                  <FiWifi className="w-4 h-4 text-[#D4A373] shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Auth Provider</p>
                    <p className="text-xs font-black text-white/70 capitalize truncate">{authInfo.provider}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Right: Details + Stats ────────────────────────────────── */}
          <motion.div variants={ci} className="col-span-1 lg:col-span-8 space-y-6">

            {/* Account Details card */}
              <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-[#1A1A1A]/5 shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#C62828]/3 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-[#C62828]/[0.07] transition-all" />

              {/* Card header */}
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#C62828]/10 flex items-center justify-center text-[#C62828]">
                    <FiUser className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-[#1A1A1A] tracking-tighter uppercase text-lg">Account Details</h3>
                    <p className="text-[9px] font-black text-[#1A1A1A]/30 uppercase tracking-widest italic">Institutional Record</p>
                  </div>
                </div>
                {!editing ? (
                  <button
                    onClick={() => { setEditing(true); setSaveMsg(''); setSaveErr(''); }}
                    className="flex items-center gap-2 bg-[#F5F5F0] hover:bg-[#C62828] hover:text-white text-[#1A1A1A] px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border border-[#1A1A1A]/5"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditing(false); setEditName(profile?.name ?? ''); setEditPhone(profile?.phone ?? ''); setSaveErr(''); }}
                      className="flex items-center gap-2 bg-[#F5F5F0] text-[#1A1A1A] px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border border-[#1A1A1A]/5 hover:bg-[#1A1A1A] hover:text-white"
                    >
                      <FiX className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 bg-[#C62828] text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-md disabled:opacity-60"
                    >
                      {saving ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiSave className="w-3.5 h-3.5" />}
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {saveMsg && (
                <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 relative z-10">
                  <FiCheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  <p className="text-xs font-bold text-green-700">{saveMsg}</p>
                </div>
              )}
              {saveErr && (
                <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 relative z-10">
                  <FiAlertCircle className="w-4 h-4 text-[#C62828] shrink-0" />
                  <p className="text-xs font-bold text-[#C62828]">{saveErr}</p>
                </div>
              )}

              {loading
                ? <div className="space-y-4">{[1,2,3,4,5,6].map(i => <div key={i} className="h-14 bg-[#F5F5F0] rounded-2xl animate-pulse" />)}</div>
                : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">

                    {/* Full Name — editable */}
                    <Field icon={FiUser} label="Full Name">
                      {editing
                        ? <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                            className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] outline-none focus:ring-4 focus:ring-[#C62828]/10 border border-transparent focus:border-[#C62828]/20 transition-all" />
                        : <ReadField>{profile?.name || '—'}</ReadField>
                      }
                    </Field>

                    {/* Email — read-only, from auth */}
                    <Field icon={FiMail} label="Email Address">
                      <ReadField dim suffix="Secured">
                        {authInfo?.email || profile?.email || '—'}
                      </ReadField>
                    </Field>

                    {/* Phone — editable */}
                    <Field icon={FiPhone} label="Phone Number">
                      {editing
                        ? <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)}
                            placeholder="+1 234 567 8900"
                            className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] outline-none focus:ring-4 focus:ring-[#C62828]/10 border border-transparent focus:border-[#C62828]/20 placeholder:text-[#1A1A1A]/20 transition-all" />
                        : <ReadField>{profile?.phone || <span className="text-[#1A1A1A]/30 italic">Not provided</span>}</ReadField>
                      }
                    </Field>

                    {/* Current Level */}
                    <Field icon={FiBookOpen} label="Current Level">
                      <ReadField>
                        <span className="inline-flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-[10px] shrink-0"
                            style={{ background: levelColor(currentLevel) }}>
                            {currentLevel}
                          </span>
                          {levelLabel(currentLevel)}
                        </span>
                      </ReadField>
                    </Field>

                    {/* Role */}
                    <Field icon={FiShield} label="Role">
                      <ReadField suffix={
                        <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-[#C62828]/10 text-[#C62828] rounded-full">
                          {profile?.role ?? 'student'}
                        </span>
                      }>
                        <span className="capitalize">{profile?.role || 'student'}</span>
                      </ReadField>
                    </Field>

                    {/* Email Verified */}
                    <Field icon={FiCheckCircle} label="Email Verified">
                      <ReadField>
                        {authInfo?.emailConfirmedAt
                          ? <span className="text-green-600">✓ Verified on {formatDate(authInfo.emailConfirmedAt)}</span>
                          : <span className="text-[#C62828] italic">Not verified</span>
                        }
                      </ReadField>
                    </Field>

                    {/* Member Since — from auth */}
                    <Field icon={FiCalendar} label="Member Since">
                      <ReadField>{formatDate(authInfo?.createdAt ?? profile?.created_at)}</ReadField>
                    </Field>

                    {/* Last Sign In */}
                    <Field icon={FiWifi} label="Last Sign In">
                      <ReadField>{formatDateTime(authInfo?.lastSignInAt)}</ReadField>
                    </Field>

                    {/* Account ID — full width */}
                    <div className="sm:col-span-2 space-y-2">
                      <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] ml-1">
                        <FiKey className="w-3 h-3" /> Account ID
                      </label>
                      <div className="px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-[10px] text-[#1A1A1A]/40 tracking-wider break-all select-all">
                        {profile?.id || user?.id || '—'}
                      </div>
                    </div>
                  </div>
                )
              }
            </div>

            {/* ── Academic Stats ─────────────────────────────────────── */}
            <motion.div variants={ci} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { icon: RiFlashlightLine, label: 'Exams Taken',  value: loading ? '—' : results.length,       color: '#C62828' },
                { icon: FiAward,          label: 'Average Score', value: loading ? '—' : `${avgScore}%`,       color: '#D4A373' },
                { icon: RiMedalLine,      label: 'Pass Rate',     value: loading ? '—' : `${passRate}%`,       color: '#1A1A1A' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-4xl p-7 border border-[#1A1A1A]/5 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl opacity-5 group-hover:opacity-15 transition-all" style={{ background: s.color }} />
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 z-10 relative" style={{ background: `${s.color}18` }}>
                    <s.icon className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                  <p className="text-3xl font-black tracking-tighter text-[#1A1A1A] relative z-10">{s.value}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 mt-1 relative z-10">{s.label}</p>
                </div>
              ))}
            </motion.div>

            {/* ── Exam History ───────────────────────────────────────── */}
            {results.length > 0 && (
              <motion.div variants={ci} className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-[#1A1A1A]/5 shadow-sm">
                <h3 className="font-black text-[#1A1A1A] tracking-tighter uppercase text-lg mb-6 flex items-center gap-3">
                  <FiAward className="text-[#C62828] w-5 h-5" />
                  Exam History
                </h3>
                <div className="space-y-3">
                  {results.slice(0, 8).map((r, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-[#F5F5F0] rounded-2xl group hover:bg-[#C62828]/5 transition-all">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 ${r.passed ? 'bg-green-500' : 'bg-[#C62828]'}`}>
                        {r.passed ? '✓' : '✗'}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        {r.exams?.title && (
                          <p className="text-xs font-black text-[#1A1A1A] truncate">{r.exams.title}</p>
                        )}
                        <div className="h-1.5 bg-[#1A1A1A]/5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${r.passed ? 'bg-green-400' : 'bg-[#C62828]'}`}
                            style={{ width: `${r.score}%` }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-0.5">
                        <p className="font-black text-sm text-[#1A1A1A]">{r.score.toFixed(0)}%</p>
                        <p className="text-[8px] font-black uppercase tracking-wider text-[#1A1A1A]/30">{formatDate(r.taken_at)}</p>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full shrink-0 ${r.passed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-[#C62828]'}`}>
                        {r.passed ? 'Pass' : 'Fail'}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </motion.div>
  );
}

// ── Small reusable sub-components ─────────────────────────────────────────────

function Field({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] ml-1">
        <Icon className="w-3 h-3" /> {label}
      </label>
      {children}
    </div>
  );
}

function ReadField({ children, dim, suffix }: { children: React.ReactNode; dim?: boolean; suffix?: React.ReactNode }) {
  return (
    <div className={`px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm flex items-center justify-between gap-3 ${dim ? 'text-[#1A1A1A]/50' : 'text-[#1A1A1A]'}`}>
      <span className="truncate min-w-0">{children}</span>
      {suffix && <span className="shrink-0">{suffix}</span>}
    </div>
  );
}