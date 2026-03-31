import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  fetchExamsForInstructor, createExam, deleteExam, updateExam,
  fetchQuestionsByExamAdmin, createExamQuestion, updateExamQuestion, deleteExamQuestion,
  uploadMaterialAsset,
  type Exam, type Level, type ExamQuestion 
} from '../../services/adminService';
import { fetchInstructorLevels, fetchInstructorExamSubmissions } from '../../services/instructorService';
import { Award, Clock, Plus, X, Loader2, List, Trash2, Edit2, CheckCircle, AlertCircle } from 'lucide-react';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const ci = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

type QuestionAction =
  | { type: 'SET_QUESTIONS'; payload: ExamQuestion[] }
  | { type: 'ADD_QUESTION'; payload: ExamQuestion }
  | { type: 'UPDATE_QUESTION'; payload: ExamQuestion }
  | { type: 'DELETE_QUESTION'; payload: string }
  | { type: 'RESET' };

function questionsReducer(state: ExamQuestion[], action: QuestionAction): ExamQuestion[] {
  switch (action.type) {
    case 'SET_QUESTIONS': return action.payload;
    case 'ADD_QUESTION': return [...state, action.payload];
    case 'UPDATE_QUESTION': return state.map(q => q.id === action.payload.id ? action.payload : q);
    case 'DELETE_QUESTION': return state.filter(q => q.id !== action.payload);
    case 'RESET': return [];
    default: return state;
  }
}

