import React, { useState, useEffect } from 'react';
import { resolveMediaUrl, getDefaultCourseImage, getDefaultAvatar } from '../../lib/api';

export interface ScaloraImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  alt: string;
  fallbackType?: 'course' | 'avatar' | 'community' | 'general';
  category?: string;
  fallbackName?: string;
  withBackdropBlur?: boolean;
  containerClassName?: string;
}

export const ScaloraImage: React.FC<ScaloraImageProps> = ({
  src,
  alt,
  fallbackType = 'course',
  category,
  fallbackName,
  withBackdropBlur = false,
  containerClassName = '',
  className = '',
  onError,
  onLoad,
  ...rest
}) => {
  const getFallbackSrc = (): string => {
    if (fallbackType === 'avatar') {
      return getDefaultAvatar(fallbackName || alt);
    }
    if (fallbackType === 'course') {
      return getDefaultCourseImage(category);
    }
    return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1080&auto=format&fit=crop&q=80';
  };

  const primaryUrl = resolveMediaUrl(src);
  const [currentSrc, setCurrentSrc] = useState<string>(primaryUrl || getFallbackSrc());
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Update if primary src changes
  useEffect(() => {
    const resolved = resolveMediaUrl(src);
    if (resolved) {
      setCurrentSrc(resolved);
      setHasError(false);
      setIsLoaded(false);
    } else {
      setCurrentSrc(getFallbackSrc());
    }
  }, [src, category, fallbackName]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError) {
      console.warn(`[ScaloraImage] Image load failed for "${src}". Switching to resilient fallback.`);
      setHasError(true);
      setCurrentSrc(getFallbackSrc());
    }
    if (onError) onError(e);
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  if (withBackdropBlur) {
    return (
      <div className={`relative overflow-hidden flex items-center justify-center ${containerClassName}`}>
        {/* Subtle ambient blur backdrop */}
        <img
          src={currentSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-md opacity-25 scale-110 pointer-events-none"
        />
        {/* Main image */}
        <img
          src={currentSrc}
          alt={alt}
          onError={handleError}
          onLoad={handleLoad}
          className={`relative z-[1] transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-80'} ${className}`}
          {...rest}
        />
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={handleError}
      onLoad={handleLoad}
      className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-80'} ${className}`}
      {...rest}
    />
  );
};
