import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
  Eye,
  Link2,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

interface ThumbnailUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB Limit
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

export const ThumbnailUpload: React.FC<ThumbnailUploadProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(value || '');
  const [showManualInput, setShowManualInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal preview when external value changes
  React.useEffect(() => {
    if (value && value !== previewUrl && !isUploading) {
      setPreviewUrl(value);
    }
  }, [value]);

  const validateFile = (file: File): string | null => {
    // 1. Check size limit
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return `File size (${sizeMB} MB) exceeds the 5 MB maximum limit. Please choose a smaller image.`;
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

  const uploadToStorage = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(10);
    setError(null);
    setUploadSuccess(false);

    // Immediate local preview via DataURL / ObjectURL
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    // Simulate progressive upload feeling
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return prev + 15;
      });
    }, 120);

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const cleanFileName = `course_thumb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `thumbnails/${cleanFileName}`;

      let finalUrl = '';

      // 1. Try uploading to Supabase Storage Bucket ('course-thumbnails' or 'courses')
      try {
        const { data, error: sbError } = await supabase.storage
          .from('course-thumbnails')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
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
        console.warn('Direct Supabase storage upload attempt encountered error, trying backend endpoint...', sbErr);
      }

      // 2. If direct Supabase storage was not available or bucket missing, use backend upload endpoint
      if (!finalUrl) {
        // Read as base64 for reliable backend processing
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read image file'));
          reader.readAsDataURL(file);
        });

        const imageBase64 = await base64Promise;

        const res = await api.post<{ success: boolean; url: string; message?: string }>(
          '/courses/upload-thumbnail',
          {
            imageBase64,
            fileName: cleanFileName,
            mimeType: file.type || 'image/jpeg',
          }
        );

        if (res.success && res.url) {
          finalUrl = res.url;
        } else {
          // Fallback to base64 data url directly if offline
          finalUrl = imageBase64;
        }
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      setPreviewUrl(finalUrl);
      onChange(finalUrl);
      setUploadSuccess(true);

      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error('Thumbnail upload error:', err);
      setError(err.message || 'Failed to upload image. Please try again or paste a direct URL.');
    } finally {
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

    uploadToStorage(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
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
    if (disabled || isUploading) return;

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>Course Thumbnail</span>
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
          <span className="text-[10px] text-slate-400 font-medium">Max 5 MB</span>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        disabled={disabled || isUploading}
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
          onClick={() => !isUploading && !disabled && fileInputRef.current?.click()}
          className={`relative group cursor-pointer p-6 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center overflow-hidden ${
            isDragging
              ? 'border-cyan-400 bg-cyan-500/15 scale-[1.01] shadow-[0_0_25px_rgba(6,182,212,0.25)]'
              : 'border-cyan-500/30 bg-[#041226]/80 hover:border-cyan-400/70 hover:bg-[#061833]'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {/* Subtle decorative glow */}
          <div className="absolute -top-12 -left-12 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/20 transition-all" />
          <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-scalora-blue/10 rounded-full blur-2xl pointer-events-none group-hover:bg-scalora-blue/20 transition-all" />

          {isUploading ? (
            /* Uploading state */
            <div className="space-y-3 py-2 w-full max-w-xs">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 mx-auto flex items-center justify-center text-cyan-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                  <span>Uploading to Storage...</span>
                  <span className="text-cyan-400">{uploadProgress}%</span>
                </div>
                <p className="text-[11px] text-slate-400">Optimizing and saving thumbnail...</p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-scalora-blue to-cyan-400 h-full rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            /* Idle Drag & Drop State */
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-scalora-blue/20 border border-cyan-500/30 mx-auto flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:border-cyan-400 transition-all duration-300 shadow-md">
                <UploadCloud className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Upload course thumbnail image
                </p>
                <p className="text-[11px] text-slate-400">
                  Drag and drop your image here, or <span className="text-cyan-400 font-semibold underline underline-offset-2">browse</span>
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400">
                <span>JPG, PNG, WEBP</span>
                <span>•</span>
                <span>Max 5 MB</span>
                <span>•</span>
                <span>16:9 Recommended</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Image Preview & Management Card */
        <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-[#030E1F] shadow-lg group">
          {/* Image aspect ratio container */}
          <div className="relative w-full aspect-video sm:h-48 overflow-hidden bg-black/50 flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Course Thumbnail Preview"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => {
                setError('Failed to load image preview. Please re-upload or check image format.');
              }}
            />

            {/* Dark overlay with actions on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/90 text-white flex items-center gap-1 shadow-md">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Thumbnail Ready</span>
                </span>

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-1.5 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-white shadow-md transition-transform hover:scale-110"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105"
                >
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>Replace Image</span>
                </button>
              </div>
            </div>

            {/* Uploading overlay if re-uploading */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
                <p className="text-xs font-bold text-white">Uploading New Image...</p>
                <div className="w-36 bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Info Bar */}
          <div className="p-2.5 px-3.5 bg-[#05142B] border-t border-cyan-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span className="text-[11px] text-slate-300 truncate font-medium">
                {uploadSuccess ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded to storage!
                  </span>
                ) : (
                  'Thumbnail active for public catalog & cards'
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-2 flex-shrink-0 ml-2"
            >
              Change
            </button>
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