export default function InstructorExams() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<(Exam & { groups: { name: string }[] })[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<'exams' | 'submissions'>('exams');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [subLoading, setSubLoading] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states (Exam)
  const [title, setTitle] = useState('');
  const [levelId, setLevelId] = useState('');
  const [duration, setDuration] = useState(60);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  // Question states
  const [activeExam, setActiveExam] = useState<any | null>(null);
  const [questions, dispatchQuestions] = useReducer(questionsReducer, []);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [qSaving, setQSaving] = useState(false);
  const [qError, setQError] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionAudioFile, setQuestionAudioFile] = useState<File | null>(null);
  const [listeningAudioUrl, setListeningAudioUrl] = useState<string | null>(null);

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

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    try {
      const [eData, lData] = await Promise.all([
        fetchExamsForInstructor(user.id),
        fetchInstructorLevels(user.id)
      ]);
      setExams(eData);
      setLevels(lData);
      if (lData.length > 0) setLevelId(lData[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const loadSubmissions = async () => {
    if (!user) return;
    setSubLoading(true);
    try {
      const data = await fetchInstructorExamSubmissions(user.id!);
      setSubmissions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSubLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'submissions') loadSubmissions();
  }, [tab]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!levelId) return setError('Choose a curriculum level');
    setSubmitting(true);
    try {
      if (editingExamId) {
        await updateExam({ id: editingExamId, title, levelId, duration });
        setSuccess('Exam updated successfully!');
      } else {
        await createExam({ title, levelId, duration });
        setSuccess('Exam created successfully!');
      }
      setShowModal(false);
      setEditingExamId(null);
      setTitle('');
      setDuration(60);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    try {
      await deleteExam(id);
      setExams(prev => prev.filter(e => e.id !== id));
      setSuccess('Exam deleted.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openQuestions = async (exam: any) => {
    setActiveExam(exam);
    setQuestionsLoading(true);
    setQError('');
    try {
      const qs = await fetchQuestionsByExamAdmin(exam.id);
      dispatchQuestions({ type: 'SET_QUESTIONS', payload: qs });
    } catch (e: any) {
      setQError(e.message);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleSaveQuestion = async () => {
    if (!activeExam) return;
    if (!qFormData.qText.trim()) return setQError('Question prompt required.');

    setQSaving(true);
    setQError('');
    try {
      const parseWords = (raw: string) => raw.split(/[,\n]/g).map(s => s.trim()).filter(Boolean);
      const correctIndex = qFormData.qCorrect.charCodeAt(0) - 'A'.charCodeAt(0);
      
      let payload: any = {
        examId: activeExam.id,
        questionText: qFormData.qText.trim(),
        qType: qFormData.qType,
        orderIndex: editingQuestionId ? undefined : (questions.length + 1),
      };
      if (editingQuestionId) payload.id = editingQuestionId;

      if (qFormData.qType === 'paragraph') {
        payload.content = qFormData.pParagraph.trim();
        payload.extraData = { subtype: qFormData.pSubtype };
        if (qFormData.pSubtype === 'mcq') {
          payload.options = qFormData.qOptions.map(o => o.trim());
          payload.correctAnswer = qFormData.qCorrect;
          payload.correctAnswerJson = payload.options[correctIndex];
        } else {
          payload.options = ['True', 'False'];
          payload.correctAnswer = qFormData.tfCorrect === 'True' ? 'A' : 'B';
          payload.correctAnswerJson = qFormData.tfCorrect === 'True';
        }
      } else if (qFormData.qType === 'grammar') {
        payload.content = qFormData.gSentence.trim();
        const words = parseWords(qFormData.gWordsRaw);
        payload.extraData = { words };
        payload.correctAnswer = 'A';
        payload.correctAnswerJson = qFormData.gCorrectWord.trim();
      } else if (qFormData.qType === 'writing') {
        payload.extraData = { words: parseWords(qFormData.wWordsRaw) };
        payload.correctAnswer = 'A';
      } else if (qFormData.qType === 'listening') {
        if (!listeningAudioUrl && !questionAudioFile) throw new Error('Audio required.');
        payload.audioUrl = listeningAudioUrl ?? await uploadMaterialAsset(questionAudioFile!);
        payload.options = qFormData.qOptions.map(o => o.trim());
        payload.correctAnswer = qFormData.qCorrect;
        payload.correctAnswerJson = payload.options[correctIndex];
      }

      if (editingQuestionId) await updateExamQuestion(payload);
      else await createExamQuestion(payload);

      const qs = await fetchQuestionsByExamAdmin(activeExam.id);
      dispatchQuestions({ type: 'SET_QUESTIONS', payload: qs });
      setEditingQuestionId(null);
      setSuccess('Question saved!');
      setQFormData({ ...qFormData, qText: '', pParagraph: '' }); // partial reset
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setQError(e.message);
    } finally {
      setQSaving(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await deleteExamQuestion(id);
      dispatchQuestions({ type: 'DELETE_QUESTION', payload: id });
    } catch (e: any) {
      setQError(e.message);
    }
  };

  const openEditQuestion = (q: ExamQuestion) => {
    setEditingQuestionId(q.id);
    const opts = Array.isArray(q.options) ? q.options : ['', '', '', ''];
    setQFormData({
      qText: q.question_text,
      qOptions: [opts[0] || '', opts[1] || '', opts[2] || '', opts[3] || ''],
      qCorrect: q.correct_answer || 'A',
      qType: (q.type as any) || 'paragraph',
      pSubtype: (q.extra_data as any)?.subtype || 'mcq',
      pParagraph: q.content || '',
      gSentence: q.type === 'grammar' ? q.content || '' : 'I ___ to school yesterday',
      gWordsRaw: (q.extra_data as any)?.words?.join(',') || 'go,went,gone',
      gCorrectWord: q.correct_answer_json as string || 'went',
      wWordsRaw: (q.extra_data as any)?.words?.join(',') || 'travel,Germany,experience',
      tfCorrect: q.correct_answer_json === true ? 'True' : 'False',
    });
    setListeningAudioUrl(q.audio_url || null);
    setQError('');
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:ml-80 p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#D4A373]/[0.02] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

      {/* Alerts */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-5 relative z-[1001]">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-xs font-black uppercase tracking-wider text-green-700">{success}</p>
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-5 relative z-[1001]">
            <AlertCircle className="w-5 h-5 text-[#D4A373] shrink-0" />
            <p className="text-xs font-black uppercase tracking-wider text-[#D4A373]">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header variants={ci} className="mb-14 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-8">
        <div>
           <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase mb-3">
             Cohort<br /><span className="text-[#D4A373]">Exams.</span>
           </h1>
           <p className="text-[#1A1A1A]/40 font-black uppercase text-[10px] tracking-[0.5em] italic">
             Standardized Evaluations
           </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-white rounded-2xl p-1 border border-[#1A1A1A]/5 shadow-sm">
            <button 
              onClick={() => setTab('exams')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'exams' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]'}`}
            >
              Exams
            </button>
            <button 
              onClick={() => setTab('submissions')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'submissions' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]'}`}
            >
              Submissions
            </button>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-8 py-4 bg-[#1A1A1A] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-2xl hover:bg-[#D4A373] transition-all flex items-center gap-3 active:scale-95 group shadow-xl"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            New Examination
          </button>
        </div>
      </motion.header>

      {tab === 'exams' ? (
        <motion.div variants={ci} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 font-body">
          {loading ? (
            [1, 2].map(i => (
              <div key={i} className="h-64 bg-white rounded-[2.5rem] p-8 border border-[#1A1A1A]/5 animate-pulse font-sans" />
            ))
          ) : exams.length === 0 ? (
            <div className="col-span-full py-32 bg-white rounded-[3rem] border border-[#1A1A1A]/5 text-center flex flex-col items-center justify-center font-sans">
              <div className="w-20 h-20 bg-[#F5F5F0] rounded-full flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-[#1A1A1A]/10" />
              </div>
              <p className="font-black text-[#1A1A1A]/30 uppercase tracking-widest text-sm">No scheduled evaluations for your nodes.</p>
            </div>
          ) : (
            exams.map((exam) => (
              <div key={exam.id} className="bg-white rounded-[2.5rem] p-10 border border-[#1A1A1A]/5 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden flex flex-col font-sans group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A373]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="w-12 h-12 bg-[#F5F5F0] rounded-2xl flex items-center justify-center text-[#D4A373] group-hover:bg-[#D4A373] group-hover:text-white transition-colors">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingExamId(exam.id); setTitle(exam.title); setLevelId(exam.level_id); setDuration(exam.duration); setShowModal(true); }} className="w-9 h-9 rounded-xl bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/20 hover:bg-[#1A1A1A] hover:text-white transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteExam(exam.id)} className="w-9 h-9 rounded-xl bg-[#F5F5F0] flex items-center justify-center text-[#1A1A1A]/20 hover:bg-red-50 hover:text-[#D4A373] transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <h3 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase mb-2 leading-none relative z-10">{exam.title}</h3>
                <p className="text-[10px] text-[#D4A373] font-black uppercase tracking-widest mb-10 italic relative z-10">Academic Standard Evaluation</p>

                <div className="space-y-4 mt-auto relative z-10">
                  <div className="flex flex-wrap gap-2">
                    {exam.groups && exam.groups.length > 0 ? exam.groups.map(g => (
                      <span key={g.name} className="px-3 py-1.5 bg-[#1A1A1A]/5 text-[#1A1A1A]/60 text-[8px] font-black uppercase tracking-widest rounded-full border border-black/5">
                        {g.name}
                      </span>
                    )) : (
                      <span className="px-3 py-1.5 bg-[#1A1A1A]/5 text-[#1A1A1A]/30 text-[8px] font-black uppercase tracking-widest rounded-full italic">Open Access</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px] font-black text-[#1A1A1A]/30 uppercase tracking-[0.2em] mb-8">
                    <Clock className="w-3.5 h-3.5" />
                    {exam.duration} Minutes
                  </div>

                  <button onClick={() => openQuestions(exam)} className="w-full flex items-center justify-center gap-4 py-4 bg-[#1A1A1A] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#D4A373] transition-all shadow-xl active:scale-95 border-none">
                    <List className="w-4 h-4" />
                    Manage Questions
                  </button>
                </div>
              </div>
            ))
          )}
        </motion.div>
      ) : (
        <motion.div variants={ci} className="bg-white rounded-[2.5rem] border border-[#1A1A1A]/5 shadow-sm overflow-hidden relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="border-b border-[#1A1A1A]/5 bg-[#F5F5F0]/50">
                  {['Candidate', 'Evaluation', 'Performance', 'Session Date'].map(h => (
                    <th key={h} className="px-8 py-6 text-[9px] font-black uppercase tracking-[0.4em] text-[#D4A373] italic">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subLoading ? (
                  [1, 2, 3].map(i => (
                    <tr key={i} className="animate-pulse border-b border-[#1A1A1A]/5 h-20 bg-[#F5F5F0]/20" />
                  ))
                ) : submissions.length === 0 ? (
                  <tr><td colSpan={4} className="px-8 py-20 text-center font-black text-[#1A1A1A]/20 uppercase text-xs tracking-widest">No data available yet.</td></tr>
                ) : (
                  submissions.map(s => (
                    <tr key={s.id} className="border-b border-[#1A1A1A]/5 hover:bg-[#F5F5F0]/40 transition-all">
                      <td className="px-8 py-6">
                        <p className="font-black text-sm uppercase tracking-tighter text-[#1A1A1A]">{s.profiles?.name}</p>
                        <p className="text-[10px] font-bold text-[#1A1A1A]/30 uppercase tracking-widest">{s.profiles?.email}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-black text-xs uppercase text-[#1A1A1A]/70">{s.exams?.title}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${s.score >= 50 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                            {s.score}% Match
                          </span>
                          {s.review_status !== 'completed' && (
                            <button 
                              onClick={() => navigate(`/instructor/exams/${s.exam_id}/review/${s.student_id}`)}
                              className="px-4 py-1.5 bg-[#D4A373] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg hover:shadow-[#D4A373]/30 transition-all flex items-center gap-2"
                            >
                              <Award className="w-3 h-3" /> Review
                            </button>
                          )}
                          {s.review_status === 'completed' && (
                            <span className="text-[10px] font-black uppercase text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-100">Evaluated</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-[10px] font-black text-[#1A1A1A]/40 uppercase tracking-widest">
                          {new Date(s.taken_at).toLocaleDateString('en-GB')}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Creation Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1A1A1A]/20 backdrop-blur-xl">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl border border-[#1A1A1A]/5 overflow-hidden">
                <div className="p-10 border-b border-[#1A1A1A]/5 flex items-center justify-between">
                   <h2 className="text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase">New <span className="text-[#D4A373]">Exam.</span></h2>
                   <button onClick={() => setShowModal(false)} className="p-3 bg-[#F5F5F0] rounded-full text-[#1A1A1A]/20 hover:text-[#D4A373] transition-colors"><X className="w-5 h-5" /></button>
                </div>
                
                <form onSubmit={handleCreate} className="p-10 space-y-6">
                   {error && <p className="text-[10px] font-black uppercase text-[#D4A373] bg-red-50 p-4 rounded-xl">{error}</p>}
                   
                   <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-4">Examination Title</label>
                      <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Final Certification Test" className="w-full px-6 py-4 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] outline-none focus:ring-4 focus:ring-[#D4A373]/10" />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[8px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-4">Target Node</label>
                         <select required value={levelId} onChange={e => setLevelId(e.target.value)} className="w-full px-6 py-4 bg-[#F5F5F0] rounded-2xl font-black text-xs uppercase tracking-widest text-[#1A1A1A] outline-none appearance-none cursor-pointer">
                            {levels.map(l => <option key={l.id} value={l.id}>Level {l.name}</option>)}
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[8px] font-black uppercase tracking-widest text-[#1A1A1A]/30 ml-4">Limit (Min)</label>
                         <input type="number" required value={duration} onChange={e => setDuration(parseInt(e.target.value))} className="w-full px-6 py-4 bg-[#F5F5F0] rounded-2xl font-black text-sm text-[#1A1A1A] outline-none" />
                      </div>
                   </div>

                   <button disabled={submitting} type="submit" className="w-full py-5 bg-[#1A1A1A] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:shadow-2xl hover:bg-[#D4A373] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mt-4">
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-4 h-4" /> Initialize Exam</>}
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeExam && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110]">
            <button className="absolute inset-0 bg-black/55" onClick={() => setActiveExam(null)} />
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} className="absolute inset-4 md:inset-8 lg:inset-12 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
               <div className="px-6 md:px-8 py-5 border-b border-[#1A1A1A]/10 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#D4A373]">Question Node Management</p>
                    <h3 className="text-lg md:text-xl font-black tracking-tight text-[#1A1A1A] uppercase mt-1">{activeExam.title}</h3>
                  </div>
                  <button onClick={() => setActiveExam(null)} className="w-9 h-9 rounded-xl bg-[#F5F5F0] text-[#1A1A1A]/50 hover:text-[#D4A373] flex items-center justify-center transition-colors">
                    <X className="w-5 h-5" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 xl:grid-cols-2 gap-8 bg-[#F5F5F0]">
                  <div className="bg-white rounded-2xl p-6 border border-[#1A1A1A]/10 space-y-4">
                    <h4 className="font-black text-[#1A1A1A] uppercase tracking-tight mb-2">Configure Question</h4>
                    {qError && <p className="text-[10px] font-black uppercase text-[#D4A373] bg-red-50 p-3 rounded-xl">{qError}</p>}
                    
                    <select
                      value={qFormData.qType}
                      onChange={(e) => setQFormData({ ...qFormData, qType: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none"
                    >
                      <option value="paragraph">Paragraph (MCQ / True-False)</option>
                      <option value="grammar">Grammar (Drag & Drop)</option>
                      <option value="writing">Writing (Manual Review)</option>
                      <option value="listening">Listening (Audio MCQ)</option>
                    </select>

                    <input value={qFormData.qText} onChange={(e) => setQFormData({...qFormData, qText: e.target.value})} placeholder="Question prompt" className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none" />

                    {qFormData.qType === 'paragraph' && (
                      <>
                        <select value={qFormData.pSubtype} onChange={(e) => setQFormData({...qFormData, pSubtype: e.target.value as any})} className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none">
                          <option value="mcq">Reading + MCQ</option>
                          <option value="true_false">Reading + True/False</option>
                        </select>
                        <textarea value={qFormData.pParagraph} onChange={(e) => setQFormData({...qFormData, pParagraph: e.target.value})} rows={4} placeholder="Paragraph text..." className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none resize-none" />
                        {qFormData.pSubtype === 'mcq' ? (
                          <>
                            {['A', 'B', 'C', 'D'].map((label, idx) => (
                              <input key={label} value={qFormData.qOptions[idx]} onChange={(e) => {
                                const next = [...qFormData.qOptions]; next[idx] = e.target.value; setQFormData({...qFormData, qOptions: next});
                              }} placeholder={`Option ${label}`} className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none" />
                            ))}
                            <select value={qFormData.qCorrect} onChange={(e) => setQFormData({...qFormData, qCorrect: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none">
                              {['A', 'B', 'C', 'D'].map(c => <option key={c} value={c}>Correct: {c}</option>)}
                            </select>
                          </>
                        ) : (
                          <select value={qFormData.tfCorrect} onChange={(e) => setQFormData({...qFormData, tfCorrect: e.target.value as any})} className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none">
                            <option value="True">Correct: True</option><option value="False">Correct: False</option>
                          </select>
                        )}
                      </>
                    )}

                    {qFormData.qType === 'grammar' && (
                      <>
                        <input value={qFormData.gSentence} onChange={(e) => setQFormData({...qFormData, gSentence: e.target.value})} placeholder="Sentence with ___" className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none" />
                        <textarea value={qFormData.gWordsRaw} onChange={(e) => setQFormData({...qFormData, gWordsRaw: e.target.value})} rows={3} placeholder="Candidate words (comma separated)" className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none resize-none" />
                        <input value={qFormData.gCorrectWord} onChange={(e) => setQFormData({...qFormData, gCorrectWord: e.target.value})} placeholder="Correct word" className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none" />
                      </>
                    )}

                    {qFormData.qType === 'writing' && <textarea value={qFormData.wWordsRaw} onChange={(e) => setQFormData({...qFormData, wWordsRaw: e.target.value})} rows={3} placeholder="Mandatory words..." className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none resize-none" />}

                    {qFormData.qType === 'listening' && (
                       <>
                         <input type="file" accept="audio/*" onChange={(e) => setQuestionAudioFile(e.target.files?.[0] || null)} className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-xs font-black outline-none" />
                         {['A', 'B', 'C', 'D'].map((label, idx) => (
                              <input key={label} value={qFormData.qOptions[idx]} onChange={(e) => {
                                const next = [...qFormData.qOptions]; next[idx] = e.target.value; setQFormData({...qFormData, qOptions: next});
                              }} placeholder={`Listening option ${label}`} className="w-full px-4 py-3 rounded-xl bg-[#F5F5F0] border border-[#1A1A1A]/10 text-sm font-black outline-none" />
                            ))}
                       </>
                    )}

                    <button onClick={handleSaveQuestion} disabled={qSaving} className="w-full py-4 bg-[#D4A373] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all disabled:opacity-50">
                      {qSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editingQuestionId ? 'Update' : 'Add to Exam'}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-black text-[#1A1A1A] uppercase tracking-tight mb-2">Manifest ({questions.length})</h4>
                    {questionsLoading ? <div className="p-10 bg-white rounded-2xl animate-pulse" /> : questions.length === 0 ? <p className="text-xs font-black text-[#1A1A1A]/20 uppercase">No questions added.</p> : (
                      <div className="space-y-3">
                        {questions.map((q, idx) => (
                          <div key={q.id} className="bg-white p-5 rounded-2xl border border-[#1A1A1A]/10 flex items-start justify-between group">
                            <div>
                              <p className="text-[10px] font-black text-[#D4A373] uppercase mb-1">Index {idx + 1} • {q.type}</p>
                              <h5 className="font-bold text-sm text-[#1A1A1A] line-clamp-1">{q.question_text}</h5>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditQuestion(q)} className="p-2 bg-[#F5F5F0] rounded-lg text-[#1A1A1A]/40 hover:text-[#1A1A1A]"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 bg-[#F5F5F0] rounded-lg text-red-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
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
    </motion.div>
  );
}
