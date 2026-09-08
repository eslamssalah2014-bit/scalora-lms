"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDraftSubmission = exports.getSubmissionById = exports.getMySubmissions = exports.submitCourseForReview = exports.saveCourseDraft = exports.getTrainerProfile = exports.registerTrainerProfile = exports.acceptPolicy = exports.getActivePolicy = exports.getActiveTracks = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_js_1 = require("../lib/prisma.js");
const JWT_SECRET = process.env.JWT_SECRET || 'scalora_super_secret_jwt_key_2026_modern_lms';
// Helper to generate a clean URL slug
function generateSlug(text) {
    const base = text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    return `${base || 'course'}-${randomSuffix}`;
}
// ---------------------------------------------------------------------------
// 1. GET ALL ACTIVE TEACHING TRACKS
// ---------------------------------------------------------------------------
const getActiveTracks = async (_req, res) => {
    try {
        const tracks = await prisma_js_1.prisma.teachingTrack.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });
        res.json({
            success: true,
            data: tracks,
        });
    }
    catch (error) {
        console.error('Error fetching teaching tracks:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch tracks' });
    }
};
exports.getActiveTracks = getActiveTracks;
// ---------------------------------------------------------------------------
// 2. GET ACTIVE TRAINER POLICY
// ---------------------------------------------------------------------------
const getActivePolicy = async (req, res) => {
    try {
        const policy = await prisma_js_1.prisma.trainerPolicy.findFirst({
            where: { isActive: true },
            orderBy: { version: 'desc' },
        });
        let hasAccepted = false;
        let acceptedVersion = 0;
        if (req.user?.id && policy) {
            const acceptance = await prisma_js_1.prisma.trainerPolicyAcceptance.findFirst({
                where: {
                    userId: req.user.id,
                    policyId: policy.id,
                    policyVersion: policy.version,
                },
            });
            if (acceptance) {
                hasAccepted = true;
                acceptedVersion = acceptance.policyVersion;
            }
        }
        res.json({
            success: true,
            data: {
                policy,
                hasAccepted,
                acceptedVersion,
            },
        });
    }
    catch (error) {
        console.error('Error fetching trainer policy:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch policy' });
    }
};
exports.getActivePolicy = getActivePolicy;
// ---------------------------------------------------------------------------
// 3. ACCEPT TRAINER POLICY
// ---------------------------------------------------------------------------
const acceptPolicy = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { policyId, policyVersion } = req.body;
        if (!policyId) {
            res.status(400).json({ success: false, message: 'Policy ID is required' });
            return;
        }
        const policy = await prisma_js_1.prisma.trainerPolicy.findUnique({
            where: { id: policyId },
        });
        if (!policy) {
            res.status(404).json({ success: false, message: 'Policy not found' });
            return;
        }
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';
        const acceptance = await prisma_js_1.prisma.trainerPolicyAcceptance.create({
            data: {
                userId,
                policyId: policy.id,
                policyVersion: policyVersion || policy.version,
                ipAddress: typeof ipAddress === 'string' ? ipAddress.split(',')[0].trim() : '',
                userAgent,
            },
        });
        res.json({
            success: true,
            message: 'Policy accepted successfully',
            data: acceptance,
        });
    }
    catch (error) {
        console.error('Error accepting policy:', error);
        res.status(500).json({ success: false, message: 'Failed to accept policy' });
    }
};
exports.acceptPolicy = acceptPolicy;
// ---------------------------------------------------------------------------
// 4. REGISTER / UPDATE TRAINER PROFILE (With Uniqueness Checks)
// ---------------------------------------------------------------------------
const registerTrainerProfile = async (req, res) => {
    try {
        const { fullName, email, mobile, country, linkedin, yearsExperience, professionalTitle, bio, preferredTrackId, password, } = req.body;
        // Strict Validations
        if (!fullName || !fullName.trim()) {
            res.status(400).json({ success: false, message: 'Full name is required' });
            return;
        }
        if (!email || !email.trim()) {
            res.status(400).json({ success: false, message: 'Email address is required' });
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            res.status(400).json({ success: false, message: 'Please provide a valid email address' });
            return;
        }
        if (!mobile || !mobile.trim()) {
            res.status(400).json({ success: false, message: 'Mobile number is required' });
            return;
        }
        const cleanEmail = email.trim().toLowerCase();
        const cleanMobile = mobile.trim();
        let currentUserId = req.user?.id;
        let token;
        let userObj;
        // 1. Check duplicate mobile across other trainer profiles
        const existingMobileProfile = await prisma_js_1.prisma.trainerProfile.findFirst({
            where: {
                mobile: cleanMobile,
                ...(currentUserId ? { userId: { not: currentUserId } } : {}),
            },
        });
        if (existingMobileProfile) {
            res.status(400).json({
                success: false,
                message: 'This mobile number is already registered with another trainer profile.',
            });
            return;
        }
        // 2. If user is logged in
        if (currentUserId) {
            // Check if email belongs to another user
            const duplicateUser = await prisma_js_1.prisma.user.findFirst({
                where: {
                    email: cleanEmail,
                    id: { not: currentUserId },
                },
            });
            if (duplicateUser) {
                res.status(400).json({
                    success: false,
                    message: 'This email address is already associated with another account.',
                });
                return;
            }
            // Update user info and role to TRAINER if STUDENT
            userObj = await prisma_js_1.prisma.user.update({
                where: { id: currentUserId },
                data: {
                    name: fullName.trim(),
                    ...(req.user?.role === 'STUDENT' ? { role: 'TRAINER' } : {}),
                },
            });
        }
        else {
            // 3. User is NOT logged in: check if user exists by email
            const existingUser = await prisma_js_1.prisma.user.findUnique({
                where: { email: cleanEmail },
            });
            if (existingUser) {
                // User already has an account, verify password if provided or ask to log in
                if (password) {
                    const isMatch = await bcryptjs_1.default.compare(password, existingUser.password);
                    if (!isMatch) {
                        res.status(400).json({
                            success: false,
                            message: 'An account with this email already exists. Incorrect password provided. Please sign in first.',
                        });
                        return;
                    }
                    currentUserId = existingUser.id;
                    userObj = existingUser;
                    // Upgrade role if student
                    if (existingUser.role === 'STUDENT') {
                        userObj = await prisma_js_1.prisma.user.update({
                            where: { id: existingUser.id },
                            data: { role: 'TRAINER' },
                        });
                    }
                }
                else {
                    res.status(400).json({
                        success: false,
                        message: 'An account with this email already exists. Please log in or enter your account password.',
                        requireLogin: true,
                    });
                    return;
                }
            }
            else {
                // Create brand new user with role TRAINER
                const rawPassword = password || `ScaloraTrainer@${Math.random().toString(36).slice(2, 8)}`;
                const hashedPassword = await bcryptjs_1.default.hash(rawPassword, 10);
                userObj = await prisma_js_1.prisma.user.create({
                    data: {
                        name: fullName.trim(),
                        email: cleanEmail,
                        password: hashedPassword,
                        role: 'TRAINER',
                    },
                });
                currentUserId = userObj.id;
            }
            // Generate JWT Token for immediate seamless onboarding
            token = jsonwebtoken_1.default.sign({
                id: userObj.id,
                email: userObj.email,
                role: userObj.role,
                name: userObj.name,
            }, JWT_SECRET, { expiresIn: '30d' });
        }
        // 4. Upsert Trainer Profile
        const profile = await prisma_js_1.prisma.trainerProfile.upsert({
            where: { userId: currentUserId },
            update: {
                fullName: fullName.trim(),
                email: cleanEmail,
                mobile: cleanMobile,
                country: country || null,
                linkedin: linkedin || null,
                yearsExperience: Number(yearsExperience) || 0,
                professionalTitle: professionalTitle || null,
                bio: bio || null,
                preferredTrackId: preferredTrackId || null,
            },
            create: {
                userId: currentUserId,
                fullName: fullName.trim(),
                email: cleanEmail,
                mobile: cleanMobile,
                country: country || null,
                linkedin: linkedin || null,
                yearsExperience: Number(yearsExperience) || 0,
                professionalTitle: professionalTitle || null,
                bio: bio || null,
                preferredTrackId: preferredTrackId || null,
                status: 'REGISTERED',
            },
        });
        res.json({
            success: true,
            message: 'Trainer profile saved successfully',
            data: {
                profile,
                user: {
                    id: userObj.id,
                    name: userObj.name,
                    email: userObj.email,
                    role: userObj.role,
                },
                token,
            },
        });
    }
    catch (error) {
        console.error('Error saving trainer profile:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to save trainer profile' });
    }
};
exports.registerTrainerProfile = registerTrainerProfile;
// ---------------------------------------------------------------------------
// 5. GET CURRENT TRAINER PROFILE & ONBOARDING STATUS
// ---------------------------------------------------------------------------
const getTrainerProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const profile = await prisma_js_1.prisma.trainerProfile.findUnique({
            where: { userId },
        });
        const activePolicy = await prisma_js_1.prisma.trainerPolicy.findFirst({
            where: { isActive: true },
            orderBy: { version: 'desc' },
        });
        let policyAccepted = false;
        if (activePolicy) {
            const acceptance = await prisma_js_1.prisma.trainerPolicyAcceptance.findFirst({
                where: {
                    userId,
                    policyId: activePolicy.id,
                    policyVersion: activePolicy.version,
                },
            });
            policyAccepted = !!acceptance;
        }
        res.json({
            success: true,
            data: {
                profile,
                policyAccepted,
                activePolicy,
            },
        });
    }
    catch (error) {
        console.error('Error fetching trainer profile:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch trainer profile' });
    }
};
exports.getTrainerProfile = getTrainerProfile;
// ---------------------------------------------------------------------------
// 6. SAVE COURSE SUBMISSION DRAFT (Additive / Non-blocking)
// ---------------------------------------------------------------------------
const saveCourseDraft = async (req, res) => {
    try {
        const trainerId = req.user?.id;
        if (!trainerId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { id, trackId, trackName, title, shortDescription, fullDescription, thumbnail, level, price, currency, numberOfSessions, submissionNotes, sessions, } = req.body;
        const courseTitle = title?.trim() || 'Untitled Course Draft';
        const numSessions = Number(numberOfSessions) || (Array.isArray(sessions) ? sessions.length : 1) || 1;
        // Calculate total duration from sessions
        let totalDurationMinutes = 0;
        if (Array.isArray(sessions)) {
            totalDurationMinutes = sessions.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);
        }
        let submission;
        if (id) {
            // Verify ownership
            const existing = await prisma_js_1.prisma.trainerCourseSubmission.findUnique({
                where: { id },
            });
            if (!existing || existing.trainerId !== trainerId) {
                res.status(403).json({ success: false, message: 'Submission not found or unauthorized' });
                return;
            }
            // Update submission draft
            submission = await prisma_js_1.prisma.trainerCourseSubmission.update({
                where: { id },
                data: {
                    trackId: trackId || null,
                    trackName: trackName || null,
                    title: courseTitle,
                    shortDescription: shortDescription || null,
                    fullDescription: fullDescription || null,
                    thumbnail: thumbnail || null,
                    level: level || 'All Levels',
                    price: Number(price) || 0.0,
                    currency: currency || 'USD',
                    numberOfSessions: numSessions,
                    totalDurationMinutes,
                    submissionNotes: submissionNotes || null,
                    // Only update to DRAFT if previously DRAFT or NEEDS_REVISION
                    ...(existing.status === 'NEEDS_REVISION' ? { status: 'DRAFT' } : {}),
                },
            });
            // Update sessions: delete old sessions for this submission and recreate cleanly
            if (Array.isArray(sessions)) {
                await prisma_js_1.prisma.trainerSubmissionSession.deleteMany({
                    where: { submissionId: id },
                });
                for (let i = 0; i < sessions.length; i++) {
                    const s = sessions[i];
                    await prisma_js_1.prisma.trainerSubmissionSession.create({
                        data: {
                            submissionId: id,
                            title: s.title?.trim() || `Session ${i + 1}`,
                            description: s.description || null,
                            order: i + 1,
                            sessionNumber: Number(s.sessionNumber) || i + 1,
                            durationMinutes: Number(s.durationMinutes) || 0,
                            videoProvider: s.videoProvider || 'bunny',
                            videoId: s.videoId || null,
                            videoUrl: s.videoUrl || null,
                            fileUrl: s.fileUrl || null,
                            fileName: s.fileName || null,
                        },
                    });
                }
            }
        }
        else {
            // Create new draft
            const slug = generateSlug(courseTitle);
            submission = await prisma_js_1.prisma.trainerCourseSubmission.create({
                data: {
                    trainerId,
                    trackId: trackId || null,
                    trackName: trackName || null,
                    title: courseTitle,
                    slug,
                    shortDescription: shortDescription || null,
                    fullDescription: fullDescription || null,
                    thumbnail: thumbnail || null,
                    level: level || 'All Levels',
                    price: Number(price) || 0.0,
                    currency: currency || 'USD',
                    numberOfSessions: numSessions,
                    totalDurationMinutes,
                    status: 'DRAFT',
                    submissionNotes: submissionNotes || null,
                },
            });
            if (Array.isArray(sessions) && sessions.length > 0) {
                for (let i = 0; i < sessions.length; i++) {
                    const s = sessions[i];
                    await prisma_js_1.prisma.trainerSubmissionSession.create({
                        data: {
                            submissionId: submission.id,
                            title: s.title?.trim() || `Session ${i + 1}`,
                            description: s.description || null,
                            order: i + 1,
                            sessionNumber: Number(s.sessionNumber) || i + 1,
                            durationMinutes: Number(s.durationMinutes) || 0,
                            videoProvider: s.videoProvider || 'bunny',
                            videoId: s.videoId || null,
                            videoUrl: s.videoUrl || null,
                            fileUrl: s.fileUrl || null,
                            fileName: s.fileName || null,
                        },
                    });
                }
            }
        }
        const completeSubmission = await prisma_js_1.prisma.trainerCourseSubmission.findUnique({
            where: { id: submission.id },
            include: {
                sessions: { orderBy: { order: 'asc' } },
                track: true,
            },
        });
        res.json({
            success: true,
            message: 'Draft saved successfully',
            data: completeSubmission,
        });
    }
    catch (error) {
        console.error('Error saving course draft:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to save draft' });
    }
};
exports.saveCourseDraft = saveCourseDraft;
// ---------------------------------------------------------------------------
// 7. SUBMIT COURSE FOR REVIEW (Strict Validation & Status Lock)
// ---------------------------------------------------------------------------
const submitCourseForReview = async (req, res) => {
    try {
        const trainerId = req.user?.id;
        if (!trainerId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { id, trackId, trackName, title, shortDescription, fullDescription, thumbnail, level, price, currency, numberOfSessions, submissionNotes, sessions, } = req.body;
        // Strict Validations for Submission
        if (!title || !title.trim()) {
            res.status(400).json({ success: false, message: 'Course title is mandatory' });
            return;
        }
        if (!trackId && !trackName) {
            res.status(400).json({ success: false, message: 'Please select a teaching track' });
            return;
        }
        if (!Array.isArray(sessions) || sessions.length === 0) {
            res.status(400).json({ success: false, message: 'At least 1 session is required for course submission' });
            return;
        }
        // Validate each session
        for (let i = 0; i < sessions.length; i++) {
            const s = sessions[i];
            if (!s.title || !s.title.trim()) {
                res.status(400).json({
                    success: false,
                    message: `Session #${i + 1} must have a title`,
                });
                return;
            }
            if (!s.videoUrl && !s.videoId && !s.fileUrl) {
                res.status(400).json({
                    success: false,
                    message: `Session #${i + 1} ("${s.title}") must have a video or material attached`,
                });
                return;
            }
        }
        const numSessions = Number(numberOfSessions) || sessions.length;
        const totalDurationMinutes = sessions.reduce((acc, s) => acc + (Number(s.durationMinutes) || 0), 0);
        let submissionId = id;
        if (submissionId) {
            const existing = await prisma_js_1.prisma.trainerCourseSubmission.findUnique({
                where: { id: submissionId },
            });
            if (!existing || existing.trainerId !== trainerId) {
                res.status(403).json({ success: false, message: 'Submission not found or unauthorized' });
                return;
            }
            await prisma_js_1.prisma.trainerCourseSubmission.update({
                where: { id: submissionId },
                data: {
                    trackId: trackId || null,
                    trackName: trackName || null,
                    title: title.trim(),
                    shortDescription: shortDescription || null,
                    fullDescription: fullDescription || null,
                    thumbnail: thumbnail || null,
                    level: level || 'All Levels',
                    price: Number(price) || 0.0,
                    currency: currency || 'USD',
                    numberOfSessions: numSessions,
                    totalDurationMinutes,
                    status: 'PENDING_REVIEW',
                    submittedAt: new Date(),
                    submissionNotes: submissionNotes || null,
                },
            });
            // Sync sessions
            await prisma_js_1.prisma.trainerSubmissionSession.deleteMany({
                where: { submissionId },
            });
            for (let i = 0; i < sessions.length; i++) {
                const s = sessions[i];
                await prisma_js_1.prisma.trainerSubmissionSession.create({
                    data: {
                        submissionId,
                        title: s.title.trim(),
                        description: s.description || null,
                        order: i + 1,
                        sessionNumber: Number(s.sessionNumber) || i + 1,
                        durationMinutes: Number(s.durationMinutes) || 0,
                        videoProvider: s.videoProvider || 'bunny',
                        videoId: s.videoId || null,
                        videoUrl: s.videoUrl || null,
                        fileUrl: s.fileUrl || null,
                        fileName: s.fileName || null,
                    },
                });
            }
        }
        else {
            const slug = generateSlug(title.trim());
            const created = await prisma_js_1.prisma.trainerCourseSubmission.create({
                data: {
                    trainerId,
                    trackId: trackId || null,
                    trackName: trackName || null,
                    title: title.trim(),
                    slug,
                    shortDescription: shortDescription || null,
                    fullDescription: fullDescription || null,
                    thumbnail: thumbnail || null,
                    level: level || 'All Levels',
                    price: Number(price) || 0.0,
                    currency: currency || 'USD',
                    numberOfSessions: numSessions,
                    totalDurationMinutes,
                    status: 'PENDING_REVIEW',
                    submittedAt: new Date(),
                    submissionNotes: submissionNotes || null,
                },
            });
            submissionId = created.id;
            for (let i = 0; i < sessions.length; i++) {
                const s = sessions[i];
                await prisma_js_1.prisma.trainerSubmissionSession.create({
                    data: {
                        submissionId: created.id,
                        title: s.title.trim(),
                        description: s.description || null,
                        order: i + 1,
                        sessionNumber: Number(s.sessionNumber) || i + 1,
                        durationMinutes: Number(s.durationMinutes) || 0,
                        videoProvider: s.videoProvider || 'bunny',
                        videoId: s.videoId || null,
                        videoUrl: s.videoUrl || null,
                        fileUrl: s.fileUrl || null,
                        fileName: s.fileName || null,
                    },
                });
            }
        }
        const finalSubmission = await prisma_js_1.prisma.trainerCourseSubmission.findUnique({
            where: { id: submissionId },
            include: {
                sessions: { orderBy: { order: 'asc' } },
                track: true,
            },
        });
        res.json({
            success: true,
            message: 'Course successfully submitted for review. Our academic team will evaluate it within 48 hours.',
            data: finalSubmission,
        });
    }
    catch (error) {
        console.error('Error submitting course for review:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to submit course' });
    }
};
exports.submitCourseForReview = submitCourseForReview;
// ---------------------------------------------------------------------------
// 8. GET TRAINER'S OWN SUBMISSIONS
// ---------------------------------------------------------------------------
const getMySubmissions = async (req, res) => {
    try {
        const trainerId = req.user?.id;
        if (!trainerId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const { status } = req.query;
        const whereClause = {
            trainerId,
        };
        if (status && status !== 'ALL') {
            whereClause.status = status;
        }
        const submissions = await prisma_js_1.prisma.trainerCourseSubmission.findMany({
            where: whereClause,
            include: {
                sessions: { orderBy: { order: 'asc' } },
                track: true,
            },
            orderBy: { updatedAt: 'desc' },
        });
        // Calculate stats
        const allForTrainer = await prisma_js_1.prisma.trainerCourseSubmission.findMany({
            where: { trainerId },
            select: { status: true },
        });
        const stats = {
            all: allForTrainer.length,
            draft: allForTrainer.filter((s) => s.status === 'DRAFT').length,
            pending: allForTrainer.filter((s) => s.status === 'PENDING_REVIEW').length,
            approved: allForTrainer.filter((s) => s.status === 'APPROVED').length,
            needsRevision: allForTrainer.filter((s) => s.status === 'NEEDS_REVISION').length,
            rejected: allForTrainer.filter((s) => s.status === 'REJECTED').length,
        };
        res.json({
            success: true,
            data: {
                submissions,
                stats,
            },
        });
    }
    catch (error) {
        console.error('Error fetching trainer submissions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch submissions' });
    }
};
exports.getMySubmissions = getMySubmissions;
// ---------------------------------------------------------------------------
// 9. GET SINGLE SUBMISSION BY ID (For trainer or admin)
// ---------------------------------------------------------------------------
const getSubmissionById = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const id = req.params.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const submission = await prisma_js_1.prisma.trainerCourseSubmission.findUnique({
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
                        trainerProfile: true,
                    },
                },
            },
        });
        if (!submission) {
            res.status(404).json({ success: false, message: 'Submission not found' });
            return;
        }
        // Verify permission: only the author trainer or an admin can access
        if (submission.trainerId !== userId && userRole !== 'ADMIN') {
            res.status(403).json({ success: false, message: 'Access denied' });
            return;
        }
        res.json({
            success: true,
            data: submission,
        });
    }
    catch (error) {
        console.error('Error fetching submission details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch submission' });
    }
};
exports.getSubmissionById = getSubmissionById;
// ---------------------------------------------------------------------------
// 10. DELETE DRAFT SUBMISSION
// ---------------------------------------------------------------------------
const deleteDraftSubmission = async (req, res) => {
    try {
        const userId = req.user?.id;
        const id = req.params.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const submission = await prisma_js_1.prisma.trainerCourseSubmission.findUnique({
            where: { id },
        });
        if (!submission || submission.trainerId !== userId) {
            res.status(404).json({ success: false, message: 'Draft not found or unauthorized' });
            return;
        }
        if (submission.status !== 'DRAFT' && submission.status !== 'NEEDS_REVISION') {
            res.status(400).json({
                success: false,
                message: 'Only drafts or courses requiring revision can be deleted',
            });
            return;
        }
        await prisma_js_1.prisma.trainerCourseSubmission.delete({
            where: { id },
        });
        res.json({
            success: true,
            message: 'Draft removed successfully',
        });
    }
    catch (error) {
        console.error('Error deleting draft:', error);
        res.status(500).json({ success: false, message: 'Failed to delete draft' });
    }
};
exports.deleteDraftSubmission = deleteDraftSubmission;
