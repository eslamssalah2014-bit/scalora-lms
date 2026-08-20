import React, { useState, useEffect } from 'react';
import { Quiz, Course } from '../../types';
import { api } from '../../lib/api';
import { FALLBACK_COURSES } from '../../data/fallbackData';
import { Modal } from '../../components/Modal';
import {
  HelpCircle,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  Plus,
  X,
  BookOpen,
  Award,
  Loader2,
} from 'lucide-react';

interface QuestionFormState {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const DEFAULT_QUIZZES = FALLBACK_COURSES.flatMap((c) =>
  (c.quizzes || []).map((q) => ({ ...q, courseTitle: c.title }))
);

export const AdminQuizzesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>(FALLBACK_COURSES);
  const [quizzes, setQuizzes] = useState<(Quiz & { courseTitle?: string })[]>(DEFAULT_QUIZZES);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState(FALLBACK_COURSES[0].id);
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState<QuestionFormState[]>([
    {
      question: '',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      explanation: '',
    },
  ]);

  useEffect(() => {
    fetchQuizzesAndCourses();
  }, []);

  const fetchQuizzesAndCourses = async () => {
    try {
      const res = await api.get<{ success: boolean; courses: Course[] }>('/courses/admin/all');
      if (res.success && res.courses && res.courses.length > 0) {
        setCourses(res.courses);
        const allQuizzes: (Quiz & { courseTitle?: string })[] = [];
        res.courses.forEach((c) => {
          c.quizzes?.forEach((q) => {
            allQuizzes.push({ ...q, courseTitle: c.title });
          });
        });
        setQuizzes(allQuizzes);
        setCourseId(res.courses[0].id);
      }
    } catch {
      setCourses(FALLBACK_COURSES);
      setQuizzes(DEFAULT_QUIZZES);
      setCourseId(FALLBACK_COURSES[0].id);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingQuiz(null);
    setTitle('');
    setDescription('');
    setCourseId(courses[0]?.id || '');
    setPassingScore(70);
    setQuestions([
      {
        question: '',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        explanation: '',
      },
    ]);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = async (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setFormLoading(true);
    setModalOpen(true);
    try {
      const res = await api.get<{ success: boolean; quiz: Quiz }>(`/quizzes/${quiz.id}`);
      if (res.success && res.quiz) {
        const q = res.quiz;
        setTitle(q.title);
        setDescription(q.description || '');
        setCourseId(q.courseId);
        setPassingScore(q.passingScore);
        setQuestions(
          q.questions.map((item) => ({
            id: item.id,
            question: item.question,
            options: item.options,
            correctAnswer: item.correctAnswer ?? 0,
            explanation: item.explanation || '',
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching quiz details for edit:', err);
    } finally {
      setFormLoading(false);
    }
  };

  // Question manipulation
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: '',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
        explanation: '',
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  const updateQuestionText = (index: number, text: string) => {
    const updated = [...questions];
    updated[index].question = text;
    setQuestions(updated);
  };

  const updateQuestionOption = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = val;
    setQuestions(updated);
  };

  const setQuestionCorrectAnswer = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    updated[qIdx].correctAnswer = optIdx;
    setQuestions(updated);
  };

  const updateQuestionExplanation = (qIdx: number, exp: string) => {
    const updated = [...questions];
    updated[qIdx].explanation = exp;
    setQuestions(updated);
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question.trim()) {
        setFormError(`Question #${i + 1} is empty.`);
        setFormLoading(false);
        return;
      }
    }

    const payload = {
      title,
      description: description || undefined,
      passingScore: Number(passingScore),
      courseId,
      questions: questions.map((q, idx) => ({
        id: q.id || `q_${Date.now()}_${idx}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || undefined,
        order: idx,
      })),
    };

    try {
      if (editingQuiz) {
        await api.put(`/quizzes/${editingQuiz.id}`, payload);
      } else {
        await api.post('/quizzes', payload);
      }
      fetchQuizzesAndCourses();
      setModalOpen(false);
    } catch {
      const selectedCourse = courses.find((c) => c.id === courseId);
      if (editingQuiz) {
        setQuizzes((prev) =>
          prev.map((q) =>
            q.id === editingQuiz.id
              ? {
                  ...q,
                  ...payload,
                  courseTitle: selectedCourse?.title || q.courseTitle,
                }
              : q
          )
        );
      } else {
        const newQuiz: Quiz & { courseTitle?: string } = {
          id: `quiz_${Date.now()}`,
          ...payload,
          courseTitle: selectedCourse?.title || 'Scalora Course',
        };
        setQuizzes((prev) => [newQuiz, ...prev]);
      }
      setModalOpen(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string, quizTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete quiz "${quizTitle}"?`)) return;
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    try {
      await api.delete(`/quizzes/${quizId}`);
    } catch {
      // Local state already updated
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-scalora-blue/20">
        <div>
          <h1 className="text-2xl font-black text-white">Quiz & Assessment Builder</h1>
          <p className="text-xs text-slate-400">
            Create interactive quizzes with multiple-choice questions, passing scores, and explanations
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-xs font-bold shadow-glow-blue hover:opacity-95 flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Assessment</span>
        </button>
      </div>

      {/* Quizzes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          [1, 2, 3, 4].map((n) => (
            <div key={n} className="h-44 rounded-2xl glass-card animate-pulse bg-scalora-navy/40" />
          ))
        ) : quizzes.length === 0 ? (
          <div className="col-span-2 text-center py-16 glass-panel rounded-2xl space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Quizzes Created Yet</h3>
            <p className="text-xs text-slate-400">
              Create an assessment to evaluate students before awarding course certificates.
            </p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-scalora-blue text-white text-xs font-bold"
            >
              Create Quiz
            </button>
          </div>
        ) : (
          quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="p-6 rounded-2xl glass-panel border border-scalora-blue/25 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-scalora-navy text-scalora-accent border border-scalora-blue/30 truncate max-w-[200px]">
                    {quiz.courseTitle || 'Scalora Course'}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    Pass: {quiz.passingScore}%
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{quiz.title}</h3>
                {quiz.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{quiz.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-scalora-blue/15 flex items-center justify-between">
                <span className="text-xs text-slate-400">Multiple-choice format</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(quiz)}
                    className="p-2 rounded-lg bg-slate-700/40 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Edit Quiz"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                    className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition-colors"
                    title="Delete Quiz"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quiz Create/Edit Dynamic Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingQuiz ? 'Edit Assessment' : 'Create New Assessment'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSaveQuiz} className="space-y-6">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {formError}
            </div>
          )}

          {/* Quiz Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Quiz Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distributed Consensus & Microservices Certification Quiz"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Associated Course
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-[#04152D]"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Passing Score (%)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                required
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Instructions / Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief guidelines or overview for learners..."
                className="w-full px-3.5 py-2 rounded-xl glass-input text-xs"
              />
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-4 pt-4 border-t border-scalora-blue/20">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Questions ({questions.length})
              </h3>
              <button
                type="button"
                onClick={addQuestion}
                className="px-3 py-1.5 rounded-lg bg-scalora-blue/20 hover:bg-scalora-blue/30 text-scalora-accent text-xs font-bold border border-scalora-blue/30 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-5 rounded-2xl bg-scalora-navy/40 border border-scalora-blue/25 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-scalora-accent uppercase">
                      Question #{qIdx + 1}
                    </span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIdx)}
                        className="text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  {/* Question Text */}
                  <input
                    type="text"
                    required
                    value={q.question}
                    onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                    placeholder="Enter question text here..."
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                  />

                  {/* 4 Options */}
                  <div className="space-y-2 pt-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">
                      Multiple Choice Options (Select the radio button for the correct answer):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((optText, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-2 rounded-xl border flex items-center gap-2.5 transition-colors ${
                            q.correctAnswer === optIdx
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-scalora-blue/20 bg-[#04152D]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`correctAnswer_${qIdx}`}
                            checked={q.correctAnswer === optIdx}
                            onChange={() => setQuestionCorrectAnswer(qIdx, optIdx)}
                            className="w-4 h-4 text-emerald-500 focus:ring-0 bg-transparent border-slate-500 cursor-pointer"
                          />
                          <input
                            type="text"
                            required
                            value={optText}
                            onChange={(e) => updateQuestionOption(qIdx, optIdx, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="pt-1">
                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => updateQuestionExplanation(qIdx, e.target.value)}
                      placeholder="Optional explanation shown after grading..."
                      className="w-full px-3 py-2 rounded-xl glass-input text-[11px] text-slate-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-scalora-blue/20">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-scalora-navy text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-scalora-blue to-scalora-accent text-white text-xs font-bold shadow-glow-blue"
            >
              {formLoading ? 'Saving Assessment...' : editingQuiz ? 'Update Assessment' : 'Save Assessment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
