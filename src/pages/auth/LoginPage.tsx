import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Shield, Check, AlertCircle, Loader2 } from 'lucide-react';
import TopNavBar from '../../components/layout/TopNavBar';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../context/AuthContext';
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'instructor') {
        navigate('/instructor');
      } else {
        navigate('/student');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
      <TopNavBar />

      <main className="flex-1 flex flex-col lg:flex-row relative overflow-hidden bg-white pt-20 lg:pt-16">
        {/* Background Animated Particles */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: `${(i / 6) * 100}%`,
                y: `${(i % 3) * 33}%`,
                scale: 0.4,
              }}
              animate={{ y: [null, -30, 30, -30], x: [null, 20, -20, 20] }}
              transition={{ duration: 20 + i * 3, repeat: Infinity, ease: 'easeInOut' }}
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
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&t=crop&q=80')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] via-[#1A1A1A]/80 to-transparent" />

          <div className="relative z-10 space-y-8 max-w-md">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-full w-fit border border-white/10">
                <Shield className="w-3 h-3 text-[#D4A373]" />
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/60">Institutional Access</span>
              </div>
              <p role="heading" aria-level={2} className="text-5xl font-black text-white leading-[0.9] tracking-tighter uppercase underline decoration-[#C62828] decoration-4 underline-offset-4">
                Die<br />Portal.
              </p>
            </motion.div>
            <p className="text-sm font-medium text-white/40 leading-relaxed italic font-body">
              "Enter the domain of precision and linguistic architecture."
            </p>
          </div>
        </div>

        {/* Form Side */}
        <div className="flex-1 p-6 md:p-8 lg:p-6 flex flex-col justify-center items-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl shadow-[0_20px_40px_-12px_rgba(26,26,26,0.1)] border border-[#1A1A1A]/5 relative overflow-hidden group/card"
          >
            <div className="space-y-8">
              <motion.div variants={containerVariants} className="space-y-2 md:space-y-3">
                <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] tracking-tighter leading-none uppercase">
                  Identity<br /><span className="text-[#C62828]">Verication.</span>
                </h1>
                <p className="text-xs md:text-sm text-[#1A1A1A]/40 font-medium leading-relaxed font-body">
                  Synchronize your credentials to access the institutional learning modules.
                </p>
              </motion.div>

              {/* Error Banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3"
                >
                  <AlertCircle className="w-4 h-4 text-[#C62828] shrink-0" />
                  <p className="text-xs font-bold text-[#C62828]">{error}</p>
                </motion.div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <motion.div variants={containerVariants} className="space-y-5">
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-[#D4A373] ml-3">
                      Institutional ID
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/20 w-4 h-4 group-focus-within:text-[#C62828] transition-colors" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F0] border-none rounded-xl focus:ring-4 focus:ring-[#C62828]/10 transition-all text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 outline-none text-sm font-black tracking-tight"
                        placeholder="wilhelm@example.de"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>


                  {/* Password */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-3">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-[#D4A373]">Secret Key</label>
                      <Link to="/forgot-password" className="text-[8px] font-black uppercase tracking-[0.2em] text-[#1A1A1A]/40 hover:text-[#C62828] transition-colors">
                        Recovery
                      </Link>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/20 w-4 h-4 group-focus-within:text-[#C62828] transition-colors" />
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F0] border-none rounded-xl focus:ring-4 focus:ring-[#C62828]/10 transition-all text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 outline-none text-sm font-black tracking-tight"
                        placeholder="••••••••"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Remember me */}
                <motion.div variants={containerVariants} className="flex items-center gap-3 px-3">
                  <div className="relative w-4 h-4 flex items-center justify-center cursor-pointer group">
                    <input type="checkbox" className="peer absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className="w-4 h-4 bg-[#F5F5F0] border border-[#1A1A1A]/10 rounded peer-checked:bg-[#C62828] peer-checked:border-[#C62828] transition-all"></div>
                    <Check className="absolute text-white w-3 h-3 opacity-0 peer-checked:opacity-100 transition-opacity z-20 pointer-events-none" />
                  </div>
                  <span className="text-[9px] font-black text-[#1A1A1A]/30 uppercase tracking-widest leading-none">Remember me</span>
                </motion.div>

                <motion.button
                  variants={containerVariants}
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#C62828] text-white rounded-xl font-black text-base hover:shadow-[0_20px_40px_rgba(198,40,40,0.2)] hover:-translate-y-1 active:scale-95 transition-all shadow-md uppercase tracking-wider group disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <Loader2 className="inline-block w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Verify Identity
                      <ArrowRight className="inline-block ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>
              </form>

              <motion.div variants={containerVariants} className="pt-4 md:pt-6 border-t border-[#1A1A1A]/5 text-center space-y-3 md:space-y-4">
                <p className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]/20">New Institutional Member?</p>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-3 md:py-3.5 bg-[#1A1A1A] text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.3em] hover:bg-[#C62828] transition-all hover:shadow-md"
                >
                  Apply for Admission
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
