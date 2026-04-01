import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUsers, FiSearch, FiPlus, 
  FiEdit2, FiTrash2, FiCheck, FiUser 
} from 'react-icons/fi';
import SecretarySidebar from '../../components/shared/SecretarySidebar';
import { fetchAllLevelsPublic, type Level } from '../../services/studentService';
import { fetchAllInstructors } from '../../services/adminService';
import { supabase } from '../../lib/supabase';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const ci = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } };

export default function SecretaryLevels() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [levels, setLevels] = useState<Level[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', instructor_id: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [lvls, insts] = await Promise.all([
        fetchAllLevelsPublic(),
        fetchAllInstructors()
      ]);
      setLevels(lvls);
      setInstructors(insts);
    } catch (err) {
      console.error('Failed to load levels/instructors');
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLevel) {
        const { error } = await supabase.from('levels').update(formData).eq('id', editingLevel.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('levels').insert([formData]);
        if (error) throw error;
      }
      setModalOpen(false);
      setEditingLevel(null);
      setFormData({ name: '', description: '', instructor_id: '' });
      loadData();
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure? This will affect institutional records.')) return;
    try {
      const { error } = await supabase.from('levels').delete().eq('id', id);
      if (error) throw error;
      loadData();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const filtered = levels.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex uppercase">
      <SecretarySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onToggle={() => setSidebarOpen(p => !p)} />

      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        <motion.header variants={ci} className="mb-12 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 relative z-10">
           <div className="space-y-4">
              <h2 className="text-4xl sm:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none">
                 Curriculum<br /><span className="text-[#F97316]">Infrastructure.</span>
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1A1A]/30 italic">High-level institutional tier management portal.</p>
           </div>

           <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full xl:w-auto">
              <div className="relative group flex-1 sm:w-80">
                 <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/20 w-4 h-4 group-focus-within:text-[#F97316]" />
                 <input 
                   type="text" 
                   placeholder="Resolve Level Identity..." 
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                   className="w-full bg-white border border-[#1A1A1A]/5 rounded-2xl py-4 pl-12 pr-6 font-black text-xs text-[#1A1A1A] outline-none shadow-sm focus:ring-4 focus:ring-[#F97316]/5 transition-all"
                 />
              </div>
              <button 
                onClick={() => { setEditingLevel(null); setFormData({ name: '', description: '', instructor_id: '' }); setModalOpen(true); }}
                className="bg-[#1A1A1A] text-white px-8 py-4 rounded-2xl font-black text-xs tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl hover:shadow-[#F97316]/20 transition-all hover:-translate-y-0.5 active:scale-95"
              >
                  <FiPlus className="w-4 h-4" /> Initialize Tier
              </button>
           </div>
        </motion.header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
           {loading ? (
             [1,2,3,4,5,6].map(i => <div key={i} className="h-72 bg-white rounded-[2.5rem] animate-pulse border border-[#1A1A1A]/5 shadow-sm" />)
           ) : (
             filtered.map((lvl) => (
               <motion.div 
                 key={lvl.id}
                 variants={ci}
                 className="bg-white rounded-[2.5rem] p-8 border border-[#1A1A1A]/5 shadow-sm hover:shadow-2xl transition-all group flex flex-col justify-between min-h-[320px] relative overflow-hidden"
               >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#F97316]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#F97316]/10 transition-all" />
                  
                  <div className="relative z-10">
                     <div className="flex justify-between items-start gap-4 mb-6">
                        <span className="text-4xl font-black text-[#1A1A1A]/10 group-hover:text-[#F97316]/20 transition-colors italic tracking-tighter truncate">{lvl.name}</span>
                        <div className="flex gap-2 shrink-0 relative z-20">
                           <button onClick={() => { setEditingLevel(lvl); setFormData({ name: lvl.name, description: lvl.description || '', instructor_id: lvl.instructor_id || '' }); setModalOpen(true); }} className="w-10 h-10 rounded-xl bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/40 hover:bg-[#1A1A1A] hover:text-white transition-all"><FiEdit2 className="w-4 h-4" /></button>
                           <button onClick={() => handleDelete(lvl.id)} className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#DE0002]/60 hover:bg-[#DE0002] hover:text-white transition-all"><FiTrash2 className="w-4 h-4" /></button>
                        </div>
                     </div>
                     <h3 className="text-2xl font-black text-[#1A1A1A] uppercase tracking-tighter mb-2 line-clamp-2 leading-none">{lvl.name}</h3>
                     <p className="text-[10px] font-black text-[#1A1A1A]/30 uppercase tracking-widest italic">{lvl.description || 'Institutional curriculum tier'}</p>
                  </div>

                  <div className="pt-6 border-t border-[#F5F5F0] flex items-center justify-between relative z-10">
                     <div className="flex items-center gap-2">
                        <FiUser className="w-3 h-3 text-[#D4A373]" />
                        <span className="text-[9px] font-black text-[#D4A373] tracking-widest truncate max-w-[120px] italic">
                           {lvl.instructor?.name || 'Unassigned'}
                        </span>
                     </div>
                     <div className="flex items-center gap-2 bg-[#F97316]/5 px-4 py-2 rounded-full border border-[#F97316]/10 hover:bg-[#F97316] transition-all cursor-pointer group/stat shadow-sm">
                        <FiUsers className="w-3 h-3 text-[#F97316] group-hover/stat:text-white" />
                        <span className="text-[9px] font-black text-[#F97316] group-hover/stat:text-white tracking-[0.1em]">Student Roster</span>
                     </div>
                  </div>
               </motion.div>
             ))
           )}
        </div>

        {/* Create/Edit Modal */}
        <AnimatePresence>
           {modalOpen && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalOpen(false)} className="absolute inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm" />
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[3rem] p-10 relative z-10 shadow-2xl overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-[#F97316]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                   
                   <div className="relative z-10 space-y-8">
                      <div className="space-y-2">
                         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4A373] italic">Protocol Layer</p>
                         <h3 className="text-4xl font-black text-[#1A1A1A] tracking-tighter uppercase leading-none">
                            {editingLevel ? 'Modify' : 'Initialize'}<br /><span className="text-[#F97316]">Tier.</span>
                         </h3>
                      </div>

                      <form onSubmit={handleSave} className="space-y-5">
                         <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-2">Internal Name (e.g. A1.1)</label>
                            <input 
                              type="text" required 
                              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                              className="w-full bg-[#F5F5F0] border-none rounded-2xl p-5 font-black text-sm text-[#1A1A1A] outline-none focus:ring-4 focus:ring-[#F97316]/10"
                            />
                         </div>

                         <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-2">Description / Syllabus</label>
                            <textarea 
                              rows={3}
                              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                              className="w-full bg-[#F5F5F0] border-none rounded-2xl p-5 font-black text-sm text-[#1A1A1A] outline-none focus:ring-4 focus:ring-[#F97316]/10 resize-none"
                            />
                         </div>

                         <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-2">Assign Instructor</label>
                            <select 
                              value={formData.instructor_id} onChange={e => setFormData({...formData, instructor_id: e.target.value})}
                              className="w-full bg-[#F5F5F0] border-none rounded-2xl p-5 font-black text-sm text-[#1A1A1A] outline-none focus:ring-4 focus:ring-[#F97316]/10 appearance-none"
                            >
                               <option value="">Unassigned</option>
                               {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                            </select>
                         </div>

                         <div className="pt-4 flex gap-4">
                            <button type="submit" className="flex-1 bg-[#1A1A1A] text-white py-5 rounded-2xl font-black tracking-[0.2em] uppercase text-xs shadow-xl hover:shadow-[#F97316]/20 transition-all flex items-center justify-center gap-3">
                               <FiCheck className="w-5 h-5" /> Execute
                            </button>
                            <button type="button" onClick={() => setModalOpen(false)} className="bg-[#F5F5F0] text-[#1A1A1A] px-8 py-5 rounded-2xl font-black tracking-[0.2em] uppercase text-xs">
                               Cancel
                            </button>
                         </div>
                      </form>
                   </div>
                </motion.div>
             </div>
           )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
