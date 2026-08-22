import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { communityService } from '../services/community.service.js';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createPostSchema = z.object({
  channelId: z.string().min(1, 'Channel ID is required'),
  type: z.enum(['TEXT', 'IMAGE', 'FILE', 'LINK', 'ANNOUNCEMENT']).optional().default('TEXT'),
  title: z.string().optional().or(z.literal('')),
  content: z.string().min(1, 'Post content cannot be empty'),
  mediaUrl: z.string().optional().or(z.literal('')),
  fileName: z.string().optional().or(z.literal('')),
  fileUrl: z.string().optional().or(z.literal('')),
  fileSize: z.string().optional().or(z.literal('')),
  linkUrl: z.string().optional().or(z.literal('')),
  isPinned: z.boolean().optional().default(false),
  isAnnouncement: z.boolean().optional().default(false),
});

const updatePostSchema = z.object({
  title: z.string().optional().or(z.literal('')),
  content: z.string().min(1, 'Post content cannot be empty'),
  mediaUrl: z.string().optional().or(z.literal('')),
  fileName: z.string().optional().or(z.literal('')),
  fileUrl: z.string().optional().or(z.literal('')),
  fileSize: z.string().optional().or(z.literal('')),
  linkUrl: z.string().optional().or(z.literal('')),
  isPinned: z.boolean().optional(),
  isAnnouncement: z.boolean().optional(),
});

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
  parentId: z.string().optional().nullable(),
});

// ============================================================================
// CHANNELS CONTROLLERS
// ============================================================================

export const getCommunityChannels = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Auto-heal / sync missing channels if needed
    await communityService.syncAllChannelsAndMembers();

    // Check student enrollments
    if (userRole !== 'ADMIN') {
      const activeEnrollments = await prisma.enrollment.findMany({
        where: { userId, status: 'ACTIVE' },
        select: { courseId: true },
      });

      if (activeEnrollments.length === 0) {
        res.json({
          success: true,
          hasAccess: false,
          message: 'You must be enrolled in a course to join the Scalora Community.',
          channels: [],
          stats: { enrolledCount: 0, totalChannels: 0 },
        });
        return;
      }

      const enrolledCourseIds = activeEnrollments.map((e) => e.courseId);

      // Fetch channels where courseId is in user's enrolled courses
      const channels = await prisma.communityChannel.findMany({
        where: {
          OR: [
            { courseId: { in: enrolledCourseIds } },
            { members: { some: { userId } } },
          ],
          isArchived: false,
        },
        orderBy: { createdAt: 'asc' },
        include: {
          course: {
            select: { id: true, title: true, slug: true, thumbnail: true, category: true, instructor: true },
          },
          _count: {
            select: { members: true, posts: true },
          },
        },
      });

      res.json({
        success: true,
        hasAccess: true,
        channels: channels.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          courseId: c.courseId,
          course: c.course,
          isLocked: c.isLocked,
          isArchived: c.isArchived,
          membersCount: c._count.members,
          postsCount: c._count.posts,
          createdAt: c.createdAt,
        })),
        stats: { enrolledCount: activeEnrollments.length, totalChannels: channels.length },
      });
      return;
    }

    // ADMIN: Fetch all channels
    const channels = await prisma.communityChannel.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        course: {
          select: { id: true, title: true, slug: true, thumbnail: true, category: true, instructor: true },
        },
        _count: {
          select: { members: true, posts: true },
        },
      },
    });

    res.json({
      success: true,
      hasAccess: true,
      isAdmin: true,
      channels: channels.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        courseId: c.courseId,
        course: c.course,
        isLocked: c.isLocked,
        isArchived: c.isArchived,
        membersCount: c._count.members,
        postsCount: c._count.posts,
        createdAt: c.createdAt,
      })),
      stats: { totalChannels: channels.length },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching channels' });
  }
};

