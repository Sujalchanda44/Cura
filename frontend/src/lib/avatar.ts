/**
 * Avatar Utilities for Cura+
 * Handles URL resolution and cross-device image optimization (mobile & desktop)
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const BACKEND_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

/**
 * Returns a fully qualified image URL for an avatar, handling relative /uploads paths,
 * base64 data URLs, remote URLs, and Dicebear SVG fallback.
 */
export function getAvatarUrl(url?: string | null, name?: string): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    const seed = encodeURIComponent(name?.trim() || 'User');
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=transparent`;
  }

  // Already a full remote URL, base64 data URL, or blob preview URL
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  // Relative backend upload path (e.g. /uploads/avatar-123.jpg)
  if (url.startsWith('/uploads')) {
    // If running in development or production, resolve against backend origin
    return `${BACKEND_ORIGIN}${url}`;
  }

  return url;
}

/**
 * Client-side image optimizer for laptop and mobile camera uploads.
 * Scales large mobile photos (often 5-15MB) down to an optimal profile avatar size (< 500KB)
 * while maintaining crisp resolution.
 */
export async function optimizeAvatarImage(
  file: File,
  maxDimension = 800,
  quality = 0.88
): Promise<{ optimizedFile: File; base64: string }> {
  return new Promise((resolve, reject) => {
    // If not an image or is SVG, return directly
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve({ optimizedFile: file, base64: reader.result as string });
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
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
        // Fallback without compression
        const reader = new FileReader();
        reader.onload = () => resolve({ optimizedFile: file, base64: reader.result as string });
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      // Draw with smoothing for high-quality downsampling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Export as JPEG (or webp if original was webp/png)
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const base64 = canvas.toDataURL(outputType, quality);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({ optimizedFile: file, base64 });
            return;
          }
          const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, outputType === 'image/png' ? '.png' : '.jpg'), {
            type: outputType,
            lastModified: Date.now(),
          });
          resolve({ optimizedFile, base64 });
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for optimization.'));
    };

    img.src = objectUrl;
  });
}
