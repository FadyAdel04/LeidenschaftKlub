import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { Layers, Users, CheckCircle, Plus, Edit2, Trash2, X, Save, Loader, AlertCircle } from 'lucide-react';
import AdminSidebar from '../../components/shared/AdminSidebar';
import { fetchAllLevels, fetchAllStudents, createLevel, updateLevel, deleteLevel, type Level, type Profile } from '../../services/adminService';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const ci = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function AdminLevels() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = usePersistentState('admin_level_name', '');
  const [description, setDescription] = usePersistentState('admin_level_desc', '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Level | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    try {
      const [l, s] = await Promise.all([fetchAllLevels(), fetchAllStudents()]);
      setLevels(l);
      setStudents(s);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) { setError('Level name required.'); return; }
    setSaving(true); setError('');
    try {
      await createLevel({ name: name.trim(), description: description.trim() || null });
      setName(''); setDescription(''); setShowCreate(false);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (level: Level) => {
    setEditing(level);
    setEditName(level.name);
    setEditDescription(level.description ?? '');
    setError('');
  };

  const handleUpdate = async () => {
    if (!editing) return;
    if (!editName.trim()) { setError('Level name required.'); return; }
    setSaving(true); setError('');
    try {
      await updateLevel(editing.id, { name: editName.trim(), description: editDescription.trim() || null });
      setEditing(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setError('');
    try {
      await deleteLevel(id);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed. Make sure no materials/assignments/exams depend on this level.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <AdminSidebar />
      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#1A1A1A]/[0.02] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

        <motion.header variants={ci} className="mb-14 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase mb-3">
                System<br /><span className="text-[#C62828]">Levels.</span>
              </h1>
              <p className="text-[#D4A373] font-black uppercase text-[10px] tracking-[0.5em] italic">
                Curriculum Structure Overview
              </p>
            </div>
            <button onClick={() => setShowCreate(p => !p)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#1A1A1A] text-white text-xs font-black uppercase tracking-widest hover:bg-[#C62828] transition-all">
              <Plus className={`w-4 h-4 ${showCreate ? 'rotate-45' : ''}`} /> New Level
            </button>
          </div>
        </motion.header>

        {error && (
          <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl p-4">
            <AlertCircle className="w-4 h-4 text-[#C62828]" />
            <p className="text-xs font-black text-[#C62828]">{error}</p>
          </div>
        )}

        {showCreate && (
          <div className="mb-8 bg-white rounded-[2.5rem] p-8 border border-[#1A1A1A]/5 shadow-sm">
            <h3 className="font-black text-[#1A1A1A] uppercase tracking-tight text-lg mb-5">Create Level</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Level name (e.g. C1)"
                className="px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm outline-none" />
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)"
                className="px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm outline-none" />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="px-6 py-3 bg-[#F5F5F0] rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
              <button onClick={handleCreate} disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#C62828] text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-60">
                {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Create
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">{[1,2,3,4].map(i => <div key={i} className="h-40 bg-white rounded-[2.5rem] animate-pulse" />)}</div>
        ) : (
          <motion.div variants={cv} className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            {levels.map(level => {
              const sts = students.filter(s => s.current_level === level.name).length;
              return (
                <motion.div key={level.id} variants={ci} className="bg-white p-8 lg:p-10 rounded-[3rem] border border-[#1A1A1A]/5 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#C62828]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[40px] group-hover:bg-[#C62828]/10 transition-colors" />
                  
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                      <h2 className="text-4xl font-black tracking-tighter text-[#1A1A1A] uppercase leading-none group-hover:text-[#C62828] transition-colors">{level.name}</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/30 mt-2">{level.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(level)} className="w-10 h-10 bg-[#F5F5F0] rounded-xl flex items-center justify-center text-[#1A1A1A]/30 hover:bg-[#1A1A1A] hover:text-white transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(level.id)} disabled={deleting === level.id}
                        className="w-10 h-10 bg-[#F5F5F0] rounded-xl flex items-center justify-center text-[#1A1A1A]/30 hover:bg-red-50 hover:text-[#C62828] transition-all disabled:opacity-60">
                        {deleting === level.id ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                      <div className="w-12 h-12 bg-[#F5F5F0] rounded-2xl flex items-center justify-center text-[#1A1A1A]/20">
                        <Layers className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 relative z-10 border-t border-[#1A1A1A]/5 pt-6">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#C62828]" />
                      <span className="text-sm font-black text-[#1A1A1A]">{sts}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Validated</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {editing && (
          <div className="xed inset-0 z-[110]">
            <button className="absolute inset-0 bg-black/60" onClick={() => setEditing(null)} />
            <div className="absolute inset-4 md:inset-10 bg-white rounded-3xl border border-[#1A1A1A]/10 shadow-2xl p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-xl uppercase tracking-tight text-[#1A1A1A]">Edit Level</h3>
                <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-xl bg-[#F5F5F0] text-[#1A1A1A]/50"><X className="w-5 h-5 mx-auto" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Level name"
                  className="px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm outline-none" />
                <input value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Description"
                  className="px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm outline-none" />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setEditing(null)} className="px-6 py-3 bg-[#F5F5F0] rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                <button onClick={handleUpdate} disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#C62828] text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-60">
                  {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </motion.div>
  );
}
