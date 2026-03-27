import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { FiBook, FiUploadCloud, FiTrash2, FiAlertCircle, FiCheckCircle, FiLoader, FiPlus, FiX, FiPlayCircle, FiEdit2, FiSave } from 'react-icons/fi';
import AdminSidebar from '../../components/shared/AdminSidebar';
import MaterialPreviewModal from '../../components/shared/MaterialPreviewModal';
import { fetchAllMaterials, fetchAllLevels, uploadMaterial, deleteMaterial, updateMaterial, type Material, type Level } from '../../services/adminService';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const ci = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
type MW = Material & { levels?: { name: string } };

export default function AdminMaterials() {
  const [materials, setMaterials] = useState<MW[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [levelId, setLevelId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MW | null>(null);
  const [editing, setEditing] = useState<MW | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLevelId, setEditLevelId] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const [m, l] = await Promise.all([fetchAllMaterials(), fetchAllLevels()]);
      setMaterials(m); setLevels(l);
      if (l.length && !levelId) setLevelId(l[0].id);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const handleUpload = async () => {
    if (!title.trim()) { setFormError('Title required.'); return; }
    if (!levelId) { setFormError('Choose a level first.'); return; }
    if (!file) { setFormError('Attach a file.'); return; }
    setUploading(true); setFormError('');
    try {
      await uploadMaterial({ title: title.trim(), levelId, file });
      setSuccess('Material uploaded!'); setTitle(''); setFile(null); setShowForm(false);
      await load(); setTimeout(() => setSuccess(''), 4000);
    } catch (e: unknown) { setFormError(e instanceof Error ? e.message : 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try { await deleteMaterial(id); setMaterials(p => p.filter(m => m.id !== id)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Delete failed'); }
    finally { setDeleting(null); }
  };

  const openEdit = (material: MW) => {
    setEditing(material);
    setEditTitle(material.title);
    setEditLevelId(material.level_id);
    setEditFile(null);
    setFormError('');
  };

  const handleUpdate = async () => {
    if (!editing) return;
    if (!editTitle.trim()) { setFormError('Title required.'); return; }
    if (!editLevelId) { setFormError('Choose a level.'); return; }
    setUpdating(true);
    setFormError('');
    try {
      await updateMaterial({
        id: editing.id,
        title: editTitle.trim(),
        levelId: editLevelId,
        file: editFile,
      });
      setSuccess('Material updated!');
      setEditing(null);
      await load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const getType = (url: string) => {
    const clean = url.split('?')[0].toLowerCase();
    if (clean.endsWith('.pdf')) return 'PDF';
    if (clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.ogg') || clean.endsWith('.mov')) return 'Video';
    return 'File';
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <AdminSidebar />
      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        <motion.header variants={ci} className="mb-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase mb-3">Manage<br/><span className="text-[#C62828]">Materials.</span></h1>
            <p className="text-[#D4A373] font-black uppercase text-[10px] tracking-[0.5em] italic">{loading ? '—' : `${materials.length} Uploaded`}</p>
          </div>
          <button onClick={() => { setShowForm(p => !p); setFormError(''); }}
            className="flex items-center gap-3 bg-[#1A1A1A] text-white px-7 py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-[#C62828] transition-all active:scale-95 shadow-lg shrink-0">
            <FiPlus className={`w-5 h-5 transition-transform ${showForm ? 'rotate-45' : ''}`} /> Upload
          </button>
        </motion.header>

        <AnimatePresence>
          {success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 relative z-10"><FiCheckCircle className="w-4 h-4 text-green-600 shrink-0" /><p className="text-xs font-bold text-green-700">{success}</p></motion.div>}
          {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 relative z-10"><FiAlertCircle className="w-4 h-4 text-[#C62828] shrink-0" /><p className="text-xs font-bold text-[#C62828]">{error}</p></motion.div>}
        </AnimatePresence>

        {/* Upload Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[2.5rem] p-8 lg:p-10 border border-[#1A1A1A]/5 shadow-sm mb-8 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-[#1A1A1A] tracking-tighter uppercase text-lg flex items-center gap-3"><FiUploadCloud className="w-5 h-5 text-[#C62828]" /> New Material</h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl bg-[#F5F5F0] text-[#1A1A1A]/40 hover:text-[#C62828]"><FiX className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] ml-1 block">Title</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Grammar B1 Unit 3"
                    className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 outline-none focus:ring-4 focus:ring-[#C62828]/10 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] ml-1 block">Level</label>
                  <select value={levelId} onChange={e => setLevelId(e.target.value)}
                    className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] outline-none appearance-none cursor-pointer">
                    {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
              <input type="file" ref={fileRef} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.mp4,.mp3" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              <div onClick={() => fileRef.current?.click()}
                className={`border-4 border-dashed rounded-[2rem] p-8 flex flex-col items-center cursor-pointer transition-all group mb-6 ${file ? 'border-[#C62828]/40 bg-[#C62828]/5' : 'border-[#1A1A1A]/10 hover:border-[#C62828]/30'}`}>
                {file
                  ? <div className="flex items-center gap-3"><FiBook className="w-5 h-5 text-[#C62828]" /><p className="font-black text-[#C62828] text-sm">{file.name}</p>
                      <button onClick={e => { e.stopPropagation(); setFile(null); }} className="w-6 h-6 rounded-full bg-[#C62828]/10 flex items-center justify-center hover:bg-[#C62828] hover:text-white"><FiX className="w-3 h-3" /></button></div>
                  : <><FiUploadCloud className="w-10 h-10 text-[#1A1A1A]/10 group-hover:text-[#C62828] mb-3 group-hover:-translate-y-2 transition-all" />
                      <p className="font-black text-[#1A1A1A] uppercase tracking-tighter">Drop or <span className="text-[#C62828]">browse</span></p>
                      <p className="text-[9px] text-[#1A1A1A]/20 mt-2 uppercase tracking-[0.4em] font-black">PDF, DOCX, PPT up to 50MB</p></>
                }
              </div>
              {formError && <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-6"><FiAlertCircle className="w-4 h-4 text-[#C62828] shrink-0" /><p className="text-xs font-bold text-[#C62828]">{formError}</p></div>}
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowForm(false)} className="px-6 py-3 bg-[#F5F5F0] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-all active:scale-95">Cancel</button>
                <button onClick={handleUpload} disabled={uploading}
                  className="flex items-center gap-2 px-8 py-3 bg-[#C62828] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all active:scale-95 disabled:opacity-60">
                  {uploading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiUploadCloud className="w-4 h-4" />} {uploading ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        {loading
          ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">{[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-white rounded-[2rem] animate-pulse" />)}</div>
          : materials.length === 0
            ? <div className="flex flex-col items-center py-32 relative z-10"><FiBook className="w-16 h-16 text-[#1A1A1A]/10 mb-6" /><p className="font-black text-[#1A1A1A]/30 uppercase text-xl">No materials yet.</p></div>
            : <motion.div variants={cv} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {materials.map(m => (
                  <motion.div key={m.id} variants={ci} whileHover={{ y: -4 }}
                    className="bg-white rounded-[2rem] p-7 border border-[#1A1A1A]/5 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                    <div className="w-12 h-12 rounded-2xl bg-[#C62828]/10 flex items-center justify-center mb-4 group-hover:bg-[#C62828] transition-all">
                      <FiBook className="w-6 h-6 text-[#C62828] group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#D4A373] italic">Level {m.levels?.name ?? '—'}</span>
                    <h3 className="text-base font-black text-[#1A1A1A] tracking-tighter uppercase leading-tight mt-1 mb-3 line-clamp-2 group-hover:text-[#C62828] transition-colors">{m.title}</h3>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/20 mb-4">{new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#F5F5F0] text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/60 mb-4">
                      {getType(m.file_url)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { setSelectedMaterial(m); setPreviewOpen(true); }}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#1A1A1A] text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#C62828] transition-all active:scale-95">
                        <FiPlayCircle className="w-3.5 h-3.5" /> Preview
                      </button>
                      <button onClick={() => handleDelete(m.id)} disabled={deleting === m.id}
                        className="w-10 h-10 rounded-xl bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/30 hover:bg-red-50 hover:text-[#C62828] transition-all active:scale-95 disabled:opacity-60">
                        {deleting === m.id ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiTrash2 className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEdit(m)}
                        className="w-10 h-10 rounded-xl bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/30 hover:bg-[#1A1A1A] hover:text-white transition-all active:scale-95">
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
        }

        <AnimatePresence>
          {editing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110]">
              <button className="absolute inset-0 bg-black/60" onClick={() => setEditing(null)} />
              <div className="absolute inset-4 md:inset-10 bg-white rounded-3xl border border-[#1A1A1A]/10 shadow-2xl p-6 md:p-8 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-xl uppercase tracking-tight text-[#1A1A1A]">Edit Material</h3>
                  <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-xl bg-[#F5F5F0] text-[#1A1A1A]/50"><FiX className="w-5 h-5 mx-auto" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title"
                    className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] outline-none" />
                  <select value={editLevelId} onChange={e => setEditLevelId(e.target.value)}
                    className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] outline-none">
                    {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <input ref={editFileRef} type="file" className="hidden" onChange={e => setEditFile(e.target.files?.[0] ?? null)} />
                <button onClick={() => editFileRef.current?.click()} className="px-5 py-3 rounded-xl bg-[#F5F5F0] font-black text-xs uppercase tracking-widest">
                  {editFile ? `Replace file: ${editFile.name}` : 'Replace file (optional)'}
                </button>
                {formError && <p className="mt-4 text-xs font-black text-[#C62828]">{formError}</p>}
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setEditing(null)} className="px-6 py-3 bg-[#F5F5F0] rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                  <button onClick={handleUpdate} disabled={updating}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#C62828] text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-60">
                    {updating ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSave className="w-4 h-4" />} Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <MaterialPreviewModal
        open={previewOpen}
        material={selectedMaterial}
        onClose={() => { setPreviewOpen(false); setSelectedMaterial(null); }}
      />
    </motion.div>
  );
}