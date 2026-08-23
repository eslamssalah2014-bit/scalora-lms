"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnlineUsers = exports.sendChatTypingIndicator = exports.sendTypingIndicator = exports.streamEvents = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const realtime_service_js_1 = require("../services/realtime.service.js");
const JWT_SECRET = process.env.JWT_SECRET || 'scalora_super_secret_jwt_key_2026_modern_lms';
/**
 * Connect to SSE Stream: GET /api/realtime/stream?token=...
 */
const streamEvents = (req, res) => {
    let token = req.query.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        res.status(401).json({ success: false, message: 'Authentication token required for realtime stream' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const userId = decoded.id;
        // Set headers for Server-Sent Events
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        });
        res.flushHeaders();
        const client = realtime_service_js_1.realtimeService.addClient(userId, res);
        // Remove client when connection closes
        req.on('close', () => {
            realtime_service_js_1.realtimeService.removeClient(userId, client);
        });
    }
    catch (err) {
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};
exports.streamEvents = streamEvents;
/**
 * Broadcast Typing Indicator: POST /api/realtime/typing
 */
const sendTypingIndicator = (req, res) => {
    const senderId = req.user?.id;
    const { recipientId, isTyping } = req.body;
    if (!senderId || !recipientId) {
        res.status(400).json({ success: false, message: 'recipientId is required' });
        return;
    }
    realtime_service_js_1.realtimeService.sendToUser(recipientId, 'typing', {
        senderId,
        isTyping: Boolean(isTyping),
        timestamp: new Date().toISOString(),
    });
    res.json({ success: true });
};
exports.sendTypingIndicator = sendTypingIndicator;
/**
 * Broadcast Group Chat Typing: POST /api/realtime/chat-typing
 */
const sendChatTypingIndicator = (req, res) => {
    const userId = req.user?.id;
    const userName = req.user?.name || 'User';
    const { channelId, isTyping } = req.body;
    if (!userId || !channelId) {
        res.status(400).json({ success: false, message: 'channelId is required' });
        return;
    }
    realtime_service_js_1.realtimeService.broadcastToAll('chat_typing', {
        channelId,
        userId,
        userName,
        isTyping: Boolean(isTyping),
        timestamp: new Date().toISOString(),
    });
    res.json({ success: true });
};
exports.sendChatTypingIndicator = sendChatTypingIndicator;
/**
 * Get Online Status of users: GET /api/realtime/online
 */
const getOnlineUsers = (_req, res) => {
    const onlineUserIds = realtime_service_js_1.realtimeService.getOnlineUsers();
    res.json({ success: true, onlineUsers: onlineUserIds });
};
exports.getOnlineUsers = getOnlineUsers;
