import {  useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  Layers, 
  BookOpen, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  FileText,
  Volume2,
  Activity,
  Award
} from 'lucide-react';
import { Zap, ShieldCheck } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export default function LessonPage() {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-[#F5F5F0] pb-40"
    >
      {/* Dynamic Header Interaction */}
      <header className="fixed top-0 left-0 w-full h-24 bg-white/80 backdrop-blur-2xl border-b border-[#1A1A1A]/5 px-12 z-[100] flex items-center justify-between group">
        <div className="flex items-center gap-12">
          <button 
            onClick={() => navigate('/courses')}
            className="flex items-center gap-4 text-[#1A1A1A]/40 hover:text-[#C62828] font-black text-[10px] uppercase tracking-[0.5em] transition-all group/back"
          >
            <ArrowLeft className="w-5 h-5 group-hover/back:-translate-x-2 transition-transform" />
            <span>Abandon Module</span>
          </button>
          <div className="h-8 w-[1px] bg-[#1A1A1A]/5"></div>
          <div className="space-y-1">
             <h2 className="text-xl font-black text-[#1A1A1A] tracking-tighter uppercase leading-none">B2.1 • Module 14: Subjunctive II Mastery</h2>
             <p className="text-[10px] text-[#D4A373] font-black uppercase tracking-[0.4em] italic tracking-tighter">Linguistic Structural Logic</p>
          </div>
        </div>

        <div className="flex items-center gap-10">
           <div className="flex items-center gap-4 bg-[#F5F5F0] px-6 py-2 rounded-full border border-[#1A1A1A]/5">
              <Clock className="text-[#C62828] w-5 h-5 shadow-sm" />
              <span className="text-[10px] font-black text-[#1A1A1A]/40 uppercase tracking-widest leading-none">42:12 Time Remaining</span>
           </div>
           <button className="bg-[#1A1A1A] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-[#C62828] transition-all shadow-2xl active:scale-95">
              Checkpoint Status
           </button>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto pt-48 px-12 lg:px-24 grid grid-cols-12 gap-16 relative z-10">
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-[#C62828]/[0.02] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2 -z-0"></div>
        
        {/* Primary Learning Canvas */}
        <div className="col-span-12 lg:col-span-8 space-y-16">
          <motion.section variants={containerVariants} className="bg-white rounded-[4rem] overflow-hidden shadow-2xl border border-[#1A1A1A]/5 group relative h-[600px] flex items-center justify-center cursor-pointer">
             <img src="https://images.unsplash.com/photo-1541339907198-e08756eaa539?auto=format&t=crop&q=80" className="w-full h-full object-cover grayscale opacity-20 filter blur-[2px] scale-110 group-hover:scale-100 group-hover:blur-0 group-hover:grayscale-0 transition-all duration-1000" />
             <div className="absolute inset-0 bg-[#C62828]/10 group-hover:bg-transparent transition-all duration-700"></div>
             <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent"></div>
             
             <button className="relative z-10 w-24 h-24 bg-white text-[#C62828] rounded-full flex items-center justify-center shadow-[0_40px_80px_rgba(255,255,255,0.3)] hover:scale-110 transition-transform active:scale-95 group/play border-4 border-[#C62828]/10">
                <Play className="w-8 h-8 ml-1 shadow-sm group-hover:scale-125 transition-transform" />
             </button>

             <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end">
                <div className="space-y-4">
                   <h3 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Lecture 14.2: Hypothetical States</h3>
                   <div className="flex gap-4 items-center">
                      <Layers className="text-[#C62828] w-5 h-5 shadow-sm" />
                       <span className="text-[10px] text-white/60 font-black uppercase tracking-widest italic tracking-tighter">Phase 02 / 04 Visualization</span>
                   </div>
                </div>
                <div className="flex gap-4">
                   <button className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-[#C62828] transition-all shadow-lg active:scale-95">
                      <Volume2 className="w-5 h-5 shadow-sm" />
                   </button>
                   <button className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-[#C62828] transition-all shadow-lg active:scale-95">
                      <Activity className="w-5 h-5 shadow-sm" />
                   </button>
                </div>
             </div>
          </motion.section>

          <motion.section variants={containerVariants} className="space-y-12">
             <div className="flex items-center gap-10 mb-8">
                <h4 className="text-3xl font-black tracking-tighter uppercase whitespace-nowrap">Institutional Discourse</h4>
                <div className="h-[2px] flex-1 bg-[#1A1A1A]/5 rounded-full"></div>
                <div className="flex gap-4">
                   <span className="w-3 h-3 rounded-full bg-[#D4A373] shadow-sm animate-pulse"></span>
                   <span className="w-3 h-3 rounded-full bg-[#C62828] shadow-sm"></span>
                </div>
             </div>
             <div className="bg-white p-12 lg:p-20 rounded-[4rem] shadow-2xl border border-[#1A1A1A]/5 relative overflow-hidden group">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#C62828]/[0.02] rounded-full blur-3xl -z-0"></div>
                <div className="space-y-12 relative z-10">
                   <p className="text-2xl font-medium text-[#1A1A1A]/80 leading-relaxed font-body italic underline decoration-[#C62828]/10 underline-offset-8">
                      The Subjunctive II (*Konjunktiv II*) is the architecture of possibility. In high-level German discourse, it is used to denote polite requests, hypothetical outcomes, and unreal conditions. Mastering this structure is the hallmark of near-native prociency.
                   </p>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="p-10 bg-[#F5F5F0] rounded-[3rem] border-l-[10px] border-[#C62828] space-y-4 hover:shadow-xl transition-all shadow-sm">
                        <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-[0.4em] italic shadow-sm">Direct Protocol</span>
                        <p className="text-xl font-black text-[#1A1A1A] uppercase tracking-tighter leading-tight italic opacity-40">"Ich habe Zeit." (I have time.)</p>
                      </div>
                      <div className="p-10 bg-[#1A1A1A] rounded-[3rem] border-l-[10px] border-[#D4A373] space-y-4 shadow-2xl hover:scale-105 transition-transform group">
                        <span className="text-[10px] font-black text-[#D4A373] uppercase tracking-[0.4em] italic shadow-sm">Subjunctive State</span>
                        <p className="text-xl font-black text-white uppercase tracking-tighter leading-tight italic">"Ich hätte Zeit."<br/><span className="text-[#C62828]">(I would have time.)</span></p>
                      </div>
                   </div>

                   <p className="text-lg font-medium text-[#1A1A1A]/50 leading-relaxed font-body py-10 border-t border-[#1A1A1A]/5 italic">
                      Note the vowel mutation (*Umlaut*) which signies the shift from objective reality to subjective possibility. This is a foundational phonetic logic in the Germanic linguistic engine.
                   </p>
                </div>
             </div>
          </motion.section>
        </div>

        {/* Sidebar Navigation: Module Matrix */}
        <div className="col-span-12 lg:col-span-4 space-y-12">
           <motion.div variants={containerVariants} className="bg-white p-12 rounded-[4rem] shadow-2xl border border-[#1A1A1A]/5 space-y-12 group hover:shadow-xl transition-all">
              <div className="flex justify-between items-center">
                 <h4 className="text-xl font-black uppercase tracking-tighter text-[#1A1A1A]">Module Matrix</h4>
                 <Zap className="text-[#C62828] w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-6">
                 {[
                   { title: 'Foundational Theory', time: '12:00', icon: BookOpen, status: 'complete' },
                   { title: 'Hypothetical States', time: '08:45', icon: Play, status: 'active' },
                   { title: 'Nuance & Politesse', time: '14:20', icon: Award, status: 'locked' },
                   { title: 'Case Study: The Passive', time: '22:00', icon: FileText, status: 'locked' }
                 ].map((item, i) => (
                   <div key={i} className={`p-6 rounded-[2.5rem] flex items-center justify-between transition-all group/item shadow-sm cursor-pointer ${item.status === 'active' ? 'bg-[#1A1A1A] text-white shadow-2xl -translate-x-2' : 'bg-[#F5F5F0] text-[#1A1A1A]/20 hover:bg-white border border-[#1A1A1A]/5'}`}>
                      <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.status === 'active' ? 'bg-[#C62828] text-white' : item.status === 'complete' ? 'bg-green-100 text-green-600' : 'bg-white text-stone-300'}`}>
                           {item.status === 'complete' ? <CheckCircle className="w-5 h-5 shadow-sm" /> : <item.icon className="w-5 h-5 shadow-sm" />}
                        </div>
                        <div>
                           <p className={`text-xs font-black uppercase tracking-widest ${item.status === 'active' ? 'text-white' : 'text-[#1A1A1A]/60'}`}>{item.title}</p>
                           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4A373] mt-1 italic tracking-tighter">{item.time} Duration</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-6 h-6 transition-all ${item.status === 'active' ? 'text-[#C62828] translate-x-1' : 'opacity-0'}`} />
                   </div>
                 ))}
              </div>
           </motion.div>

           <motion.div variants={containerVariants} className="bg-[#1A1A1A] p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group hover:shadow-[0_40px_80px_rgba(26,26,26,0.3)] transition-all flex flex-col justify-between h-96">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C62828]/20 rounded-full blur-2xl group-hover:bg-[#C62828]/40 transition-all duration-700"></div>
              <div className="space-y-6 relative z-10">
                 <ShieldCheck className="w-14 h-14 text-[#D4A373] mb-4 opacity-80 shadow-sm" />
                 <h4 className="text-3xl font-black tracking-tight leading-none uppercase">Institutional<br/>Checkpoint.</h4>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic mt-4 leading-relaxed tracking-tighter shadow-sm">Secure your progress before advancing to the next linguistic quadrant.</p>
              </div>
              <button className="w-full py-6 bg-[#C62828] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-[#a20513] transition-all relative overflow-hidden group/btn mt-10 shadow-lg">
                 <span className="relative z-10">Verify Module Phase</span>
                 <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform"></div>
              </button>
           </motion.div>
        </div>
      </main>

      {/* Persistence Bar: Contextual Controls */}
      <footer className="fixed bottom-0 left-0 w-full h-32 bg-white/95 backdrop-blur-3xl border-t border-[#1A1A1A]/5 px-12 lg:px-24 flex items-center justify-between z-[100] shadow-2xl">
         <div className="flex items-center gap-12">
            <div className="flex flex-col gap-2">
               <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4A373] italic">Global Progress 02/04</span>
               <div className="h-2 w-80 bg-[#F5F5F0] rounded-full overflow-hidden border border-[#1A1A1A]/5 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '45%' }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-[#C62828] rounded-full shadow-[0_0_12px_rgba(198,40,40,0.4)]"
                  ></motion.div>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-12">
            <div className="flex gap-4">
               <button className="w-16 h-16 rounded-2xl bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/40 hover:bg-[#C62828] hover:text-white transition-all shadow-sm active:scale-95 group/prev">
                  <ChevronLeft className="w-8 h-8 group-hover/prev:-translate-x-1 transition-transform" />
               </button>
               <button className="w-16 h-16 rounded-2xl bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/40 hover:bg-[#C62828] hover:text-white transition-all shadow-sm active:scale-95 group/next">
                  <ChevronRight className="w-8 h-8 group-hover/next:translate-x-1 transition-transform" />
               </button>
            </div>
            <button className="px-16 py-6 bg-[#1A1A1A] text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-[#C62828] transition-all active:scale-[0.98] shadow-lg">
               Finalize Phase
            </button>
         </div>
      </footer>
    </motion.div>
  );
}
