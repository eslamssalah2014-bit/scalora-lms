"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitQuizAttempt = exports.deleteQuiz = exports.updateQuiz = exports.createQuiz = exports.getQuizById = exports.getCourseQuizzes = void 0;
const zod_1 = require("zod");
const prisma_js_1 = require("../lib/prisma.js");
const questionSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    question: zod_1.z.string().min(3, 'Question text is required'),
    options: zod_1.z.array(zod_1.z.string()).min(2, 'At least 2 options are required'),
    correctAnswer: zod_1.z.number().min(0, 'Valid correct answer index required'),
    explanation: zod_1.z.string().optional().nullable(),
    order: zod_1.z.number().optional().default(0),
});
const quizSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Quiz title must be at least 3 characters'),
    description: zod_1.z.string().optional().nullable(),
    passingScore: zod_1.z.number().min(0).max(100).default(70),
    courseId: zod_1.z.string().min(1, 'Course ID is required'),
    moduleId: zod_1.z.string().optional().nullable(),
    questions: zod_1.z.array(questionSchema).min(1, 'At least 1 question is required'),
});
const getCourseQuizzes = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const quizzes = await prisma_js_1.prisma.quiz.findMany({
            where: { courseId },
            include: {
                _count: {
                    select: { questions: true, results: true },
                },
            },
        });
        res.json({ success: true, quizzes });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching quizzes' });
    }
};
exports.getCourseQuizzes = getCourseQuizzes;
const getQuizById = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'ADMIN';
        const quiz = await prisma_js_1.prisma.quiz.findUnique({
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
            let parsedOptions = [];
            try {
                parsedOptions = JSON.parse(q.options);
            }
            catch {
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
        let results = [];
        if (userId) {
            results = await prisma_js_1.prisma.quizResult.findMany({
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error fetching quiz' });
    }
};
exports.getQuizById = getQuizById;
const createQuiz = async (req, res) => {
    try {
        const validatedData = quizSchema.parse(req.body);
        const quiz = await prisma_js_1.prisma.quiz.create({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: error.errors[0].message });
            return;
        }
        res.status(500).json({ success: false, message: error.message || 'Error creating quiz' });
    }
};
exports.createQuiz = createQuiz;
const updateQuiz = async (req, res) => {
    try {
        const id = req.params.id;
        const validatedData = quizSchema.parse(req.body);
        await prisma_js_1.prisma.quizQuestion.deleteMany({ where: { quizId: id } });
        const updated = await prisma_js_1.prisma.quiz.update({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: error.errors[0].message });
            return;
        }
        res.status(500).json({ success: false, message: error.message || 'Error updating quiz' });
    }
};
exports.updateQuiz = updateQuiz;
const deleteQuiz = async (req, res) => {
    try {
        const id = req.params.id;
        await prisma_js_1.prisma.quiz.delete({ where: { id } });
        res.json({ success: true, message: 'Quiz deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error deleting quiz' });
    }
};
exports.deleteQuiz = deleteQuiz;
const submitQuizAttempt = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user?.id;
        const { answers } = req.body;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const quiz = await prisma_js_1.prisma.quiz.findUnique({
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
            if (isCorrect)
                correctCount++;
            let parsedOptions = [];
            try {
                parsedOptions = JSON.parse(q.options);
            }
            catch {
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
        const resultRecord = await prisma_js_1.prisma.quizResult.create({
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error evaluating quiz' });
    }
};
exports.submitQuizAttempt = submitQuizAttempt;
