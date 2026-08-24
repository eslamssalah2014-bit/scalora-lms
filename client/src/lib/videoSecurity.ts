/**
 * Scalora Video Security & Runtime YouTube Parser
 *
 * CRITICAL DATA PROTECTION POLICY:
 * - Runtime in-memory parsing ONLY.
 * - Zero database writes or modifications.
 * - Backward compatible with existing stored URLs and IDs.
 */

/**
 * Robustly extracts an 11-character YouTube video ID from ANY URL format or raw ID.
 * Handles:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID&feature=share
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID?si=abcdef
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube-nocookie.com/embed/VIDEO_ID
 * - https://youtube.com/shorts/VIDEO_ID
 * - https://youtube.com/live/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * - Raw 11-character ID: VIDEO_ID
 */
export function extractYouTubeVideoId(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Direct 11-char ID check (e.g. "dQw4w9WgXcQ")
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. Standard watch?v= format (with or without other query params)
  const vParamMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vParamMatch && vParamMatch[1]) {
    return vParamMatch[1];
  }

  // 3. Shortened youtu.be/VIDEO_ID format
  const youtuBeMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (youtuBeMatch && youtuBeMatch[1]) {
    return youtuBeMatch[1];
  }

  // 4. Embed URLs: embed/VIDEO_ID
  const embedMatch = trimmed.match(/(?:embed|v)\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch && embedMatch[1]) {
    return embedMatch[1];
  }

  // 5. YouTube Shorts: shorts/VIDEO_ID
  const shortsMatch = trimmed.match(/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch && shortsMatch[1]) {
    return shortsMatch[1];
  }

  // 6. YouTube Live: live/VIDEO_ID
  const liveMatch = trimmed.match(/live\/([a-zA-Z0-9_-]{11})/);
  if (liveMatch && liveMatch[1]) {
    return liveMatch[1];
  }

  // 7. General Regex Fallback
  const generalMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  if (generalMatch && generalMatch[1]) {
    return generalMatch[1];
  }

  return null;
}

export interface EmbedOptions {
  autoplay?: boolean;
  controls?: boolean;
  rel?: number;
  modestbranding?: number;
  playsinline?: number;
  iv_load_policy?: number;
  enablejsapi?: number;
}

/**
 * Builds a secure, privacy-enhanced YouTube embed URL from any input video string.
 * Uses youtube-nocookie.com to minimize tracking and external leaks.
 */
export function buildSecureYouTubeEmbedUrl(
  input?: string | null,
  options: EmbedOptions = {}
): string | null {
  const videoId = extractYouTubeVideoId(input);
  if (!videoId) return null;

  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';

  const params = new URLSearchParams({
    rel: String(options.rel ?? 0),
    modestbranding: String(options.modestbranding ?? 1),
    playsinline: String(options.playsinline ?? 1),
    iv_load_policy: String(options.iv_load_policy ?? 3),
    enablejsapi: String(options.enablejsapi ?? 1),
    autoplay: options.autoplay ? '1' : '0',
    controls: options.controls !== false ? '1' : '0',
  });

  if (origin) {
    params.set('origin', origin);
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
