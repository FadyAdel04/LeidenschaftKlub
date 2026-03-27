import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Shield } from 'lucide-react';
import TopNavBar from '../../components/layout/TopNavBar';
import Footer from '../../components/layout/Footer';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
      <TopNavBar />
      
      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-white pt-20 px-6">
        {/* Background Animated Particles */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * 100 + "%",
                y: Math.random() * 100 + "%",
                scale: Math.random() * 0.5 + 0.2
              }}
              animate={{
                y: [null, -30, 30, -30],
                x: [null, 20, -20, 20],
              }}
              transition={{
                duration: Math.random() * 10 + 15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute w-1 h-1 bg-[#C62828]/20 rounded-full"
            />
          ))}
        </div>

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl shadow-[0_20px_40px_-12px_rgba(26,26,26,0.1)] border border-[#1A1A1A]/5 relative z-10"
        >
          <div className="space-y-8">
            <motion.div variants={containerVariants} className="space-y-3">
              <div className="flex items-center gap-3 bg-[#F5F5F0] px-4 py-1.5 rounded-full w-fit border border-[#1A1A1A]/5">
                <Shield className="w-3.5 h-3.5 text-[#C62828]" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]/60">Recovery Protocol</span>
              </div>
              <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tighter leading-none uppercase">Secret<br/><span className="text-[#C62828]">Recovery.</span></h1>
              <p className="text-sm text-[#1A1A1A]/40 font-medium leading-relaxed font-body">
                Enter your institutional ID to receive an encrypted reset link.
              </p>
            </motion.div>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-[#D4A373] ml-3">Institutional ID</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/20 w-4 h-4 group-focus-within:text-[#C62828] transition-colors" />
                  <input 
                    type="email" 
                    className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F0] border-none rounded-xl focus:ring-4 focus:ring-[#C62828]/10 transition-all text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 outline-none text-sm font-black tracking-tight" 
                    placeholder="wilhelm@example.de" 
                    required
                  />
                </div>
              </div>

              <motion.button 
                variants={containerVariants}
                type="submit" 
                className="w-full py-4 bg-[#1A1A1A] text-white rounded-xl font-black text-base hover:shadow-[0_20px_40px_rgba(26,26,26,0.2)] hover:-translate-y-1 active:scale-95 transition-all shadow-md uppercase tracking-wider group"
              >
                Send Recovery Key
              </motion.button>
            </form>

            <motion.div variants={containerVariants} className="pt-6 border-t border-[#1A1A1A]/5 text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]/40 hover:text-[#C62828] transition-all"
              >
                <ArrowLeft className="w-3 h-3" />
                Abort Protocol
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
