import React, { useState, useEffect, useMemo } from 'react';
import { Lock, PlayCircle, Loader2, Zap } from 'lucide-react';
import { buildBunnyEmbedUrl, extractBunnyVideoId } from '../lib/bunnySecurity';

export interface BunnyLessonPlayerProps {
  /** Bunny Stream Video ID (UUID) or pasted Bunny play URL */
  videoId?: string | null;
  /** Accessible title for screen readers */
  title?: string;
  /** Optional custom Bunny Library ID (falls back to default/env) */
  libraryId?: string | number;
  /** Active enrolled student for digital watermark overlay */
  user?: {
    id?: string;
    name?: string;
    email?: string;
  } | null;
  /** Optional custom container CSS classes */
  className?: string;
  /** Autoplay setting */
  autoPlay?: boolean;
}

export const BunnyLessonPlayer: React.FC<BunnyLessonPlayerProps> = ({
  videoId,
  title = 'Course Lesson Video',
  libraryId,
  user,
  className = '',
  autoPlay = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Dynamic subtle watermark motion state (shifts position periodically)
  const [watermarkPosIndex, setWatermarkPosIndex] = useState(0);

  // Dynamically compute Bunny embed URL (Zero full URLs stored in database)
  const embedUrl = useMemo(() => {
    return buildBunnyEmbedUrl(videoId, {
      libraryId,
      autoPlay,
      preload: true,
      responsive: true,
    });
  }, [videoId, libraryId, autoPlay]);

  const cleanVideoId = useMemo(() => extractBunnyVideoId(videoId), [videoId]);

  // Rotate watermark quadrant subtly to deter screen capture crops
  useEffect(() => {
    const interval = setInterval(() => {
      setWatermarkPosIndex((prev) => (prev + 1) % 4);
    }, 35000);
    return () => clearInterval(interval);
  }, []);

  // Position presets for floating watermark
  const watermarkPositions = [
    'top-4 right-4 sm:top-6 sm:right-6 text-right items-end',
    'bottom-12 right-4 sm:bottom-14 sm:right-6 text-right items-end',
    'top-4 left-4 sm:top-6 sm:left-6 text-left items-start',
    'bottom-12 left-4 sm:bottom-14 sm:left-6 text-left items-start',
  ];

  const studentName = user?.name || 'Enrolled Student';
  const studentEmail = user?.email || 'scalora.learner@verified.student';

  if (!cleanVideoId || !embedUrl) {
    return (
      <div
        className={`w-full aspect-video rounded-2xl bg-[#04152D] border border-scalora-blue/20 flex flex-col items-center justify-center p-6 text-center space-y-3 shadow-2xl ${className}`}
      >
        <div className="w-14 h-14 rounded-2xl bg-scalora-navy/80 border border-scalora-blue/30 flex items-center justify-center text-scalora-accent">
          <PlayCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">Bunny Stream Video Unavailable</h4>
          <p className="text-xs text-slate-400 max-w-sm">
            This module lesson does not have a valid Bunny Stream video ID attached.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-scalora-blue/30 shadow-2xl group select-none ${className}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 1. Loading Overlay Placeholder */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#04152D] flex flex-col items-center justify-center space-y-3 z-0">
          <Loader2 className="w-8 h-8 animate-spin text-scalora-blue" />
          <span className="text-xs font-semibold text-slate-400">
            Connecting to ultra-fast Bunny Stream edge network...
          </span>
        </div>
      )}

      {/* 2. Embedded Bunny Stream Video Player */}
      <iframe
        src={embedUrl}
        title={title}
        className="absolute top-0 left-0 w-full h-full border-0 z-0"
        loading="lazy"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />

      {/* 3. Non-Intrusive DRM Security Watermark Layer */}
      <div
        className="absolute inset-0 pointer-events-none z-10 p-4 sm:p-6 flex flex-col justify-between overflow-hidden"
        aria-hidden="true"
      >
        {/* Floating Dynamic Position Watermark */}
        <div
          className={`absolute ${watermarkPositions[watermarkPosIndex]} transition-all duration-1000 flex flex-col pointer-events-none`}
        >
          <div className="px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-[2px] border border-white/10 shadow-sm flex flex-col opacity-30 hover:opacity-40 transition-opacity">
            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-300 uppercase tracking-wider">
              <Lock className="w-2.5 h-2.5 text-scalora-accent" />
              <span>Bunny Edge DRM Protected</span>
            </div>
            <span className="text-[10px] font-black text-white truncate max-w-[200px]">
              {studentName}
            </span>
            <span className="text-[9px] text-slate-300 font-mono truncate max-w-[200px]">
              {studentEmail}
            </span>
          </div>
        </div>

        {/* Static Stream Badge */}
        <div className="mt-auto ml-auto pointer-events-none opacity-20 hidden sm:flex items-center gap-1">
          <Zap className="w-2.5 h-2.5 text-amber-400" />
          <div className="text-[8px] font-mono text-slate-400 text-right uppercase tracking-widest">
            <span>BUNNY STREAM HIGH SPEED CDN</span>
          </div>
        </div>
      </div>
    </div>
  );
};
