"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPassword = exports.validateSetupToken = exports.forgotPassword = exports.updateProfile = exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_js_1 = require("../lib/prisma.js");
const JWT_SECRET = process.env.JWT_SECRET || 'scalora_super_secret_jwt_key_2026_modern_lms';
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    role: zod_1.z.enum(['STUDENT', 'ADMIN']).optional().default('STUDENT'),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
const register = async (req, res) => {
    try {
        const validatedData = registerSchema.parse(req.body);
        const existingUser = await prisma_js_1.prisma.user.findUnique({
            where: { email: validatedData.email.toLowerCase() },
        });
        if (existingUser) {
            res.status(400).json({ success: false, message: 'Email is already registered' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(validatedData.password, 10);
        const user = await prisma_js_1.prisma.user.create({
            data: {
                name: validatedData.name,
                email: validatedData.email.toLowerCase(),
                password: hashedPassword,
                role: 'STUDENT',
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                createdAt: true,
            },
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            token,
            user,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: error.errors[0].message });
            return;
        }
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const validatedData = loginSchema.parse(req.body);
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { email: validatedData.email.toLowerCase() },
        });
        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
            return;
        }
        const isPasswordValid = await bcryptjs_1.default.compare(validatedData.password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            success: true,
            message: 'Logged in successfully',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                bio: user.bio,
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: error.errors[0].message });
            return;
        }
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { id: req.user?.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                bio: true,
                createdAt: true,
                _count: {
                    select: {
                        enrollments: true,
                        quizResults: true,
                        certificates: true,
                    },
                },
            },
        });
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.json({ success: true, user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};
exports.getMe = getMe;
const updateProfile = async (req, res) => {
    try {
        const { name, avatar, bio } = req.body;
        const user = await prisma_js_1.prisma.user.update({
            where: { id: req.user?.id },
            data: {
                ...(name && { name }),
                ...(avatar !== undefined && { avatar }),
                ...(bio !== undefined && { bio }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                bio: true,
            },
        });
        res.json({ success: true, message: 'Profile updated', user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};
exports.updateProfile = updateProfile;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ success: false, message: 'Email is required' });
            return;
        }
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        res.json({
            success: true,
            message: 'If an account exists with this email, password reset instructions have been sent.',
            resetTokenDemo: user ? 'demo-reset-token-scalora-2026' : undefined,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};
exports.forgotPassword = forgotPassword;
const validateSetupToken = async (req, res) => {
    try {
        const token = req.params.token;
        if (!token) {
            res.status(400).json({ success: false, valid: false, message: 'Setup token is required' });
            return;
        }
        const tokenDoc = await prisma_js_1.prisma.passwordSetupToken.findUnique({
            where: { token },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        enrollments: {
                            include: {
                                course: {
                                    select: { id: true, title: true, slug: true, thumbnail: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!tokenDoc) {
            res.status(404).json({ success: false, valid: false, message: 'Invalid or expired password setup link.' });
            return;
        }
        if (tokenDoc.usedAt) {
            res.status(400).json({
                success: false,
                valid: false,
                message: 'This setup link has already been used. Please log in with your password.',
            });
            return;
        }
        if (new Date() > new Date(tokenDoc.expiresAt)) {
            res.status(400).json({
                success: false,
                valid: false,
                message: 'This setup link has expired (24-hour validity). Please contact support for a new activation link.',
            });
            return;
        }
        const course = tokenDoc.user.enrollments[0]?.course;
        res.json({
            success: true,
            valid: true,
            user: {
                name: tokenDoc.user.name,
                email: tokenDoc.user.email,
            },
            course: course ? { title: course.title, thumbnail: course.thumbnail } : null,
            expiresAt: tokenDoc.expiresAt,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, valid: false, message: error.message || 'Error validating setup token' });
    }
};
exports.validateSetupToken = validateSetupToken;
const setupPassword = async (req, res) => {
    try {
        const { token, password, confirmPassword } = req.body;
        if (!token) {
            res.status(400).json({ success: false, message: 'Setup token is required' });
            return;
        }
        if (!password || password.length < 8) {
            res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
            return;
        }
        if (password !== confirmPassword) {
            res.status(400).json({ success: false, message: 'Passwords do not match' });
            return;
        }
        const tokenDoc = await prisma_js_1.prisma.passwordSetupToken.findUnique({
            where: { token },
            include: { user: true },
        });
        if (!tokenDoc) {
            res.status(404).json({ success: false, message: 'Invalid password setup link.' });
            return;
        }
        if (tokenDoc.usedAt) {
            res.status(400).json({ success: false, message: 'This link has already been used. Please log in with your existing password.' });
            return;
        }
        if (new Date() > new Date(tokenDoc.expiresAt)) {
            res.status(400).json({ success: false, message: 'This link has expired (24-hour validity). Please contact support.' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const updatedUser = await prisma_js_1.prisma.user.update({
            where: { id: tokenDoc.userId },
            data: { password: hashedPassword },
            select: { id: true, name: true, email: true, role: true, avatar: true },
        });
        await prisma_js_1.prisma.passwordSetupToken.update({
            where: { id: tokenDoc.id },
            data: { usedAt: new Date() },
        });
        const jwtToken = jsonwebtoken_1.default.sign({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role, name: updatedUser.name }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            success: true,
            message: 'Account activated successfully! Redirecting to your dashboard...',
            token: jwtToken,
            user: updatedUser,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Error setting up password' });
    }
};
exports.setupPassword = setupPassword;