export const getCommunityChannelById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const channelId = req.params.id as string;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const channel = await prisma.communityChannel.findUnique({
      where: { id: channelId },
      include: {
        course: {
          select: { id: true, title: true, slug: true, thumbnail: true, category: true, instructor: true },
        },
        _count: {
          select: { members: true, posts: true },
        },
        members: {
          take: 8,
          include: {
            user: {
              select: { id: true, name: true, avatar: true, role: true, bio: true },
            },
          },
          orderBy: { joinedAt: 'desc' },
        },
      },
    });

    if (!channel) {
      res.status(404).json({ success: false, message: 'Community channel not found' });
      return;
    }

    // Check membership / access
    let isMember = false;
    if (userId) {
      const membership = await prisma.communityMember.findUnique({
        where: {
          channelId_userId: {
            channelId,
            userId,
          },
        },
      });

      if (membership || userRole === 'ADMIN') {
        isMember = true;
      } else if (channel.courseId) {
        // Check if enrolled in linked course, auto-join
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: channel.courseId,
            },
          },
        });

        if (enrollment && enrollment.status === 'ACTIVE') {
          await communityService.autoEnrollInChannel(userId, channel.courseId);
          isMember = true;
        }
      }
    }

    if (!isMember && userRole !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'You are not enrolled in the course associated with this private channel.',
      });
      return;
    }

    res.json({
      success: true,
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        courseId: channel.courseId,
        course: channel.course,
        isLocked: channel.isLocked,
        isArchived: channel.isArchived,
        membersCount: channel._count.members,
        postsCount: channel._count.posts,
        recentMembers: channel.members.map((m) => ({
          ...m.user,
          channelRole: m.role,
          joinedAt: m.joinedAt,
        })),
        createdAt: channel.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching channel details' });
  }
};

export const getChannelMembers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const channelId = req.params.id as string;
    const { search, limit = '50' } = req.query;

    const where: any = { channelId };

    if (search && typeof search === 'string' && search.trim()) {
      where.user = {
        OR: [
          { name: { contains: search.trim(), mode: 'insensitive' } },
          { email: { contains: search.trim(), mode: 'insensitive' } },
        ],
      };
    }

    const members = await prisma.communityMember.findMany({
      where,
      take: Math.min(100, parseInt(limit as string, 10) || 50),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            bio: true,
            createdAt: true,
            _count: {
              select: { enrollments: true, communityPosts: true, communityComments: true },
            },
          },
        },
      },
      orderBy: [{ role: 'asc' }, { joinedAt: 'desc' }],
    });

    res.json({
      success: true,
      members: members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatar: m.user.avatar,
        role: m.user.role,
        channelRole: m.role,
        bio: m.user.bio,
        joinedAt: m.joinedAt,
        enrolledCoursesCount: m.user._count.enrollments,
        postsCount: m.user._count.communityPosts,
        commentsCount: m.user._count.communityComments,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching channel members' });
  }
};

// ============================================================================
// POSTS CONTROLLERS (FEED, CREATE, LIKE, SAVE, PIN, DELETE)
// ============================================================================

export const getChannelPosts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const channelId = req.params.id as string;
    const userId = req.user?.id;
    const { type, search, page = '1', limit = '30' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 30));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { channelId };

    if (type === 'ANNOUNCEMENTS') {
      where.isAnnouncement = true;
    } else if (type === 'RESOURCES') {
      where.OR = [
        { type: 'FILE' },
        { type: 'LINK' },
        { fileUrl: { not: null } },
        { linkUrl: { not: null } },
      ];
    } else if (type === 'MEDIA') {
      where.OR = [{ type: 'IMAGE' }, { mediaUrl: { not: null } }];
    } else if (type === 'SAVED' && userId) {
      where.savedBy = { some: { userId } };
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { content: { contains: q, mode: 'insensitive' } },
            { title: { contains: q, mode: 'insensitive' } },
            { user: { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    const [posts, totalCount] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
              bio: true,
            },
          },
          _count: {
            select: { comments: true, likes: true },
          },
          likes: userId ? { where: { userId }, select: { id: true } } : false,
          savedBy: userId ? { where: { userId }, select: { id: true } } : false,
          comments: {
            take: 2,
            where: { parentId: null },
            orderBy: { createdAt: 'desc' },
            include: {
              user: { select: { id: true, name: true, avatar: true, role: true } },
              _count: { select: { replies: true } },
            },
          },
        },
      }),
      prisma.communityPost.count({ where }),
    ]);

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      channelId: post.channelId,
      type: post.type,
      title: post.title,
      content: post.content,
      mediaUrl: post.mediaUrl,
      fileName: post.fileName,
      fileUrl: post.fileUrl,
      fileSize: post.fileSize,
      linkUrl: post.linkUrl,
      isPinned: post.isPinned,
      isAnnouncement: post.isAnnouncement,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        id: post.user.id,
        name: post.user.name,
        email: post.user.email,
        avatar: post.user.avatar,
        role: post.user.role,
        bio: post.user.bio,
      },
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      isLiked: userId ? Array.isArray(post.likes) && post.likes.length > 0 : false,
      isSaved: userId ? Array.isArray(post.savedBy) && post.savedBy.length > 0 : false,
      recentComments: post.comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        author: c.user,
        repliesCount: c._count.replies,
      })),
    }));

    res.json({
      success: true,
      posts: formattedPosts,
      total: totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching posts' });
  }
};

