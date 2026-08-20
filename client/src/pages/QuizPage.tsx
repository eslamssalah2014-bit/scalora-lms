import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Quiz, QuizQuestion } from '../types';
import { api } from '../lib/api';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Award,
  BookOpen,
  Loader2,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizResult {
  attemptId: string;
  score: number;
  passed: boolean;
  passingScore: number;
  correctCount: number;
  totalQuestions: number;
  review: {
    questionId: string;
    question: string;
    options: string[];
    userAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
    explanation?: string;
  }[];
}

export const QuizPage: React.FC = () => {
  const { slug, quizId } = useParams<{ slug: string; quizId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.get<{ success: boolean; quiz: Quiz }>(`/quizzes/${quizId}`);
      if (res.success && res.quiz) {
        setQuiz(res.quiz);
      } else {
        setError('Quiz not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load assessment quiz from server.');
    } finally {
      setLoading(false);
    }
  };

  const selectOption = (questionId: string, optionIndex: number) => {
    if (result) return; // Prevent change after submit
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    setSubmitting(true);

    try {
      const res = await api.post<{ success: boolean; result: QuizResult }>(
        `/quizzes/${quiz.id}/submit`,
        { answers }
      );

      if (res.success && res.result) {
        setResult(res.result);
        if (res.result.passed) {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#2D8CFF', '#00D2FF', '#FFD700', '#10B981'],
          });
        }
        return;
      }
    } catch {
      // Local fallback quiz evaluation
      let correct = 0;
      const review = quiz.questions.map((q) => {
        const userAns = answers[q.id] ?? -1;
        const isCorr = userAns === (q.correctAnswer ?? 0);
        if (isCorr) correct++;
        return {
          questionId: q.id,
          question: q.question,
          options: q.options,
          userAnswer: userAns,
          correctAnswer: q.correctAnswer ?? 0,
          isCorrect: isCorr,
          explanation: q.explanation || undefined,
        };
      });
      const score = Math.round((correct / quiz.questions.length) * 100);
      const passed = score >= quiz.passingScore;

      setResult({
        attemptId: `att_${Date.now()}`,
        score,
        passed,
        passingScore: quiz.passingScore,
        correctCount: correct,
        totalQuestions: quiz.questions.length,
        review,
      });

      if (passed) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#2D8CFF', '#00D2FF', '#FFD700', '#10B981'],
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#04152D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-scalora-blue animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Loading assessment questions...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-[#04152D] flex items-center justify-center p-4">
        <div className="text-center glass-panel p-8 rounded-2xl space-y-4 max-w-sm">
          <h3 className="text-lg font-bold text-white">Quiz Not Found</h3>
          <Link to={`/learn/${slug}`} className="px-4 py-2 rounded-xl bg-scalora-blue text-white text-xs font-bold">
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz.questions?.length || 0;
  const isComplete = answeredCount === totalQuestions;

  return (
    <div className="min-h-screen bg-[#020C1B] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-scalora-blue/20">
          <Link
            to={`/learn/${slug}`}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Course Classroom</span>
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider text-scalora-accent">
            Assessment Checkpoint
          </span>
        </div>

        {/* Quiz Info Banner */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-scalora-blue/30 space-y-3 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white">{quiz.title}</h1>
            <span className="px-3 py-1 rounded-full bg-scalora-blue/20 text-scalora-accent border border-scalora-blue/30 text-xs font-bold">
              Passing: {quiz.passingScore}%
            </span>
          </div>
          {quiz.description && <p className="text-xs sm:text-sm text-slate-300">{quiz.description}</p>}
          <div className="pt-2 flex items-center gap-4 text-xs text-slate-400">
            <span>{totalQuestions} Questions</span>
            <span>•</span>
            <span>Multiple Choice</span>
          </div>
        </div>

        {/* Result Screen (If Submitted) */}
        {result && (
          <div
            className={`p-8 rounded-3xl border shadow-2xl space-y-6 animate-in zoom-in-95 duration-300 ${
              result.passed
                ? 'bg-emerald-950/40 border-emerald-500/40'
                : 'bg-rose-950/40 border-rose-500/40'
            }`}
          >
            <div className="text-center space-y-3">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border ${
                  result.passed
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                }`}
              >
                {result.passed ? <Award className="w-8 h-8" /> : <RotateCcw className="w-8 h-8" />}
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {result.passed ? 'Assessment Passed! 🎉' : 'Assessment Not Passed'}
              </h2>

              <p className="text-sm text-slate-300">
                You scored <strong className="text-white text-lg">{result.score}%</strong> (Passing requirement:{' '}
                {result.passingScore}%).
              </p>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto text-center">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[11px] text-slate-400 block uppercase font-bold">Correct Answers</span>
                <span className="text-xl font-black text-emerald-400">
                  {result.correctCount} / {result.totalQuestions}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[11px] text-slate-400 block uppercase font-bold">Status</span>
                <span className={`text-xl font-black ${result.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {result.passed ? 'PASSED' : 'RETRY'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleRetake}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-scalora-navy hover:bg-scalora-navy/80 text-slate-200 text-xs font-bold border border-scalora-blue/30 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Assessment</span>
              </button>

              <Link
                to={`/learn/${slug}`}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-xs font-bold shadow-glow-blue hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Continue Learning Track</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-6">
          {quiz.questions?.map((q, qIndex) => {
            const reviewItem = result?.review.find((r) => r.questionId === q.id);
            const selectedOption = answers[q.id];

            return (
              <div
                key={q.id}
                className={`p-6 sm:p-7 rounded-2xl glass-card border transition-all ${
                  reviewItem
                    ? reviewItem.isCorrect
                      ? 'border-emerald-500/40 bg-emerald-950/10'
                      : 'border-rose-500/40 bg-rose-950/10'
                    : 'border-scalora-blue/20'
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-scalora-blue/10">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-scalora-accent uppercase tracking-wider">
                      Question {qIndex + 1} of {totalQuestions}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {q.question}
                    </h3>
                  </div>

                  {reviewItem && (
                    <div className="flex-shrink-0">
                      {reviewItem.isCorrect ? (
                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-1 border border-rose-500/30">
                          <XCircle className="w-3.5 h-3.5" /> Incorrect
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Multiple Choice Options */}
                <div className="pt-4 space-y-2.5">
                  {q.options.map((optionText, optIndex) => {
                    const isSelected = selectedOption === optIndex;
                    let optionStyle =
                      'border-scalora-blue/20 bg-scalora-navy/40 hover:bg-scalora-navy/70 text-slate-300';

                    if (result && reviewItem) {
                      if (optIndex === reviewItem.correctAnswer) {
                        optionStyle =
                          'border-emerald-500 bg-emerald-500/20 text-white font-semibold shadow-sm';
                      } else if (isSelected && !reviewItem.isCorrect) {
                        optionStyle =
                          'border-rose-500 bg-rose-500/20 text-rose-200 font-semibold';
                      }
                    } else if (isSelected) {
                      optionStyle =
                        'border-scalora-blue bg-scalora-blue/20 text-white font-semibold shadow-glow-blue';
                    }

                    return (
                      <button
                        key={optIndex}
                        type="button"
                        onClick={() => selectOption(q.id, optIndex)}
                        disabled={Boolean(result)}
                        className={`w-full p-4 rounded-xl border text-left flex items-center justify-between text-xs sm:text-sm transition-all ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-black/40 text-slate-300 font-mono text-xs flex items-center justify-center flex-shrink-0">
                            {String.fromCharCode(65 + optIndex)}
                          </span>
                          <span>{optionText}</span>
                        </div>

                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-scalora-blue bg-scalora-blue' : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Answer Explanation (If Reviewed) */}
                {reviewItem?.explanation && (
                  <div className="mt-4 p-3.5 rounded-xl bg-scalora-navy/70 border border-scalora-blue/20 text-xs text-slate-300 leading-relaxed">
                    <strong className="text-scalora-accent block mb-1">Explanation:</strong>
                    {reviewItem.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit Quiz Action Bar */}
        {!result && (
          <div className="sticky bottom-6 p-4 rounded-2xl glass-panel border border-scalora-blue/30 flex items-center justify-between shadow-2xl backdrop-blur-xl">
            <span className="text-xs text-slate-300">
              Answered: <strong className="text-white">{answeredCount}</strong> of{' '}
              <strong className="text-white">{totalQuestions}</strong> questions
            </span>

            <button
              onClick={handleSubmit}
              disabled={submitting || !isComplete}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-xs font-bold shadow-glow-blue hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating Answers...</span>
                </>
              ) : (
                <>
                  <span>Submit Assessment</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
