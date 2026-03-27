import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCheckCircle, FiChevronLeft, FiChevronRight, FiClock, FiLoader } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { fetchExamById, fetchQuestionsByExam, fetchResultForExam, submitExamAndGrade, type Exam, type ExamQuestion } from '../../services/studentService';

export default function ExamPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [bypassProtection, setBypassProtection] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const pendingLeaveRef = useRef<null | (() => void)>(null);
  const protectionEnabled = useMemo(() => {
    if (!exam) return false;
    if (!user) return false;
    if (submitting) return false;
    if (submitted) return false;
    if (bypassProtection) return false;
    return true;
  }, [exam, user, submitting, submitted, bypassProtection]);
  const examUrlRef = useRef<string>('');

  const backupKey = useMemo(() => {
    if (!id || !user) return null;
    return `exam_backup_${user.id}_${id}`;
  }, [id, user]);

  const answersRef = useRef<Record<string, string>>({});
  const indexRef = useRef<number>(0);

  useEffect(() => {
    if (!id || !user) return;
    const examId = id;
    const userId = user.id;
    let cancelled = false;
    async function load() {
      try {
        const existing = await fetchResultForExam(userId, examId);
        if (existing) {
          navigate('/student/results', { replace: true });
          return;
        }
        const [examData, questionData] = await Promise.all([
          fetchExamById(examId),
          fetchQuestionsByExam(examId),
        ]);
        if (cancelled) return;
        setExam(examData);
        setQuestions(questionData);
        setTimeLeft(examData.duration * 60);

        // Restore autosaved answers (if any)
        if (backupKey) {
          try {
            const raw = localStorage.getItem(backupKey);
            if (raw) {
              const parsed = JSON.parse(raw) as { answers?: Record<string, string>; currentIndex?: number };
              if (parsed?.answers && typeof parsed.answers === 'object') {
                setAnswers(parsed.answers);
              }
              if (typeof parsed.currentIndex === 'number') {
                setCurrentIndex(Math.max(0, Math.min(questionData.length - 1, parsed.currentIndex)));
              }
            }
          } catch {
            // Ignore corrupted localStorage
          }
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load exam');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, user, navigate]);

  useEffect(() => {
    answersRef.current = answers;
    indexRef.current = currentIndex;
  }, [answers, currentIndex]);

  // Auto-save answers every 30 seconds (localStorage backup)
  useEffect(() => {
    if (!protectionEnabled || !backupKey) return;
    const interval = window.setInterval(() => {
      try {
        const payload = {
          answers: answersRef.current,
          currentIndex: indexRef.current,
          savedAt: Date.now(),
        };
        localStorage.setItem(backupKey, JSON.stringify(payload));
      } catch {
        // localStorage may be unavailable; don't break exam UX
      }
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [protectionEnabled, backupKey]);

  const LEAVE_MESSAGE = "⚠️ You're about to leave this exam. Your answers may not be saved. Are you sure you want to exit?";

  useEffect(() => {
    if (!protectionEnabled || !backupKey) return;
    examUrlRef.current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      // Most browsers ignore custom UI, but the confirmation text is preserved via returnValue.
      e.preventDefault();
      e.returnValue = LEAVE_MESSAGE;
      return LEAVE_MESSAGE;
    };

    window.addEventListener('beforeunload', onBeforeUnload);

    const onPopState = () => {
      if (!protectionEnabled) return;
      // Browser back/forward (history) handling.
      // We'll immediately revert to the exam URL, then let the user decide via modal.
      const destUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.history.replaceState(null, '', examUrlRef.current);
      requestLeave(() => {
        setBypassProtection(true);
        navigate(destUrl, { replace: true });
      });
    };
    window.addEventListener('popstate', onPopState);

    // Prime history so popstate triggers
    try {
      window.history.pushState(null, '', window.location.href);
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('popstate', onPopState);
    };
  }, [protectionEnabled, backupKey]);

  // Intercept clicks on react-router links (and other anchors) so student sees the modal.
  useEffect(() => {
    if (!protectionEnabled) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Only handle left-clicks on same-tab navigation.
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;

      const href = anchor.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#')) return;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return;

      const url = new URL(href, window.location.href);
      const dest = `${url.pathname}${url.search}${url.hash}`;
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (dest === current) return;

      e.preventDefault();
      requestLeave(() => {
        setBypassProtection(true);
        navigate(dest, { replace: false });
      });
    };

    document.addEventListener('click', onDocClick, true);
    return () => document.removeEventListener('click', onDocClick, true);
  }, [protectionEnabled, navigate]);

  const requestLeave = (leaveAction: () => void) => {
    if (!protectionEnabled) {
      leaveAction();
      return;
    }
    pendingLeaveRef.current = leaveAction;
    setLeaveDialogOpen(true);
  };

  const confirmLeave = () => {
    setLeaveDialogOpen(false);
    setBypassProtection(true);
    const action = pendingLeaveRef.current;
    pendingLeaveRef.current = null;
    action?.();
  };

  const cancelLeave = () => {
    setLeaveDialogOpen(false);
    pendingLeaveRef.current = null;
  };

  useEffect(() => {
    if (loading || !exam || submitting) return;
    if (timeLeft <= 0) {
      void handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading, exam, submitting]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const handleChoose = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  async function handleSubmit() {
    if (!id || !user || submitting) return;
    const examId = id;
    const userId = user.id;
    setSubmitting(true);
    setError('');
    try {
      await submitExamAndGrade({
        examId,
        studentId: userId,
        answers,
      });
      setSubmitted(true);
      if (backupKey) {
        try {
          localStorage.removeItem(backupKey);
        } catch {
          // ignore
        }
      }
      navigate('/student/results', { replace: true });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit exam');
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center"><FiLoader className="w-8 h-8 animate-spin text-[#C62828]" /></div>;
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-6">
        <div className="bg-white border border-[#1A1A1A]/10 rounded-3xl p-8 max-w-lg text-center">
          <p className="font-black text-[#1A1A1A] text-xl uppercase">Exam unavailable</p>
          <p className="text-sm text-[#1A1A1A]/50 mt-2">This exam has no questions yet.</p>
          <button onClick={() => navigate('/student/exams')} className="mt-6 px-6 py-3 rounded-xl bg-[#C62828] text-white text-xs font-black uppercase tracking-widest">
            Back to exams
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F5F5F0] pb-10">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#1A1A1A]/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => requestLeave(() => navigate('/student/exams'))}
              className="w-10 h-10 rounded-xl bg-[#F5F5F0] text-[#1A1A1A]/60 hover:text-[#C62828]"
            >
              <FiArrowLeft className="w-5 h-5 mx-auto" />
            </button>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#D4A373]">Exam in progress</p>
              <h1 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">{exam.title}</h1>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2 ${timeLeft < 120 ? 'bg-[#C62828] text-white' : 'bg-[#F5F5F0] text-[#1A1A1A]'}`}>
            <FiClock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 bg-white rounded-3xl border border-[#1A1A1A]/10 p-6 sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#D4A373] mb-3">
            Question {currentIndex + 1} / {questions.length}
          </p>
          <h2 className="text-2xl font-black tracking-tight text-[#1A1A1A] mb-6">{currentQuestion.question_text}</h2>

          <div className="space-y-3">
            {(currentQuestion.options ?? []).map((option, index) => {
              const label = String.fromCharCode(65 + index);
              const checked = answers[currentQuestion.id] === label;
              return (
                <button
                  key={`${currentQuestion.id}-${label}`}
                  type="button"
                  onClick={() => handleChoose(currentQuestion.id, label)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${checked ? 'border-[#C62828] bg-[#C62828]/5' : 'border-[#1A1A1A]/10 bg-[#F5F5F0] hover:border-[#C62828]/40'}`}
                >
                  <span className="font-black text-sm text-[#1A1A1A]">{label}. {option}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5F5F0] text-xs font-black uppercase tracking-widest disabled:opacity-40"
            >
              <FiChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
              disabled={currentIndex === questions.length - 1}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5F5F0] text-xs font-black uppercase tracking-widest disabled:opacity-40"
            >
              Next
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        <aside className="lg:col-span-4 bg-[#1A1A1A] text-white rounded-3xl p-6">
          <h3 className="font-black uppercase tracking-tight text-lg mb-4">Progress</h3>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-2">
            <div className="h-full bg-[#C62828]" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-6">{answeredCount}/{questions.length} answered</p>

          <div className="grid grid-cols-5 gap-2 mb-6">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`h-9 rounded-lg text-[10px] font-black ${currentIndex === i ? 'bg-white text-[#1A1A1A]' : answers[q.id] ? 'bg-[#C62828] text-white' : 'bg-white/10 text-white/40'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {error && <p className="text-xs text-[#ffb4b4] font-bold mb-4">{error}</p>}

          <button
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#C62828] text-white text-xs font-black uppercase tracking-widest hover:brightness-95 disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {submitting ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiCheckCircle className="w-4 h-4" />}
            {submitting ? 'Submitting...' : 'Submit exam'}
          </button>
        </aside>
      </main>

      {leaveDialogOpen && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/60" onClick={cancelLeave} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#1A1A1A]/10 shadow-2xl p-6 sm:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#D4A373]">Leave exam</p>
            <p className="text-sm font-bold text-[#1A1A1A]/70 mt-3">
              ⚠️ You're about to leave this exam. Your answers may not be saved. Are you sure you want to exit?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={cancelLeave} className="px-5 py-3 rounded-2xl bg-[#F5F5F0] font-black text-xs uppercase tracking-widest">
                Stay on Exam
              </button>
              <button onClick={confirmLeave} className="px-6 py-3 rounded-2xl bg-[#C62828] text-white font-black text-xs uppercase tracking-widest">
                Leave Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