export const createPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userName = req.user?.name || 'Community Member';

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const validatedData = createPostSchema.parse(req.body);

    // Verify channel
    const channel = await prisma.communityChannel.findUnique({
      where: { id: validatedData.channelId },
    });

    if (!channel) {
      res.status(404).json({ success: false, message: 'Channel not found' });
      return;
    }

    if (channel.isLocked && userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'This channel is currently locked by administrators.' });
      return;
    }

    // Only Admin can pin or mark as announcement
    const isPinned = userRole === 'ADMIN' ? Boolean(validatedData.isPinned) : false;
    const isAnnouncement = userRole === 'ADMIN' ? Boolean(validatedData.isAnnouncement) : false;

    const post = await prisma.communityPost.create({
      data: {
        channelId: validatedData.channelId,
        userId,
        type: validatedData.type || 'TEXT',
        title: validatedData.title || null,
        content: validatedData.content,
        mediaUrl: validatedData.mediaUrl || null,
        fileName: validatedData.fileName || null,
        fileUrl: validatedData.fileUrl || null,
        fileSize: validatedData.fileSize || null,
        linkUrl: validatedData.linkUrl || null,
        isPinned,
        isAnnouncement,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, role: true, bio: true },
        },
      },
    });

    // If announcement, broadcast notification
    if (isAnnouncement) {
      await communityService.broadcastChannelAnnouncement({
        channelId: channel.id,
        actorId: userId,
        postId: post.id,
        announcementTitle: validatedData.title || validatedData.content.slice(0, 45) + '...',
      });
    }

    res.status(201).json({
      success: true,
      message: isAnnouncement ? 'Announcement broadcasted to channel!' : 'Post published successfully!',
      post: {
        ...post,
        author: post.user,
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        isSaved: false,
        recentComments: [],
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Error creating post' });
  }
};

export const updatePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const postId = req.params.id as string;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const existingPost = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    if (existingPost.userId !== userId && userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'You can only edit your own posts' });
      return;
    }

    const validatedData = updatePostSchema.parse(req.body);

    const updated = await prisma.communityPost.update({
      where: { id: postId },
      data: {
        title: validatedData.title !== undefined ? validatedData.title || null : existingPost.title,
        content: validatedData.content,
        mediaUrl: validatedData.mediaUrl !== undefined ? validatedData.mediaUrl || null : existingPost.mediaUrl,
        fileName: validatedData.fileName !== undefined ? validatedData.fileName || null : existingPost.fileName,
        fileUrl: validatedData.fileUrl !== undefined ? validatedData.fileUrl || null : existingPost.fileUrl,
        fileSize: validatedData.fileSize !== undefined ? validatedData.fileSize || null : existingPost.fileSize,
        linkUrl: validatedData.linkUrl !== undefined ? validatedData.linkUrl || null : existingPost.linkUrl,
        isPinned: userRole === 'ADMIN' && validatedData.isPinned !== undefined ? validatedData.isPinned : existingPost.isPinned,
        isAnnouncement:
          userRole === 'ADMIN' && validatedData.isAnnouncement !== undefined
            ? validatedData.isAnnouncement
            : existingPost.isAnnouncement,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, role: true, bio: true },
        },
      },
    });

    res.json({
      success: true,
      message: 'Post updated successfully',
      post: updated,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Error updating post' });
  }
};

