import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Check, AlertCircle, Loader2, Phone } from 'lucide-react';
import TopNavBar from '../../components/layout/TopNavBar';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../context/AuthContext';
import { GraduationCap, Briefcase } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState<UserRole>('student');
  const [agreed, setAgreed]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!agreed) { setError('You must accept the institutional protocol.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8) { setError('Enter a valid phone number (at least 8 digits).'); return; }
    setLoading(true);
    try {
      await register(name, email, password, phone, role);
      setSuccess('Account created! Check your email to confirm your address, then log in.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
      <TopNavBar />

      <main className="flex-1 flex flex-col lg:flex-row-reverse relative overflow-hidden bg-white pt-20 lg:pt-16">
        {/* Animated Particles */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: Math.random() * 100 + '%', y: Math.random() * 100 + '%', scale: Math.random() * 0.5 + 0.2 }}
              animate={{ y: [null, -30, 30, -30], x: [null, 20, -20, 20] }}
              transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute w-1 h-1 bg-[#C62828]/20 rounded-full"
            />
          ))}
        </div>

        {/* Visual Side */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#1A1A1A] relative overflow-hidden group items-center justify-center p-16">
          <motion.div
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-cover bg-center opacity-30 grayscale group-hover:grayscale-0 transition-all duration-1000"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&t=crop&q=80')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] via-[#1A1A1A]/80 to-transparent" />

          <div className="relative z-10 space-y-8 max-w-md">
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-full w-fit border border-white/10">
                <ShieldCheck className="w-3 h-3 text-[#D4A373]" />
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/60">Cohort Admission</span>
              </div>
              <h2 className="text-5xl font-black text-white leading-[0.9] tracking-tighter uppercase underline decoration-[#C62828] decoration-4 underline-offset-4">
                Join The.<br />Klub.
              </h2>
            </motion.div>
            <p className="text-sm font-medium text-white/40 leading-relaxed italic font-body">
              "Your journey towards linguistic excellence begins here."
            </p>
          </div>
        </div>

        {/* Form Side */}
        <div className="flex-1 p-6 md:p-8 lg:p-6 flex flex-col justify-center items-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="w-full max-w-md bg-white p-6 md:p-8 rounded-2xl shadow-[0_20px_40px_-12px_rgba(26,26,26,0.1)] border border-[#1A1A1A]/5 relative overflow-hidden group/card"
          >
            <div className="space-y-6">
              <motion.div variants={containerVariants} className="space-y-1.5 md:space-y-2">
                <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tighter leading-none uppercase">
                  Begin<br /><span className="text-[#C62828]">Admission.</span>
                </h1>
                <p className="text-[10px] md:text-xs text-[#1A1A1A]/40 font-medium leading-relaxed font-body">
                  Initiate your enrollment in our premium language cohorts.
                </p>
              </motion.div>

              {/* Error / Success banners */}
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-[#C62828] shrink-0" />
                  <p className="text-xs font-bold text-[#C62828]">{error}</p>
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
                  <Check className="w-4 h-4 text-green-600 shrink-0" />
                  <p className="text-xs font-bold text-green-700">{success}</p>
                </motion.div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <motion.div variants={containerVariants} className="space-y-4">
                  {/* Role Selection */}
                  <div className="space-y-1.5">
                    <label className="block text-[8px] font-black uppercase tracking-[0.3em] text-[#D4A373] ml-3">Membership Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          role === 'student'
                            ? 'border-[#C62828] bg-[#C62828]/5 text-[#C62828]'
                            : 'border-[#1A1A1A]/5 bg-[#F5F5F0] text-[#1A1A1A]/40 hover:border-[#1A1A1A]/10'
                        }`}
                      >
                        <GraduationCap className="w-4 h-4" />
                        <div className="text-left">
                          <p className="text-[10px] font-black uppercase tracking-tighter leading-none">Student</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('instructor')}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          role === 'instructor'
                            ? 'border-[#C62828] bg-[#C62828]/5 text-[#C62828]'
                            : 'border-[#1A1A1A]/5 bg-[#F5F5F0] text-[#1A1A1A]/40 hover:border-[#1A1A1A]/10'
                        }`}
                      >
                        <Briefcase className="w-4 h-4" />
                        <div className="text-left">
                          <p className="text-[10px] font-black uppercase tracking-tighter leading-none">Instructor</p>
                        </div>
                      </button>
                    </div>
                  </div>
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[8px] font-black uppercase tracking-[0.3em] text-[#D4A373] ml-3">Candidate Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/20 w-3.5 h-3.5 group-focus-within:text-[#C62828] transition-colors" />
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-[#F5F5F0] border-none rounded-xl focus:ring-4 focus:ring-[#C62828]/10 transition-all text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 outline-none text-sm font-black tracking-tight"
                        placeholder="Wilhelm Schmidt"
                        required
                        disabled={loading || !!success}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-[8px] font-black uppercase tracking-[0.3em] text-[#D4A373] ml-3">Phone number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/20 w-3.5 h-3.5 group-focus-within:text-[#C62828] transition-colors" />
                      <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-[#F5F5F0] border-none rounded-xl focus:ring-4 focus:ring-[#C62828]/10 transition-all text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 outline-none text-sm font-black tracking-tight"
                        placeholder="+20 15 12345678"
                        required
                        disabled={loading || !!success}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-[8px] font-black uppercase tracking-[0.3em] text-[#D4A373] ml-3">Institutional Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/20 w-3.5 h-3.5 group-focus-within:text-[#C62828] transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-[#F5F5F0] border-none rounded-xl focus:ring-4 focus:ring-[#C62828]/10 transition-all text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 outline-none text-sm font-black tracking-tight"
                        placeholder="wilhelm@example.de"
                        required
                        disabled={loading || !!success}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center px-3">
                      <label className="text-[8px] font-black uppercase tracking-[0.3em] text-[#D4A373]">Secret Key</label>
                      <span className="text-[7px] font-black uppercase tracking-[0.2em] text-[#1A1A1A]/20">Min. 8 chars</span>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/20 w-3.5 h-3.5 group-focus-within:text-[#C62828] transition-colors" />
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-[#F5F5F0] border-none rounded-xl focus:ring-4 focus:ring-[#C62828]/10 transition-all text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 outline-none text-sm font-black tracking-tight"
                        placeholder="••••••••"
                        required
                        disabled={loading || !!success}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Terms checkbox */}
                <motion.div variants={containerVariants} className="flex items-center gap-2.5 px-3">
                  <div className="relative w-3.5 h-3.5 flex items-center justify-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={e => setAgreed(e.target.checked)}
                      className="peer absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-3.5 h-3.5 bg-[#F5F5F0] border border-[#1A1A1A]/10 rounded peer-checked:bg-[#C62828] peer-checked:border-[#C62828] transition-all"></div>
                    <Check className="absolute text-white w-2.5 h-2.5 opacity-0 peer-checked:opacity-100 transition-opacity z-20 pointer-events-none" />
                  </div>
                  <span className="text-[8px] font-black text-[#1A1A1A]/30 uppercase tracking-widest leading-none">Accept Institutional Protocol</span>
                </motion.div>

                <motion.button
                  variants={containerVariants}
                  type="submit"
                  disabled={loading || !!success}
                  className="w-full py-3 bg-[#1A1A1A] text-white rounded-xl font-black text-sm hover:shadow-[0_20px_40px_rgba(26,26,26,0.2)] hover:-translate-y-0.5 active:scale-95 transition-all shadow-md uppercase tracking-wider group disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <Loader2 className="inline-block w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Initiate Enrollment
                      <ArrowRight className="inline-block ml-2 w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>
              </form>

              <motion.div variants={containerVariants} className="pt-3 md:pt-4 border-t border-[#1A1A1A]/5 text-center space-y-2 md:space-y-3">
                <p className="text-[7px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]/20">Registered Member?</p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-2 md:py-2.5 bg-[#F5F5F0] text-[#1A1A1A] rounded-xl font-black text-[9px] uppercase tracking-[0.3em] hover:bg-[#1A1A1A] hover:text-white transition-all hover:shadow-md border border-[#1A1A1A]/10"
                >
                  Access Portal
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
