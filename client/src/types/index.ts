export type Role = 'ADMIN' | 'STUDENT' | 'TRAINER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  bio?: string | null;
  title?: string | null;
  linkedin?: string | null;
  website?: string | null;
  phone?: string | null;
  status?: 'ACTIVE' | 'INACTIVE' | string;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Trainer {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  title?: string | null;
  bio?: string | null;
  linkedin?: string | null;
  website?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | string;
  assignedCourses?: {
    id?: string;
    course: {
      id: string;
      title: string;
      slug: string;
      thumbnail?: string | null;
      _count?: { enrollments: number };
    };
  }[];
  createdAt?: string;
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
  basePrice?: number;
  discountPrice?: number;
  discountPercent?: number;
  currency?: string;
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
  trainers?: Trainer[];
  trainerIds?: string[];
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

// ============================================================================
// COMMUNITY MODULE TYPES
// ============================================================================

export type PostType = 'TEXT' | 'IMAGE' | 'FILE' | 'LINK' | 'ANNOUNCEMENT';

export interface CommunityChannel {
  id: string;
  name: string;
  description?: string | null;
  courseId?: string | null;
  course?: {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    category: string;
    instructor: string;
  } | null;
  isLocked: boolean;
  isArchived: boolean;
  membersCount: number;
  postsCount: number;
  recentMembers?: CommunityMemberSummary[];
  createdAt: string;
}

export interface CommunityMemberSummary {
  id: string;
  name: string;
  avatar?: string | null;
  role: string;
  channelRole?: string;
  bio?: string | null;
  joinedAt?: string;
}

export interface CommunityMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: string;
  channelRole: string;
  bio?: string | null;
  joinedAt: string;
  enrolledCoursesCount: number;
  postsCount: number;
  commentsCount: number;
}

export interface CommentAuthor {
  id: string;
  name: string;
  avatar?: string | null;
  role: string;
  bio?: string | null;
}

export interface CommentReply {
  id: string;
  parentId?: string | null;
  content: string;
  createdAt: string;
  author: CommentAuthor;
}

export interface CommunityComment {
  id: string;
  postId: string;
  parentId?: string | null;
  content: string;
  createdAt: string;
  author: CommentAuthor;
  replies?: CommentReply[];
}

export interface CommunityPost {
  id: string;
  channelId: string;
  type: PostType;
  title?: string | null;
  content: string;
  mediaUrl?: string | null;
  fileName?: string | null;
  fileUrl?: string | null;
  fileSize?: string | null;
  linkUrl?: string | null;
  isPinned: boolean;
  isAnnouncement: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    role: string;
    bio?: string | null;
  };
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  recentComments?: {
    id: string;
    content: string;
    createdAt: string;
    author: CommentAuthor;
    repliesCount?: number;
  }[];
}

export interface CommunityNotification {
  id: string;
  type: 'COMMENT' | 'REPLY' | 'LIKE' | 'ANNOUNCEMENT' | 'SYSTEM' | 'WELCOME' | string;
  message: string;
  isRead: boolean;
  channelId?: string | null;
  channelName?: string | null;
  postId?: string | null;
  actor?: {
    id: string;
    name: string;
    avatar?: string | null;
    role: string;
  } | null;
  createdAt: string;
}

export interface CommunityMemberProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: string;
  bio?: string | null;
  joinedAt: string;
  totalPosts: number;
  totalComments: number;
  certificatesCount: number;
  enrolledCourses: {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    category: string;
    instructor: string;
  }[];
  recentPosts: {
    id: string;
    channelId: string;
    channelName: string;
    title?: string | null;
    content: string;
    type: PostType;
    createdAt: string;
    likesCount: number;
    commentsCount: number;
  }[];
}

export interface CommunityAdminOverview {
  stats: {
    totalChannels: number;
    totalPosts: number;
    totalComments: number;
    totalMembers: number;
  };
  channels: {
    id: string;
    name: string;
    description?: string | null;
    courseId?: string | null;
    courseTitle?: string | null;
    isLocked: boolean;
    isArchived: boolean;
    membersCount: number;
    postsCount: number;
    createdAt: string;
  }[];
  recentPosts: {
    id: string;
    channelId: string;
    channelName: string;
    type: PostType;
    title?: string | null;
    content: string;
    mediaUrl?: string | null;
    fileName?: string | null;
    isPinned: boolean;
    isAnnouncement: boolean;
    createdAt: string;
    author: {
      id: string;
      name: string;
      avatar?: string | null;
      role: string;
      email: string;
    };
    likesCount: number;
    commentsCount: number;
  }[];
}

export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  courseId?: string | null;
  content: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: 'IMAGE' | 'FILE' | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string | null;
    role: string;
    title?: string | null;
  };
  recipient?: {
    id: string;
    name: string;
    avatar?: string | null;
    role: string;
    title?: string | null;
  };
}

export interface Conversation {
  partner: {
    id: string;
    name: string;
    avatar?: string | null;
    role: string;
    title?: string | null;
  };
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    isSender: boolean;
    isRead: boolean;
  };
  unreadCount: number;
}

export interface CommunityChatMessage {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  mediaUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  parentId?: string | null;
  isPinned: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
    role: string;
    title?: string | null;
  };
}

export * from './study-plan';




