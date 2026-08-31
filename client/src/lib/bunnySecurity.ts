/**
 * Scalora LMS - Bunny Stream Video Security & Dynamic URL Generator
 * 
 * Architectural Principles:
 * - Dynamic runtime iframe generation (Zero database writes of full embed URLs).
 * - Automatic extraction of Video ID from raw UUIDs, Play URLs, or Embed URLs.
 * - Ready for Bunny Token Authentication & Domain Restriction (scaloraa.online, www.scaloraa.online).
 */

export interface BunnyEmbedUrlOptions {
  libraryId?: string | number;
  autoPlay?: boolean;
  preload?: boolean;
  responsive?: boolean;
  muted?: boolean;
  loop?: boolean;
  token?: string;
  expires?: number | string;
}

/**
 * Validates whether the given string is a valid 36-character UUID format (standard for Bunny Stream Video IDs).
 */
export function isValidBunnyVideoId(input?: string | null): boolean {
  if (!input || typeof input !== 'string') return false;
  const trimmed = input.trim();
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed);
}

/**
 * Robustly extracts the clean 36-char Bunny Video ID (UUID) from:
 * 1. Raw UUID: "e6f4d9c1-8451-419b-a01c-3be08761ba10"
 * 2. Play URL: "https://iframe.mediadelivery.net/play/384144/e6f4d9c1-8451-419b-a01c-3be08761ba10"
 * 3. Embed URL: "https://iframe.mediadelivery.net/embed/384144/e6f4d9c1-8451-419b-a01c-3be08761ba10"
 * 4. BunnyCDN URLs: "https://video.bunnycdn.com/play/384144/e6f4d9c1-..."
 * 5. Composite string "384144/e6f4d9c1-..."
 */
export function extractBunnyVideoId(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Direct UUID match
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  // 2. Mediadeliver iframe / play / embed URL format
  const urlPattern = /(?:iframe\.mediadelivery\.net|video\.bunnycdn\.com)\/(?:embed|play)\/(?:\d+)\/([0-9a-fA-F-]{36})/i;
  const urlMatch = trimmed.match(urlPattern);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].toLowerCase();
  }

  // 3. Fallback: Search for any standard 36-char UUID substring
  const uuidMatch = trimmed.match(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/i);
  if (uuidMatch && uuidMatch[1]) {
    return uuidMatch[1].toLowerCase();
  }

  // 4. Custom/Alphanumeric ID fallback (8-64 chars)
  if (/^[a-zA-Z0-9_-]{8,64}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Extracts Library ID from a pasted Bunny URL if present.
 */
export function extractBunnyLibraryId(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null;
  const match = input.match(/(?:iframe\.mediadelivery\.net|video\.bunnycdn\.com)\/(?:embed|play)\/(\d+)\//i);
  return match && match[1] ? match[1] : null;
}

/**
 * Returns default configured Bunny Stream Library ID.
 */
export function getDefaultBunnyLibraryId(): string {
  const envLibraryId =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BUNNY_STREAM_LIBRARY_ID) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BUNNY_LIBRARY_ID);

  if (envLibraryId && typeof envLibraryId === 'string' && envLibraryId.trim().length > 0) {
    return envLibraryId.trim();
  }
  return '384144'; // Scalora Default Bunny Library ID
}

/**
 * Dynamically builds a secure Bunny Stream embed URL.
 * Format: https://iframe.mediadelivery.net/embed/{LIBRARY_ID}/{VIDEO_ID}?autoplay=...&preload=...
 */
export function buildBunnyEmbedUrl(
  input?: string | null,
  options: BunnyEmbedUrlOptions = {}
): string | null {
  if (!input) return null;

  const videoId = extractBunnyVideoId(input) || input.trim();
  if (!videoId) return null;

  const libraryId =
    options.libraryId ||
    extractBunnyLibraryId(input) ||
    getDefaultBunnyLibraryId();

  const params = new URLSearchParams();

  if (options.autoPlay) {
    params.set('autoplay', 'true');
  }
  if (options.preload) {
    params.set('preload', 'true');
  }
  if (options.muted) {
    params.set('muted', 'true');
  }
  if (options.loop) {
    params.set('loop', 'true');
  }
  if (options.responsive !== false) {
    params.set('responsive', 'true');
  }

  // Token Security Architecture Ready:
  if (options.token && options.expires) {
    params.set('token', options.token);
    params.set('expires', String(options.expires));
  }

  const query = params.toString();
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}${query ? `?${query}` : ''}`;
}
