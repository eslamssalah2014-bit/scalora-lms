export type Role = 'ADMIN' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  bio?: string | null;
  createdAt?: string;
}

export type LessonType = 'YOUTUBE' | 'PDF' | 'DOWNLOAD' | 'TEXT';

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  content?: string | null;
  videoUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: string | null;
  duration?: string | null;
  order: number;
  moduleId: string;
  isCompleted?: boolean;
  createdAt?: string;
}

export interface Module {
  id: string;
  title: string;
  order: number;
  courseId: string;
  lessons: Lesson[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: number;
  explanation?: string | null;
  order?: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string | null;
  passingScore: number;
  courseId: string;
  moduleId?: string | null;
  questions: QuizQuestion[];
  attempts?: QuizAttempt[];
  _count?: {
    questions: number;
    attempts: number;
  };
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  passed: boolean;
  answers: string;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail?: string | null;
  price: number;
  instructor: string;
  category: string;
  level: string;
  isPublished: boolean;
  modulesCount?: number;
  lessonsCount?: number;
  quizzesCount?: number;
  studentsCount?: number;
  modules?: Module[];
  quizzes?: Quiz[];
  isEnrolled?: boolean;
  userProgress?: {
    completedLessonIds: string[];
    completionPercentage: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Enrollment {
  enrollmentId?: string;
  id?: string;
  enrolledAt: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  progressPercent: number;
  completedCount: number;
  totalLessons: number;
  nextLessonId?: string;
  course: Course;
  user?: User;
}

export interface AdminStats {
  totalCourses: number;
  totalStudents: number;
  totalEnrollments: number;
  totalRevenue: number;
  publishedCoursesCount: number;
}
