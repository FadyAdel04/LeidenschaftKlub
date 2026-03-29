import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { Book, UploadCloud, Trash2, AlertCircle, CheckCircle, Loader, Plus, X, PlayCircle, Edit2, Save } from 'lucide-react';
import AdminSidebar from '../../components/shared/AdminSidebar';
import MaterialPreviewModal from '../../components/shared/MaterialPreviewModal';
import { 
  fetchAllMaterials, 
  fetchAllLevels, 
  uploadMaterial, 
  deleteMaterial, 
  updateMaterial, 
  fetchStudentsByLevel, 
  syncMaterialAssignments,
  fetchMaterialAssignments,
  type Material, 
  type Level,
  type Profile,
} from '../../services/adminService';
import { formatBytes, MAX_UPLOAD_BYTES, type UploadMetrics } from '../../utils/storageUpload';

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
  const [title, setTitle] = usePersistentState('admin_material_title', '');
  const [levelId, setLevelId] = usePersistentState('admin_material_level_id', '');
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
  const [uploadMetrics, setUploadMetrics] = useState<UploadMetrics | null>(null);
  
  // Assignment Modal State
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [assigningMaterial, setAssigningMaterial] = useState<MW | null>(null);
  const [studentsInLevel, setStudentsInLevel] = useState<Profile[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [availableFrom, setAvailableFrom] = useState(new Date().toISOString().slice(0, 16));
  const [visibility, setVisibility] = useState(true);
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  const leRef = useRef<HTMLInputElement>(null);
  const editleRef = useRef<HTMLInputElement>(null);

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
    if (file.size > MAX_UPLOAD_BYTES) { setFormError('File exceeds 200MB limit.'); return; }
    setUploading(true); setFormError('');
    try {
      await uploadMaterial({
        title: title.trim(),
        levelId,
        file,
        onProgress: setUploadMetrics,
      });
      setSuccess('Material uploaded!');
      setTitle(''); setLevelId(''); setFile(null);
      setShowForm(false);
      await load();
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: unknown) { setFormError(e instanceof Error ? e.message : 'Upload failed'); }
    finally { setUploading(false); setUploadMetrics(null); }
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
    if (editFile && editFile.size > MAX_UPLOAD_BYTES) { setFormError('Replacement file exceeds 200MB limit.'); return; }
    setUpdating(true);
    setFormError('');
    try {
      await updateMaterial({
        id: editing.id,
        title: editTitle.trim(),
        levelId: editLevelId,
        file: editFile,
        onProgress: setUploadMetrics,
      });
      setSuccess('Material updated!');
      setEditing(null);
      await load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdating(false);
      setUploadMetrics(null);
    }
  };

  const openAssignModal = async (material: MW) => {
    setAssigningMaterial(material);
    setAssignmentModalOpen(true);
    setAssignmentLoading(true);
    try {
      const [studs, assignedIds] = await Promise.all([
        fetchStudentsByLevel(material.level_id),
        fetchMaterialAssignments(material.id)
      ]);
      setStudentsInLevel(studs);
      setSelectedStudentIds(assignedIds); 
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch students');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assigningMaterial) return;
    setAssignmentLoading(true);
    try {
      await syncMaterialAssignments({
        materialId: assigningMaterial.id,
        studentIds: selectedStudentIds,
        availableFrom: new Date(availableFrom).toISOString(),
        visible: visibility
      });
      setSuccess(`Assignments updated for ${selectedStudentIds.length} students!`);
      setAssignmentModalOpen(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Assignment failed');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === studentsInLevel.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(studentsInLevel.map(s => s.id));
    }
  };

  const getType = (url: string) => {
    const clean = url.split('?')[0].toLowerCase();
    if (clean.endsWith('.pdf')) return 'PDF';
    if (clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.ogg') || clean.endsWith('.mov')) return 'Video';
    if (clean.endsWith('.mp3') || clean.endsWith('.wav') || clean.endsWith('.m4a')) return 'Audio';
    return 'file';
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
            <Plus className={`w-5 h-5 transition-transform ${showForm ? 'rotate-45' : ''}`} /> Upload
          </button>
        </motion.header>

        <AnimatePresence>
          {success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 relative z-10"><CheckCircle className="w-4 h-4 text-green-600 shrink-0" /><p className="text-xs font-bold text-green-700">{success}</p></motion.div>}
          {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 relative z-10"><AlertCircle className="w-4 h-4 text-[#C62828] shrink-0" /><p className="text-xs font-bold text-[#C62828]">{error}</p></motion.div>}
        </AnimatePresence>

        {/* Upload Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[2.5rem] p-8 lg:p-10 border border-[#1A1A1A]/5 shadow-sm mb-8 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-[#1A1A1A] tracking-tighter uppercase text-lg flex items-center gap-3"><UploadCloud className="w-5 h-5 text-[#C62828]" /> New Material</h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl bg-[#F5F5F0] text-[#1A1A1A]/40 hover:text-[#C62828]"><X className="w-4 h-4" /></button>
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
              <input type="file" ref={leRef} className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.mp4,.mp3" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              <div onClick={() => leRef.current?.click()}
                className={`border-4 border-dashed rounded-[2rem] p-8 flex flex-col items-center cursor-pointer transition-all group mb-6 ${file ? 'border-[#C62828]/40 bg-[#C62828]/5' : 'border-[#1A1A1A]/10 hover:border-[#C62828]/30'}`}>
                {file
                  ? <div className="flex items-center gap-3"><Book className="w-5 h-5 text-[#C62828]" /><p className="font-black text-[#C62828] text-sm">{file.name}</p>
                      <button onClick={e => { e.stopPropagation(); setFile(null); }} className="w-6 h-6 rounded-full bg-[#C62828]/10 flex items-center justify-center hover:bg-[#C62828] hover:text-white"><X className="w-3 h-3" /></button></div>
                  : <><UploadCloud className="w-10 h-10 text-[#1A1A1A]/10 group-hover:text-[#C62828] mb-3 group-hover:-translate-y-2 transition-all" />
                      <p className="font-black text-[#1A1A1A] uppercase tracking-tighter">Drop or <span className="text-[#C62828]">browse</span></p>
                      <p className="text-[9px] text-[#1A1A1A]/20 mt-2 uppercase tracking-[0.4em] font-black">PDF/Video/Audio up to 200MB</p></>
                }
              </div>
              {uploadMetrics?.status === 'uploading' && (
                <div className="mb-5 rounded-2xl border border-[#1A1A1A]/10 bg-[#F5F5F0] p-4">
                  <div className="h-2 rounded-full bg-white overflow-hidden">
                    <div className="h-full bg-[#C62828]" style={{ width: `${uploadMetrics.progress}%` }} />
                  </div>
                  <div className="mt-2 text-[10px] font-black uppercase tracking-wider text-[#1A1A1A]/50">
                    {uploadMetrics.progress}% - {formatBytes(uploadMetrics.uploadedBytes)} / {formatBytes(uploadMetrics.totalBytes)}
                    {uploadMetrics.etaSeconds !== null ? ` - ETA ${uploadMetrics.etaSeconds}s` : ''}
                  </div>
                </div>
              )}
              {formError && <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-6"><AlertCircle className="w-4 h-4 text-[#C62828] shrink-0" /><p className="text-xs font-bold text-[#C62828]">{formError}</p></div>}
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowForm(false)} className="px-6 py-3 bg-[#F5F5F0] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-all active:scale-95">Cancel</button>
                <button onClick={handleUpload} disabled={uploading}
                  className="flex items-center gap-2 px-8 py-3 bg-[#C62828] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all active:scale-95 disabled:opacity-60">
                  {uploading ? <Loader className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />} {uploading ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        {loading
          ? <div className="flex flex-col items-center justify-center py-20 relative z-10 w-full col-span-full border-2 border-dashed border-[#1A1A1A]/5 rounded-[2rem] bg-white/50"><Loader className="w-10 h-10 text-[#C62828] animate-spin" /><p className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/20">Loading Materials...</p></div>
          : materials.length === 0
            ? <div className="flex flex-col items-center py-32 relative z-10"><Book className="w-16 h-16 text-[#1A1A1A]/10 mb-6" /><p className="font-black text-[#1A1A1A]/30 uppercase text-xl">No materials yet.</p></div>
            : <motion.div variants={cv} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {materials.map(m => (
                  <motion.div key={m.id} variants={ci} whileHover={{ y: -4 }}
                    className="bg-white rounded-[2rem] p-7 border border-[#1A1A1A]/5 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                    <div className="w-12 h-12 rounded-2xl bg-[#C62828]/10 flex items-center justify-center mb-4 group-hover:bg-[#C62828] transition-all">
                      <Book className="w-6 h-6 text-[#C62828] group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#D4A373] italic">Level {m.levels?.name ?? '—'}</span>
                    <h3 className="text-base font-black text-[#1A1A1A] tracking-tighter uppercase leading-tight mt-1 mb-3 line-clamp-2 group-hover:text-[#C62828] transition-colors">{m.title}</h3>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/20 mb-4">{new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#F5F5F0] text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/60 mb-4">
                      {getType(m.file_url)}
                    </span>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => { setSelectedMaterial(m); setPreviewOpen(true); }}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#1A1A1A] text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#C62828] transition-all active:scale-95">
                        <PlayCircle className="w-3.5 h-3.5" /> Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => openAssignModal(m)}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#C62828] text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1A1A1A] transition-all active:scale-95 shadow-md shadow-[#C62828]/20">
                        <Plus className="w-3.5 h-3.5" /> Assign to Students
                      </button>
                      <div className="flex items-center gap-2 mt-1">
                        <button onClick={() => handleDelete(m.id)} disabled={deleting === m.id}
                          className="flex-1 h-10 rounded-xl bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/30 hover:bg-red-50 hover:text-[#C62828] transition-all active:scale-95 disabled:opacity-60">
                          {deleting === m.id ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                        <button onClick={() => openEdit(m)}
                          className="flex-1 h-10 rounded-xl bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/30 hover:bg-[#1A1A1A] hover:text-white transition-all active:scale-95">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
        }

        <AnimatePresence>
          {editing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditing(null)} />
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-[#1A1A1A]/10 p-8 lg:p-10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-[#1A1A1A] tracking-tight uppercase">Edit Material</h3>
                  <button onClick={() => setEditing(null)} className="w-11 h-11 rounded-2xl bg-[#F5F5F0] text-[#1A1A1A]/40 hover:text-[#C62828] flex items-center justify-center transition-all"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] ml-1 block">Title</label>
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title"
                      className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] outline-none border border-transparent focus:border-[#C62828]/20 transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] ml-1 block">Level</label>
                    <select value={editLevelId} onChange={e => setEditLevelId(e.target.value)}
                      className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] outline-none">
                      {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                </div>
                <input ref={editleRef} type="file" className="hidden" onChange={e => setEditFile(e.target.files?.[0] ?? null)} />
                <div onClick={() => editleRef.current?.click()}
                  className={`border-4 border-dashed rounded-[2rem] p-8 flex flex-col items-center cursor-pointer transition-all group mb-8 ${editFile ? 'border-[#C62828]/40 bg-[#C62828]/5' : 'border-[#1A1A1A]/10 hover:border-[#C62828]/30'}`}>
                  {editFile 
                    ? <div className="flex items-center gap-3"><Book className="w-5 h-5 text-[#C62828]" /><p className="font-black text-[#C62828] text-sm">{editFile.name}</p></div>
                    : <><UploadCloud className="w-8 h-8 text-[#1A1A1A]/10 group-hover:text-[#C62828] mb-2 transition-all" /><p className="font-black text-[10px] text-[#1A1A1A]/30 uppercase tracking-widest">Replace file (optional)</p></>
                  }
                </div>
                {formError && <p className="mb-6 text-xs font-black text-[#C62828] bg-red-50 p-4 rounded-2xl border border-red-100">{formError}</p>}
                <div className="flex justify-end gap-3">
                  <button onClick={() => setEditing(null)} className="px-6 py-3 bg-[#F5F5F0] rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Cancel</button>
                  <button onClick={handleUpdate} disabled={updating}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-[#C62828] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all disabled:opacity-60">
                    {updating ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {assignmentModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAssignmentModalOpen(false)} />
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-[#1A1A1A]/10">
                <div className="p-8 lg:p-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-[#1A1A1A] tracking-tight uppercase mb-1">Assign Material</h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C62828] italic">{assigningMaterial?.title}</p>
                    </div>
                    <button onClick={() => setAssignmentModalOpen(false)} className="w-11 h-11 rounded-2xl bg-[#F5F5F0] text-[#1A1A1A]/40 hover:text-[#C62828] flex items-center justify-center transition-all"><X className="w-5 h-5" /></button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] ml-1 block">Release Schedule</label>
                        <input type="datetime-local" value={availableFrom} onChange={e => setAvailableFrom(e.target.value)}
                          className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] outline-none border border-transparent focus:border-[#C62828]/20 transition-all" />
                      </div>
                      <div className="flex items-center justify-between p-5 bg-[#F5F5F0] rounded-2xl border border-[#1A1A1A]/5">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">Visibility</p>
                          <p className="text-[9px] text-[#1A1A1A]/40 uppercase mt-0.5 font-bold">Show to students immediately</p>
                        </div>
                        <button onClick={() => setVisibility(!visibility)}
                          className={`w-14 h-7 rounded-full p-1 transition-all ${visibility ? 'bg-[#C62828]' : 'bg-[#1A1A1A]/10'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full transition-all ${visibility ? 'translate-x-7' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 flex flex-col h-[300px]">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] block">Select Students</label>
                        <button onClick={toggleSelectAll} className="text-[9px] font-black uppercase tracking-widest text-[#C62828] hover:underline transition-all">
                          {selectedStudentIds.length === studentsInLevel.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto bg-[#F5F5F0] rounded-2xl p-4 space-y-2 border border-[#1A1A1A]/5">
                        {assignmentLoading && <div className="flex items-center justify-center h-full"><Loader className="w-5 h-5 animate-spin text-[#C62828]" /></div>}
                        {!assignmentLoading && studentsInLevel.length === 0 && <p className="text-center py-10 text-[10px] font-black uppercase text-[#1A1A1A]/20">No students in Level {assigningMaterial?.levels?.name}</p>}
                        {studentsInLevel.map(s => (
                          <label key={s.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#1A1A1A]/5 cursor-pointer hover:border-[#C62828]/30 transition-all group">
                            <input type="checkbox" checked={selectedStudentIds.includes(s.id)} 
                              onChange={() => setSelectedStudentIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                              className="w-4 h-4 rounded border-[#1A1A1A]/10 text-[#C62828] focus:ring-[#C62828]/20" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-black text-[#1A1A1A] truncate uppercase leading-none">{s.name}</p>
                              <p className="text-[9px] text-[#1A1A1A]/30 truncate uppercase mt-0.5 tracking-tighter">{s.email}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#C62828] text-center mt-2">
                        {selectedStudentIds.length} Students Selected
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 justify-end">
                    <button onClick={() => setAssignmentModalOpen(false)} className="px-8 py-4 bg-[#F5F5F0] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-all active:scale-95">Cancel</button>
                    <button onClick={handleAssign} disabled={assignmentLoading || selectedStudentIds.length === 0}
                      className="flex items-center gap-3 px-10 py-4 bg-[#C62828] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-2xl hover:shadow-[#C62828]/30 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none">
                      {assignmentLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Assign Now
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <MaterialPreviewModal
        open={previewOpen}
        material={selectedMaterial ? { ...selectedMaterial, watermarkText: 'Admin Preview' } : null}
        onClose={() => { setPreviewOpen(false); setSelectedMaterial(null); }}
      />
    </motion.div>
  );
}
