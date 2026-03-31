import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchExamById,
  fetchQuestionsByExam,
  fetchResultForExam,
  submitExamAndGrade,
  fetchExamAnswers,
  upsertExamAnswer,
  type Exam,
  type ExamQuestion,
} from '../../services/studentService';

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function isAnswered(question: ExamQuestion, answer: unknown): boolean {
  if (answer === null || answer === undefined) return false;
  if (question.type === 'writing') return typeof answer === 'string' && answer.trim().length > 0;
  if (question.type === 'grammar') return typeof answer === 'string' && answer.trim().length > 0;

  // mcq/listening/paragraph can be boolean (TF) or string (options)
  if (question.type === 'paragraph') {
    const subtype = (question.extra_data as any)?.subtype ?? (question.extra_data as any)?.question_subtype ?? 'mcq';
    const isTF = String(subtype).toLowerCase().includes('true');
    if (isTF) return typeof answer === 'boolean';
    return typeof answer === 'string' && answer.trim().length > 0;
  }

  return typeof answer === 'string' ? answer.trim().length > 0 : typeof answer === 'boolean';
}

function normalizeParagraphAnswer(question: ExamQuestion, answer: unknown): unknown {
  const subtype = (question.extra_data as any)?.subtype ?? (question.extra_data as any)?.question_subtype ?? 'mcq';
  const isTF = String(subtype).toLowerCase().includes('true');
  if (!isTF) return typeof answer === 'string' ? answer : '';
  if (typeof answer === 'boolean') return answer;
  if (typeof answer === 'string') return answer.trim().toLowerCase() === 'true';
  return null;
}

