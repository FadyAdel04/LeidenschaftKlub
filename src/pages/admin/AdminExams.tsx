import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useOnceAnimation } from '../../hooks/useOnceAnimation';
import { Award, Plus, X, Trash2, AlertCircle, CheckCircle, Loader, Clock, List, Upload, Edit2, Save, Clipboard } from 'lucide-react';
import AdminSidebar from '../../components/shared/AdminSidebar';
import {
  fetchAllExams, fetchAllLevels, createExam, deleteExam, fetchQuestionsByExamAdmin,
  createExamQuestion, bulkCreateExamQuestions, deleteExamQuestion, updateExam, uploadMaterialAsset,
  fetchAllExamSubmissions,
  type Exam, type Level, type ExamQuestion,
} from '../../services/adminService';
import type { Result } from '../../services/studentService';
import { MAX_UPLOAD_BYTES } from '../../utils/storageUpload';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const ci = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
type EW = Exam & { levels?: { name: string } };

type QuestionAction =
  | { type: 'SET_QUESTIONS'; payload: ExamQuestion[] }
  | { type: 'ADD_QUESTION'; payload: ExamQuestion }
  | { type: 'UPDATE_QUESTION'; payload: ExamQuestion }
  | { type: 'DELETE_QUESTION'; payload: string }
  | { type: 'RESET' };

function questionsReducer(state: ExamQuestion[], action: QuestionAction): ExamQuestion[] {
  switch (action.type) {
    case 'SET_QUESTIONS':
      return action.payload;
    case 'ADD_QUESTION':
      return [...state, action.payload];
    case 'UPDATE_QUESTION':
      return state.map((q) => (q.id === action.payload.id ? action.payload : q));
    case 'DELETE_QUESTION':
      return state.filter((q) => q.id !== action.payload);
    case 'RESET':
      return [];
    default:
      return state;
  }
}

