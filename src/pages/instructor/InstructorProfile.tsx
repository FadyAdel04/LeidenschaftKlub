import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  FiUser, FiMail, FiPhone, FiShield, FiCalendar,
  FiEdit2, FiSave, FiX, FiAlertCircle, FiCheckCircle,
  FiLoader, FiKey, FiWifi, FiUploadCloud,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import InstructorSidebar from '../../components/shared/InstructorSidebar';
import {
  fetchProfile,
  fetchAuthUser,
  updateProfile,
  uploadProfileImage,
  type Profile,
  type AuthUserInfo,
} from '../../services/studentService';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } } };
const ci = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || 'IN';
}
function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function InstructorProfile() {
  const { user, refreshUser } = useAuth();
  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [authInfo, setAuthInfo] = useState<AuthUserInfo | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  // Edit state
  const [editing,   setEditing]   = useState(false);
  const [editName,  setEditName]  = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [saveMsg,   setSaveMsg]   = useState('');
  const [saveErr,   setSaveErr]   = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      try {
        const [prof, auth] = await Promise.all([
          fetchProfile(user!.id),
          fetchAuthUser(),
        ]);
        if (cancelled) return;
        setProfile(prof);
        setAuthInfo(auth);
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
      await refreshUser(); // Force UI update 
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

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <InstructorSidebar />

      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#D4A373]/2 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

        {/* Header */}
        <motion.header variants={ci} className="mb-10 lg:mb-14 relative z-10">
          <span className="text-[#D4A373] font-black tracking-[0.5em] text-[10px] uppercase italic block mb-3">Institutional Identity</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase">
            Instructor<br /><span className="text-[#D4A373]">Profile.</span>
          </h1>
        </motion.header>

        {error && (
          <motion.div variants={ci} className="mb-8 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
            <FiAlertCircle className="w-5 h-5 text-[#F97316] shrink-0" />
            <p className="text-sm font-bold text-[#F97316]">{error}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative z-10">

          {/* Left Avatar Card */}
          <motion.div variants={ci} className="col-span-1 lg:col-span-4">
            <div className="bg-[#1A1A1A] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5 group flex flex-col items-center text-center h-full">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4A373]/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px] group-hover:bg-[#D4A373]/40 transition-all duration-1000" />

              {/* Avatar */}
              <div className="relative z-10 w-28 h-28 rounded-4xl bg-[#D4A373] flex items-center justify-center text-[#1A1A1A] font-black text-4xl shadow-2xl mb-6 group-hover:scale-105 transition-transform">
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
                  type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                    e.currentTarget.value = '';
                  }}
                />
              </label>

              {/* Name + role */}
              <div className="relative z-10 space-y-2 mb-6 w-full">
                {loading
                  ? <div className="h-7 w-40 bg-white/10 rounded-xl animate-pulse mx-auto" />
                  : <h2 className="text-2xl font-black tracking-tighter uppercase">{profile?.name || 'Unnamed'}</h2>
                }
                <p className="text-[10px] font-black uppercase tracking-widest text-[#D4A373] italic">Instructor</p>
              </div>

              {/* Provider Info */}
              {authInfo && (
                <div className="relative z-10 mt-auto w-full flex items-center gap-3 bg-white/5 rounded-2xl px-5 py-3 border border-white/5">
                  <FiWifi className="w-4 h-4 text-[#D4A373] shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Auth Provider</p>
                    <p className="text-xs font-black text-white/70 capitalize truncate">{authInfo.provider}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Details Card */}
          <motion.div variants={ci} className="col-span-1 lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-[#1A1A1A]/5 shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#D4A373]/3 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-[#D4A373]/[0.07] transition-all" />

              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#D4A373]/10 flex items-center justify-center text-[#D4A373]">
                    <FiUser className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-[#1A1A1A] tracking-tighter uppercase text-lg">Account Details</h3>
                    <p className="text-[9px] font-black text-[#1A1A1A]/30 uppercase tracking-widest italic">Teaching Record</p>
                  </div>
                </div>
                {!editing ? (
                  <button
                    onClick={() => { setEditing(true); setSaveMsg(''); setSaveErr(''); }}
                    className="flex items-center gap-2 bg-[#F5F5F0] text-[#1A1A1A] px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border border-[#1A1A1A]/5 hover:bg-[#D4A373] hover:text-white"
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
                      className="flex items-center gap-2 bg-[#D4A373] text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-md disabled:opacity-60"
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
                  <FiAlertCircle className="w-4 h-4 text-[#F97316] shrink-0" />
                  <p className="text-xs font-bold text-[#F97316]">{saveErr}</p>
                </div>
              )}

              {loading
                ? <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-[#F5F5F0] rounded-2xl animate-pulse" />)}</div>
                : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
                    <Field icon={FiUser} label="Full Name">
                      {editing
                        ? <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                            className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] outline-none transition-all" />
                        : <ReadField>{profile?.name || '—'}</ReadField>
                      }
                    </Field>
                    <Field icon={FiMail} label="Email">
                      <ReadField dim suffix="Secured">
                         {authInfo?.email || profile?.email || '—'}
                      </ReadField>
                    </Field>
                    <Field icon={FiPhone} label="Phone">
                      {editing 
                        ? <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)}
                            className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] outline-none transition-all" />
                        : <ReadField>{profile?.phone || 'Not provided'}</ReadField>
                      }
                    </Field>
                    <Field icon={FiShield} label="Role">
                      <ReadField suffix={<span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-[#D4A373]/10 text-[#D4A373] rounded-full">Instructor</span>}>
                         Instructor
                      </ReadField>
                    </Field>
                    <Field icon={FiCalendar} label="Member Since">
                       <ReadField>{formatDate(authInfo?.createdAt ?? profile?.created_at)}</ReadField>
                    </Field>
                    <div className="sm:col-span-2 space-y-2">
                       <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] ml-1">
                         <FiKey className="w-3 h-3" /> Instructor ID
                       </label>
                       <div className="px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-[10px] text-[#1A1A1A]/40 tracking-wider break-all">
                         {profile?.id}
                       </div>
                    </div>
                  </div>
                )
              }
            </div>
          </motion.div>
        </div>
      </main>
    </motion.div>
  );
}

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
