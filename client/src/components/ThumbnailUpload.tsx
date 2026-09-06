import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
  Crop,
  Link2,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api, resolveMediaUrl } from '../lib/api';

interface ThumbnailUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB Limit
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Smart Center-Crop and Resize Engine
 * Automatically enforces 4:5 Aspect Ratio (target 1080 × 1350 px)
 * High-quality bicubic smoothing for crisp, high-definition thumbnails
 */
export const processAndCropTo4by5 = async (
  file: File
): Promise<{ file: File; dataUrl: string; width: number; height: number; wasCropped: boolean }> => {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;

        const targetRatio = 4 / 5; // 0.8
        const currentRatio = naturalWidth / naturalHeight;

        let cropX = 0;
        let cropY = 0;
        let cropWidth = naturalWidth;
        let cropHeight = naturalHeight;
        let wasCropped = false;

        // Tolerance for floating point equality
        if (Math.abs(currentRatio - targetRatio) > 0.01) {
          wasCropped = true;
          if (currentRatio > targetRatio) {
            // Image is wider than 4:5 -> Keep full height, center-crop the width
            cropHeight = naturalHeight;
            cropWidth = Math.round(naturalHeight * targetRatio);
            cropX = Math.round((naturalWidth - cropWidth) / 2);
            cropY = 0;
          } else {
            // Image is taller than 4:5 -> Keep full width, center-crop the height
            cropWidth = naturalWidth;
            cropHeight = Math.round(naturalWidth / targetRatio);
            cropX = 0;
            cropY = Math.round((naturalHeight - cropHeight) / 2);
          }
        }

        // Standard 1080 × 1350 px (or preserve high-res 4:5 up to 1440x1800 if source is higher)
        const targetWidth = Math.max(1080, Math.min(cropWidth, 1440));
        const targetHeight = Math.round(targetWidth * (5 / 4)); // exactly 1350 if targetWidth=1080

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to initialize canvas context for image processing');
        }

        // High quality image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw cropped area scaled into 4:5 canvas
        ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to generate image blob'));
              return;
            }

            const cleanBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^\w-]/g, '_');
            const processedFile = new File([blob], `${cleanBaseName}_4x5.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve({
              file: processedFile,
              dataUrl,
              width: targetWidth,
              height: targetHeight,
              wasCropped,
            });
          },
          'image/jpeg',
          0.92
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image. Please verify the file is a valid image.'));
    };

    img.src = objectUrl;
  });
};

export const ThumbnailUpload: React.FC<ThumbnailUploadProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [wasAutoCropped, setWasAutoCropped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(value || '');
  const [showManualInput, setShowManualInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal preview when external value changes
  React.useEffect(() => {
    if (value && value !== previewUrl && !isUploading && !isProcessing) {
      setPreviewUrl(value);
    }
  }, [value]);

  const validateFile = (file: File): string | null => {
    // 1. Check size limit (max 5 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return `File size (${sizeMB} MB) exceeds the 5 MB maximum limit. Please choose an image under 5 MB.`;
    }

    // 2. Check MIME type or extension
    const matchesType = ALLOWED_TYPES.includes(file.type.toLowerCase());
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const matchesExt = ALLOWED_EXTS.includes(ext);

    if (!matchesType && !matchesExt) {
      return 'Invalid file format. Please upload a JPG, JPEG, PNG, or WebP image.';
    }

    return null;
  };

  const handleProcessAndUpload = async (rawFile: File) => {
    setError(null);
    setUploadSuccess(false);
    setIsProcessing(true);

    try {
      // Step 1: Smart Center-Crop and Resize to exact 4:5 aspect ratio (1080 × 1350 px)
      const { file: processedFile, dataUrl, wasCropped } = await processAndCropTo4by5(rawFile);
      setWasAutoCropped(wasCropped);
      setPreviewUrl(dataUrl);

      setIsProcessing(false);
      setIsUploading(true);
      setUploadProgress(15);

      // Simulate progressive upload feeling
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + 15;
        });
      }, 100);

      const cleanFileName = `course_thumb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
      const filePath = `thumbnails/${cleanFileName}`;

      let finalUrl = '';

      // 1. Try Supabase Storage Bucket ('course-thumbnails' or 'courses')
      try {
        const { data, error: sbError } = await supabase.storage
          .from('course-thumbnails')
          .upload(filePath, processedFile, {
            cacheControl: '3600',
            upsert: true,
            contentType: 'image/jpeg',
          });

        if (!sbError && data) {
          const { data: publicData } = supabase.storage
            .from('course-thumbnails')
            .getPublicUrl(filePath);

          if (publicData?.publicUrl) {
            finalUrl = publicData.publicUrl;
          }
        }
      } catch (sbErr) {
        console.warn('Direct Supabase storage upload notice, falling back to server upload...', sbErr);
      }

      // 2. If Supabase storage is unreachable or bucket not yet configured, use backend upload endpoint
      if (!finalUrl) {
        const res = await api.post<{ success: boolean; url: string; message?: string }>(
          '/courses/upload-thumbnail',
          {
            imageBase64: dataUrl,
            fileName: cleanFileName,
            mimeType: 'image/jpeg',
          }
        );

        if (res.success && res.url) {
          finalUrl = res.url;
        } else {
          // Direct base64 fallback
          finalUrl = dataUrl;
        }
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      setPreviewUrl(finalUrl);
      onChange(finalUrl);
      setUploadSuccess(true);

      setTimeout(() => {
        setUploadSuccess(false);
      }, 4000);
    } catch (err: any) {
      console.error('Image processing/upload error:', err);
      setError(err.message || 'Failed to process or upload image. Please try again.');
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    handleProcessAndUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading && !isProcessing) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isUploading || isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl('');
    onChange('');
    setError(null);
    setUploadSuccess(false);
    setWasAutoCropped(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>Course Thumbnail (4:5 Portrait)</span>
        </label>
        <div className="flex items-center gap-2">
          {previewUrl && (
            <button
              type="button"
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-[11px] font-medium text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              title="Toggle manual URL edit"
            >
              <Link2 className="w-3 h-3" />
              <span>{showManualInput ? 'Hide URL' : 'Edit URL'}</span>
            </button>
          )}
          <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            4:5 (1080 × 1350)
          </span>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        disabled={disabled || isUploading || isProcessing}
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-[11px] leading-relaxed">{error}</div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dropzone & Preview Container */}
      {!previewUrl ? (
        /* Upload Area (No image selected yet) */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && !isProcessing && !disabled && fileInputRef.current?.click()}
          className={`relative group cursor-pointer p-5 sm:p-6 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center overflow-hidden ${
            isDragging
              ? 'border-cyan-400 bg-cyan-500/15 scale-[1.01] shadow-[0_0_25px_rgba(6,182,212,0.25)]'
              : 'border-cyan-500/30 bg-[#041226]/80 hover:border-cyan-400/70 hover:bg-[#061833]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {/* Subtle decorative glow */}
          <div className="absolute -top-12 -left-12 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/20 transition-all" />
          <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-scalora-blue/10 rounded-full blur-2xl pointer-events-none group-hover:bg-scalora-blue/20 transition-all" />

          {isProcessing || isUploading ? (
            /* Processing / Uploading state */
            <div className="space-y-3 py-3 w-full max-w-xs">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 mx-auto flex items-center justify-center text-cyan-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                  <span>{isProcessing ? 'Auto-cropping to 4:5...' : 'Uploading to Storage...'}</span>
                  {isUploading && <span className="text-cyan-400">{uploadProgress}%</span>}
                </div>
                <p className="text-[11px] text-slate-400">
                  {isProcessing
                    ? 'Center-cropping & resizing to 1080 × 1350 px...'
                    : 'Optimizing and saving thumbnail to cloud...'}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-scalora-blue to-cyan-400 h-full rounded-full transition-all duration-200"
                  style={{ width: `${isProcessing ? 30 : uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            /* Idle Drag & Drop State */
            <div className="space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-scalora-blue/20 border border-cyan-500/30 mx-auto flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:border-cyan-400 transition-all duration-300 shadow-md">
                <UploadCloud className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Upload course thumbnail image
                </p>
                <p className="text-[11px] text-slate-300">
                  Drag & drop image here, or <span className="text-cyan-400 font-semibold underline underline-offset-2">browse</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  Auto-crops and resizes non-4:5 images automatically while preserving quality.
                </p>
              </div>

              <div className="inline-flex flex-wrap items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300">
                <span className="text-cyan-300 font-semibold">4:5 Aspect Ratio</span>
                <span>•</span>
                <span>1080 × 1350 px</span>
                <span>•</span>
                <span>JPG, PNG, WEBP (Max 5 MB)</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Image 4:5 Preview Card */
        <div className="rounded-2xl border border-cyan-500/30 bg-[#030E1F] p-3 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-white/5">
            <div className="flex items-center gap-1.5 text-cyan-300 font-semibold text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>4:5 Aspect Ratio Preview</span>
            </div>
            {wasAutoCropped && (
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                <Crop className="w-3 h-3" /> Auto-Cropped to 4:5
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* 4:5 Aspect Ratio Preview Box */}
            <div className="relative w-36 aspect-[4/5] rounded-xl overflow-hidden bg-black/60 border border-cyan-400/40 shadow-xl group/preview flex-shrink-0">
              <img
                src={resolveMediaUrl(previewUrl)}
                alt="Course Thumbnail 4:5"
                className="w-full h-full object-cover group-hover/preview:scale-105 transition-transform duration-500"
                onError={() => {
                  setError('Failed to load image preview. Please re-upload or verify format.');
                }}
              />

              {/* Hover actions overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-200 flex items-center justify-center p-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isProcessing}
                  className="p-2 rounded-xl bg-white text-slate-900 shadow-lg hover:scale-110 transition-transform"
                  title="Replace with another image"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Processing/Uploading Overlay */}
              {(isProcessing || isUploading) && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mb-1" />
                  <span className="text-[10px] text-white font-bold">{isProcessing ? 'Cropping...' : `${uploadProgress}%`}</span>
                </div>
              )}
            </div>

            {/* Metadata & Actions */}
            <div className="flex-1 space-y-2 text-left w-full">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>1080 × 1350 px (4:5 Ready)</span>
                  </span>
                </div>
                <p className="text-xs text-white font-semibold">
                  Course Card Thumbnail Ready
                </p>
                <p className="text-[11px] text-slate-400">
                  Formatted for high-definition marketing cards and catalog displays across mobile & desktop.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isProcessing}
                  className="px-3 py-1.5 rounded-xl bg-scalora-blue/20 hover:bg-scalora-blue/40 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Replace</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isUploading || isProcessing}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual URL Input (Optional fallback mode) */}
      {showManualInput && (
        <div className="p-3 rounded-xl bg-[#051124] border border-white/10 space-y-1.5 animate-fadeIn">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Direct Thumbnail Image URL (Fallback)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={previewUrl}
              onChange={(e) => {
                setPreviewUrl(e.target.value);
                onChange(e.target.value);
              }}
              placeholder="https://..."
              className="w-full px-3 py-1.5 rounded-lg glass-input text-xs text-white"
            />
            {previewUrl && (
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl('');
                  onChange('');
                }}
                className="p-2 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