export default function AdminExams() {
  const navigate = useNavigate();
  const hasAnimated = useOnceAnimation('admin_exams');
  const [adminTab, setAdminTab] = usePersistentState<'bank' | 'submissions'>('admin_exams_tab', 'bank');
  const [submissions, setSubmissions] = useState<
    (Result & { profiles?: { name: string; email: string }; exams?: { title: string } })[]
  >([]);
  const [subLoading, setSubLoading] = useState(false);

  const [exams, setExams] = useState<EW[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Consolidated Exam Data
  const [examData, setExamData] = useState({
    title: '',
    levelId: '',
    duration: '30',
  });

  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeExam, setActiveExam] = useState<EW | null>(null);
  
  // useReducer for questions
  const [questions, dispatchQuestions] = useReducer(questionsReducer, []);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // Consolidated Question Form Data
  const [qFormData, setQFormData] = useState({
    qText: '',
    qOptions: ['', '', '', ''],
    qCorrect: 'A',
    qType: 'paragraph' as 'paragraph' | 'grammar' | 'writing' | 'listening',
    pSubtype: 'mcq' as 'mcq' | 'true_false',
    pParagraph: '',
    gSentence: 'I ___ to school yesterday',
    gWordsRaw: 'go,went,gone',
    gCorrectWord: 'went',
    wWordsRaw: 'travel,Germany,experience',
    tfCorrect: 'True' as 'True' | 'False',
  });

  const [qSaving, setQSaving] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [qError, setQError] = useState('');
  const [questionAudioFile, setQuestionAudioFile] = useState<File | null>(null);
  const [listeningAudioUrl, setListeningAudioUrl] = useState<string | null>(null);
  
  const [editingExam, setEditingExam] = useState<EW | null>(null);
  const [editExamState, setEditExamState] = useState({
    title: '',
    levelId: '',
    duration: '30'
  });
  const [updatingExam, setUpdatingExam] = useState(false);

  // Prevent full page reload on tab switch or visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Just log, don't trigger anything that could cause a reload
        console.log('Tab visible');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  async function load() {
    try {
      const [e, l] = await Promise.all([fetchAllExams(), fetchAllLevels()]);
      setExams(e); setLevels(l);
      if (l.length && !examData.levelId) {
        setExamData(prev => ({ ...prev, levelId: l[0].id }));
      }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (adminTab !== 'submissions') return;
    let cancelled = false;
    setSubLoading(true);
    fetchAllExamSubmissions()
      .then((rows) => {
        if (!cancelled) setSubmissions(rows);
      })
      .catch(() => {
        if (!cancelled) setSubmissions([]);
      })
      .finally(() => {
        if (!cancelled) setSubLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [adminTab]);

  const handleCreate = async () => {
    if (!examData.title.trim()) { setFormError('Title required.'); return; }
    if (!examData.levelId) { setFormError('Choose a level first.'); return; }
    const durationNum = Number(examData.duration);
    if (!durationNum || durationNum < 1) { setFormError('Duration must be at least 1 min.'); return; }
    setCreating(true); setFormError('');
    try {
      await createExam({ title: examData.title.trim(), levelId: examData.levelId, duration: durationNum });
      setSuccess('Exam created!'); 
      setExamData({ title: '', levelId: levels[0]?.id || '', duration: '30' }); 
      setShowForm(false);
      await load(); setTimeout(() => setSuccess(''), 4000);
    } catch (e: unknown) { setFormError(e instanceof Error ? e.message : 'Failed'); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try { 
      await deleteExam(id); 
      setExams(p => p.filter(e => e.id !== id)); 
    } catch (e: unknown) { 
      setError(e instanceof Error ? e.message : 'Delete failed'); 
    } finally { 
      setDeleting(null); 
    }
  };

  const openEditExam = (exam: EW) => {
    setEditingExam(exam);
    setEditExamState({
      title: exam.title,
      levelId: exam.level_id,
      duration: String(exam.duration)
    });
    setFormError('');
  };

  const handleUpdateExam = async () => {
    if (!editingExam) return;
    if (!editExamState.title.trim()) { setFormError('Title required.'); return; }
    if (!editExamState.levelId) { setFormError('Choose a level.'); return; }
    const durationNum = Number(editExamState.duration);
    if (!durationNum || durationNum < 1) { setFormError('Duration must be at least 1 min.'); return; }
    setUpdatingExam(true);
    setFormError('');
    try {
      await updateExam({ 
        id: editingExam.id, 
        title: editExamState.title.trim(), 
        levelId: editExamState.levelId, 
        duration: durationNum 
      });
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
      dispatchQuestions({ type: 'SET_QUESTIONS', payload: qs });
    } catch (e: unknown) {
      setQError(e instanceof Error ? e.message : 'Failed to load questions');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!activeExam) return;
    if (!qFormData.qText.trim()) {
      setQError('Question prompt is required.');
      return;
    }

    const orderIndex = questions.length + 1;
    setQSaving(true);
    setQError('');
    try {
      const parseWords = (raw: string) =>
        raw
          .split(/[,\n]/g)
          .map((s) => s.trim())
          .filter(Boolean);

      const correctIndex = qFormData.qCorrect.charCodeAt(0) - 'A'.charCodeAt(0);
      const pickCorrectByLetter = (opts: string[]) => {
        if (correctIndex < 0 || correctIndex >= opts.length) return null;
        return opts[correctIndex]?.trim() ?? null;
      };

      if (qFormData.qType === 'paragraph') {
        if (!qFormData.pParagraph.trim()) throw new Error('Paragraph text is required.');

        if (qFormData.pSubtype === 'mcq') {
          if (qFormData.qOptions.some((o) => !o.trim())) throw new Error('All 4 options are required.');
          const options = qFormData.qOptions.map((o) => o.trim());
          const correctOption = pickCorrectByLetter(options);
          if (!correctOption) throw new Error('Please select the correct option (A/B/C/D).');

          await createExamQuestion({
            examId: activeExam.id,
            questionText: qFormData.qText.trim(),
            qType: 'paragraph',
            content: qFormData.pParagraph.trim(),
            options,
            correctAnswer: qFormData.qCorrect,
            correctAnswerJson: correctOption,
            extraData: { subtype: 'mcq' },
            orderIndex,
          });
        } else {
          const options = ['True', 'False'];
          await createExamQuestion({
            examId: activeExam.id,
            questionText: qFormData.qText.trim(),
            qType: 'paragraph',
            content: qFormData.pParagraph.trim(),
            options,
            correctAnswer: qFormData.tfCorrect === 'True' ? 'A' : 'B',
            correctAnswerJson: qFormData.tfCorrect === 'True',
            extraData: { subtype: 'true_false' },
            orderIndex,
          });
        }
      }

      if (qFormData.qType === 'grammar') {
        const sentence = qFormData.gSentence.trim();
        if (!sentence || !sentence.includes('___')) {
          throw new Error('Grammar sentence must include the blank token `___`.');
        }
        const words = parseWords(qFormData.gWordsRaw);
        if (words.length < 2) throw new Error('Provide at least 2 candidate words.');
        const correctWord = qFormData.gCorrectWord.trim();
        if (!correctWord) throw new Error('Correct word is required.');
        if (!words.some((w) => w.toLowerCase() === correctWord.toLowerCase())) {
          throw new Error('Correct word must be one of the candidate words.');
        }

        await createExamQuestion({
          examId: activeExam.id,
          questionText: qFormData.qText.trim(),
          qType: 'grammar',
          content: sentence,
          options: null,
          extraData: { words },
          correctAnswer: 'A',
          correctAnswerJson: correctWord,
          orderIndex,
        });
      }

      if (qFormData.qType === 'writing') {
        const words = parseWords(qFormData.wWordsRaw);
        if (words.length < 1) throw new Error('Word list is required.');

        await createExamQuestion({
          examId: activeExam.id,
          questionText: qFormData.qText.trim(),
          qType: 'writing',
          content: null,
          options: null,
          extraData: { words },
          correctAnswer: 'A',
          correctAnswerJson: null,
          orderIndex,
        });
      }

      if (qFormData.qType === 'listening') {
        if (!questionAudioFile) throw new Error('Audio file is required for listening questions.');
        if (questionAudioFile.size > MAX_UPLOAD_BYTES) throw new Error('Audio exceeds 200MB.');

        if (qFormData.qOptions.some((o) => !o.trim())) throw new Error('All 4 listening options are required.');
        const options = qFormData.qOptions.map((o) => o.trim());
        const correctOption = pickCorrectByLetter(options);
        if (!correctOption) throw new Error('Please select the correct option (A/B/C/D).');

        const audioUrl = listeningAudioUrl ?? await uploadMaterialAsset(questionAudioFile);
        if (!listeningAudioUrl) setListeningAudioUrl(audioUrl);
        await createExamQuestion({
          examId: activeExam.id,
          questionText: qFormData.qText.trim(),
          qType: 'listening',
          audioUrl,
          options,
          correctAnswer: qFormData.qCorrect,
          correctAnswerJson: correctOption,
          extraData: null,
          content: null,
          orderIndex,
        });
      }

      const qs = await fetchQuestionsByExamAdmin(activeExam.id);
      dispatchQuestions({ type: 'SET_QUESTIONS', payload: qs });

      // reset form fields for next question
      setQFormData({
        ...qFormData,
        qText: '',
        qOptions: ['', '', '', ''],
        qCorrect: 'A',
        pParagraph: '',
        gSentence: 'I ___ to school yesterday',
        gWordsRaw: 'go,went,gone',
        gCorrectWord: 'went',
        wWordsRaw: 'travel,Germany,experience',
        pSubtype: 'mcq' as 'mcq' | 'true_false',
        tfCorrect: 'True' as 'True' | 'False',
      });
      
      if (qFormData.qType !== 'listening') {
        setQuestionAudioFile(null);
        setListeningAudioUrl(null);
      }
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
      dispatchQuestions({ type: 'SET_QUESTIONS', payload: qs });
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
      dispatchQuestions({ type: 'DELETE_QUESTION', payload: id });
    } catch (e: unknown) {
      setQError(e instanceof Error ? e.message : 'Delete question failed');
    }
  };

  return (
    <motion.div initial={hasAnimated ? false : "hidden"} animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <AdminSidebar />
      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        <motion.header variants={ci} initial={hasAnimated ? false : "hidden"} animate="visible" className="mb-10 flex flex-col gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 w-full">
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase mb-3">Manage<br/><span className="text-[#C62828]">Exams.</span></h1>
              <p className="text-[#D4A373] font-black uppercase text-[10px] tracking-[0.5em] italic">{loading ? '—' : `${exams.length} Created`}</p>
            </div>
            {adminTab === 'bank' && (
              <button onClick={() => { setShowForm(p => !p); setFormError(''); }}
                className="flex items-center gap-3 bg-[#1A1A1A] text-white px-7 py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-[#C62828] transition-all active:scale-95 shadow-lg shrink-0">
                <Plus className={`w-5 h-5 transition-transform ${showForm ? 'rotate-45' : ''}`} /> New Exam
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAdminTab('bank')}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${adminTab === 'bank' ? 'bg-[#1A1A1A] text-white' : 'bg-white border border-[#1A1A1A]/10 text-[#1A1A1A]/50'}`}
            >
              Exam bank
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('submissions')}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${adminTab === 'submissions' ? 'bg-[#1A1A1A] text-white' : 'bg-white border border-[#1A1A1A]/10 text-[#1A1A1A]/50'}`}
            >
              Submissions
            </button>
          </div>
        </motion.header>

        {adminTab === 'bank' && (
        <>
        <AnimatePresence>
          {success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 relative z-10"><CheckCircle className="w-4 h-4 text-green-600 shrink-0" /><p className="text-xs font-bold text-green-700">{success}</p></motion.div>}
          {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 relative z-10"><AlertCircle className="w-4 h-4 text-[#C62828] shrink-0" /><p className="text-xs font-bold text-[#C62828]">{error}</p></motion.div>}
        </AnimatePresence>

        {/* Create Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[2.5rem] p-8 lg:p-10 border border-[#1A1A1A]/5 shadow-sm mb-8 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-[#1A1A1A] tracking-tighter uppercase text-lg flex items-center gap-3"><Award className="w-5 h-5 text-[#C62828]" /> New Exam</h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl bg-[#F5F5F0] text-[#1A1A1A]/40 hover:text-[#C62828]"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] ml-1 block">Exam Title</label>
                  <input type="text" value={examData.title} onChange={e => setExamData(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g. B1 Midterm"
                    className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 outline-none focus:ring-4 focus:ring-[#C62828]/10 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] ml-1 block">Level</label>
                  <select value={examData.levelId} onChange={e => setExamData(prev => ({ ...prev, levelId: e.target.value }))}
                    className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] outline-none appearance-none cursor-pointer">
                    {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] ml-1 block">Duration (min)</label>
                  <input type="number" value={examData.duration} onChange={e => setExamData(prev => ({ ...prev, duration: e.target.value }))} min="1" max="300"
                    className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] outline-none focus:ring-4 focus:ring-[#C62828]/10 transition-all" />
                </div>
              </div>
              {formError && <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-6"><AlertCircle className="w-4 h-4 text-[#C62828] shrink-0" /><p className="text-xs font-bold text-[#C62828]">{formError}</p></div>}
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowForm(false)} className="px-6 py-3 bg-[#F5F5F0] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-all active:scale-95">Cancel</button>
                <button onClick={handleCreate} disabled={creating}
                  className="flex items-center gap-2 px-8 py-3 bg-[#C62828] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all active:scale-95 disabled:opacity-60">
                  {creating ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exam Grid */}
        {loading
          ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">{[1,2,3].map(i => <div key={i} className="h-48 bg-white rounded-[2rem] animate-pulse" />)}</div>
          : exams.length === 0
            ? <div className="flex flex-col items-center py-32 relative z-10"><Award className="w-16 h-16 text-[#1A1A1A]/10 mb-6" /><p className="font-black text-[#1A1A1A]/30 uppercase text-xl">No exams yet.</p></div>
            : <motion.div variants={cv} initial={hasAnimated ? false : "hidden"} animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {exams.map(e => (
                  <motion.div key={e.id} variants={ci} whileHover={{ y: -4 }}
                    className="bg-white rounded-[2rem] p-7 border border-[#1A1A1A]/5 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-[#C62828]/[0.03] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-[#C62828]/10 transition-all" />
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-[#C62828]/10 flex items-center justify-center group-hover:bg-[#C62828] transition-all shrink-0">
                        <Award className="w-6 h-6 text-[#C62828] group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleDelete(e.id)} disabled={deleting === e.id}
                          className="w-8 h-8 rounded-lg bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/20 hover:bg-red-50 hover:text-[#C62828] transition-all active:scale-95 disabled:opacity-60 shrink-0">
                          {deleting === e.id ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => openEditExam(e)}
                          className="w-8 h-8 rounded-lg bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/30 hover:bg-[#1A1A1A] hover:text-white transition-all active:scale-95 shrink-0"
                          title="Edit exam"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#D4A373] italic">Level {e.levels?.name ?? '—'}</span>
                    <h3 className="text-lg font-black text-[#1A1A1A] tracking-tighter uppercase leading-tight mt-1 mb-4 line-clamp-2 group-hover:text-[#C62828] transition-colors">{e.title}</h3>
                    <div className="flex items-center gap-2 text-[9px] font-black text-[#1A1A1A]/30 uppercase tracking-widest">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{e.duration} Minutes</span>
                    </div>
                    <button
                      onClick={() => openQuestions(e)}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1A1A1A] text-white font-black text-[10px] uppercase tracking-widest hover:bg-[#C62828] transition-all"
                    >
                      <List className="w-3.5 h-3.5" />
                      Manage Questions
                    </button>
                  </motion.div>
                ))}
              </motion.div>
        }
        </>
        )}

        {adminTab === 'submissions' && (
          <section className="relative z-10 bg-white rounded-3xl border border-[#1A1A1A]/10 shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-[#1A1A1A]/10 flex items-center gap-3">
              <Clipboard className="w-5 h-5 text-[#C62828]" />
              <div>
                <h3 className="font-black uppercase text-[#1A1A1A] tracking-tight">Exam submissions</h3>
                <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/35">Review writing tasks and release Final scores</p>
              </div>
            </div>
            {subLoading ? (
              <div className="p-12 flex justify-center">
                <Loader className="w-8 h-8 animate-spin text-[#C62828]" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-12 text-center font-black text-[#1A1A1A]/30 uppercase text-sm">No submissions yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#1A1A1A]/10 bg-[#F5F5F0]/80">
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Student</th>
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Exam</th>
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Date</th>
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Status</th>
                      <th className="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/40 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A]/10">
                    {submissions.map((r) => (
                      <tr key={r.id} className="hover:bg-[#F5F5F0]/50">
                        <td className="px-6 py-4 font-bold text-[#1A1A1A]">{r.profiles?.name ?? '—'}</td>
                        <td className="px-6 py-4 text-[#1A1A1A]/70">{r.exams?.title ?? 'Exam'}</td>
                        <td className="px-6 py-4 text-[#1A1A1A]/50 text-xs">
                          {new Date(r.taken_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                              r.review_status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-900'
                            }`}
                          >
                            {r.review_status === 'completed' ? 'Completed' : 'Pending review'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/exams/${r.exam_id}/review/${r.student_id}`)}
                            className="text-[10px] font-black uppercase tracking-widest text-[#C62828] hover:underline"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

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
                    <X className="w-5 h-5 mx-auto" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 xl:grid-cols-2 gap-8 bg-[#F5F5F0]">
                  <div className="bg-white rounded-2xl p-6 border border-[#1A1A1A]/10">
                    <h4 className="font-black text-[#1A1A1A] uppercase tracking-tight mb-4">Add Question</h4>
                    <div className="space-y-3">
                      <select
                        value={qFormData.qType}
                        onChange={(e) => setQFormData(prev => ({ ...prev, qType: e.target.value as typeof qFormData.qType }))}
                        className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none"
                      >
                        <option value="paragraph">Paragraph (MCQ / True-False)</option>
                        <option value="grammar">Grammar (Drag & Drop)</option>
                        <option value="writing">Writing (Manual Review)</option>
                        <option value="listening">Listening (Audio MCQ)</option>
                      </select>

                      <input
                        value={qFormData.qText}
                        onChange={(e) => setQFormData(prev => ({ ...prev, qText: e.target.value }))}
                        placeholder="Question prompt"
                        className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none"
                      />

                      {qFormData.qType === 'paragraph' && (
                        <>
                          <select
                            value={qFormData.pSubtype}
                            onChange={(e) => setQFormData(prev => ({ ...prev, pSubtype: e.target.value as typeof qFormData.pSubtype }))}
                            className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none"
                          >
                            <option value="mcq">Reading + MCQ</option>
                            <option value="true_false">Reading + True/False</option>
                          </select>

                          <textarea
                            value={qFormData.pParagraph}
                            onChange={(e) => setQFormData(prev => ({ ...prev, pParagraph: e.target.value }))}
                            rows={4}
                            placeholder="Paragraph text (reading material)"
                            className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none resize-none"
                          />

                          {qFormData.pSubtype === 'mcq' ? (
                            <>
                              {['A', 'B', 'C', 'D'].map((label, idx) => (
                                <input
                                  key={label}
                                  value={qFormData.qOptions[idx]}
                                  onChange={(e) => setQFormData(prev => ({ 
                                    ...prev, 
                                    qOptions: prev.qOptions.map((v, i) => (i === idx ? e.target.value : v)) 
                                  }))}
                                  placeholder={`Option ${label}`}
                                  className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none"
                                />
                              ))}
                              <select
                                value={qFormData.qCorrect}
                                onChange={(e) => setQFormData(prev => ({ ...prev, qCorrect: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none"
                              >
                                {['A', 'B', 'C', 'D'].map((c) => (
                                  <option key={c} value={c}>
                                    Correct: {c}
                                  </option>
                                ))}
                              </select>
                            </>
                          ) : (
                            <select
                              value={qFormData.tfCorrect}
                              onChange={(e) => setQFormData(prev => ({ ...prev, tfCorrect: e.target.value as typeof qFormData.tfCorrect }))}
                              className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none"
                            >
                              <option value="True">Correct: True</option>
                              <option value="False">Correct: False</option>
                            </select>
                          )}
                        </>
                      )}

                      {qFormData.qType === 'grammar' && (
                        <>
                          <input
                            value={qFormData.gSentence}
                            onChange={(e) => setQFormData(prev => ({ ...prev, gSentence: e.target.value }))}
                            placeholder="Sentence with ___ blank"
                            className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none"
                          />
                          <textarea
                            value={qFormData.gWordsRaw}
                            onChange={(e) => setQFormData(prev => ({ ...prev, gWordsRaw: e.target.value }))}
                            rows={3}
                            placeholder="Candidate words (comma or newline separated)"
                            className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none resize-none"
                          />
                          <input
                            value={qFormData.gCorrectWord}
                            onChange={(e) => setQFormData(prev => ({ ...prev, gCorrectWord: e.target.value }))}
                            placeholder="Correct word"
                            className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none"
                          />
                        </>
                      )}

                      {qFormData.qType === 'writing' && (
                        <>
                          <textarea
                            value={qFormData.wWordsRaw}
                            onChange={(e) => setQFormData(prev => ({ ...prev, wWordsRaw: e.target.value }))}
                            rows={3}
                            placeholder="Allowed words/topic (comma or newline separated)"
                            className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none resize-none"
                          />
                        </>
                      )}

                      {qFormData.qType === 'listening' && (
                        <>
                          <input
                            type="file"
                            accept=".mp3,.wav,.m4a,audio/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0] ?? null;
                              setQuestionAudioFile(f);
                              setListeningAudioUrl(null);
                            }}
                            className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-xs font-black outline-none"
                          />
                          {['A', 'B', 'C', 'D'].map((label, idx) => (
                            <input
                              key={label}
                              value={qFormData.qOptions[idx]}
                              onChange={(e) => setQFormData(prev => ({ 
                                ...prev, 
                                qOptions: prev.qOptions.map((v, i) => (i === idx ? e.target.value : v)) 
                              }))}
                              placeholder={`Listening option ${label}`}
                              className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none"
                            />
                          ))}
                          <select
                            value={qFormData.qCorrect}
                            onChange={(e) => setQFormData(prev => ({ ...prev, qCorrect: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none"
                          >
                            {['A', 'B', 'C', 'D'].map((c) => (
                              <option key={c} value={c}>
                                Correct: {c}
                              </option>
                            ))}
                          </select>
                        </>
                      )}

                      <button
                        onClick={handleCreateQuestion}
                        disabled={qSaving}
                        className="w-full py-3 rounded-xl bg-[#C62828] text-white text-xs font-black uppercase tracking-widest hover:shadow-xl disabled:opacity-60"
                      >
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
                      <Upload className="w-4 h-4" />
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
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="mt-2 text-[10px] font-black text-[#1A1A1A]/50 uppercase tracking-wider">
                              Correct: {q.correct_answer}
                            </p>
                            {q.audio_url && (
                              <audio src={q.audio_url} controls className="w-full mt-2" />
                            )}
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
                  <button onClick={() => setEditingExam(null)} className="w-9 h-9 rounded-xl bg-[#F5F5F0] text-[#1A1A1A]/50"><X className="w-5 h-5 mx-auto" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
                  <input value={editExamState.title} onChange={e => setEditExamState(prev => ({ ...prev, title: e.target.value }))} placeholder="Exam title"
                    className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm outline-none" />
                  <select value={editExamState.levelId} onChange={e => setEditExamState(prev => ({ ...prev, levelId: e.target.value }))}
                    className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm outline-none">
                    {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <input type="number" value={editExamState.duration} onChange={e => setEditExamState(prev => ({ ...prev, duration: e.target.value }))} min="1"
                    className="w-full px-5 py-3.5 bg-[#F5F5F0] rounded-2xl font-black text-sm outline-none" />
                </div>
                {formError && <p className="mt-2 text-xs font-black text-[#C62828]">{formError}</p>}
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setEditingExam(null)} className="px-6 py-3 bg-[#F5F5F0] rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                  <button onClick={handleUpdateExam} disabled={updatingExam}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#C62828] text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-60">
                    {updatingExam ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
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
