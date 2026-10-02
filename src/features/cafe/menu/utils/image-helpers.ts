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
