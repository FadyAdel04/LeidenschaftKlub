import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FiAward, FiPlus, FiX, FiTrash2, FiAlertCircle, FiCheckCircle, FiLoader, FiClock, FiList, FiUpload, FiEdit2, FiSave } from 'react-icons/fi';
import AdminSidebar from '../../components/shared/AdminSidebar';
import {
  fetchAllExams, fetchAllLevels, createExam, deleteExam, fetchQuestionsByExamAdmin,
  createExamQuestion, bulkCreateExamQuestions, deleteExamQuestion, updateExam, type Exam, type Level, type ExamQuestion,
} from '../../services/adminService';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const ci = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
type EW = Exam & { levels?: { name: string } };

export default function AdminExams() {
  const [exams, setExams] = useState<EW[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [levelId, setLevelId] = useState('');
  const [duration, setDuration] = useState('30');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeExam, setActiveExam] = useState<EW | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState('A');
  const [qSaving, setQSaving] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [qError, setQError] = useState('');
  const [editingExam, setEditingExam] = useState<EW | null>(null);
  const [editExamTitle, setEditExamTitle] = useState('');
  const [editExamLevel, setEditExamLevel] = useState('');
  const [editExamDuration, setEditExamDuration] = useState('30');
  const [updatingExam, setUpdatingExam] = useState(false);

  async function load() {
    try {
      const [e, l] = await Promise.all([fetchAllExams(), fetchAllLevels()]);
      setExams(e); setLevels(l);
      if (l.length && !levelId) setLevelId(l[0].id);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!title.trim()) { setFormError('Title required.'); return; }
    if (!levelId) { setFormError('Choose a level first.'); return; }
    if (!duration || Number(duration) < 1) { setFormError('Duration must be at least 1 min.'); return; }
    setCreating(true); setFormError('');
    try {
      await createExam({ title: title.trim(), levelId, duration: Number(duration) });
      setSuccess('Exam created!'); setTitle(''); setDuration('30'); setShowForm(false);
      await load(); setTimeout(() => setSuccess(''), 4000);
    } catch (e: unknown) { setFormError(e instanceof Error ? e.message : 'Failed'); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try { await deleteExam(id); setExams(p => p.filter(e => e.id !== id)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Delete failed'); }
    finally { setDeleting(null); }
  };

  const openEditExam = (exam: EW) => {
    setEditingExam(exam);
    setEditExamTitle(exam.title);
    setEditExamLevel(exam.level_id);
    setEditExamDuration(String(exam.duration));
    setFormError('');
  };

  const handleUpdateExam = async () => {
    if (!editingExam) return;
    if (!editExamTitle.trim()) { setFormError('Title required.'); return; }
    if (!editExamLevel) { setFormError('Choose a level.'); return; }
    const durationNum = Number(editExamDuration);
    if (!durationNum || durationNum < 1) { setFormError('Duration must be at least 1 min.'); return; }
    setUpdatingExam(true);
    setFormError('');
    try {
      await updateExam({ id: editingExam.id, title: editExamTitle.trim(), levelId: editExamLevel, duration: durationNum });
      setSuccess('Exam updated!');
      setEditingExam(null);
      await load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdatingExam(false);
    }
  };

  const openQuestions = async (exam: EW) => {
    setActiveExam(exam);
    setQuestionsLoading(true);
    setQError('');
    try {
      const qs = await fetchQuestionsByExamAdmin(exam.id);
      setQuestions(qs);
    } catch (e: unknown) {
      setQError(e instanceof Error ? e.message : 'Failed to load questions');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!activeExam) return;
    if (!qText.trim()) { setQError('Question text is required.'); return; }
    if (qOptions.some(o => !o.trim())) { setQError('All 4 options are required.'); return; }

    setQSaving(true);
    setQError('');
    try {
      await createExamQuestion({
        examId: activeExam.id,
        questionText: qText.trim(),
        options: qOptions.map(o => o.trim()),
        correctAnswer: qCorrect,
        orderIndex: questions.length + 1,
      });
      const qs = await fetchQuestionsByExamAdmin(activeExam.id);
      setQuestions(qs);
      setQText('');
      setQOptions(['', '', '', '']);
      setQCorrect('A');
    } catch (e: unknown) {
      setQError(e instanceof Error ? e.message : 'Failed to add question');
    } finally {
      setQSaving(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!activeExam) return;
    const lines = bulkInput.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) { setQError('Paste at least one line.'); return; }

    const parsed: Array<{ questionText: string; options: string[]; correctAnswer: string }> = [];
    for (const line of lines) {
      const parts = line.split('||').map(p => p.trim());
      if (parts.length !== 6) {
        setQError('Invalid format. Use: question || optA || optB || optC || optD || A');
        return;
      }
      const [questionText, a, b, c, d, correctRaw] = parts;
      const correctAnswer = correctRaw.toUpperCase();
      if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
        setQError('Correct answer must be A/B/C/D.');
        return;
      }
      parsed.push({ questionText, options: [a, b, c, d], correctAnswer });
    }

    setBulkSaving(true);
    setQError('');
    try {
      await bulkCreateExamQuestions({ examId: activeExam.id, questions: parsed });
      const qs = await fetchQuestionsByExamAdmin(activeExam.id);
      setQuestions(qs);
      setBulkInput('');
    } catch (e: unknown) {
      setQError(e instanceof Error ? e.message : 'Bulk upload failed');
    } finally {
      setBulkSaving(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!activeExam) return;
    try {
      await deleteExamQuestion(id);
      const qs = await fetchQuestionsByExamAdmin(activeExam.id);
      setQuestions(qs);
    } catch (e: unknown) {
      setQError(e instanceof Error ? e.message : 'Delete question failed');
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <AdminSidebar />
      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        <motion.header variants={ci} className="mb-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase mb-3">Manage<br/><span className="text-[#C62828]">Exams.</span></h1>
            <p className="text-[#D4A373] font-black uppercase text-[10px] tracking-[0.5em] italic">{loading ? '—' : `${exams.length} Created`}</p>
          </div>
          <button onClick={() => { setShowForm(p => !p); setFormError(''); }}
            className="flex items-center gap-3 bg-[#1A1A1A] text-white px-7 py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-[#C62828] transition-all active:scale-95 shadow-lg shrink-0">
            <FiPlus className={`w-5 h-5 transition-transform ${showForm ? 'rotate-45' : ''}`} /> New Exam
          </button>
        </motion.header>

        <AnimatePresence>
          {success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 relative z-10"><FiCheckCircle className="w-4 h-4 text-green-600 shrink-0" /><p className="text-xs font-bold text-green-700">{success}</p></motion.div>}
          {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 relative z-10"><FiAlertCircle className="w-4 h-4 text-[#C62828] shrink-0" /><p className="text-xs font-bold text-[#C62828]">{error}</p></motion.div>}
        </AnimatePresence>

        {/* Create Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[2.5rem] p-8 lg:p-10 border border-[#1A1A1A]/5 shadow-sm mb-8 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-[#1A1A1A] tracking-tighter uppercase text-lg flex items-center gap-3"><FiAward className="w-5 h-5 text-[#C62828]" /> New Exam</h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl bg-[#F5F5F0] text-[#1A1A1A]/40 hover:text-[#C62828]"><FiX className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] ml-1 block">Exam Title</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. B1 Midterm"
                    className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 outline-none focus:ring-4 focus:ring-[#C62828]/10 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] ml-1 block">Level</label>
                  <select value={levelId} onChange={e => setLevelId(e.target.value)}
                    className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] outline-none appearance-none cursor-pointer">
                    {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] ml-1 block">Duration (min)</label>
                  <input type="number" value={duration} onChange={e => setDuration(e.target.value)} min="1" max="300"
                    className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] outline-none focus:ring-4 focus:ring-[#C62828]/10 transition-all" />
                </div>
              </div>
              {formError && <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-6"><FiAlertCircle className="w-4 h-4 text-[#C62828] shrink-0" /><p className="text-xs font-bold text-[#C62828]">{formError}</p></div>}
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowForm(false)} className="px-6 py-3 bg-[#F5F5F0] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-all active:scale-95">Cancel</button>
                <button onClick={handleCreate} disabled={creating}
                  className="flex items-center gap-2 px-8 py-3 bg-[#C62828] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all active:scale-95 disabled:opacity-60">
                  {creating ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiPlus className="w-4 h-4" />} {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exam Grid */}
        {loading
          ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">{[1,2,3].map(i => <div key={i} className="h-48 bg-white rounded-[2rem] animate-pulse" />)}</div>
          : exams.length === 0
            ? <div className="flex flex-col items-center py-32 relative z-10"><FiAward className="w-16 h-16 text-[#1A1A1A]/10 mb-6" /><p className="font-black text-[#1A1A1A]/30 uppercase text-xl">No exams yet.</p></div>
            : <motion.div variants={cv} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {exams.map(e => (
                  <motion.div key={e.id} variants={ci} whileHover={{ y: -4 }}
                    className="bg-white rounded-[2rem] p-7 border border-[#1A1A1A]/5 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#C62828]/[0.03] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-[#C62828]/10 transition-all" />
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-[#C62828]/10 flex items-center justify-center group-hover:bg-[#C62828] transition-all shrink-0">
                        <FiAward className="w-6 h-6 text-[#C62828] group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openQuestions(e)}
                          className="w-8 h-8 rounded-lg bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/30 hover:bg-[#1A1A1A] hover:text-white transition-all active:scale-95 shrink-0"
                          title="Manage questions"
                        >
                          <FiList className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(e.id)} disabled={deleting === e.id}
                          className="w-8 h-8 rounded-lg bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/20 hover:bg-red-50 hover:text-[#C62828] transition-all active:scale-95 disabled:opacity-60 shrink-0">
                          {deleting === e.id ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiTrash2 className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => openEditExam(e)}
                          className="w-8 h-8 rounded-lg bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/30 hover:bg-[#1A1A1A] hover:text-white transition-all active:scale-95 shrink-0"
                          title="Edit exam"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#D4A373] italic">Level {e.levels?.name ?? '—'}</span>
                    <h3 className="text-lg font-black text-[#1A1A1A] tracking-tighter uppercase leading-tight mt-1 mb-4 line-clamp-2 group-hover:text-[#C62828] transition-colors">{e.title}</h3>
                    <div className="flex items-center gap-2 text-[9px] font-black text-[#1A1A1A]/30 uppercase tracking-widest">
                      <FiClock className="w-3.5 h-3.5" />
                      <span>{e.duration} Minutes</span>
                    </div>
                    <button
                      onClick={() => openQuestions(e)}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1A1A1A] text-white font-black text-[10px] uppercase tracking-widest hover:bg-[#C62828] transition-all"
                    >
                      <FiList className="w-3.5 h-3.5" />
                      Manage Questions
                    </button>
                  </motion.div>
                ))}
              </motion.div>
        }

        <AnimatePresence>
          {activeExam && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110]">
              <button className="absolute inset-0 bg-black/55" onClick={() => setActiveExam(null)} />
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 30, opacity: 0 }}
                className="absolute inset-4 md:inset-8 lg:inset-12 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="px-6 md:px-8 py-5 border-b border-[#1A1A1A]/10 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#D4A373]">Exam Question Bank</p>
                    <h3 className="text-lg md:text-xl font-black tracking-tight text-[#1A1A1A] uppercase mt-1">{activeExam.title}</h3>
                  </div>
                  <button onClick={() => setActiveExam(null)} className="w-9 h-9 rounded-xl bg-[#F5F5F0] text-[#1A1A1A]/50 hover:text-[#C62828]">
                    <FiX className="w-5 h-5 mx-auto" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 xl:grid-cols-2 gap-8 bg-[#F5F5F0]">
                  <div className="bg-white rounded-2xl p-6 border border-[#1A1A1A]/10">
                    <h4 className="font-black text-[#1A1A1A] uppercase tracking-tight mb-4">Add MCQ question</h4>
                    <div className="space-y-3">
                      <input value={qText} onChange={e => setQText(e.target.value)} placeholder="Question text"
                        className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none" />
                      {['A', 'B', 'C', 'D'].map((label, idx) => (
                        <input
                          key={label}
                          value={qOptions[idx]}
                          onChange={e => setQOptions(prev => prev.map((v, i) => (i === idx ? e.target.value : v)))}
                          placeholder={`Option ${label}`}
                          className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none"
                        />
                      ))}
                      <select value={qCorrect} onChange={e => setQCorrect(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none">
                        {['A', 'B', 'C', 'D'].map(c => <option key={c} value={c}>Correct: {c}</option>)}
                      </select>
                      <button onClick={handleCreateQuestion} disabled={qSaving}
                        className="w-full py-3 rounded-xl bg-[#C62828] text-white text-xs font-black uppercase tracking-widest hover:shadow-xl disabled:opacity-60">
                        {qSaving ? 'Saving…' : 'Add Question'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-[#1A1A1A]/10">
                    <h4 className="font-black text-[#1A1A1A] uppercase tracking-tight mb-2">Bulk upload MCQ</h4>
                    <p className="text-[10px] font-black text-[#1A1A1A]/35 uppercase tracking-wider mb-3">
                      Format: question || optionA || optionB || optionC || optionD || A
                    </p>
                    <textarea
                      value={bulkInput}
                      onChange={e => setBulkInput(e.target.value)}
                      rows={8}
                      placeholder="What is 2+2? || 1 || 2 || 4 || 5 || C"
                      className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-xs font-bold outline-none resize-none"
                    />
                    <button onClick={handleBulkUpload} disabled={bulkSaving}
                      className="mt-3 w-full py-3 rounded-xl bg-[#1A1A1A] text-white text-xs font-black uppercase tracking-widest hover:bg-[#C62828] disabled:opacity-60 flex items-center justify-center gap-2">
                      <FiUpload className="w-4 h-4" />
                      {bulkSaving ? 'Uploading…' : 'Upload Questions'}
                    </button>
                  </div>

                  <div className="xl:col-span-2 bg-white rounded-2xl p-6 border border-[#1A1A1A]/10">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-black text-[#1A1A1A] uppercase tracking-tight">Questions ({questions.length})</h4>
                    </div>
                    {qError && <p className="mb-3 text-xs font-black text-[#C62828]">{qError}</p>}
                    {questionsLoading ? (
                      <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-[#F5F5F0] rounded-xl animate-pulse" />)}</div>
                    ) : questions.length === 0 ? (
                      <p className="text-sm text-[#1A1A1A]/40 font-black italic">No questions yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {questions.map((q, idx) => (
                          <div key={q.id} className="p-4 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10">
                            <div className="flex justify-between gap-4">
                              <p className="text-sm font-black text-[#1A1A1A]">{idx + 1}. {q.question_text}</p>
                              <button onClick={() => handleDeleteQuestion(q.id)} className="text-[#C62828]">
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="mt-2 text-[10px] font-black text-[#1A1A1A]/50 uppercase tracking-wider">
                              Correct: {q.correct_answer}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editingExam && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[111]">
              <button className="absolute inset-0 bg-black/60" onClick={() => setEditingExam(null)} />
              <div className="absolute inset-4 md:inset-10 bg-white rounded-3xl border border-[#1A1A1A]/10 shadow-2xl p-6 md:p-8 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-xl uppercase tracking-tight text-[#1A1A1A]">Edit Exam</h3>
                  <button onClick={() => setEditingExam(null)} className="w-9 h-9 rounded-xl bg-[#F5F5F0] text-[#1A1A1A]/50"><FiX className="w-5 h-5 mx-auto" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
                  <input value={editExamTitle} onChange={e => setEditExamTitle(e.target.value)} placeholder="Exam title"
                    className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm outline-none" />
                  <select value={editExamLevel} onChange={e => setEditExamLevel(e.target.value)}
                    className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm outline-none">
                    {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <input type="number" value={editExamDuration} onChange={e => setEditExamDuration(e.target.value)} min="1"
                    className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm outline-none" />
                </div>
                {formError && <p className="mt-2 text-xs font-black text-[#C62828]">{formError}</p>}
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setEditingExam(null)} className="px-6 py-3 bg-[#F5F5F0] rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                  <button onClick={handleUpdateExam} disabled={updatingExam}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#C62828] text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-60">
                    {updatingExam ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSave className="w-4 h-4" />} Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
