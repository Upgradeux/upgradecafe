/**
 * Helpers for parsing and handling menu item images (supporting up to 3 images per dish)
 */

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per image
export const MAX_TOTAL_IMAGES_SIZE_BYTES = 12 * 1024 * 1024; // 12 MB total across all 3 images
export const MAX_IMAGES_PER_ITEM = 3;

export function parseMenuItemImages(imageKey?: string | null): string[] {
  if (!imageKey || !imageKey.trim()) return [];
  const trimmed = imageKey.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((img) => typeof img === "string" && img.trim().length > 0);
      }
    } catch {
      // Fallback
    }
  }
  return [trimmed];
}

export function serializeMenuItemImages(images: string[]): string | null {
  const clean = images.filter((img) => img && img.trim().length > 0);
  if (clean.length === 0) return null;
  if (clean.length === 1) return clean[0];
  return JSON.stringify(clean);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Browser-side image compression and resizing using HTML5 Canvas.
 * Resizes large raw camera photos exceeding 1600px and converts to WebP at 0.85 quality.
 * Reduces 3-5 MB raw photos down to ~150-250 KB before transmission, saving R2 storage.
 */
export async function optimizeImageForUpload(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width <= maxDimension && height <= maxDimension && file.size < 400 * 1024) {
          return resolve(file);
        }

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const optimizedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, "") + ".webp",
              { type: "image/webp", lastModified: Date.now() }
            );
            resolve(optimizedFile);
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