export const deletePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const postId = req.params.id as string;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const existingPost = await prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    if (existingPost.userId !== userId && userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'You can only delete your own posts' });
      return;
    }

    await prisma.communityPost.delete({ where: { id: postId } });

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting post' });
  }
};

export const toggleLikePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const postId = req.params.id as string;
    const userId = req.user?.id;
    const userName = req.user?.name || 'Someone';

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: { channel: { select: { name: true } } },
    });

    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    const existingLike = await prisma.communityLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    let isLiked = false;

    if (existingLike) {
      await prisma.communityLike.delete({
        where: { id: existingLike.id },
      });
      isLiked = false;
    } else {
      await prisma.communityLike.create({
        data: { postId, userId },
      });
      isLiked = true;

      // Trigger notification to author
      if (post.userId !== userId) {
        await communityService.createNotification({
          userId: post.userId,
          actorId: userId,
          channelId: post.channelId,
          postId: post.id,
          type: 'LIKE',
          message: `${userName} liked your post in ${post.channel.name}.`,
        });
      }
    }

    const likesCount = await prisma.communityLike.count({ where: { postId } });

    res.json({
      success: true,
      isLiked,
      likesCount,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error toggling like' });
  }
};

export const toggleSavePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const postId = req.params.id as string;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const existingSave = await prisma.communitySavedPost.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    let isSaved = false;

    if (existingSave) {
      await prisma.communitySavedPost.delete({
        where: { id: existingSave.id },
      });
      isSaved = false;
    } else {
      await prisma.communitySavedPost.create({
        data: { postId, userId },
      });
      isSaved = true;
    }

    res.json({
      success: true,
      isSaved,
      message: isSaved ? 'Post saved to your bookmarks' : 'Post removed from your bookmarks',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error toggling saved post' });
  }
};

export const togglePinPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const postId = req.params.id as string;

    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    const updated = await prisma.communityPost.update({
      where: { id: postId },
      data: { isPinned: !post.isPinned },
    });

    res.json({
      success: true,
      message: updated.isPinned ? 'Post pinned to channel feed' : 'Post unpinned',
      isPinned: updated.isPinned,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error pinning post' });
  }
};

// ============================================================================
// COMMENTS & REPLIES CONTROLLERS
// ============================================================================

export const getPostComments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const postId = req.params.id as string;

    const comments = await prisma.communityComment.findMany({
      where: { postId, parentId: null },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, role: true, bio: true },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, name: true, avatar: true, role: true, bio: true },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      comments: comments.map((c) => ({
        id: c.id,
        postId: c.postId,
        content: c.content,
        createdAt: c.createdAt,
        author: c.user,
        replies: c.replies.map((r) => ({
          id: r.id,
          parentId: r.parentId,
          content: r.content,
          createdAt: r.createdAt,
          author: r.user,
        })),
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching comments' });
  }
};

export const createComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const postId = req.params.id as string;
    const userId = req.user?.id;
    const userName = req.user?.name || 'Someone';

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { content, parentId } = createCommentSchema.parse(req.body);

    const post = await prisma.communityPost.findUnique({
      where: { id: postId },
      include: { channel: { select: { id: true, name: true, isLocked: true } } },
    });

    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    if (post.channel.isLocked && req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Channel is locked. No new comments allowed.' });
      return;
    }

    const comment = await prisma.communityComment.create({
      data: {
        postId,
        userId,
        parentId: parentId || null,
        content,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, role: true, bio: true },
        },
      },
    });

    // Notifications
    if (parentId) {
      const parentComment = await prisma.communityComment.findUnique({
        where: { id: parentId },
      });
      if (parentComment && parentComment.userId !== userId) {
        await communityService.createNotification({
          userId: parentComment.userId,
          actorId: userId,
          channelId: post.channel.id,
          postId: post.id,
          type: 'REPLY',
          message: `${userName} replied to your comment in ${post.channel.name}.`,
        });
      }
    } else if (post.userId !== userId) {
      await communityService.createNotification({
        userId: post.userId,
        actorId: userId,
        channelId: post.channel.id,
        postId: post.id,
        type: 'COMMENT',
        message: `${userName} commented on your post: "${content.slice(0, 40)}..."`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comment added',
      comment: {
        id: comment.id,
        postId: comment.postId,
        parentId: comment.parentId,
        content: comment.content,
        createdAt: comment.createdAt,
        author: comment.user,
        replies: [],
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Error adding comment' });
  }
};

export const deleteComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const commentId = req.params.id as string;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const comment = await prisma.communityComment.findUnique({ where: { id: commentId } });
    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    if (comment.userId !== userId && userRole !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'You can only delete your own comments' });
      return;
    }

    await prisma.communityComment.delete({ where: { id: commentId } });

    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting comment' });
  }
};

