"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bunnyService = exports.BunnyService = void 0;
const crypto_1 = __importDefault(require("crypto"));
class BunnyService {
    defaultLibraryId;
    tokenSecurityKey;
    allowedDomains;
    constructor() {
        this.defaultLibraryId = process.env.BUNNY_STREAM_LIBRARY_ID || process.env.BUNNY_LIBRARY_ID || '740117';
        this.tokenSecurityKey = process.env.BUNNY_STREAM_TOKEN_KEY || process.env.BUNNY_TOKEN_AUTH_KEY;
        this.allowedDomains = ['scaloraa.online', 'www.scaloraa.online', 'localhost'];
    }
    /**
     * Extracts a clean Bunny Video ID (UUID format) from:
     * - Raw UUID: "e6f4d9c1-8451-419b-a01c-3be08761ba10"
     * - Embed URL: "https://iframe.mediadelivery.net/embed/740117/e6f4d9c1-8451-419b-a01c-3be08761ba10"
     * - Play URL: "https://player.mediadelivery.net/play/740117/e6f4d9c1-8451-419b-a01c-3be08761ba10"
     * - Direct URL or query format
     */
    extractVideoId(input) {
        if (!input || typeof input !== 'string')
            return null;
        const trimmed = input.trim();
        if (!trimmed)
            return null;
        // 1. Direct standard UUID check (36 chars: 8-4-4-4-12)
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (uuidRegex.test(trimmed)) {
            return trimmed.toLowerCase();
        }
        // 2. Mediadeliver / Bunny iframe embed/play URL pattern:
        // https://(iframe|player).mediadelivery.net/(embed|play)/{libraryId}/{videoId}
        const urlPattern = /(?:iframe\.mediadelivery\.net|player\.mediadelivery\.net|video\.bunnycdn\.com|mediadelivery\.net)\/(?:embed|play)\/(?:\d+)\/([0-9a-fA-F-]{36})/i;
        const urlMatch = trimmed.match(urlPattern);
        if (urlMatch && urlMatch[1]) {
            return urlMatch[1].toLowerCase();
        }
        // 3. Fallback UUID search anywhere in string
        const fallbackMatch = trimmed.match(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/i);
        if (fallbackMatch && fallbackMatch[1]) {
            return fallbackMatch[1].toLowerCase();
        }
        // 4. If non-standard string ID provided (e.g. legacy or custom ID)
        if (/^[a-zA-Z0-9_-]{8,64}$/.test(trimmed)) {
            return trimmed;
        }
        return null;
    }
    /**
     * Extracts Library ID from a full Bunny URL if present.
     */
    extractLibraryId(input) {
        if (!input || typeof input !== 'string')
            return null;
        const match = input.match(/(?:iframe\.mediadelivery\.net|player\.mediadelivery\.net|video\.bunnycdn\.com|mediadelivery\.net)\/(?:embed|play)\/(\d+)/i);
        return match && match[1] ? match[1] : null;
    }
    /**
     * Architecture ready: Generates SHA256 Bunny Token Signature for secure URL authentication
     * Format: SHA256(securityToken + videoId + expirationTime)
     */
    generateTokenSignature(videoId, expirationTime) {
        if (!this.tokenSecurityKey) {
            return null; // Token auth not configured yet
        }
        const dataToSign = `${this.tokenSecurityKey}${videoId}${expirationTime}`;
        return crypto_1.default.createHash('sha256').update(dataToSign).digest('hex');
    }
    /**
     * Builds the dynamic Bunny Stream iframe embed URL.
     * Does NOT store this URL in the database; calculated on-demand at runtime.
     */
    buildEmbedUrl(options) {
        const rawVideoId = options.videoId;
        const cleanVideoId = this.extractVideoId(rawVideoId) || rawVideoId;
        const libraryId = options.libraryId || this.extractLibraryId(rawVideoId) || this.defaultLibraryId;
        const queryParams = new URLSearchParams();
        if (options.autoPlay)
            queryParams.set('autoplay', 'true');
        if (options.preload)
            queryParams.set('preload', 'true');
        if (options.responsive !== false)
            queryParams.set('responsive', 'true');
        // Token authentication signature (if token key is enabled in future)
        if (this.tokenSecurityKey) {
            const expiresIn = options.expiresInSeconds || 3600 * 4; // 4 hours default
            const expires = Math.floor(Date.now() / 1000) + expiresIn;
            const token = this.generateTokenSignature(cleanVideoId, expires);
            if (token) {
                queryParams.set('token', token);
                queryParams.set('expires', expires.toString());
            }
        }
        const queryStr = queryParams.toString();
        return `https://iframe.mediadelivery.net/embed/${libraryId}/${cleanVideoId}${queryStr ? `?${queryStr}` : ''}`;
    }
    getAllowedDomains() {
        return [...this.allowedDomains];
    }
}
exports.BunnyService = BunnyService;
exports.bunnyService = new BunnyService();
