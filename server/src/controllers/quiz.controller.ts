import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const questionSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(3, 'Question text is required'),
  options: z.array(z.string()).min(2, 'At least 2 options are required'),
  correctAnswer: z.number().min(0, 'Valid correct answer index required'),
  explanation: z.string().optional().nullable(),
  order: z.number().optional().default(0),
});

const quizSchema = z.object({
  title: z.string().min(3, 'Quiz title must be at least 3 characters'),
  description: z.string().optional().nullable(),
  passingScore: z.number().min(0).max(100).default(70),
  courseId: z.string().min(1, 'Course ID is required'),
  moduleId: z.string().optional().nullable(),
  questions: z.array(questionSchema).min(1, 'At least 1 question is required'),
});

export const getCourseQuizzes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const courseId = req.params.courseId as string;

    const quizzes = await prisma.quiz.findMany({
      where: { courseId },
      include: {
        _count: {
          select: { questions: true, results: true },
        },
      },
    });

    res.json({ success: true, quizzes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching quizzes' });
  }
};

export const getQuizById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'ADMIN';

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        course: {
          select: { id: true, title: true, slug: true },
        },
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }

    const formattedQuestions = quiz.questions.map((q) => {
      let parsedOptions: string[] = [];
      try {
        parsedOptions = JSON.parse(q.options);
      } catch {
        parsedOptions = [];
      }

      return {
        id: q.id,
        question: q.question,
        options: parsedOptions,
        order: q.order,
        explanation: isAdmin ? q.explanation : undefined,
        correctAnswer: isAdmin ? q.correctAnswer : undefined,
      };
    });

    let results: any[] = [];
    if (userId) {
      results = await prisma.quizResult.findMany({
        where: { quizId: id, userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        passingScore: quiz.passingScore,
        courseId: quiz.courseId,
        course: quiz.course,
        moduleId: quiz.moduleId,
        questions: formattedQuestions,
        attempts: results,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching quiz' });
  }
};

export const createQuiz = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validatedData = quizSchema.parse(req.body);

    const quiz = await prisma.quiz.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        passingScore: validatedData.passingScore,
        courseId: validatedData.courseId,
        moduleId: validatedData.moduleId || null,
        questions: {
          create: validatedData.questions.map((q, idx) => ({
            question: q.question,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || null,
            order: q.order ?? idx,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    res.status(201).json({ success: true, message: 'Quiz created successfully', quiz });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Error creating quiz' });
  }
};

export const updateQuiz = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const validatedData = quizSchema.parse(req.body);

    await prisma.quizQuestion.deleteMany({ where: { quizId: id } });

    const updated = await prisma.quiz.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        passingScore: validatedData.passingScore,
        courseId: validatedData.courseId,
        moduleId: validatedData.moduleId || null,
        questions: {
          create: validatedData.questions.map((q, idx) => ({
            question: q.question,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || null,
            order: q.order ?? idx,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    res.json({ success: true, message: 'Quiz updated successfully', quiz: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Error updating quiz' });
  }
};

export const deleteQuiz = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    await prisma.quiz.delete({ where: { id } });

    res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting quiz' });
  }
};

export const submitQuizAttempt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;
    const { answers } = req.body as { answers: Record<string, number> };

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: true,
      },
    });

    if (!quiz || quiz.questions.length === 0) {
      res.status(404).json({ success: false, message: 'Quiz or questions not found' });
      return;
    }

    let correctCount = 0;
    const totalQuestions = quiz.questions.length;

    const review = quiz.questions.map((q) => {
      const selectedOption = answers[q.id] !== undefined ? answers[q.id] : -1;
      const isCorrect = selectedOption === q.correctAnswer;
      if (isCorrect) correctCount++;

      let parsedOptions: string[] = [];
      try {
        parsedOptions = JSON.parse(q.options);
      } catch {
        parsedOptions = [];
      }

      return {
        questionId: q.id,
        question: q.question,
        options: parsedOptions,
        userAnswer: selectedOption,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const passed = scorePercentage >= quiz.passingScore;

    // Save into PostgreSQL QuizResult table
    const resultRecord = await prisma.quizResult.create({
      data: {
        quizId: id,
        userId,
        score: scorePercentage,
        passed,
        answers: JSON.stringify(answers),
      },
    });

    res.json({
      success: true,
      result: {
        attemptId: resultRecord.id,
        score: scorePercentage,
        passed,
        passingScore: quiz.passingScore,
        correctCount,
        totalQuestions,
        review,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error evaluating quiz' });
  }
};