// ============================================================================
// NOTIFICATIONS CONTROLLERS
// ============================================================================

export const getMyNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.communityNotification.findMany({
        where: { userId },
        take: 40,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, name: true, avatar: true, role: true },
          },
          channel: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.communityNotification.count({
        where: { userId, isRead: false },
      }),
    ]);

    res.json({
      success: true,
      unreadCount,
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        isRead: n.isRead,
        channelId: n.channelId,
        channelName: n.channel?.name,
        postId: n.postId,
        actor: n.actor,
        createdAt: n.createdAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching notifications' });
  }
};

export const markNotificationRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id;

    await prisma.communityNotification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating notification' });
  }
};

export const markAllNotificationsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    await prisma.communityNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error marking all read' });
  }
};

// ============================================================================
// MEMBER PROFILE & GLOBAL COMMUNITY SEARCH
// ============================================================================

export const getMemberProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = req.params.userId as string;

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        bio: true,
        createdAt: true,
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            course: {
              select: { id: true, title: true, slug: true, thumbnail: true, category: true, instructor: true },
            },
          },
        },
        _count: {
          select: {
            communityPosts: true,
            communityComments: true,
            certificates: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'Community member not found' });
      return;
    }

    const recentPosts = await prisma.communityPost.findMany({
      where: { userId: targetUserId },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: {
        channel: { select: { id: true, name: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    res.json({
      success: true,
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        bio: user.bio,
        joinedAt: user.createdAt,
        totalPosts: user._count.communityPosts,
        totalComments: user._count.communityComments,
        certificatesCount: user._count.certificates,
        enrolledCourses: user.enrollments.map((e) => e.course),
        recentPosts: recentPosts.map((p) => ({
          id: p.id,
          channelId: p.channelId,
          channelName: p.channel.name,
          title: p.title,
          content: p.content,
          type: p.type,
          createdAt: p.createdAt,
          likesCount: p._count.likes,
          commentsCount: p._count.comments,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching member profile' });
  }
};

export const searchCommunity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || !q.trim()) {
      res.json({ success: true, posts: [], members: [], channels: [] });
      return;
    }

    const searchTerm = q.trim();

    const [posts, members, channels] = await Promise.all([
      prisma.communityPost.findMany({
        where: {
          OR: [
            { content: { contains: searchTerm, mode: 'insensitive' } },
            { title: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 10,
        include: {
          user: { select: { id: true, name: true, avatar: true, role: true } },
          channel: { select: { id: true, name: true } },
        },
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { bio: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true,
          bio: true,
        },
      }),
      prisma.communityChannel.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: {
          id: true,
          name: true,
          description: true,
          _count: { select: { members: true, posts: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      posts,
      members,
      channels,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Search failed' });
  }
};

// ============================================================================
// ADMIN COMMUNITY MANAGEMENT
// ============================================================================

export const getAdminCommunityOverview = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [totalChannels, totalPosts, totalComments, totalMembers, channels, recentPosts] = await Promise.all([
      prisma.communityChannel.count(),
      prisma.communityPost.count(),
      prisma.communityComment.count(),
      prisma.communityMember.count(),
      prisma.communityChannel.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          course: { select: { id: true, title: true } },
          _count: { select: { members: true, posts: true } },
        },
      }),
      prisma.communityPost.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, avatar: true, role: true, email: true } },
          channel: { select: { id: true, name: true } },
          _count: { select: { comments: true, likes: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      stats: {
        totalChannels,
        totalPosts,
        totalComments,
        totalMembers,
      },
      channels: channels.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        courseId: c.courseId,
        courseTitle: c.course?.title,
        isLocked: c.isLocked,
        isArchived: c.isArchived,
        membersCount: c._count.members,
        postsCount: c._count.posts,
        createdAt: c.createdAt,
      })),
      recentPosts: recentPosts.map((p) => ({
        id: p.id,
        channelId: p.channelId,
        channelName: p.channel.name,
        type: p.type,
        title: p.title,
        content: p.content,
        mediaUrl: p.mediaUrl,
        fileName: p.fileName,
        isPinned: p.isPinned,
        isAnnouncement: p.isAnnouncement,
        createdAt: p.createdAt,
        author: p.user,
        likesCount: p._count.likes,
        commentsCount: p._count.comments,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching admin overview' });
  }
};

export const toggleChannelLock = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const channelId = req.params.id as string;

    const channel = await prisma.communityChannel.findUnique({ where: { id: channelId } });
    if (!channel) {
      res.status(404).json({ success: false, message: 'Channel not found' });
      return;
    }

    const updated = await prisma.communityChannel.update({
      where: { id: channelId },
      data: { isLocked: !channel.isLocked },
    });

    res.json({
      success: true,
      message: updated.isLocked ? 'Channel locked (members cannot create new posts)' : 'Channel unlocked',
      channel: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error toggling channel lock' });
  }
};

export const toggleChannelArchive = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const channelId = req.params.id as string;

    const channel = await prisma.communityChannel.findUnique({ where: { id: channelId } });
    if (!channel) {
      res.status(404).json({ success: false, message: 'Channel not found' });
      return;
    }

    const updated = await prisma.communityChannel.update({
      where: { id: channelId },
      data: { isArchived: !channel.isArchived },
    });

    res.json({
      success: true,
      message: updated.isArchived ? 'Channel archived' : 'Channel unarchived',
      channel: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error archiving channel' });
  }
};

export const removeChannelMember = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const channelId = req.params.channelId as string;
    const userId = req.params.userId as string;

    await prisma.communityMember.deleteMany({
      where: { channelId, userId },
    });

    res.json({ success: true, message: 'Member removed from channel successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error removing member' });
  }
};

export const broadcastAdminAnnouncement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    const { channelId, title, content, pinPost = true } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ success: false, message: 'Announcement content cannot be empty' });
      return;
    }

    if (!adminId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    let targetChannels: { id: string; name: string }[] = [];

    if (channelId && channelId !== 'ALL') {
      const channel = await prisma.communityChannel.findUnique({ where: { id: channelId } });
      if (!channel) {
        res.status(404).json({ success: false, message: 'Channel not found' });
        return;
      }
      targetChannels = [channel];
    } else {
      targetChannels = await prisma.communityChannel.findMany({ select: { id: true, name: true } });
    }

    const createdPosts = [];

    for (const ch of targetChannels) {
      const post = await prisma.communityPost.create({
        data: {
          channelId: ch.id,
          userId: adminId,
          type: 'ANNOUNCEMENT',
          title: title ? title.trim() : 'Official Announcement',
          content: content.trim(),
          isAnnouncement: true,
          isPinned: Boolean(pinPost),
        },
      });

      await communityService.broadcastChannelAnnouncement({
        channelId: ch.id,
        actorId: adminId,
        postId: post.id,
        announcementTitle: title || 'Official Announcement',
      });

      createdPosts.push(post);
    }

    res.status(201).json({
      success: true,
      message: `Announcement broadcasted to ${targetChannels.length} channel(s)!`,
      postsCount: createdPosts.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error broadcasting announcement' });
  }
};