export default function ExamPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [bypassProtection, setBypassProtection] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const pendingLeaveRef = useRef<null | (() => void)>(null);
  const [submitConrmOpen, setSubmitConrmOpen] = useState(false);

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

  const currentQuestion = questions[currentIndex];

  // Auto-save timers (per question)
  const saveTimersRef = useRef<Record<string, number>>({});
  const lastSavedRef = useRef<Record<string, string>>({});
  const submittingRef = useRef(false);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  const scheduleSave = (questionId: string, nextAnswer: unknown) => {
    if (!protectionEnabled || !id || !user) return;
    if (submitting) return;

    const normalized =
      (typeof nextAnswer === 'string' && nextAnswer.trim().length === 0) ? null
      : nextAnswer;

    // Avoid hammering network when the value hasn't changed.
    const key = questionId;
    const ngerprint = JSON.stringify(normalized);
    if (lastSavedRef.current[key] === ngerprint) return;

    if (saveTimersRef.current[key]) window.clearTimeout(saveTimersRef.current[key]);
    saveTimersRef.current[key] = window.setTimeout(async () => {
      if (submittingRef.current) return;
      try {
        await upsertExamAnswer({
          studentId: user.id,
          examId: id,
          questionId: questionId,
          answer: normalized,
        });
        lastSavedRef.current[key] = ngerprint;
      } catch (e: unknown) {
        // Autosave errors should not block the exam; just surface a soft error.
        setError(e instanceof Error ? e.message : 'Autosave failed');
      }
    }, 700);
  };

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

        const [examData, questionData, savedAnswers] = await Promise.all([
          fetchExamById(examId),
          fetchQuestionsByExam(examId),
          fetchExamAnswers(userId, examId).catch(() => ({})),
        ]);

        if (cancelled) return;
        setExam(examData);
        setQuestions(questionData);
        
        // Calculate the target end time
        const durationSeconds = examData.duration * 60;
        const endTime = Date.now() + (durationSeconds * 1000);
        (window as any).__examEndTime = endTime;
        setTimeLeft(durationSeconds);
        
        setAnswers(savedAnswers ?? {});

        // localStorage fallback (for resilience)
        if (backupKey) {
          try {
            const raw = localStorage.getItem(backupKey);
            if (raw) {
              const parsed = JSON.parse(raw) as { answers?: Record<string, unknown>; currentIndex?: number };
              if (parsed?.answers && typeof parsed.answers === 'object') {
                setAnswers(prev => ({ ...prev, ...parsed.answers }));
              }
              if (typeof parsed.currentIndex === 'number') {
                setCurrentIndex(Math.max(0, Math.min(questionData.length - 1, parsed.currentIndex)));
              }
            }
          } catch {
            // ignore corrupted localStorage
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
  }, [id, user, navigate, backupKey]);

  useEffect(() => {
    if (!protectionEnabled || !backupKey) return;
    // Immediate backup to localStorage on any change
    try {
      const payload = {
        answers,
        currentIndex,
        savedAt: Date.now(),
      };
      localStorage.setItem(backupKey, JSON.stringify(payload));
    } catch {
      // ignore
    }
    
    // Also keep a 10s interval for extra safety
    const interval = window.setInterval(() => {
      try {
        const payload = {
          answers,
          currentIndex,
          savedAt: Date.now(),
        };
        localStorage.setItem(backupKey, JSON.stringify(payload));
      } catch {
        // ignore
      }
    }, 10_000);
    return () => window.clearInterval(interval);
  }, [protectionEnabled, backupKey, answers, currentIndex]);

  const requestLeave = (leaveAction: () => void) => {
    if (!protectionEnabled) {
      leaveAction();
      return;
    }
    pendingLeaveRef.current = leaveAction;
    setLeaveDialogOpen(true);
  };

  const conrmLeave = () => {
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

  const LEAVE_MESSAGE = "⚠️ You're about to leave this exam. Your answers may not be saved. Are you sure you want to exit?";

  useEffect(() => {
    if (!protectionEnabled || !backupKey) return;
    examUrlRef.current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = LEAVE_MESSAGE;
      return LEAVE_MESSAGE;
    };

    window.addEventListener('beforeunload', onBeforeUnload);

    const onPopState = () => {
      if (!protectionEnabled) return;
      const destUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.history.replaceState(null, '', examUrlRef.current);
      requestLeave(() => {
        setBypassProtection(true);
        navigate(destUrl, { replace: true });
      });
    };
    window.addEventListener('popstate', onPopState);

    try {
      window.history.pushState(null, '', window.location.href);
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('popstate', onPopState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protectionEnabled, backupKey, navigate]);

  useEffect(() => {
    if (!protectionEnabled) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
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

  useEffect(() => {
    if (loading || !exam || submitting) return;
    
    const interval = window.setInterval(() => {
      const target = (window as any).__examEndTime;
      if (!target) return;
      
      const now = Date.now();
      const diff = Math.max(0, Math.floor((target - now) / 1000));
      
      if (diff <= 0) {
        setTimeLeft(0);
        setSubmitConrmOpen(false);
        void handleSubmit();
        window.clearInterval(interval);
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [loading, exam, submitting]);

  const answeredCount = questions.reduce((acc, q) => acc + (isAnswered(q, answers[q.id]) ? 1 : 0), 0);
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const [listeningAudioTime, setListeningAudioTime] = useState(0);
  const [listeningAudioDuration, setListeningAudioDuration] = useState(0);
  const [listeningPlaying, setListeningPlaying] = useState(false);
  const [grammarDragOver, setGrammarDragOver] = useState(false);
  const listeningAudioRef = useRef<HTMLAudioElement | null>(null);
  const listeningAudioUrlRef = useRef<string>('');

  useEffect(() => {
    // When switching to a listening question, reset audio UI.
    if (!currentQuestion || currentQuestion.type !== 'listening') return;
    const src = currentQuestion.audio_url ?? '';
    if (!src || src === listeningAudioUrlRef.current) return;
    listeningAudioUrlRef.current = src;
    setListeningAudioTime(0);
    setListeningAudioDuration(0);
    setListeningPlaying(false);
    if (listeningAudioRef.current) {
      try {
        listeningAudioRef.current.pause();
        listeningAudioRef.current.currentTime = 0;
      } catch {
        // ignore
      }
    }
  }, [currentQuestion]);

  useEffect(() => {
    const el = listeningAudioRef.current;
    if (!el) return;
    const onLoaded = () => setListeningAudioDuration(el.duration || 0);
    const onTime = () => setListeningAudioTime(el.currentTime || 0);
    const onPlay = () => setListeningPlaying(true);
    const onPause = () => setListeningPlaying(false);
    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    return () => {
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, [currentQuestion?.audio_url]);

  const toggleListening = async () => {
    const el = listeningAudioRef.current;
    if (!el) return;
    try {
      if (el.paused) await el.play();
      else el.pause();
    } catch {
      // Autoplay policies can block play; user can press play again.
    }
  };

  const replayListening = () => {
    const el = listeningAudioRef.current;
    if (!el) return;
    try {
      el.currentTime = 0;
      void el.play();
    } catch {
      // ignore
    }
  };

  async function handleSubmit() {
    if (!id || !user || submitting) return;
    const examId = id;
    setSubmitting(true);
    setError('');
    try {
      await submitExamAndGrade({
        examId,
        studentId: user.id,
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
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-[#F97316]" />
      </div>
    );
  }

  if (!exam || questions.length === 0 || !currentQuestion) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-6">
        <div className="bg-white border border-[#1A1A1A]/10 rounded-3xl p-8 max-w-lg text-center">
          <p className="font-black text-[#1A1A1A] text-xl uppercase">Exam unavailable</p>
          <p className="text-sm text-[#1A1A1A]/50 mt-2">This exam has no questions yet.</p>
          <button
            onClick={() => navigate('/student/exams')}
            className="mt-6 px-6 py-3 rounded-xl bg-[#F97316] text-white text-xs font-black uppercase tracking-widest"
          >
            Back to exams
          </button>
        </div>
      </div>
    );
  }

  const sectionLabel =
    (currentQuestion.extra_data as any)?.section_title
      ? String((currentQuestion.extra_data as any)?.section_title)
      : (currentQuestion.extra_data as any)?.section_index
        ? `Section ${(currentQuestion.extra_data as any)?.section_index}`
        : null;

  const setAnswerForCurrent = (value: unknown) => {
    setAnswers((prev) => {
      const next = { ...prev, [currentQuestion.id]: value };
      scheduleSave(currentQuestion.id, value);
      return next;
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F5F5F0] pb-10">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#1A1A1A]/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => requestLeave(() => navigate('/student/exams'))}
              className="w-10 h-10 rounded-xl bg-[#F5F5F0] text-[#1A1A1A]/60 hover:text-[#F97316]"
            >
              <ArrowLeft className="w-5 h-5 mx-auto" />
            </button>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#D4A373]">Exam in progress</p>
              <h1 className="text-lg font-black uppercase tracking-tight text-[#1A1A1A]">{exam.title}</h1>
            </div>
          </div>
          <div
            className={`px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2 ${
              timeLeft < 120 ? 'bg-[#F97316] text-white' : 'bg-[#F5F5F0] text-[#1A1A1A]'
            }`}
          >
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 bg-white rounded-3xl border border-[#1A1A1A]/10 p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[240px] h-[240px] bg-[#F97316]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[60px]" />

          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#D4A373] mb-3">
              Question {currentIndex + 1} / {questions.length}
              {sectionLabel ? ` • ${sectionLabel}` : ''}
            </p>

            {currentQuestion.type === 'listening' && currentQuestion.audio_url && (
              <div className="mb-5 rounded-2xl border border-[#1A1A1A]/10 bg-[#F5F5F0] p-4 relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#D4A373] mb-2">Listening</p>
                <audio ref={listeningAudioRef} src={currentQuestion.audio_url} preload="metadata" />
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => void toggleListening()}
                    className="px-4 py-2 rounded-xl bg-[#1A1A1A] text-white text-xs font-black uppercase tracking-widest inline-flex items-center gap-2"
                  >
                    {listeningPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {listeningPlaying ? 'Pause' : 'Play'}
                  </button>
                  <button
                    type="button"
                    onClick={replayListening}
                    className="px-4 py-2 rounded-xl bg-white text-[#1A1A1A] text-xs font-black uppercase tracking-widest border border-[#1A1A1A]/10 hover:border-[#F97316] hover:text-[#F97316]"
                  >
                    <RotateCcw className="w-4 h-4 inline-block mr-2" />
                    Replay
                  </button>
                </div>
                <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/50 flex items-center justify-between">
                  <span>{formatTime(Math.floor(listeningAudioTime))}</span>
                  <span>{formatTime(Math.floor(listeningAudioDuration || 0))}</span>
                </div>
              </div>
            )}

            {currentQuestion.type !== 'listening' && (
              <h2 className="text-2xl font-black tracking-tight text-[#1A1A1A] mb-4">
                {currentQuestion.question_text}
              </h2>
            )}
            {currentQuestion.type === 'listening' && (
              <h2 className="text-2xl font-black tracking-tight text-[#1A1A1A] mb-6">{currentQuestion.question_text}</h2>
            )}

            {currentQuestion.type === 'paragraph' && (
              <div className="space-y-5">
                {currentQuestion.content && (
                  <div className="rounded-2xl bg-[#F5F5F0] border border-[#1A1A1A]/10 p-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#D4A373] mb-2">Reading paragraph</p>
                    <p className="text-sm font-medium text-[#1A1A1A]/70 leading-relaxed">{currentQuestion.content}</p>
                  </div>
                )}
                <div className="space-y-3">
                  {(currentQuestion.options ?? []).map((option, index) => {
                    const label = String.fromCharCode(65 + index);
                    const subtype = (currentQuestion.extra_data as any)?.subtype ?? 'mcq';
                    const isTF = String(subtype).toLowerCase().includes('true');
                    const checked = isTF
                      ? answers[currentQuestion.id] === (option.trim().toLowerCase() === 'true')
                      : answers[currentQuestion.id] === option;
                    return (
                      <button
                        key={`${currentQuestion.id}-${label}`}
                        type="button"
                        onClick={() => setAnswerForCurrent(normalizeParagraphAnswer(currentQuestion, isTF ? option.trim().toLowerCase() === 'true' : option))}
                        className={`w-full text-left p-4 rounded-2xl border transition-all ${
                          checked ? 'border-[#F97316] bg-[#F97316]/5' : 'border-[#1A1A1A]/10 bg-[#F5F5F0] hover:border-[#F97316]/40'
                        }`}
                      >
                        <span className="font-black text-sm text-[#1A1A1A]">
                          {label}. {option}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {currentQuestion.type === 'listening' && (
              <div className="space-y-3">
                {(currentQuestion.options ?? []).map((option, index) => {
                  const label = String.fromCharCode(65 + index);
                  const checked = answers[currentQuestion.id] === option;
                  return (
                    <button
                      key={`${currentQuestion.id}-${label}`}
                      type="button"
                      onClick={() => setAnswerForCurrent(option)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        checked ? 'border-[#F97316] bg-[#F97316]/5' : 'border-[#1A1A1A]/10 bg-[#F5F5F0] hover:border-[#F97316]/40'
                      }`}
                    >
                      <span className="font-black text-sm text-[#1A1A1A]">
                        {label}. {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'grammar' && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-[#1A1A1A]/10 bg-[#F5F5F0] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#D4A373] mb-2">Drag the correct word</p>
                  <p className="text-base font-black text-[#1A1A1A] leading-relaxed">
                    {(() => {
                      const sentence = currentQuestion.content ?? '';
                      const parts = sentence.split('___');
                      if (parts.length !== 2) return <span>{sentence}</span>;
                      return (
                        <>
                          <span>{parts[0]}</span>
                          <span className="mx-2 inline-flex items-center px-4 py-2 rounded-xl bg-white border border-[#1A1A1A]/10 font-black text-[#F97316]">
                            {typeof answers[currentQuestion.id] === 'string' && (answers[currentQuestion.id] as string).trim()
                              ? (answers[currentQuestion.id] as string)
                              : '_____'}
                          </span>
                          <span>{parts[1]}</span>
                        </>
                      );
                    })()}
                  </p>
                </div>

                <div
                  className={`rounded-[2rem] border-4 border-dashed bg-white p-6 ${
                    grammarDragOver ? 'border-[#F97316]/70 bg-[#F97316]/5' : 'border-[#F97316]/30'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setGrammarDragOver(true);
                  }}
                  onDragLeave={() => setGrammarDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    const word = e.dataTransfer.getData('text/plain');
                    setGrammarDragOver(false);
                    if (word) setAnswerForCurrent(word);
                  }}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#D4A373] mb-3">Drop zone</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {(((currentQuestion.extra_data as any)?.words ??
                      (currentQuestion.options ?? [])) as Array<string>).map((word: string) => {
                      const checked = answers[currentQuestion.id] === word;
                      return (
                        <div
                          key={word}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', word);
                          }}
                          onClick={() => setAnswerForCurrent(word)}
                          className={`cursor-grab px-4 py-2 rounded-xl border transition-all inline-flex items-center gap-3 ${
                            checked ? 'border-[#F97316] bg-[#F97316]/5' : 'border-[#1A1A1A]/10 bg-[#F5F5F0] hover:border-[#F97316]/40'
                          }`}
                        >
                          <span className="font-black text-[#1A1A1A] text-sm">{word}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {currentQuestion.type === 'writing' && (
              <div className="space-y-5">
                <div className="bg-[#F5F5F0] rounded-2xl border border-[#1A1A1A]/10 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#D4A373] mb-2">Use these words</p>
                  <div className="flex flex-wrap gap-2">
                    {(((currentQuestion.extra_data as any)?.words ??
                      (currentQuestion.extra_data as any)?.word_list ??
                      []) as Array<string>).map((w) => (
                      <span key={w} className="px-4 py-2 rounded-xl bg-white border border-[#1A1A1A]/10 text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
                <textarea
                  value={typeof answers[currentQuestion.id] === 'string' ? (answers[currentQuestion.id] as string) : ''}
                  onChange={(e) => setAnswerForCurrent(e.target.value)}
                  disabled={submitting}
                  className="w-full bg-[#F5F5F0]/50 border border-[#1A1A1A]/5 rounded-[2rem] p-8 text-[#1A1A1A] placeholder:text-[#1A1A1A]/20 focus:ring-4 focus:ring-[#F97316]/5 outline-none text-base font-black shadow-inner min-h-[240px] tracking-tight transition-all resize-none disabled:opacity-60"
                  placeholder="Write your answer…"
                />
              </div>
            )}

            {(currentQuestion.type === 'mcq' || currentQuestion.type === 'text') && (
              <div className="space-y-3">
                <div className="text-xs font-black text-[#1A1A1A]/40 uppercase tracking-widest mb-2">
                  Legacy question type support
                </div>
                {(currentQuestion.options ?? []).map((option, index) => {
                  const label = String.fromCharCode(65 + index);
                  const checked = answers[currentQuestion.id] === label || answers[currentQuestion.id] === option;
                  return (
                    <button
                      key={`${currentQuestion.id}-${label}`}
                      type="button"
                      onClick={() => setAnswerForCurrent(label)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        checked ? 'border-[#F97316] bg-[#F97316]/5' : 'border-[#1A1A1A]/10 bg-[#F5F5F0] hover:border-[#F97316]/40'
                      }`}
                    >
                      <span className="font-black text-sm text-[#1A1A1A]">
                        {label}. {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5F5F0] text-xs font-black uppercase tracking-widest disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                disabled={currentIndex === questions.length - 1}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5F5F0] text-xs font-black uppercase tracking-widest disabled:opacity-40"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-4 bg-[#1A1A1A] text-white rounded-3xl p-6">
          <h3 className="font-black uppercase tracking-tight text-lg mb-4">Progress</h3>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-2">
            <div className="h-full bg-[#F97316]" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-6">
            {answeredCount}/{questions.length} answered
          </p>

          <div className="grid grid-cols-5 gap-2 mb-6">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`h-9 rounded-lg text-[10px] font-black ${
                  currentIndex === i
                    ? 'bg-white text-[#1A1A1A]'
                    : isAnswered(q, answers[q.id])
                      ? 'bg-[#F97316] text-white'
                      : 'bg-white/10 text-white/40'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {error && <p className="text-xs text-[#ffb4b4] font-bold mb-4">{error}</p>}

          <button
            onClick={() => setSubmitConrmOpen(true)}
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#F97316] text-white text-xs font-black uppercase tracking-widest hover:brightness-95 disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {submitting ? 'Submitting...' : 'Submit exam'}
          </button>

          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-3">
            Refresh is blocked during exam to help auto-save.
          </p>
        </aside>
      </main>

      <AnimatePresence>
        {leaveDialogOpen && (
          <div className="xed inset-0 z-120 flex items-center justify-center p-4">
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
                <button onClick={conrmLeave} className="px-6 py-3 rounded-2xl bg-[#F97316] text-white font-black text-xs uppercase tracking-widest">
                  Leave Anyway
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {submitConrmOpen && (
          <div className="xed inset-0 z-130 flex items-center justify-center p-4">
            <button className="absolute inset-0 bg-black/60" onClick={() => setSubmitConrmOpen(false)} />
            <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#1A1A1A]/10 shadow-2xl p-6 sm:p-8">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#D4A373]">Submit exam</p>
              <p className="text-sm font-bold text-[#1A1A1A]/70 mt-3">
                Are you sure you want to submit? You cannot take this exam again.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setSubmitConrmOpen(false)}
                  className="px-5 py-3 rounded-2xl bg-[#F5F5F0] font-black text-xs uppercase tracking-widest"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setSubmitConrmOpen(false); void handleSubmit(); }}
                  className="px-6 py-3 rounded-2xl bg-[#F97316] text-white font-black text-xs uppercase tracking-widest"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
