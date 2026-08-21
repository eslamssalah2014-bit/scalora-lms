export type Role = 'ADMIN' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  bio?: string | null;
  phone?: string | null;
  status?: 'ACTIVE' | 'INACTIVE' | string;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentStats {
  totalEnrollments: number;
  completedCourses: number;
  certificatesEarned: number;
  quizAttempts: number;
  activeCourses: number;
  lessonsCompleted: number;
}

export interface StudentActivity {
  id: string;
  type: 'PASSWORD_RESET' | 'STUDENT_UPDATED' | 'ENROLLMENT' | 'QUIZ_SUBMISSION' | 'CERTIFICATE_ISSUED' | string;
  title: string;
  description: string;
  timestamp: string;
  actor?: string;
  details?: any;
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

export interface Category {
  id: string;
  name: string;
  slug: string;
  courseCount?: number;
  createdAt?: string;
}

export interface AdminStats {
  totalCourses: number;
  totalStudents: number;
  totalEnrollments: number;
  totalRevenue: number;
  publishedCoursesCount: number;
}

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'MEETING_SCHEDULED'
  | 'DISCOVERY_COMPLETED'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

export interface LeadNote {
  id: string;
  text: string;
  authorName: string;
  authorId?: string;
  createdAt: string;
}

export interface LeadActivity {
  id: string;
  type: string;
  description: string;
  actorName: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  leadCode: string;
  fullName: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  industry?: string | null;
  teamSize?: string | null;
  goalsAndBottlenecks?: string | null;
  status: LeadStatus;
  assignedTo?: string | null;
  notes?: LeadNote[];
  activityLog?: LeadActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface LeadStats {
  totalLeads: number;
  newLeads: number;
  meetingsScheduled: number;
  wonDeals: number;
  lostDeals: number;
  conversionRate: number;
}

export type PaymentRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PaymentRequest {
  id: string;
  userId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    createdAt?: string;
  };
  courseId: string;
  course?: {
    id: string;
    title: string;
    price: number;
    slug: string;
    thumbnail?: string | null;
    instructor?: string;
  };
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  screenshotUrl: string;
  notes?: string | null;
  status: PaymentRequestStatus;
  adminNotes?: string | null;
  rejectionReason?: string | null;
  setupToken?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRequestStats {
  totalRequests: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  totalRevenue: number;
}



