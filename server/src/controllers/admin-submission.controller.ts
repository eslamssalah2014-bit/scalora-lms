import { Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

// Helper to generate a unique course slug
function generateCourseSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base || 'course'}-${suffix}`;
}

// ---------------------------------------------------------------------------
// 1. GET ALL SUBMISSIONS FOR ADMIN (With Filtering, Search & Pagination)
// ---------------------------------------------------------------------------
export const getAdminSubmissions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const page = (req.query.page as string) || '1';
    const limit = (req.query.limit as string) || '20';
    const trackId = req.query.trackId as string | undefined;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const whereClause: any = {};

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (trackId && trackId !== 'ALL') {
      whereClause.trackId = trackId;
    }

    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { trainer: { name: { contains: q, mode: 'insensitive' } } },
        { trainer: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [submissions, total] = await Promise.all([
      prisma.trainerCourseSubmission.findMany({
        where: whereClause,
        include: {
          sessions: { orderBy: { order: 'asc' } },
          track: true,
          trainer: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              trainerProfile: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.trainerCourseSubmission.count({ where: whereClause }),
    ]);

    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin submissions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch submissions' });
  }
};

// ---------------------------------------------------------------------------
// 2. GET SUBMISSION STATS
// ---------------------------------------------------------------------------
export const getAdminSubmissionStats = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const all = await prisma.trainerCourseSubmission.findMany({
      select: { status: true },
    });

    const stats = {
      all: all.length,
      pending: all.filter((s) => s.status === 'PENDING_REVIEW').length,
      approved: all.filter((s) => s.status === 'APPROVED').length,
      needsRevision: all.filter((s) => s.status === 'NEEDS_REVISION').length,
      rejected: all.filter((s) => s.status === 'REJECTED').length,
      draft: all.filter((s) => s.status === 'DRAFT').length,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error fetching submission stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch submission stats' });
  }
};

// ---------------------------------------------------------------------------
// 3. GET SINGLE SUBMISSION DETAILS FOR ADMIN REVIEW
// ---------------------------------------------------------------------------
export const getAdminSubmissionDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const submission = await prisma.trainerCourseSubmission.findUnique({
      where: { id },
      include: {
        sessions: { orderBy: { order: 'asc' } },
        track: true,
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            createdAt: true,
            trainerProfile: true,
            policyAcceptances: {
              include: { policy: true },
              orderBy: { acceptedAt: 'desc' },
            },
          },
        },
      },
    });

    if (!submission) {
      res.status(404).json({ success: false, message: 'Submission not found' });
      return;
    }

    res.json({
      success: true,
      data: submission,
    });
  } catch (error: any) {
    console.error('Error fetching submission details for review:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch submission details' });
  }
};

// ---------------------------------------------------------------------------
// 4. APPROVE SUBMISSION (Convert to live Course & Assign Trainer)
// ---------------------------------------------------------------------------
export const approveSubmission = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const adminUser = req.user;

    const submission = await prisma.trainerCourseSubmission.findUnique({
      where: { id },
      include: {
        sessions: { orderBy: { order: 'asc' } },
        trainer: true,
        track: true,
      },
    });

    if (!submission) {
      res.status(404).json({ success: false, message: 'Submission not found' });
      return;
    }

    const sessions = submission.sessions || [];
    if (sessions.length === 0) {
      res.status(400).json({ success: false, message: 'Cannot approve submission without sessions' });
      return;
    }

    // 1. Create or Find the Published Course
    let course;
    if (submission.convertedCourseId) {
      course = await prisma.course.findUnique({
        where: { id: submission.convertedCourseId },
      });
    }

    if (!course) {
      const courseSlug = generateCourseSlug(submission.title);
      const instructorName = submission.trainer.name || 'Scalora Faculty';
      const categoryName = submission.trackName || submission.track?.name || 'General';

      // Create standard Course
      course = await prisma.course.create({
        data: {
          title: submission.title,
          slug: courseSlug,
          description: submission.fullDescription || submission.shortDescription || submission.title,
          thumbnail: submission.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
          instructor: instructorName,
          category: categoryName,
          level: submission.level || 'All Levels',
          price: submission.price || 0.0,
          isPublished: true,
        },
      });

      // Create default Curriculum Module
      const module = await prisma.module.create({
        data: {
          courseId: course.id,
          title: 'Course Curriculum',
          order: 1,
        },
      });

      // Create Lessons from Sessions
      for (let i = 0; i < sessions.length; i++) {
        const s = sessions[i];
        await prisma.lesson.create({
          data: {
            moduleId: module.id,
            title: s.title,
            type: s.videoUrl || s.videoId ? 'VIDEO' : 'DOWNLOAD',
            content: s.description || null,
            order: s.order || i + 1,
            duration: `${s.durationMinutes || 30} min`,
            videoProvider: s.videoProvider || 'bunny',
            videoId: s.videoId || null,
            videoUrl: s.videoUrl || null,
            fileUrl: s.fileUrl || null,
            fileName: s.fileName || null,
          },
        });
      }

      // Assign Trainer to Course
      await prisma.courseTrainer.upsert({
        where: {
          courseId_trainerId: {
            courseId: course.id,
            trainerId: submission.trainerId,
          },
        },
        update: { role: 'PRIMARY' },
        create: {
          courseId: course.id,
          trainerId: submission.trainerId,
          role: 'PRIMARY',
        },
      });
    }

    // 2. Update Trainer Submission Record
    const updatedSubmission = await prisma.trainerCourseSubmission.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedBy: adminUser?.name || 'Admin',
        reviewedAt: new Date(),
        convertedCourseId: course.id,
      },
      include: {
        sessions: { orderBy: { order: 'asc' } },
        track: true,
      },
    });

    // 3. Update Trainer Profile Status to APPROVED
    await prisma.trainerProfile.updateMany({
      where: { userId: submission.trainerId },
      data: { status: 'APPROVED' },
    });

    // 4. Create in-app notification for trainer
    try {
      await prisma.communityNotification.create({
        data: {
          userId: submission.trainerId,
          actorId: adminUser?.id || null,
          type: 'SYSTEM',
          message: `🎉 Congratulations! Your course "${submission.title}" has been approved and published to the Scalora catalog.`,
        },
      });
    } catch (notifErr) {
      console.warn('Could not create notification:', notifErr);
    }

    res.json({
      success: true,
      message: `Course "${submission.title}" has been approved and published!`,
      data: {
        submission: updatedSubmission,
        course,
      },
    });
  } catch (error: any) {
    console.error('Error approving submission:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to approve submission' });
  }
};

// ---------------------------------------------------------------------------
// 5. REJECT SUBMISSION
// ---------------------------------------------------------------------------
export const rejectSubmission = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { rejectionReason, suggestedImprovements, adminFeedback } = req.body;
    const adminUser = req.user;

    if (!rejectionReason || !rejectionReason.trim()) {
      res.status(400).json({ success: false, message: 'A rejection reason is mandatory' });
      return;
    }

    const submission = await prisma.trainerCourseSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      res.status(404).json({ success: false, message: 'Submission not found' });
      return;
    }

    const updated = await prisma.trainerCourseSubmission.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
        suggestedImprovements: suggestedImprovements?.trim() || null,
        adminFeedback: adminFeedback?.trim() || null,
        reviewedBy: adminUser?.name || 'Admin',
        reviewedAt: new Date(),
      },
      include: {
        sessions: { orderBy: { order: 'asc' } },
        track: true,
      },
    });

    // Notification
    try {
      await prisma.communityNotification.create({
        data: {
          userId: submission.trainerId,
          actorId: adminUser?.id || null,
          type: 'SYSTEM',
          message: `Your course submission "${submission.title}" was not approved. Reason: ${rejectionReason.trim()}`,
        },
      });
    } catch (notifErr) {
      console.warn('Could not create notification:', notifErr);
    }

    res.json({
      success: true,
      message: 'Course submission has been rejected',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error rejecting submission:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to reject submission' });
  }
};

// ---------------------------------------------------------------------------
// 6. REQUEST REVISION FROM TRAINER
// ---------------------------------------------------------------------------
export const requestRevision = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { adminFeedback, suggestedImprovements } = req.body;
    const adminUser = req.user;

    if (!adminFeedback || !adminFeedback.trim()) {
      res.status(400).json({ success: false, message: 'Feedback for revision is required' });
      return;
    }

    const submission = await prisma.trainerCourseSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      res.status(404).json({ success: false, message: 'Submission not found' });
      return;
    }

    const updated = await prisma.trainerCourseSubmission.update({
      where: { id },
      data: {
        status: 'NEEDS_REVISION',
        adminFeedback: adminFeedback.trim(),
        suggestedImprovements: suggestedImprovements?.trim() || null,
        reviewedBy: adminUser?.name || 'Admin',
        reviewedAt: new Date(),
      },
      include: {
        sessions: { orderBy: { order: 'asc' } },
        track: true,
      },
    });

    // Notification
    try {
      await prisma.communityNotification.create({
        data: {
          userId: submission.trainerId,
          actorId: adminUser?.id || null,
          type: 'SYSTEM',
          message: `Action Required: Your course submission "${submission.title}" requires revisions before approval.`,
        },
      });
    } catch (notifErr) {
      console.warn('Could not create notification:', notifErr);
    }

    res.json({
      success: true,
      message: 'Revision requested from trainer',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error requesting revision:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to request revision' });
  }
};

// ---------------------------------------------------------------------------
// 7. TRACK MANAGEMENT (ADMIN)
// ---------------------------------------------------------------------------
export const getAdminTracks = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tracks = await prisma.teachingTrack.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    });

    res.json({
      success: true,
      data: tracks,
    });
  } catch (error: any) {
    console.error('Error fetching admin tracks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tracks' });
  }
};

export const createAdminTrack = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, slug, description, icon, order, isActive } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, message: 'Track name is required' });
      return;
    }

    const trackSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-');

    const existing = await prisma.teachingTrack.findFirst({
      where: {
        OR: [{ name: name.trim() }, { slug: trackSlug }],
      },
    });

    if (existing) {
      res.status(400).json({ success: false, message: 'Track with this name or slug already exists' });
      return;
    }

    const track = await prisma.teachingTrack.create({
      data: {
        name: name.trim(),
        slug: trackSlug,
        description: description || null,
        icon: icon || 'Briefcase',
        order: Number(order) || 0,
        isActive: isActive !== false,
      },
    });

    res.json({
      success: true,
      message: 'Teaching track created successfully',
      data: track,
    });
  } catch (error: any) {
    console.error('Error creating track:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create track' });
  }
};

export const updateAdminTrack = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, slug, description, icon, order, isActive } = req.body;

    const track = await prisma.teachingTrack.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(slug ? { slug: slug.trim().toLowerCase() } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(icon ? { icon } : {}),
        ...(order !== undefined ? { order: Number(order) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    res.json({
      success: true,
      message: 'Track updated successfully',
      data: track,
    });
  } catch (error: any) {
    console.error('Error updating track:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update track' });
  }
};

export const deleteAdminTrack = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    // Soft delete / toggle active
    await prisma.teachingTrack.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'Track deactivated successfully',
    });
  } catch (error: any) {
    console.error('Error deactivating track:', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate track' });
  }
};

// ---------------------------------------------------------------------------
// 8. POLICY MANAGEMENT (ADMIN)
// ---------------------------------------------------------------------------
export const getAdminPolicy = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const policy = await prisma.trainerPolicy.findFirst({
      where: { isActive: true },
      orderBy: { version: 'desc' },
      include: {
        revisions: { orderBy: { version: 'desc' } },
        _count: { select: { acceptances: true } },
      },
    });

    res.json({
      success: true,
      data: policy,
    });
  } catch (error: any) {
    console.error('Error fetching admin policy:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch policy' });
  }
};

export const updateAdminPolicy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, content, note } = req.body;
    const adminName = req.user?.name || 'Admin';

    if (!content || !content.trim()) {
      res.status(400).json({ success: false, message: 'Policy content cannot be empty' });
      return;
    }

    const currentPolicy = await prisma.trainerPolicy.findFirst({
      where: { isActive: true },
      orderBy: { version: 'desc' },
    });

    const newVersion = (currentPolicy?.version || 0) + 1;

    let updatedPolicy;
    if (currentPolicy) {
      updatedPolicy = await prisma.trainerPolicy.update({
        where: { id: currentPolicy.id },
        data: {
          title: title?.trim() || currentPolicy.title,
          content: content.trim(),
          version: newVersion,
          publishedAt: new Date(),
          lastUpdatedBy: adminName,
        },
      });
    } else {
      updatedPolicy = await prisma.trainerPolicy.create({
        data: {
          title: title?.trim() || 'Scalora Trainer & Academic Standards Policy',
          content: content.trim(),
          version: 1,
          isActive: true,
          publishedAt: new Date(),
          lastUpdatedBy: adminName,
        },
      });
    }

    // Record revision
    await prisma.trainerPolicyRevision.create({
      data: {
        policyId: updatedPolicy.id,
        version: updatedPolicy.version,
        title: updatedPolicy.title,
        content: updatedPolicy.content,
        note: note || `Updated policy to version ${updatedPolicy.version}`,
        author: adminName,
      },
    });

    res.json({
      success: true,
      message: `Trainer Policy updated to Version ${updatedPolicy.version}`,
      data: updatedPolicy,
    });
  } catch (error: any) {
    console.error('Error updating trainer policy:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update policy' });
  }
};
