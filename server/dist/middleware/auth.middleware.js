"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTrainer = exports.requireTrainerOrAdmin = exports.requireAdmin = exports.optionalAuth = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_js_1 = require("../lib/prisma.js");
const JWT_SECRET = process.env.JWT_SECRET || 'scalora_super_secret_jwt_key_2026_modern_lms';
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, message: 'Authorization token required' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, name: true },
        });
        if (!user) {
            res.status(401).json({ success: false, message: 'User not found or session invalid' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};
exports.authenticate = authenticate;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            const user = await prisma_js_1.prisma.user.findUnique({
                where: { id: decoded.id },
                select: { id: true, email: true, role: true, name: true },
            });
            if (user) {
                req.user = user;
            }
        }
    }
    catch {
        // Ignore invalid tokens for optional auth
    }
    next();
};
exports.optionalAuth = optionalAuth;
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Access denied: Admin privileges required' });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireTrainerOrAdmin = (req, res, next) => {
    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'TRAINER')) {
        res.status(403).json({ success: false, message: 'Access denied: Trainer or Admin privileges required' });
        return;
    }
    next();
};
exports.requireTrainerOrAdmin = requireTrainerOrAdmin;
const requireTrainer = (req, res, next) => {
    if (!req.user || req.user.role !== 'TRAINER') {
        res.status(403).json({ success: false, message: 'Access denied: Trainer privileges required' });
        return;
    }
    next();
};
exports.requireTrainer = requireTrainer;
