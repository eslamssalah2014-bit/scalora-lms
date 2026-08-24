/**
 * Client-Side Smart Image Compressor & File Validator
 * Compresses JPG/JPEG/PNG/WebP images before upload to ensure instant, reliable delivery
 * without hitting body-parser or reverse-proxy limits.
 */

export interface ProcessedFileResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  fileName: string;
  mimeType: string;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB Limit

export const validateAndProcessPaymentProof = async (file: File): Promise<ProcessedFileResult> => {
  // 1. Check strict 10 MB limit
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('File exceeds the 10 MB upload limit.');
  }

  // 2. Validate MIME type
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  if (!isImage && !isPdf) {
    throw new Error('Invalid file format. Please upload a JPG, JPEG, PNG, or PDF file.');
  }

  // 3. If PDF, read directly as Base64 Data URL
  if (isPdf) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          dataUrl: reader.result as string,
          originalSize: file.size,
          compressedSize: file.size,
          fileName: file.name,
          mimeType: 'application/pdf',
        });
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file.'));
      reader.readAsDataURL(file);
    });
  }

  // 4. If Image, smartly compress and resize on Canvas to avoid large payloads
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDimension = 1920; // 1080p / 2K max dimension - ideal for receipt text readability
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback if canvas context fails
            resolve({
              dataUrl: event.target?.result as string,
              originalSize: file.size,
              compressedSize: file.size,
              fileName: file.name,
              mimeType: file.type || 'image/jpeg',
            });
            return;
          }

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.85 quality (crisp text, small payload)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          // Calculate approximate compressed size from base64
          const base64Length = compressedDataUrl.length - (compressedDataUrl.indexOf(',') + 1);
          const compressedSize = Math.round((base64Length * 3) / 4);

          resolve({
            dataUrl: compressedDataUrl,
            originalSize: file.size,
            compressedSize,
            fileName: file.name,
            mimeType: 'image/jpeg',
          });
        } catch (err) {
          // Fallback to original
          resolve({
            dataUrl: event.target?.result as string,
            originalSize: file.size,
            compressedSize: file.size,
            fileName: file.name,
            mimeType: file.type || 'image/jpeg',
          });
        }
      };
      img.onerror = () => reject(new Error('Failed to parse uploaded image.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
};
